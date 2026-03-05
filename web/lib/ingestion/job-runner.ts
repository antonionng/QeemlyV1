/**
 * Ingestion job runner - lock, execute, retry with backoff.
 */

import { createServiceClient } from "@/lib/supabase/service";

const LOCK_TTL_MS = 5 * 60 * 1000; // 5 min
const WORKER_ID = process.env.VERCEL_CRON_ID || "worker-1";

export async function claimNextJob(): Promise<{
  job: { id: string; source_id: string; workspace_id: string | null };
} | null> {
  const supabase = createServiceClient();

  const { data: jobs } = await supabase
    .from("ingestion_jobs")
    .select("id, source_id, workspace_id")
    .eq("status", "queued")
    .or("next_retry_at.is.null,next_retry_at.lte.now()")
    .order("created_at", { ascending: true })
    .limit(1);

  const job = jobs?.[0];
  if (!job) return null;

  const { error } = await supabase
    .from("ingestion_jobs")
    .update({
      status: "running",
      locked_at: new Date().toISOString(),
      locked_by: WORKER_ID,
      started_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("status", "queued");

  if (error) return null; // Another worker claimed it

  return {
    job: {
      id: job.id,
      source_id: job.source_id,
      workspace_id: job.workspace_id,
    },
  };
}

export async function completeJob(
  jobId: string,
  result: {
    status: "success" | "partial" | "failed";
    records_created: number;
    records_updated: number;
    records_failed: number;
    error_message?: string;
    dq_report?: Record<string, unknown>;
  }
) {
  const supabase = createServiceClient();
  await supabase
    .from("ingestion_jobs")
    .update({
      status: result.status,
      records_created: result.records_created,
      records_updated: result.records_updated,
      records_failed: result.records_failed,
      error_message: result.error_message ?? null,
      dq_report: result.dq_report ?? null,
      completed_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
    })
    .eq("id", jobId);
}

export async function failJobForRetry(
  jobId: string,
  errorMessage: string,
  attemptNumber: number,
  maxAttempts: number
) {
  const supabase = createServiceClient();
  const nextRetry = new Date(Date.now() + Math.pow(2, attemptNumber) * 60 * 1000);
  const status = attemptNumber >= maxAttempts ? "failed" : "queued";

  await supabase
    .from("ingestion_jobs")
    .update({
      status,
      error_message: errorMessage,
      attempt_number: attemptNumber + 1,
      next_retry_at: status === "queued" ? nextRetry.toISOString() : null,
      locked_at: null,
      locked_by: null,
      completed_at: status === "failed" ? new Date().toISOString() : null,
    })
    .eq("id", jobId);
}
