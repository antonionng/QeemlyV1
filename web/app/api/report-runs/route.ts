import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { jsonServerError } from "@/lib/errors/http";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const { workspace_id } = wsContext.context;
  const reportId = request.nextUrl.searchParams.get("report_id");

  const query = supabase
    .from("report_runs")
    .select("*")
    .eq("workspace_id", workspace_id)
    .order("created_at", { ascending: false });

  const { data, error } = reportId
    ? await query.eq("report_id", reportId)
    : await query.limit(50);

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not load report runs right now.",
      logLabel: "Report runs load failed",
    });
  }

  return NextResponse.json({ runs: data || [] });
}
