import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HealthScore } from "@/components/dashboard/overview/health-score";
import type { OverviewMetrics } from "@/lib/dashboard/company-overview";

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

describe("HealthScore", () => {
  it("renders the redesigned semicircle gauge, status pill, and progress rows", () => {
    const html = renderToStaticMarkup(React.createElement(HealthScore, { metrics }));

    expect(html).toContain('data-testid="health-score-card"');
    expect(html).toContain('data-testid="health-score-gauge"');
    expect(html).toContain('viewBox="0 0 320 200"');
    expect(html).toContain('stroke-width="36"');
    expect(html).toContain(">6%</");
    expect(html).toContain(">Critical<");
    expect(html).toContain("background:#FFE4EA");
    expect(html).toContain("stroke:#2EC4A7");
    expect(html).toContain("Band Alignment");
    expect(html).toContain("Market Position");
    expect(html).toContain("Risk Management");
  });
});
