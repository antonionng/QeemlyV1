import { describe, expect, it } from "vitest";
import type { OverviewMetrics, OverviewRiskSummary } from "@/lib/dashboard/company-overview";
import {
  OVERVIEW_BAND_COLORS,
  getBandDistributionPresentation,
  getHealthScoreFactors,
  getHealthScorePresentation,
  getRiskCardPresentation,
} from "@/lib/dashboard/overview-card-helpers";

const baseMetrics: OverviewMetrics = {
  totalEmployees: 85,
  activeEmployees: 85,
  benchmarkedEmployees: 85,
  totalPayroll: 3_100_000,
  inBandPercentage: 0,
  outOfBandPercentage: 100,
  avgMarketPosition: 91,
  rolesOutsideBand: 85,
  departmentsOverBenchmark: 3,
  payrollRiskFlags: 73,
  healthScore: 0,
  headcountTrend: [],
  payrollTrend: [],
  riskBreakdown: [
    { severity: "critical", count: 73, label: "Critical (>25% above)" },
    { severity: "high", count: 0, label: "High (15-25% above)" },
    { severity: "medium", count: 0, label: "Medium (5-15% above)" },
    { severity: "low", count: 0, label: "Low (slightly above)" },
  ],
  bandDistribution: {
    below: 14,
    inBand: 0,
    above: 86,
  },
  bandDistributionCounts: {
    inBand: 0,
    above: 73,
    below: 12,
  },
  headcountChange: 0,
  payrollChange: 0,
  inBandChange: 0,
  trendMode: "inferred_from_current_roster",
};

const baseRiskSummary: OverviewRiskSummary = {
  totalAtRisk: 73,
  methodologyLabel: "Tracks employees paid above market thresholds.",
  coverageNote: "Counts are based on benchmarked employees only.",
  departmentRows: [
    { name: "Engineering", value: 34 },
    { name: "Product", value: 12 },
  ],
};

describe("overview card helpers", () => {
  it("exposes the Figma band palette and background tints", () => {
    expect(OVERVIEW_BAND_COLORS).toEqual({
      inBand: "#00BC7D",
      inBandBg: "rgba(0,188,125,0.1)",
      aboveBand: "#FE9A00",
      aboveBandBg: "rgba(254,154,0,0.1)",
      belowBand: "#FF2056",
      belowBandBg: "rgba(255,32,86,0.1)",
    });
  });

  it("marks a zero health score as a critical attention state with clear band context", () => {
    expect(getHealthScorePresentation(baseMetrics)).toEqual({
      label: "Critical",
      tone: "critical",
      icon: "x-circle",
      accentClass: "text-rose-600",
      primaryValue: "0",
      secondaryValue: "Health score 0/100",
      summary: "85 of 85 benchmarked employees are outside the target band.",
    });
  });

  it("uses warning as the middle health state instead of fair", () => {
    expect(
      getHealthScorePresentation({
        ...baseMetrics,
        healthScore: 52,
      }),
    ).toEqual({
      label: "Warning",
      tone: "warning",
      icon: "alert-circle",
      accentClass: "text-amber-600",
      primaryValue: "52",
      secondaryValue: "Health score 52/100",
      summary: "85 of 85 benchmarked employees are outside the target band.",
    });
  });

  it("uses the March 6 factor scaling without forced minimum widths", () => {
    expect(getHealthScoreFactors(baseMetrics)).toEqual([
      {
        label: "Band Alignment",
        value: 0,
        target: 75,
        description: "0% of employees in band",
        tone: "critical",
        width: 0,
      },
      {
        label: "Market Position",
        value: 0,
        target: 85,
        description: "+91% vs market",
        tone: "critical",
        width: 0,
      },
      {
        label: "Risk Management",
        value: 0,
        target: 90,
        description: "73 risk flags",
        tone: "critical",
        width: 0,
      },
    ]);
  });

  it("collapses health score factors when there are no benchmarked employees yet", () => {
    expect(
      getHealthScoreFactors({
        ...baseMetrics,
        activeEmployees: 0,
        benchmarkedEmployees: 0,
        payrollRiskFlags: 0,
        avgMarketPosition: 0,
      }),
    ).toEqual([
      {
        label: "Band Alignment",
        value: 0,
        target: 75,
        description: "No benchmarked employees yet",
        tone: "critical",
        width: 0,
      },
      {
        label: "Market Position",
        value: 0,
        target: 85,
        description: "No benchmarked employees yet",
        tone: "critical",
        width: 0,
      },
      {
        label: "Risk Management",
        value: 0,
        target: 90,
        description: "No benchmarked employees yet",
        tone: "critical",
        width: 0,
      },
    ]);
  });

  it("keeps the risk card focused on the first action instead of generic alarm copy", () => {
    expect(getRiskCardPresentation(baseMetrics, baseRiskSummary)).toEqual({
      title: "Above-Market Pay Risk",
      subtitle: "Focus on employees above market thresholds first.",
      badgeLabel: "73 above market",
      primaryFocusTitle: "Start with Engineering",
      primaryFocusDescription: "34 employees in Engineering are above market thresholds.",
      actionLabel: "Review above-market employees",
    });
  });

  it("turns band distribution into a status-first summary when most employees are above band", () => {
    expect(getBandDistributionPresentation(baseMetrics)).toEqual({
      title: "Band Distribution",
      subtitle: "Most benchmarked employees are above the target band.",
      primaryFocusTitle: "86% above band",
      primaryFocusDescription: "73 benchmarked employees are currently paid above the target range.",
      targetLabel: "75% in band target",
      targetProgressLabel: "75 percentage points to go",
    });
  });
});
