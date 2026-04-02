import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { getAdvisoryModel, getOpenAIClient, getChatModel } from "@/lib/ai/openai";
import {
  parseEmployeeStructuredAnswer,
  type ChatFinalPayload,
  type ChatStreamEvent,
  validateChatRequest,
} from "@/lib/ai/chat/protocol";
import { buildGeneralChatInput } from "@/lib/ai/chat/general";
import { resolveGeneralHelperQuestion } from "@/lib/ai/chat/general-helper";
import { buildEmployeeChatInput, loadEmployeeChatContext } from "@/lib/ai/chat/employee";
import { encodeChatEvent, extractOutputTextDelta } from "@/lib/ai/chat/stream";
import { buildThreadTitle } from "@/lib/ai/chat/threads";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import { buildAiBenchmarkRows } from "@/lib/benchmarks/ai-benchmark-rows";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const body = await request.json().catch(() => null);
  const validation = validateChatRequest(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }
  const chatRequest = validation.value;
  const { workspace_id, user_id } = wsContext.context;

  const { data: thread, error: threadError } = await supabase
    .from("ai_chat_threads")
    .select("id,mode,employee_id,employee_name,auto_titled")
    .eq("id", chatRequest.threadId)
    .eq("workspace_id", workspace_id)
    .eq("user_id", user_id)
    .is("archived_at", null)
    .single();

  if (threadError || !thread) {
    return NextResponse.json({ error: "Chat thread not found" }, { status: 404 });
  }

  if (thread.mode !== chatRequest.mode) {
    return NextResponse.json({ error: "Chat mode does not match thread context" }, { status: 400 });
  }

  if (thread.mode === "employee") {
    if (chatRequest.mode !== "employee") {
      return NextResponse.json({ error: "Employee thread requires employee mode requests" }, { status: 400 });
    }
    if (!thread.employee_id) {
      return NextResponse.json({ error: "Employee thread is missing employee context" }, { status: 400 });
    }
    if (chatRequest.employeeId !== thread.employee_id) {
      return NextResponse.json({ error: "employeeId does not match thread context" }, { status: 400 });
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: ChatStreamEvent) => {
        controller.enqueue(encoder.encode(encodeChatEvent(event)));
      };

      const run = async () => {
        try {
          send({ type: "start", mode: thread.mode });

          let finalPayload: ChatFinalPayload;

          if (thread.mode === "general") {
            const { data: generalEmployeeRows } = await supabase
              .from("employees")
              .select("role_id, location_id")
              .eq("workspace_id", wsContext.context.workspace_id)
              .eq("status", "active")
              .limit(500);
            const helperBenchmarks = await buildAiBenchmarkRows(
              ((generalEmployeeRows || []) as Array<{ role_id?: string | null; location_id?: string | null }>).map(
                (row) => ({
                  roleId: String(row.role_id || ""),
                  locationId: String(row.location_id || ""),
                }),
              ),
            ).catch(() => []);
            const helperResolution = await resolveGeneralHelperQuestion({
              supabase: supabase as { from: (table: string) => unknown },
              workspaceId: wsContext.context.workspace_id,
              message: chatRequest.message,
              marketBenchmarks:
                helperBenchmarks.length > 0
                  ? helperBenchmarks
                  : await fetchMarketBenchmarks(supabase as never).catch(() => []),
            });

            if (helperResolution.handled) {
              finalPayload = helperResolution.payload;
            } else {
              const input = await buildGeneralChatInput(wsContext.context, chatRequest.message);
              const client = getOpenAIClient();
              const responseStream = await client.responses.create({
                model: getChatModel(),
                input,
                stream: true,
              });

              let fullText = "";
              for await (const event of responseStream as AsyncIterable<unknown>) {
                const delta = extractOutputTextDelta(event);
                if (!delta) {
                  continue;
                }

                fullText += delta;
                send({ type: "delta", text: delta });
              }

              finalPayload = {
                mode: "general",
                answer: fullText.trim() || "I could not generate a response right now.",
              };
            }
          } else {
            const { context } = await loadEmployeeChatContext(
              wsContext.context.workspace_id,
              thread.employee_id!
            );
            const input = buildEmployeeChatInput(context, chatRequest.message);
            const client = getOpenAIClient();
            const responseStream = await client.responses.create({
              model: getAdvisoryModel(),
              input,
              stream: true,
            });

            let fullText = "";
            for await (const event of responseStream as AsyncIterable<unknown>) {
              const delta = extractOutputTextDelta(event);
              if (!delta) {
                continue;
              }

              fullText += delta;
            }

            const parsed = parseEmployeeStructuredAnswer(fullText);
            finalPayload = {
              mode: "employee",
              answer: parsed.answer,
              confidence: parsed.confidence,
              reasons: parsed.reasons,
              missing_data: parsed.missing_data,
            };
          }

          send({ type: "final", ...finalPayload });

          const userMessageTime = new Date();
          const assistantMessageTime = new Date(userMessageTime.getTime() + 1);
          const { error: userInsertError } = await supabase.from("ai_chat_messages").insert({
            thread_id: thread.id,
            role: "user",
            content: chatRequest.message,
            created_at: userMessageTime.toISOString(),
          });
          if (userInsertError) {
            throw new Error(userInsertError.message);
          }

          const { error: assistantInsertError } = await supabase.from("ai_chat_messages").insert({
            thread_id: thread.id,
            role: "assistant",
            content: finalPayload.answer,
            confidence: finalPayload.mode === "employee" ? finalPayload.confidence ?? null : null,
            reasons: finalPayload.mode === "employee" ? finalPayload.reasons ?? [] : [],
            missing_data: finalPayload.mode === "employee" ? finalPayload.missing_data ?? [] : [],
            created_at: assistantMessageTime.toISOString(),
          });
          if (assistantInsertError) {
            throw new Error(assistantInsertError.message);
          }

          let nextTitle: string | null = null;
          let nextAutoTitled: boolean | null = null;
          if (thread.auto_titled) {
            const { count } = await supabase
              .from("ai_chat_messages")
              .select("id", { count: "exact", head: true })
              .eq("thread_id", thread.id);
            if ((count || 0) <= 2) {
              nextTitle = buildThreadTitle({
                mode: thread.mode,
                employeeName: thread.employee_name,
                firstUserMessage: chatRequest.message,
              });
              nextAutoTitled = false;
            }
          }

          const threadUpdatePayload: {
            updated_at: string;
            last_message_at: string;
            title?: string;
            auto_titled?: boolean;
          } = {
            updated_at: assistantMessageTime.toISOString(),
            last_message_at: assistantMessageTime.toISOString(),
          };
          if (nextTitle) threadUpdatePayload.title = nextTitle;
          if (nextAutoTitled !== null) threadUpdatePayload.auto_titled = nextAutoTitled;

          const { error: threadUpdateError } = await supabase
            .from("ai_chat_threads")
            .update(threadUpdatePayload)
            .eq("id", thread.id);
          if (threadUpdateError) {
            throw new Error(threadUpdateError.message);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown chat error";
          send({ type: "error", error: message });
        } finally {
          controller.close();
        }
      };

      void run();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
