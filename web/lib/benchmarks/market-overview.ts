import type { MarketInsightsResponse } from "@/lib/benchmarks/market-insights";

export type MarketOverviewTone = "neutral" | "warning" | "positive" | "market" | "overlay";
export type MarketEntityKind = "role" | "location" | "level" | "provenance";
export type MarketTrustState = "healthy" | "limited" | "untrusted";

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
  const trustState = getMarketTrustState(insights);

  return [
    {
      label: "Trusted Benchmark Coverage",
      value: trustState === "untrusted" ? "No trusted cohorts in view" : `${qualifiedShare}%`,
      description:
        trustState === "untrusted"
          ? "Visible market cohorts are below Qeemly's contributor threshold for higher-confidence benchmarking in this view."
          : `${insights.summary.contributorQualifiedRows.toLocaleString()} of ${insights.summary.benchmarkCount.toLocaleString()} visible market cohorts currently meet Qeemly's minimum contributor requirement for trusted benchmarking.`,
      tone: trustState === "healthy" ? "positive" : "warning",
    },
    {
      label: "Roles Covered",
      value: `${insights.summary.uniqueRoles}`,
      description: "Visible market role coverage in the current benchmarking view.",
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

export function getMarketTrustState(
  insights: Pick<MarketInsightsResponse, "summary">,
): MarketTrustState {
  if (insights.summary.benchmarkCount === 0 || insights.summary.contributorQualifiedRows === 0) {
    return "untrusted";
  }

  if (insights.summary.coverageStrength === "strong") return "healthy";
  return "limited";
}

export function getMarketTrustExplainer(
  insights: Pick<MarketInsightsResponse, "summary" | "freshness">,
): string {
  const trustState = getMarketTrustState(insights);
  const qualifiedCount = insights.summary.contributorQualifiedRows.toLocaleString();
  const benchmarkCount = insights.summary.benchmarkCount.toLocaleString();
  const staleDays = insights.freshness.staleThresholdDays;
  const stateLine =
    trustState === "healthy"
      ? `${qualifiedCount} of ${benchmarkCount} visible cohorts currently qualify as trusted benchmarks in this view.`
      : trustState === "limited"
        ? `${qualifiedCount} of ${benchmarkCount} visible cohorts currently qualify as trusted benchmarks in this view, so stronger areas should be prioritized first.`
        : "Qeemly market coverage is visible in the current view, but none of the cohorts currently clear the contributor threshold for trusted benchmarking.";

  return [
    "A trusted benchmark is a visible market cohort that meets Qeemly's minimum contributor requirement.",
    "Cohorts below that bar can still appear in the dataset, but they should be used with extra caution.",
    `Freshness also matters. Cohorts older than ${staleDays} days are flagged so you can spot aging data before relying on it.`,
    stateLine,
  ].join("\n\n");
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
