"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { readChatStream } from "@/lib/ai/chat/stream-client";
import type { ChatRequest } from "@/lib/ai/chat/protocol";
import type { ChatStreamEvent } from "@/lib/ai/chat/protocol";
import type { ChatMessage, ChatThread, EmployeeContextSnapshot } from "@/lib/ai/chat/threads";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  confidence?: number | null;
  reasons?: string[];
  missingData?: string[];
};

export type SendMessageOptions = {
  mode?: ChatRequest["mode"];
  employeeId?: string;
  employee?: EmployeeContextSnapshot;
  newThread?: boolean;
};

type StartNewChatOptions = SendMessageOptions & {
  preserveMessages?: boolean;
};

const SUGGESTED_PROMPTS = [
  { id: "trends", label: "Market trends summary", query: "Can you summarize current market trends?" },
  { id: "underpaid", label: "Retention risk analysis", query: "Is my team at risk of being underpaid?" },
  { id: "compare", label: "Dubai vs Riyadh comparison", query: "Compare senior dev salaries in Dubai and Riyadh." },
  { id: "budget", label: "Hiring budget tips", query: "How can I optimize my hiring budget?" },
];

export function useAIChat() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || null,
    [threads, activeThreadId]
  );

  const fetchThreads = useCallback(async (): Promise<ChatThread[]> => {
    const response = await fetch("/api/chat/threads", { method: "GET" });
    if (!response.ok) {
      throw new Error("Failed to load chat history");
    }
    const payload = (await response.json()) as { threads?: ChatThread[] };
    const loadedThreads = Array.isArray(payload.threads) ? payload.threads : [];
    setThreads(loadedThreads);
    return loadedThreads;
  }, []);

  const openThread = useCallback(
    async (threadId: string) => {
      setIsLoadingMessages(true);
      try {
        const response = await fetch(`/api/chat/threads/${threadId}/messages`, { method: "GET" });
        if (!response.ok) {
          throw new Error("Failed to load chat messages");
        }
        const payload = (await response.json()) as {
          thread?: ChatThread;
          messages?: ChatMessage[];
        };

        if (payload.thread) {
          setThreads((prev) => {
            const exists = prev.some((thread) => thread.id === payload.thread!.id);
            if (!exists) return [payload.thread!, ...prev];
            return prev.map((thread) => (thread.id === payload.thread!.id ? payload.thread! : thread));
          });
        }

        const mappedMessages = (payload.messages || []).map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: new Date(message.created_at),
          confidence: message.confidence,
          reasons: Array.isArray(message.reasons) ? message.reasons : [],
          missingData: Array.isArray(message.missing_data) ? message.missing_data : [],
        }));

        setActiveThreadId(threadId);
        setMessages(mappedMessages);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    []
  );

  const startNewChat = useCallback(
    async (options?: StartNewChatOptions) => {
      const mode = options?.mode ?? "general";
      const response = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          employeeId: mode === "employee" ? options?.employeeId : undefined,
          employee: options?.employee,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to create chat thread");
      }
      const payload = (await response.json()) as { thread: ChatThread };
      setThreads((prev) => [payload.thread, ...prev.filter((thread) => thread.id !== payload.thread.id)]);
      setActiveThreadId(payload.thread.id);
      if (!options?.preserveMessages) {
        setMessages([]);
      }
      return payload.thread;
    },
    []
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      const response = await fetch(`/api/chat/threads/${threadId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to delete chat");
      }

      setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
      if (activeThreadId === threadId) {
        const remaining = threads.filter((thread) => thread.id !== threadId);
        if (remaining.length > 0) {
          void openThread(remaining[0].id);
        } else {
          setActiveThreadId(null);
          setMessages([]);
        }
      }
    },
    [activeThreadId, openThread, threads]
  );

  useEffect(() => {
    let ignore = false;
    const bootstrap = async () => {
      setIsLoadingThreads(true);
      try {
        const loadedThreads = await fetchThreads();
        if (ignore || loadedThreads.length === 0) return;
        await openThread(loadedThreads[0].id);
      } catch {
        if (!ignore) {
          setThreads([]);
          setMessages([]);
          setActiveThreadId(null);
        }
      } finally {
        if (!ignore) {
          setIsLoadingThreads(false);
        }
      }
    };
    void bootstrap();
    return () => {
      ignore = true;
    };
  }, [fetchThreads, openThread]);

  const sendMessage = useCallback(async (content: string, options?: SendMessageOptions) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }
    const desiredMode = options?.mode ?? activeThread?.mode ?? "general";
    const desiredEmployeeId =
      desiredMode === "employee" ? options?.employeeId ?? activeThread?.employee_id ?? undefined : undefined;

    let targetThread = activeThread;
    const modeMismatch = targetThread && targetThread.mode !== desiredMode;
    const employeeMismatch =
      desiredMode === "employee" &&
      targetThread?.mode === "employee" &&
      targetThread.employee_id &&
      desiredEmployeeId &&
      targetThread.employee_id !== desiredEmployeeId;
    const requiresNewThread = !targetThread || options?.newThread || modeMismatch || employeeMismatch;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedContent,
      timestamp: new Date(),
    };
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...(requiresNewThread ? [] : prev),
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);
    setIsTyping(true);

    try {
      if (requiresNewThread) {
        targetThread = await startNewChat({
          mode: desiredMode,
          employeeId: desiredEmployeeId,
          employee: options?.employee,
          preserveMessages: true,
        });
      }

      if (!targetThread) {
        throw new Error("No active chat thread available.");
      }

      const requestedMode = targetThread.mode;
      const payload: ChatRequest =
        requestedMode === "employee" && targetThread.employee_id
          ? {
              mode: "employee",
              employeeId: targetThread.employee_id,
              message: trimmedContent,
              threadId: targetThread.id,
            }
          : { mode: "general", message: trimmedContent, threadId: targetThread.id };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Chat backend unavailable");
      }

      let streamedAnswer = "";
      let finalAnswer = "";
      let streamError: string | null = null;

      await readChatStream(res, (event: ChatStreamEvent) => {
        if (event.type === "delta") {
          streamedAnswer += event.text;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: streamedAnswer } : msg))
          );
          return;
        }

        if (event.type === "final") {
          finalAnswer = event.answer;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: event.answer,
                    confidence: typeof event.confidence === "number" ? event.confidence : null,
                    reasons: Array.isArray(event.reasons) ? event.reasons : [],
                    missingData: Array.isArray(event.missing_data) ? event.missing_data : [],
                  }
                : msg
            )
          );
          return;
        }

        if (event.type === "error") {
          streamError = event.error;
        }
      });

      if (streamError) {
        throw new Error(streamError);
      }

      if (!streamedAnswer && !finalAnswer) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: "No response returned." } : msg
          )
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown chat error";
      const friendlyMessage =
        /relation .*ai_chat_threads.* does not exist|relation .*ai_chat_messages.* does not exist/i.test(
          message
        )
          ? "Chat storage is not initialized in this environment yet. Please run the latest Supabase migrations."
          : message;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: `AI chat request failed: ${friendlyMessage}` }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
      void fetchThreads();
    }
  }, [activeThread, fetchThreads, startNewChat]);

  return {
    threads,
    activeThreadId,
    activeThread,
    messages,
    sendMessage,
    startNewChat,
    openThread,
    deleteThread,
    isLoadingThreads,
    isLoadingMessages,
    isTyping,
    suggestedPrompts: SUGGESTED_PROMPTS,
  };
}

