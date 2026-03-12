import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HealthScore } from "@/components/dashboard/overview/health-score";
import { StatCards } from "@/components/dashboard/overview/stat-cards";
import type { OverviewBenchmarkCoverage, OverviewMetrics } from "@/lib/dashboard/company-overview";

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

describe("Compensation health score grid", () => {
  it("uses a single responsive 3-column metrics grid in the overview page", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "app/(dashboard)/dashboard/overview/page.tsx"),
      "utf8",
    );

    expect(source).toContain('data-testid="overview-metrics-grid"');
    expect(source).toContain("lg:[grid-template-columns:2fr_1fr_1fr]");
    expect(source).not.toContain("<div className=\"lg:col-span-2\">");
  });

  it("renders the health score card with the large semicircle gauge, status pill, and unified factor bars", () => {
    const html = renderToStaticMarkup(
      React.createElement(HealthScore, {
        metrics,
      }),
    );

    expect(html).toContain('data-testid="health-score-card"');
    expect(html).toContain('data-testid="health-score-gauge"');
    expect(html).toContain('viewBox="0 0 320 200"');
    expect(html).toContain("stroke:#E6E7EB");
    expect(html).toContain("stroke:#2EC4A7");
    expect(html).toContain(">70%</");
    expect(html).toContain(">Good<");
    expect(html).toContain("background:#DFF7F1");
    expect(html).toContain("color:#1C8C6C");
    expect(html).toContain("Band Alignment");
    expect(html).toContain("Market Position");
    expect(html).toContain("Risk Management");
    expect(html).toContain("background:#5A67FF");
    expect(html).toContain("background:#F59E0B");
    expect(html).toContain("background:#FF3B5C");
  });

  it("renders the four metric cards with the exact chart treatments and without legacy chrome", () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCards, {
        metrics,
        benchmarkCoverage,
      }),
    );

    expect(html).toContain('data-testid="active-employees-card"');
    expect(html).toContain('data-testid="active-employees-sparkline"');
    expect(html).toContain("linearGradient");
    expect(html).toContain("stroke:#7C7FF0");
    expect(html).toContain(">141<");
    expect(html).toContain("+8.2%");
    expect(html).toContain("vs last year");

    expect(html).toContain('data-testid="total-payroll-card"');
    expect(html).toContain(">AED 68.6M<");
    expect(html).toContain(">Annual compensation<");
    expect(html).not.toContain("Monthly compensation");
    expect(html).toContain(">2023<");
    expect(html).toContain(">2024<");
    expect(html).toContain(">2025<");
    expect(html).toContain(">2026<");

    expect(html).toContain('data-testid="in-band-card"');
    expect(html).toContain('data-testid="in-band-distribution"');
    expect(html).toContain("background:#7BC8AE");
    expect(html).toContain("background:#F2C98A");
    expect(html).toContain("background:#E88FA1");
    expect(html).toContain(">65%<");

    expect(html).toContain('data-testid="risk-flags-card"');
    expect(html).toContain('data-testid="risk-flags-indicator"');
    expect(html).toContain("background:#FF3B5C");
    expect(html).toContain(">14<");

    expect(html).not.toContain("Coverage");
  });
});
