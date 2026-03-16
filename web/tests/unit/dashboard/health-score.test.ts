import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HealthScore } from "@/components/dashboard/overview/health-score";
import type { OverviewMetrics } from "@/lib/dashboard/company-overview";
import { buildOverviewInteractionMap } from "@/lib/dashboard/overview-interactions";

const metrics: OverviewMetrics = {
  totalEmployees: 95,
  activeEmployees: 95,
  benchmarkedEmployees: 95,
  totalPayroll: 17_800_000,
  inBandPercentage: 14,
  outOfBandPercentage: 86,
  avgMarketPosition: 85,
  rolesOutsideBand: 82,
  departmentsOverBenchmark: 4,
  payrollRiskFlags: 70,
  healthScore: 6,
  headcountTrend: [],
  payrollTrend: [],
  riskBreakdown: [],
  bandDistribution: {
    inBand: 14,
    above: 71,
    below: 15,
  },
  bandDistributionCounts: {
    inBand: 13,
    above: 67,
    below: 15,
  },
  headcountChange: 0,
  payrollChange: 0,
  inBandChange: 0,
  trendMode: "inferred_from_current_roster",
};

const interactions = buildOverviewInteractionMap({
  metrics,
  departmentSummaries: [],
  benchmarkCoverage: {
    activeEmployees: 95,
    benchmarkedEmployees: 95,
    unbenchmarkedEmployees: 0,
    coveragePct: 100,
  },
  benchmarkTrust: {
    coveragePercent: 100,
    matchRatePercent: 100,
    benchmarkedEmployees: 95,
    totalEmployees: 95,
    confidenceLabel: "High confidence",
    confidenceScore: 100,
    coverageLabel: "100% covered",
    methodologyLabel: "Uses matched market benchmarks for covered roles.",
    benchmarkSourceLabel: "Market",
  },
  advisoryCandidates: [],
  actions: [],
  insights: [],
  riskSummary: {
    totalAtRisk: 70,
    methodologyLabel: "Tracks benchmarked employees whose pay sits above market thresholds.",
    coverageNote: "Counts are based on benchmarked employees only.",
    departmentRows: [],
  },
  dataHealth: {
    latestBenchmarkFreshness: null,
    lastSync: null,
  },
});

describe("HealthScore", () => {
  it("renders the redesigned semicircle gauge, status pill, progress rows, and interaction hooks", () => {
    const html = renderToStaticMarkup(React.createElement(HealthScore, { metrics, interactions }));

    expect(html).toContain('data-testid="health-score-card"');
    expect(html).toContain('data-testid="health-score-gauge"');
    expect(html).toContain('data-testid="health-score-gauge-shell"');
    expect(html).toContain('data-testid="health-score-center-stack"');
    expect(html).toContain('data-testid="health-score-status-pill"');
    expect(html).toContain('data-testid="health-score-gauge-action"');
    expect(html).toContain('data-testid="health-score-gauge-tooltip"');
    expect(html).toContain('data-testid="health-score-factor-band-alignment-action"');
    expect(html).toContain('data-testid="health-score-factor-market-position-action"');
    expect(html).toContain('data-testid="health-score-factor-risk-management-action"');
    expect(html).toContain('data-overview-action="drawer"');
    expect(html).toContain('data-overview-action="link"');
    expect(html).toContain('viewBox="0 0 360 220"');
    expect(html).toContain('stroke-width="40"');
    expect(html).toContain(">6%</");
    expect(html).toContain(">Critical<");
    expect(html).toContain("background:#FFE4EA");
    expect(html).toContain("stroke:#2EC4A7");
    expect(html).toContain('data-testid="health-score-factor-band-alignment"');
    expect(html).toContain('data-testid="health-score-factor-market-position"');
    expect(html).toContain('data-testid="health-score-factor-risk-management"');
  });
});
