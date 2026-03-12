import { describe, expect, it } from "vitest";
import type { CompanyMetrics, DepartmentSummary } from "@/lib/employees";
import {
  buildCompanyOverviewHeadlineCards,
  buildCompareLensCards,
  getDashboardOverviewRoutes,
  buildMarketLensCards,
  type BenchmarkStatsSummary,
} from "@/lib/company-vs-market";

const metrics: CompanyMetrics = {
  totalEmployees: 108,
  activeEmployees: 100,
  totalPayroll: 3_100_000,
  inBandPercentage: 68,
  outOfBandPercentage: 32,
  avgMarketPosition: -4,
  rolesOutsideBand: 32,
  departmentsOverBenchmark: 1,
  payrollRiskFlags: 7,
  healthScore: 58,
  headcountTrend: [{ month: "Jan", value: 100 }],
  payrollTrend: [{ month: "Jan", value: 3_100_000 }],
  riskBreakdown: [{ severity: "medium", count: 7, label: "Medium" }],
  bandDistribution: {
    below: 24,
    inBand: 68,
    above: 8,
  },
  headcountChange: 0,
  payrollChange: 0,
  inBandChange: 0,
};

const departmentSummaries: DepartmentSummary[] = [
  {
    department: "Engineering",
    headcount: 40,
    activeCount: 40,
    inBandCount: 25,
    belowBandCount: 10,
    aboveBandCount: 5,
    totalPayroll: 1_400_000,
    avgVsMarket: -8,
  },
  {
    department: "Product",
    headcount: 20,
    activeCount: 20,
    inBandCount: 17,
    belowBandCount: 1,
    aboveBandCount: 2,
    totalPayroll: 700_000,
    avgVsMarket: 6,
  },
];

const benchmarkStats: BenchmarkStatsSummary = {
  total: 560,
  uniqueRoles: 84,
  uniqueLocations: 6,
  sources: ["market", "uploaded"],
  lastUpdated: "2026-03-05T12:00:00.000Z",
  hasRealData: true,
  market: {
    count: 520,
    uniqueRoles: 80,
    uniqueLocations: 6,
  },
  workspace: {
    count: 40,
    uniqueRoles: 12,
    uniqueLocations: 2,
    sources: ["uploaded"],
  },
};

const criticalMetrics: CompanyMetrics = {
  ...metrics,
  activeEmployees: 85,
  inBandPercentage: 0,
  outOfBandPercentage: 100,
  avgMarketPosition: 91,
  rolesOutsideBand: 85,
  payrollRiskFlags: 73,
  healthScore: 0,
  bandDistribution: {
    below: 14,
    inBand: 0,
    above: 86,
  },
};

describe("company vs market helpers", () => {
  it("defines overview routes for company and benchmark drill-down only", () => {
    expect(getDashboardOverviewRoutes()).toEqual([
      {
        href: "/dashboard/overview",
        label: "Company Overview",
      },
      {
        href: "/dashboard/benchmarks",
        label: "Benchmarking",
      },
    ]);
  });

  it("builds compare cards from company metrics and department deltas", () => {
    expect(
      buildCompareLensCards(metrics, departmentSummaries, {
        activeEmployees: 100,
        benchmarkedEmployees: 82,
      }),
    ).toEqual([
      {
        label: "Company Gap to Market",
        value: "-4%",
        description: "median position across benchmarked employees",
        tone: "warning",
      },
      {
        label: "Employees Below Target",
        value: "24%",
        description: "below market-aligned pay range",
        tone: "warning",
      },
      {
        label: "Priority Departments",
        value: "1",
        description: "functions lagging market by 5%+",
        tone: "warning",
      },
      {
        label: "Coverage Confidence",
        value: "82%",
        description: "active employees mapped to market data",
        tone: "neutral",
      },
    ]);
  });

  it("builds market cards that keep market data primary and company data as overlay", () => {
    expect(buildMarketLensCards(benchmarkStats)).toEqual([
      {
        label: "Qeemly Market Rows",
        value: "520",
        description: "aggregated benchmark rows available now",
        tone: "market",
      },
      {
        label: "Roles Covered",
        value: "80",
        description: "unique roles across the market dataset",
        tone: "market",
      },
      {
        label: "Markets Covered",
        value: "6",
        description: "locations represented in Qeemly data",
        tone: "market",
      },
      {
        label: "Your Data Overlay",
        value: "40",
        description: "workspace band rows augmenting market gaps",
        tone: "overlay",
      },
    ]);
  });

  it("builds company headline cards that summarize health and coverage", () => {
    expect(
      buildCompanyOverviewHeadlineCards(metrics, {
        activeEmployees: 100,
        benchmarkedEmployees: 82,
      }),
    ).toEqual([
      {
        label: "Compensation Health",
        value: "58/100",
        description: "overall pay health score",
        tone: "warning",
      },
      {
        label: "Coverage Confidence",
        value: "82%",
        description: "active employees benchmarked to market",
        tone: "neutral",
      },
    ]);
  });

  it("builds a status-first headline card when compensation health is critical", () => {
    expect(
      buildCompanyOverviewHeadlineCards(criticalMetrics, {
        activeEmployees: 85,
        benchmarkedEmployees: 85,
      }),
    ).toEqual([
      {
        label: "Compensation Health",
        value: "Critical",
        description: "85 of 85 benchmarked employees are outside the target band",
        tone: "warning",
      },
      {
        label: "Coverage Confidence",
        value: "100%",
        description: "active employees benchmarked to market",
        tone: "positive",
      },
    ]);
  });
});
