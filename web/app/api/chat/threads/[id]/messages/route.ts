import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, user_id } = wsContext.context;
  const { id } = await params;

  const { data: thread, error: threadError } = await supabase
    .from("ai_chat_threads")
    .select(
      "id,workspace_id,user_id,mode,employee_id,employee_name,employee_role,employee_department,title,auto_titled,created_at,updated_at,last_message_at,archived_at"
    )
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .eq("user_id", user_id)
    .is("archived_at", null)
    .single();

  if (threadError || !thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const { data: messages, error: messagesError } = await supabase
    .from("ai_chat_messages")
    .select("id,thread_id,role,content,confidence,reasons,missing_data,created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }

  return NextResponse.json({
    thread,
    messages: (messages || []).map((message) => ({
      ...message,
      reasons: Array.isArray(message.reasons) ? message.reasons : [],
      missing_data: Array.isArray(message.missing_data) ? message.missing_data : [],
    })),
  });
}
