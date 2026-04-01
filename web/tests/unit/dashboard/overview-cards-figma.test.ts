import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BandDistributionChart } from "@/components/dashboard/overview/band-distribution-chart";
import { HealthScore } from "@/components/dashboard/overview/health-score";
import { StatCards } from "@/components/dashboard/overview/stat-cards";
import type { OverviewBenchmarkCoverage, OverviewMetrics } from "@/lib/dashboard/company-overview";
import { buildOverviewInteractionMap } from "@/lib/dashboard/overview-interactions";

const metrics: OverviewMetrics = {
  totalEmployees: 150,
  activeEmployees: 141,
  benchmarkedEmployees: 120,
  totalPayroll: 68_600_000,
  inBandPercentage: 65,
  outOfBandPercentage: 35,
  avgMarketPosition: 15,
  rolesOutsideBand: 42,
  departmentsOverBenchmark: 3,
  payrollRiskFlags: 14,
  healthScore: 70,
  headcountTrend: [
    { month: "2023", value: 108 },
    { month: "2024", value: 104 },
    { month: "2025", value: 106 },
    { month: "2026-01", value: 118 },
    { month: "2026-02", value: 125 },
    { month: "2026-03", value: 141 },
  ],
  payrollTrend: [
    { month: "2023", value: 44_000_000 },
    { month: "2024", value: 52_000_000 },
    { month: "2025", value: 49_000_000 },
    { month: "2026", value: 68_600_000 },
  ],
  riskBreakdown: [],
  bandDistribution: {
    inBand: 65,
    above: 20,
    below: 15,
  },
  bandDistributionCounts: {
    inBand: 78,
    above: 24,
    below: 18,
  },
  headcountChange: 8.2,
  payrollChange: 12.4,
  inBandChange: -3.5,
  trendMode: "inferred_from_current_roster",
};

const benchmarkCoverage: OverviewBenchmarkCoverage = {
  activeEmployees: 141,
  benchmarkedEmployees: 120,
  unbenchmarkedEmployees: 21,
  coveragePct: 85,
};

const interactions = buildOverviewInteractionMap({
  metrics,
  departmentSummaries: [],
  benchmarkCoverage,
  benchmarkTrust: {
    coveragePercent: 85,
    matchRatePercent: 92,
    benchmarkedEmployees: 120,
    totalEmployees: 141,
    confidenceLabel: "High confidence",
    confidenceScore: 85,
    coverageLabel: "85% covered",
    methodologyLabel: "Uses matched market benchmarks for covered roles.",
    benchmarkSourceLabel: "Market",
  },
  advisoryCandidates: [],
  actions: [],
  insights: [],
  riskSummary: {
    totalAtRisk: 14,
    methodologyLabel: "Tracks benchmarked employees whose pay sits above market thresholds.",
    coverageNote: "Counts are based on benchmarked employees only.",
    departmentRows: [],
  },
  dataHealth: {
    latestBenchmarkFreshness: null,
    lastSync: null,
  },
});

describe("Compensation health score grid", () => {
  it("uses a single responsive 3-column metrics grid in the overview page", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "app/(dashboard)/dashboard/overview/page.tsx"),
      "utf8",
    );

    expect(source).toContain('data-testid="overview-metrics-grid"');
    expect(source).not.toContain("lg:[grid-template-columns:2fr_1fr_1fr]");
    expect(source).toContain("items-start");
    expect(source).toContain("2xl:grid-cols-[minmax(0,1.75fr)_minmax(24rem,1fr)]");
    expect(source).toContain("<HealthScore");
    expect(source).toContain("interactions={interactionMap}");
    expect(source).toContain("onInteract={handleOverviewInteraction}");
    expect(source).toContain("<StatCards");
  });

  it("renders the health score card with the large semicircle gauge, status pill, and unified factor bars", () => {
    const html = renderToStaticMarkup(
      React.createElement(HealthScore, {
        metrics,
        interactions,
      }),
    );

    expect(html).toContain('data-testid="health-score-card"');
    expect(html).toContain('data-testid="health-score-gauge"');
    expect(html).toContain('data-testid="health-score-gauge-shell"');
    expect(html).toContain('data-testid="health-score-center-stack"');
    expect(html).toContain('data-testid="health-score-status-pill"');
    expect(html).toContain('viewBox="0 0 435 218"');
    expect(html).toContain('stroke="#E5E7EB"');
    expect(html).toContain('stroke="#2EC4A6"');
    expect(html).toContain(">70%</");
    expect(html).toContain(">Good<");
    expect(html).toContain("bg-teal-100 text-teal-700");
    expect(html).toContain('data-testid="health-score-needle"');
    expect(html).toContain('data-testid="health-score-factor-band-alignment"');
    expect(html).toContain('data-testid="health-score-factor-market-position"');
    expect(html).toContain('data-testid="health-score-factor-risk-management"');
    expect(html).toContain('data-testid="health-score-gauge-action"');
    expect(html).toContain('data-testid="health-score-gauge-tooltip"');
    expect(html).toContain("background-color:#5C45FD");
    expect(html).toContain("background-color:#FE9A00");
    expect(html).toContain("background-color:#FF2056");
  });

  it("keeps the health score card compact at medium dashboard widths", () => {
    const html = renderToStaticMarkup(
      React.createElement(HealthScore, {
        metrics,
        interactions,
      }),
    );

    expect(html).toContain("min-h-[480px]");
    expect(html).toContain("lg:min-h-[540px]");
    expect(html).toContain('data-testid="health-score-card-header"');
    expect(html).toContain('data-testid="health-score-factor-list"');
    expect(html).toContain("h-[232px]");
    expect(html).toContain("lg:h-[252px]");
  });

  it("renders the four metric cards with the exact chart treatments and without legacy chrome", () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCards, {
        metrics,
        benchmarkCoverage,
        interactions,
      }),
    );

    expect(html).toContain('data-testid="overview-stat-card-grid"');
    expect(html).toContain("md:grid-cols-2");
    expect(html).toContain('data-testid="active-employees-card"');
    expect(html).toContain('data-testid="active-employees-card-action"');
    expect(html).toContain('data-testid="active-employees-card-tooltip"');
    expect(html).toContain('data-testid="active-employees-sparkline"');
    expect(html).toContain('data-testid="active-employees-card-chart"');
    expect(html).toContain("linearGradient");
    expect(html).toContain("stroke:#A89BFF");
    expect(html).toContain(">141<");
    expect(html).toContain("+8.2%");
    expect(html).toContain("vs last year");

    expect(html).toContain('data-testid="total-payroll-card"');
    expect(html).toContain('data-testid="total-payroll-card-action"');
    expect(html).toContain('data-testid="total-payroll-card-tooltip"');
    expect(html).toContain('data-testid="total-payroll-card-chart"');
    expect(html).toContain('data-testid="total-payroll-card-value-currency">AED<');
    expect(html).toContain('data-testid="total-payroll-card-value-amount">68.6M<');
    expect(html).toContain(">Annual compensation<");
    expect(html).not.toContain("Monthly compensation");
    expect(html).toContain(">2023<");
    expect(html).toContain(">2024<");
    expect(html).toContain(">2025<");
    expect(html).toContain(">2026<");

    expect(html).toContain('data-testid="in-band-card"');
    expect(html).toContain('data-testid="in-band-card-action"');
    expect(html).toContain('data-testid="in-band-card-tooltip"');
    expect(html).toContain('data-testid="in-band-distribution"');
    expect(html).toContain('data-testid="in-band-card-chart"');
    expect(html).toContain("background:#00BC7D");
    expect(html).toContain("background:#FE9A00");
    expect(html).toContain("background:#FF2056");
    expect(html).toContain(">65%<");

    expect(html).toContain('data-testid="risk-flags-card"');
    expect(html).toContain('data-testid="risk-flags-card-action"');
    expect(html).toContain('data-testid="risk-flags-card-tooltip"');
    expect(html).toContain('data-testid="risk-flags-indicator"');
    expect(html).toContain('data-testid="risk-flags-card-chart"');
    expect(html).toContain("background:#FF2056");
    expect(html).toContain(">14<");

    expect(html).not.toContain("Coverage");
  });

  it("renders payroll headline values as separate currency and amount tokens for narrow cards", () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCards, {
        metrics,
        benchmarkCoverage,
        interactions,
      }),
    );

    expect(html).toContain('data-testid="total-payroll-card-value"');
    expect(html).toContain('data-testid="total-payroll-card-value-currency">AED<');
    expect(html).toContain('data-testid="total-payroll-card-value-amount">68.6M<');
    expect(html).not.toContain(">AED 68.6M<");
  });

  it("uses shared header and visual slots to keep metric cards aligned on smaller screens", () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCards, {
        metrics,
        benchmarkCoverage,
        interactions,
      }),
    );

    expect(html).toContain('data-testid="active-employees-card-header"');
    expect(html).toContain('data-testid="total-payroll-card-header"');
    expect(html).toContain('data-testid="in-band-card-header"');
    expect(html).toContain('data-testid="risk-flags-card-header"');
    expect(html).toContain('data-testid="active-employees-card-visual-slot"');
    expect(html).toContain('data-testid="total-payroll-card-visual-slot"');
    expect(html).toContain('data-testid="in-band-card-visual-slot"');
    expect(html).toContain('data-testid="risk-flags-card-visual-slot"');
    expect(html).toContain("overview-metric-card-footer");
  });

  it("reserves enough header height to keep bottom-row metric values aligned", () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCards, {
        metrics,
        benchmarkCoverage,
        interactions,
      }),
    );

    expect(html).toContain("overview-metric-card-header min-h-[5.25rem]");
    expect(html).toContain("overview-metric-card-description block min-h-[3rem]");
  });

  it("renders the band distribution card with row and donut interaction hooks", () => {
    const html = renderToStaticMarkup(
      React.createElement(BandDistributionChart, {
        metrics,
        benchmarkCoverage,
        interactions,
      }),
    );

    expect(html).toContain('data-testid="band-distribution-in-band-action"');
    expect(html).toContain('data-testid="band-distribution-above-band-action"');
    expect(html).toContain('data-testid="band-distribution-below-band-action"');
    expect(html).toContain('data-testid="band-distribution-in-band-tooltip"');
    expect(html).toContain('data-testid="band-distribution-above-band-tooltip"');
    expect(html).toContain('data-testid="band-distribution-below-band-tooltip"');
    expect(html).toContain('data-testid="band-distribution-in-band-segment-action"');
    expect(html).toContain('data-testid="band-distribution-above-band-segment-action"');
    expect(html).toContain('data-testid="band-distribution-below-band-segment-action"');
    expect(html).toContain('data-overview-href="/dashboard/people?band=in-band"');
    expect(html).toContain('data-overview-href="/dashboard/people?band=above"');
    expect(html).toContain('data-overview-href="/dashboard/people?band=below"');
  });
});
