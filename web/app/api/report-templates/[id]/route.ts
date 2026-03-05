import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const { workspace_id } = wsContext.context;
  const { id } = await params;

  const { data, error } = await supabase
    .from("report_templates")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .or(`workspace_id.eq.${workspace_id},workspace_id.is.null`)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ template: data });
}
