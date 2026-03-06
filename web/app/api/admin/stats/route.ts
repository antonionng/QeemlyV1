import { NextResponse } from "next/server";
import { adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const supabase = createServiceClient();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      totalSourcesResult,
      enabledSourcesResult,
      jobs24hResult,
      marketBenchmarks,
      freshnessRowsResult,
    ] = await Promise.all([
      supabase.from("ingestion_sources").select("id", { count: "exact", head: true }),
      supabase.from("ingestion_sources").select("id", { count: "exact", head: true }).eq("enabled", true),
      supabase
        .from("ingestion_jobs")
        .select("status")
        .gte("created_at", cutoff),
      fetchMarketBenchmarks(supabase),
      supabase.from("data_freshness_metrics").select("last_updated_at, confidence").limit(50),
    ]);

    throwIfAdminQueryError(totalSourcesResult.error, "Failed to count ingestion sources");
    throwIfAdminQueryError(enabledSourcesResult.error, "Failed to count enabled ingestion sources");
    throwIfAdminQueryError(jobs24hResult.error, "Failed to load recent ingestion jobs");
    throwIfAdminQueryError(freshnessRowsResult.error, "Failed to load freshness summary");

    const jobs = jobs24hResult.data ?? [];
    const byStatus = {
      success: jobs.filter((j) => j.status === "success").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      running: jobs.filter((j) => j.status === "running" || j.status === "queued").length,
      partial: jobs.filter((j) => j.status === "partial").length,
    };

    const freshnessRows = freshnessRowsResult.data ?? [];
    const lastUpdated = freshnessRows.length
      ? freshnessRows
          .map((f) => new Date(f.last_updated_at).getTime())
          .filter(Boolean)
          .sort((a, b) => b - a)[0]
      : null;
    const stalenessHours = lastUpdated
      ? (Date.now() - lastUpdated) / (1000 * 60 * 60)
      : null;
    const freshnessScore =
      stalenessHours === null
        ? "unknown"
        : stalenessHours < 6
        ? "fresh"
        : stalenessHours < 24
        ? "stale"
        : "critical";

    return NextResponse.json({
      sources: { total: totalSourcesResult.count ?? 0, enabled: enabledSourcesResult.count ?? 0 },
      jobs_24h: { total: jobs.length, ...byStatus },
      benchmarks: { total: marketBenchmarks.length },
      freshness: {
        score: freshnessScore,
        last_updated_at: lastUpdated ? new Date(lastUpdated).toISOString() : null,
        staleness_hours: stalenessHours,
      },
    });
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
