/**
 * Vercel Cron: POST /api/cron/ingestion
 *
 * Triggered by vercel.json cron. Creates queued jobs for enabled sources
 * and processes one queued job. Protected by CRON_SECRET.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSourceAllowedForIngestion } from "@/lib/ingestion/source-registry";
import { createServiceClient } from "@/lib/supabase/service";
import { claimNextJob, completeJob, failJobForRetry } from "@/lib/ingestion/job-runner";
import { runIngestionForJob } from "@/lib/ingestion/worker";
import { validateRuntimeEnv } from "@/lib/config/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const envCheck = validateRuntimeEnv(process.env, { requireCronSecret: true });
  if (!envCheck.ok) {
    return NextResponse.json(
      {
        error: "Server misconfiguration",
        missing: envCheck.missing,
      },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET!;
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 1. Enqueue jobs for all enabled sources
  const { data: sources } = await supabase
    .from("ingestion_sources")
    .select("id, slug, name, enabled, approved_for_commercial, needs_review, category, regions, update_cadence, expected_fields, config, description, license_url, terms_summary, created_at, updated_at");

  for (const source of (sources || []).filter(isSourceAllowedForIngestion)) {
    const { count } = await supabase
      .from("ingestion_jobs")
      .select("id", { count: "exact", head: true })
      .eq("source_id", source.id)
      .in("status", ["queued", "running"])
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if ((count ?? 0) > 0) continue; // Already has pending job today

    await supabase.from("ingestion_jobs").insert({
      source_id: source.id,
      workspace_id: null,
      status: "queued",
      job_type: "full",
    });
  }

  // 2. Process one queued job
  const claimed = await claimNextJob();
  if (!claimed) {
    return NextResponse.json({ enqueued: sources?.length ?? 0, processed: 0 });
  }

  const { job } = claimed;
  try {
    const result = await runIngestionForJob(job.id, job.source_id, job.workspace_id);
    await completeJob(job.id, result);
    return NextResponse.json({
      enqueued: sources?.length ?? 0,
      processed: 1,
      job_id: job.id,
      status: result.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const { data: j } = await supabase
      .from("ingestion_jobs")
      .select("attempt_number, max_attempts")
      .eq("id", job.id)
      .single();
    await failJobForRetry(
      job.id,
      msg,
      j?.attempt_number ?? 1,
      j?.max_attempts ?? 3
    );
    return NextResponse.json({
      enqueued: sources?.length ?? 0,
      processed: 1,
      job_id: job.id,
      error: msg,
    });
  }
}
