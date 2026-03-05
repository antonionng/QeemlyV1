import type { NormalizedBenchmarkRow } from "./normalizer";

export type IndustryMarketSignalInsert = {
  workspace_id: string;
  source_slug: string;
  domain: "benchmark" | "compliance" | "relocation" | "billing";
  industry: string;
  metric_key: string;
  metric_value_numeric: number | null;
  metric_value_text: string | null;
  unit: string | null;
  currency: string | null;
  role_id: string;
  location_id: string;
  level_id: string;
  geo_region: string | null;
  period_start: string;
  period_end: string | null;
  observed_at: string;
  confidence: "high" | "medium" | "low";
  metadata: Record<string, unknown>;
  updated_at: string;
};

function inferIndustryFromSourceSlug(sourceSlug: string): string {
  const slug = sourceSlug.toLowerCase();
  if (slug.includes("health")) return "healthcare";
  if (slug.includes("bank") || slug.includes("fin") || slug.includes("gastat")) return "fintech";
  if (slug.includes("retail") || slug.includes("consumer")) return "retail";
  if (slug.includes("public") || slug.includes("gov")) return "public-sector";
  return "general";
}

export function benchmarkRowToIndustrySignals(args: {
  workspaceId: string;
  sourceSlug: string;
  row: NormalizedBenchmarkRow;
  periodStart: string;
}): IndustryMarketSignalInsert[] {
  const { workspaceId, sourceSlug, row, periodStart } = args;
  const observedAt = new Date().toISOString();
  const industry = inferIndustryFromSourceSlug(sourceSlug);
  const geoRegion = row.locationId.includes("riyadh") || row.locationId.includes("doha")
    ? "GCC"
    : "Global";

  const base = {
    workspace_id: workspaceId,
    source_slug: sourceSlug,
    domain: "benchmark" as const,
    industry,
    currency: row.currency,
    role_id: row.roleId,
    location_id: row.locationId,
    level_id: row.levelId,
    geo_region: geoRegion,
    period_start: periodStart,
    period_end: null,
    observed_at: observedAt,
    confidence: row.mappingConfidence,
    metadata: {
      sample_size: row.sampleSize,
      original_role: row.originalRole || null,
      original_location: row.originalLocation || null,
      original_level: row.originalLevel || null,
    },
    updated_at: observedAt,
  };

  return [
    { ...base, metric_key: "p10", metric_value_numeric: row.p10, metric_value_text: null, unit: "annual_compensation" },
    { ...base, metric_key: "p25", metric_value_numeric: row.p25, metric_value_text: null, unit: "annual_compensation" },
    { ...base, metric_key: "p50", metric_value_numeric: row.p50, metric_value_text: null, unit: "annual_compensation" },
    { ...base, metric_key: "p75", metric_value_numeric: row.p75, metric_value_text: null, unit: "annual_compensation" },
    { ...base, metric_key: "p90", metric_value_numeric: row.p90, metric_value_text: null, unit: "annual_compensation" },
    {
      ...base,
      metric_key: "sample_size",
      metric_value_numeric: row.sampleSize ?? 0,
      metric_value_text: null,
      unit: "count",
    },
  ];
}

export function complianceSnapshotToIndustrySignals(args: {
  workspaceId: string;
  sourceSlug: string;
  complianceScore: number;
  openRiskCount: number;
  periodStart: string;
}): IndustryMarketSignalInsert[] {
  const observedAt = new Date().toISOString();
  const base = {
    workspace_id: args.workspaceId,
    source_slug: args.sourceSlug,
    domain: "compliance" as const,
    industry: "general",
    currency: null,
    role_id: "",
    location_id: "",
    level_id: "",
    geo_region: "GCC",
    period_start: args.periodStart,
    period_end: null,
    observed_at: observedAt,
    confidence: "high" as const,
    metadata: {},
    updated_at: observedAt,
  };

  return [
    { ...base, metric_key: "compliance_score", metric_value_numeric: args.complianceScore, metric_value_text: null, unit: "score" },
    { ...base, metric_key: "open_risk_count", metric_value_numeric: args.openRiskCount, metric_value_text: null, unit: "count" },
  ];
}

export function relocationCostToIndustrySignals(args: {
  workspaceId: string;
  sourceSlug: string;
  cityId: string;
  currency: string;
  monthlyCost: number;
  periodStart: string;
}): IndustryMarketSignalInsert[] {
  const observedAt = new Date().toISOString();
  return [
    {
      workspace_id: args.workspaceId,
      source_slug: args.sourceSlug,
      domain: "relocation",
      industry: "general",
      metric_key: "monthly_total_cost",
      metric_value_numeric: args.monthlyCost,
      metric_value_text: null,
      unit: "monthly_cost",
      currency: args.currency,
      role_id: "",
      location_id: args.cityId,
      level_id: "",
      geo_region: "GCC",
      period_start: args.periodStart,
      period_end: null,
      observed_at: observedAt,
      confidence: "medium",
      metadata: {},
      updated_at: observedAt,
    },
  ];
}

export function billingInvoiceToIndustrySignals(args: {
  workspaceId: string;
  sourceSlug: string;
  currency: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  periodStart: string;
}): IndustryMarketSignalInsert[] {
  const observedAt = new Date().toISOString();
  return [
    {
      workspace_id: args.workspaceId,
      source_slug: args.sourceSlug,
      domain: "billing",
      industry: "general",
      metric_key: "invoice_amount",
      metric_value_numeric: args.amount,
      metric_value_text: null,
      unit: "currency_amount",
      currency: args.currency,
      role_id: "",
      location_id: "",
      level_id: "",
      geo_region: "GCC",
      period_start: args.periodStart,
      period_end: null,
      observed_at: observedAt,
      confidence: "high",
      metadata: { status: args.status },
      updated_at: observedAt,
    },
  ];
}
