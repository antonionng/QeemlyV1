import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { isSourceAllowedForIngestion } from "@/lib/ingestion/source-registry";
import { completeJob, failJobForRetry } from "@/lib/ingestion/job-runner";
import { runIngestionForJob } from "@/lib/ingestion/worker";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const sourceId = body?.source_id;

    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json(
        { error: "body.source_id (UUID) is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify source exists
    const { data: source, error: sourceErr } = await supabase
      .from("ingestion_sources")
      .select("id, slug, name, enabled, approved_for_commercial, needs_review, category, regions, update_cadence, expected_fields, config, description, license_url, terms_summary, created_at, updated_at")
      .eq("id", sourceId)
      .single();

    if (sourceErr || !source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    if (!isSourceAllowedForIngestion(source)) {
      return NextResponse.json(
        { error: `Source ${source.slug} is not approved for ingestion` },
        { status: 400 },
      );
    }

    // Create job and mark as running
    const { data: job, error: jobErr } = await supabase
      .from("ingestion_jobs")
      .insert({
        source_id: sourceId,
        workspace_id: null,
        status: "running",
        job_type: "full",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      return NextResponse.json(
        { error: jobErr?.message ?? "Failed to create job" },
        { status: 500 }
      );
    }

    try {
      const result = await runIngestionForJob(job.id, sourceId, null);
      await completeJob(job.id, result);
      return NextResponse.json({
        job_id: job.id,
        status: result.status,
        records_created: result.records_created,
        records_updated: result.records_updated,
        records_failed: result.records_failed,
        error_message: result.error_message,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await failJobForRetry(job.id, msg, 1, 3);
      return NextResponse.json(
        { job_id: job.id, error: msg },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Trigger failed" },
      { status: 500 }
    );
  }
}
