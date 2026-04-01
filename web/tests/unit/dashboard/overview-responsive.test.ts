import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DepartmentTabs } from "@/components/dashboard/overview/department-tabs";
import { QuickActions } from "@/components/dashboard/overview/quick-actions";
import { StatCards } from "@/components/dashboard/overview/stat-cards";
import type {
  OverviewAction,
  OverviewBenchmarkCoverage,
  OverviewDepartmentSummary,
  OverviewMetrics,
} from "@/lib/dashboard/company-overview";

const metrics: OverviewMetrics = {
  totalEmployees: 144,
  activeEmployees: 144,
  benchmarkedEmployees: 120,
  totalPayroll: 32_600_000,
  inBandPercentage: 65,
  outOfBandPercentage: 35,
  avgMarketPosition: -4,
  rolesOutsideBand: 19,
  departmentsOverBenchmark: 3,
  payrollRiskFlags: 8,
  healthScore: 72,
  headcountTrend: [
    { month: "2023", value: 120 },
    { month: "2024", value: 126 },
    { month: "2025", value: 131 },
    { month: "2026", value: 144 },
  ],
  payrollTrend: [
    { month: "2023", value: 24_000_000 },
    { month: "2024", value: 26_000_000 },
    { month: "2025", value: 28_000_000 },
    { month: "2026", value: 32_600_000 },
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
  headcountChange: 18.2,
  payrollChange: 19.4,
  inBandChange: -2.5,
  trendMode: "inferred_from_current_roster",
};

const benchmarkCoverage: OverviewBenchmarkCoverage = {
  activeEmployees: 144,
  benchmarkedEmployees: 120,
  unbenchmarkedEmployees: 24,
  coveragePct: 83,
};

const departmentSummaries: OverviewDepartmentSummary[] = [
  {
    department: "Engineering",
    activeCount: 67,
    benchmarkedCount: 67,
    totalPayroll: 13_000_000,
    avgVsMarket: -46.2,
    inBandCount: 0,
    aboveBandCount: 0,
    belowBandCount: 67,
    inBandPct: 0,
    aboveBandPct: 0,
    belowBandPct: 100,
    coveragePct: 100,
  },
  {
    department: "Design",
    activeCount: 20,
    benchmarkedCount: 18,
    totalPayroll: 3_400_000,
    avgVsMarket: 4.1,
    inBandCount: 11,
    aboveBandCount: 4,
    belowBandCount: 3,
    inBandPct: 61,
    aboveBandPct: 22,
    belowBandPct: 17,
    coveragePct: 90,
  },
];

const actions: OverviewAction[] = [
  {
    id: "explore-benchmarks",
    title: "Explore Benchmarks",
    description: "Qeemly market comparison data",
    href: "/dashboard/benchmarks",
    icon: "chart",
    tone: "info",
    actionLabel: "Open benchmarks",
  },
  {
    id: "import-comp",
    title: "Import Compensation Data",
    description: "Add incremental updates or replace your roster",
    href: "/dashboard/upload",
    icon: "upload",
    tone: "warning",
    actionLabel: "Import data",
  },
];

describe("dashboard overview responsive hardening", () => {
  it("delays the narrow overview rail until xl-sized viewports", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "app/(dashboard)/dashboard/overview/page.tsx"),
      "utf8",
    );

    expect(source).toContain('xl:grid-cols-[minmax(0,1.75fr)_minmax(24rem,1fr)]');
    expect(source).not.toContain("lg:grid-cols-[minmax(0,1.75fr)_minmax(22rem,1fr)]");
    expect(source).toContain("xl:grid-cols-2");
  });

  it("keeps overview stat cards on the simplified responsive grid", () => {
    const html = renderToStaticMarkup(
      React.createElement(StatCards, {
        metrics,
        benchmarkCoverage,
      }),
    );

    expect(html).toContain('data-testid="overview-stat-card-grid"');
    expect(html).toContain("md:grid-cols-2");
    expect(html).not.toContain("xl:grid-cols-1");
    expect(html).not.toContain("2xl:grid-cols-2");
    expect(html).toContain("sm:flex-row");
    expect(html).toContain("sm:items-end");
    expect(html).toContain('data-testid="total-payroll-bars-grid"');
    expect(html).toContain("grid-cols-4");
    expect(html).toContain("overflow-hidden");
    expect(html).not.toContain("min-w-[2.75rem]");
  });

  it("lets department widgets wrap and stack large payroll figures on smaller cards", () => {
    const html = renderToStaticMarkup(
      React.createElement(DepartmentTabs, {
        summaries: departmentSummaries,
      }),
    );

    expect(html).toContain("flex-wrap items-end gap-3");
    expect(html).toContain("break-words");
    expect(html).toContain("sm:grid-cols-3");
  });

  it("keeps quick actions readable in narrow dashboard widths", () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickActions, {
        actions,
      }),
    );

    expect(html).toContain("flex-wrap items-center justify-between");
    expect(html).toContain("max-w-[85vw]");
    expect(html).toContain("min-w-0 flex-1");
    expect(html).toContain("line-clamp-2");
    expect(html).toContain("min-h-[3rem]");
    expect(html).toContain("line-clamp-3");
    expect(html).toContain("min-h-[4.5rem]");
  });
});
