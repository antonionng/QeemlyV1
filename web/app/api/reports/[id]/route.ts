import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { jsonServerError } from "@/lib/errors/http";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const { workspace_id } = wsContext.context;
  const { id } = await params;

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  return NextResponse.json({ report: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const { workspace_id } = wsContext.context;
  const { id } = await params;

  const body = await request.json();
  const allowedFields = [
    "title", "status", "tags", "schedule_cadence", "schedule_next_run",
    "recipients", "config", "result_data", "format", "last_run_at",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("reports")
    .update(updates)
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .select()
    .single();

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not update this report right now.",
      logLabel: "Report update failed",
    });
  }
  return NextResponse.json({ report: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const { workspace_id } = wsContext.context;
  const { id } = await params;

  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace_id);

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not delete this report right now.",
      logLabel: "Report delete failed",
    });
  }
  return NextResponse.json({ success: true });
}
