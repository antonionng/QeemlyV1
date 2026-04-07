import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import type { ChatMode } from "@/lib/ai/chat/protocol";
import { summarizeTitleFromMessage } from "@/lib/ai/chat/threads";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

type CreateThreadBody = {
  mode?: ChatMode;
  employeeId?: string;
  employee?: {
    id?: string;
    name?: string;
    role?: string;
    department?: string;
  };
  title?: string;
};

export async function GET() {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, user_id } = wsContext.context;
  const { data, error } = await supabase
    .from("ai_chat_threads")
    .select(
      "id,workspace_id,user_id,mode,employee_id,employee_name,employee_role,employee_department,title,auto_titled,created_at,updated_at,last_message_at,archived_at"
    )
    .eq("workspace_id", workspace_id)
    .eq("user_id", user_id)
    .is("archived_at", null)
    .order("last_message_at", { ascending: false })
    .limit(200);

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not load your chat threads right now.",
      logLabel: "Chat threads load failed",
    });
  }

  return NextResponse.json({ threads: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, user_id } = wsContext.context;
  const body = (await request.json().catch(() => null)) as CreateThreadBody | null;
  const mode = body?.mode;
  if (mode !== "general" && mode !== "employee") {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: {
        mode: "Choose either general or employee mode and try again.",
      },
    });
  }

  let employeeId: string | null = null;
  let employeeName: string | null = null;
  let employeeRole: string | null = null;
  let employeeDepartment: string | null = null;

  if (mode === "employee") {
    const requestedEmployeeId = body?.employeeId || body?.employee?.id;
    if (!requestedEmployeeId?.trim()) {
      return jsonValidationError({
        message: "Please correct the highlighted fields and try again.",
        fields: {
          employeeId: "Choose an employee to start this chat.",
        },
      });
    }

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department")
      .eq("workspace_id", workspace_id)
      .eq("id", requestedEmployeeId.trim())
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    employeeId = employee.id;
    employeeName = body?.employee?.name?.trim() || `${employee.first_name} ${employee.last_name}`.trim();
    employeeRole = body?.employee?.role?.trim() || null;
    employeeDepartment = body?.employee?.department?.trim() || employee.department || null;
  }

  const rawTitle = body?.title?.trim();
  const finalTitle = rawTitle ? summarizeTitleFromMessage(rawTitle) : "New chat";
  const autoTitled = !rawTitle;

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("ai_chat_threads")
    .insert({
      workspace_id,
      user_id,
      mode,
      employee_id: employeeId,
      employee_name: employeeName,
      employee_role: employeeRole,
      employee_department: employeeDepartment,
      title: finalTitle,
      auto_titled: autoTitled,
      updated_at: nowIso,
      last_message_at: nowIso,
    })
    .select(
      "id,workspace_id,user_id,mode,employee_id,employee_name,employee_role,employee_department,title,auto_titled,created_at,updated_at,last_message_at,archived_at"
    )
    .single();

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not create this chat thread right now.",
      logLabel: "Chat thread create failed",
    });
  }

  return NextResponse.json({ thread: data }, { status: 201 });
}
