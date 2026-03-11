import type { MarketInsightsResponse } from "@/lib/benchmarks/market-insights";

export type MarketOverviewTone = "neutral" | "warning" | "positive" | "market" | "overlay";
export type MarketEntityKind = "role" | "location" | "level" | "provenance";

export type MarketOverviewCard = {
  label: string;
  value: string;
  description: string;
  tone: MarketOverviewTone;
};

export type MarketOverviewFilters = {
  roleId: string;
  locationId: string;
  levelId: string;
};

export function buildMarketOverviewCards(
  insights: MarketInsightsResponse,
): MarketOverviewCard[] {
  const qualifiedShare =
    insights.summary.benchmarkCount > 0
      ? Math.round((insights.summary.contributorQualifiedRows / insights.summary.benchmarkCount) * 100)
      : 0;

  return [
    {
      label: "Coverage Quality",
      value: `${qualifiedShare}%`,
      description: `${insights.summary.contributorQualifiedRows.toLocaleString()} of ${insights.summary.benchmarkCount.toLocaleString()} visible market cohorts meet the contributor threshold.`,
      tone: insights.summary.coverageStrength === "strong" ? "positive" : "warning",
    },
    {
      label: "Roles Covered",
      value: `${insights.summary.uniqueRoles}`,
      description: "Active market coverage across the visible Qeemly dataset.",
      tone: "market",
    },
    {
      label: "Freshness Watch",
      value: `${insights.freshness.staleRows}`,
      description: `Cohorts are older than the ${insights.freshness.staleThresholdDays}-day freshness target.`,
      tone: insights.freshness.staleRows > 0 ? "warning" : "positive",
    },
    {
      label: "Company Overlay",
      value: `${insights.workspaceOverlay.count}`,
      description: "Company pay bands are available as a secondary policy overlay.",
      tone: "overlay",
    },
  ];
}

export function filterMarketDrilldownRows(
  insights: Pick<MarketInsightsResponse, "drilldowns">,
  filters: MarketOverviewFilters,
) {
  return insights.drilldowns.rows.filter((row) => {
    if (filters.roleId && row.roleId !== filters.roleId) return false;
    if (filters.locationId && row.locationId !== filters.locationId) return false;
    if (filters.levelId && row.levelId !== filters.levelId) return false;
    return true;
  });
}

export function formatMarketEntityLabel(value: string, kind: MarketEntityKind): string {
  if (!value) return "";
  if (kind === "level") return value.toUpperCase();
  if (kind === "provenance") return getProvenanceLabel(value);

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => {
      const upper = part.toUpperCase();
      if (upper === "VP" || /^IC\d+$/.test(upper) || /^D\d+$/.test(upper)) return upper;
      return upper.charAt(0) + upper.slice(1).toLowerCase();
    })
    .join(" ");
}

function getProvenanceLabel(value: string): string {
  switch (value) {
    case "blended":
      return "Blended Market Data";
    case "employee":
      return "Employee Contributed Data";
    case "uploaded":
      return "Company Submitted Data";
    case "admin":
      return "Curated Market Data";
    default:
      return formatMarketEntityLabel(value, "role");
  }
}
