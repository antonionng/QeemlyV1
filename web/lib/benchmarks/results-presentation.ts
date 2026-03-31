import type { BenchmarkState } from "./benchmark-state";
import type { OrgPeerSummary } from "./org-peer-summary";

type BenchmarkPageStep = BenchmarkState["step"];
type BenchmarkConfidence = "High" | "Medium" | "Low";

export type BenchmarkInsight = {
  type: "success" | "warning" | "info";
  message: string;
};

export function getOrgPeerHoverMessage({
  isLoading,
  summary,
}: {
  isLoading: boolean;
  summary: OrgPeerSummary | null;
}): string {
  if (isLoading) return "Checking your org data...";
  if (!summary || !summary.benchmarkSource) {
    return "Org peer count is unavailable for this band";
  }
  if (summary.inBandCount === 0) {
    return "No active employees in your org are in this band";
  }
  if (summary.inBandCount === 1) {
    return "1 employee in your org is in this band";
  }
  return `${summary.inBandCount} employees in your org are in this band`;
}

export function shouldEnableOrgPeerHover(rowId: string, selectedLevelId: string): boolean {
  return Boolean(rowId && selectedLevelId);
}

export function getBenchmarkMarkerLabel(
  targetValue: number,
  row: { p10: number; p25: number; p50: number; p75: number; p90: number },
): string {
  const percentile = percentileFromComp(targetValue, row);
  return String(Math.round(percentile));
}

export function getBenchmarkPageTitle(step: BenchmarkPageStep): string {
  switch (step) {
    case "results":
      return "Benchmark Results";
    case "detail":
      return "Detailed Breakdown";
    default:
      return "Benchmarking";
  }
}

export function getBenchmarkConfidenceLabel(confidence: BenchmarkConfidence): string {
  if (confidence === "High") return "Very High Confidence";
  if (confidence === "Medium") return "Medium Confidence";
  return "Low Confidence";
}

export function getBenchmarkResultsInsights({
  targetPercentile,
  confidence,
  sampleSize,
}: {
  targetPercentile: number;
  confidence: BenchmarkConfidence;
  sampleSize: number;
}): BenchmarkInsight[] {
  const insights: BenchmarkInsight[] = [];

  if (targetPercentile === 75) {
    insights.push({
      type: "success",
      message: "Targeting above market to attract top talent",
    });
  } else if (targetPercentile === 50) {
    insights.push({
      type: "info",
      message: "Targeting market median for competitive positioning",
    });
  }

  if (confidence === "High") {
    insights.push({
      type: "success",
      message: `High confidence data (${sampleSize} data points)`,
    });
  } else if (confidence === "Low") {
    insights.push({
      type: "warning",
      message: "Limited data available. Use with caution",
    });
  }

  return insights;
}

function percentileFromComp(
  comp: number,
  row: { p10: number; p25: number; p50: number; p75: number; p90: number },
): number {
  if (comp <= row.p10) return 10;
  if (comp >= row.p90) return 90;
  if (comp <= row.p25) return 10 + ((comp - row.p10) / Math.max(1, row.p25 - row.p10)) * 15;
  if (comp <= row.p50) return 25 + ((comp - row.p25) / Math.max(1, row.p50 - row.p25)) * 25;
  if (comp <= row.p75) return 50 + ((comp - row.p50) / Math.max(1, row.p75 - row.p50)) * 25;
  return 75 + ((comp - row.p75) / Math.max(1, row.p90 - row.p75)) * 15;
}
