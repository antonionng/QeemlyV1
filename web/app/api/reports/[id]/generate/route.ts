import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { generateReportResult } from "@/lib/reports/generation";
import { jsonServerError } from "@/lib/errors/http";

type GenerateRequestBody = {
  trigger_source?: "manual" | "schedule" | "api" | "template";
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const { workspace_id, user_id } = wsContext.context;
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as GenerateRequestBody;
  const triggerSource = body.trigger_source || "manual";

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const { data: run, error: runInsertError } = await supabase
    .from("report_runs")
    .insert({
      workspace_id,
      report_id: report.id,
      status: "running",
      triggered_by: user_id,
      trigger_source: triggerSource,
      started_at: now,
    })
    .select()
    .single();

  if (runInsertError || !run) {
    return jsonServerError(runInsertError, {
      defaultMessage: "We could not start this report run right now.",
      logLabel: "Report run create failed",
    });
  }

  await supabase
    .from("reports")
    .update({
      status: "Building",
      build_error: null,
      last_run_id: run.id,
      updated_at: now,
    })
    .eq("id", report.id)
    .eq("workspace_id", workspace_id);

  try {
    const resultData = await generateReportResult(report);
    const completedAt = new Date().toISOString();

    const { data: completedRun, error: runUpdateError } = await supabase
      .from("report_runs")
      .update({
        status: "success",
        completed_at: completedAt,
        result_data: resultData,
        error_message: null,
        artifact_format: report.format,
        updated_at: completedAt,
      })
      .eq("id", run.id)
      .eq("workspace_id", workspace_id)
      .select()
      .single();

    if (runUpdateError || !completedRun) {
      return jsonServerError(runUpdateError, {
        defaultMessage: "We could not finish this report run right now.",
        logLabel: "Report run finalize failed",
      });
    }

    const { data: updatedReport, error: reportUpdateError } = await supabase
      .from("reports")
      .update({
        status: "Ready",
        result_data: resultData,
        last_run_at: completedAt,
        build_error: null,
        last_run_id: run.id,
        updated_at: completedAt,
      })
      .eq("id", report.id)
      .eq("workspace_id", workspace_id)
      .select()
      .single();

    if (reportUpdateError || !updatedReport) {
      return jsonServerError(reportUpdateError, {
        defaultMessage: "We could not update this report after generation.",
        logLabel: "Report status update after generation failed",
      });
    }

    return NextResponse.json({ run: completedRun, report: updatedReport });
  } catch (error) {
    const failedAt = new Date().toISOString();
    const message =
      error instanceof Error ? error.message : "Unexpected generation error";

    await supabase
      .from("report_runs")
      .update({
        status: "failed",
        completed_at: failedAt,
        error_message: message,
        updated_at: failedAt,
      })
      .eq("id", run.id)
      .eq("workspace_id", workspace_id);

    await supabase
      .from("reports")
      .update({
        status: "In Review",
        build_error: message,
        last_run_id: run.id,
        updated_at: failedAt,
      })
      .eq("id", report.id)
      .eq("workspace_id", workspace_id);

    return jsonServerError(error, {
      defaultMessage: "We could not generate this report right now.",
      logLabel: "Report generation failed",
    });
  }
}
