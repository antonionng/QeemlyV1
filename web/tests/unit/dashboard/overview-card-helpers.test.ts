import { describe, expect, it } from "vitest";
import type { OverviewMetrics, OverviewRiskSummary } from "@/lib/dashboard/company-overview";
import {
  getBandDistributionPresentation,
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
  it("marks a zero health score as a critical attention state with clear band context", () => {
    expect(getHealthScorePresentation(baseMetrics)).toEqual({
      label: "Critical",
      tone: "critical",
      icon: "x-circle",
      accentClass: "text-rose-600",
      primaryValue: "Critical",
      secondaryValue: "Health score 0/100",
      summary: "85 of 85 benchmarked employees are outside the target band.",
    });
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
