import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";

export async function DELETE(
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
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("ai_chat_threads")
    .update({
      archived_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .eq("user_id", user_id)
    .is("archived_at", null)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
