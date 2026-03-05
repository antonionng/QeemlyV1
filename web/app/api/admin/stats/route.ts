import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalSources },
    { count: enabledSources },
    { data: jobs24h },
    { count: totalBenchmarks },
    { data: freshnessRows },
  ] = await Promise.all([
    supabase.from("ingestion_sources").select("id", { count: "exact", head: true }),
    supabase.from("ingestion_sources").select("id", { count: "exact", head: true }).eq("enabled", true),
    supabase
      .from("ingestion_jobs")
      .select("status")
      .gte("created_at", cutoff),
    supabase.from("salary_benchmarks").select("id", { count: "exact", head: true }),
    supabase.from("data_freshness_metrics").select("last_updated_at, confidence").limit(50),
  ]);

  const jobs = jobs24h ?? [];
  const byStatus = {
    success: jobs.filter((j) => j.status === "success").length,
    failed: jobs.filter((j) => j.status === "failed").length,
    running: jobs.filter((j) => j.status === "running" || j.status === "queued").length,
    partial: jobs.filter((j) => j.status === "partial").length,
  };

  // Overall freshness: most recent last_updated_at
  const lastUpdated = freshnessRows?.length
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
    sources: { total: totalSources ?? 0, enabled: enabledSources ?? 0 },
    jobs_24h: { total: jobs.length, ...byStatus },
    benchmarks: { total: totalBenchmarks ?? 0 },
    freshness: {
      score: freshnessScore,
      last_updated_at: lastUpdated ? new Date(lastUpdated).toISOString() : null,
      staleness_hours: stalenessHours,
    },
  });
}
