import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { id } = await params;
  const workspaceId = wsContext.context.workspace_id;
  const queryClient = wsContext.context.is_override ? createServiceClient() : supabase;
  const eventType = request.nextUrl.searchParams.get("eventType");
  const limitParam = Number(request.nextUrl.searchParams.get("limit") || "100");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 100;

  let query = queryClient
    .from("employee_timeline_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("employee_id", id)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, events: data || [] });
}
