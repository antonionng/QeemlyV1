/**
 * Freshness metrics - compute and store last_updated_at, record_count, confidence.
 */

import { createServiceClient } from "@/lib/supabase/service";

export type FreshnessMetric = {
  workspace_id: string | null;
  source_id: string | null;
  metric_type: string;
  last_updated_at: string;
  record_count: number;
  confidence: "high" | "medium" | "low";
};

export async function upsertBenchmarksFreshness(
  workspaceId: string,
  recordCount: number,
  sourceId?: string | null
): Promise<void> {
  const supabase = createServiceClient();
  const lastUpdated = new Date().toISOString();
  const confidence: "high" | "medium" | "low" =
    recordCount >= 100 ? "high" : recordCount >= 20 ? "medium" : "low";

  const q = supabase
    .from("data_freshness_metrics")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("metric_type", "benchmarks");
  const { data: existing } = sourceId
    ? await q.eq("source_id", sourceId).maybeSingle()
    : await q.is("source_id", null).maybeSingle();

  if (existing?.id) {
    await supabase
      .from("data_freshness_metrics")
      .update({
        last_updated_at: lastUpdated,
        record_count: recordCount,
        confidence,
        computed_at: lastUpdated,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("data_freshness_metrics").insert({
      workspace_id: workspaceId,
      source_id: sourceId ?? null,
      metric_type: "benchmarks",
      last_updated_at: lastUpdated,
      record_count: recordCount,
      confidence,
      computed_at: lastUpdated,
    });
  }
}

export async function getFreshnessForWorkspace(
  workspaceId: string
): Promise<FreshnessMetric[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("data_freshness_metrics")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("computed_at", { ascending: false });

  return (data ?? []) as FreshnessMetric[];
}
