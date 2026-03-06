import type { CompanyMetrics, DepartmentSummary } from "@/lib/employees";

export type BenchmarkStatsSummary = {
  total: number;
  uniqueRoles: number;
  uniqueLocations: number;
  sources: string[];
  lastUpdated: string | null;
  hasRealData: boolean;
  market: {
    count: number;
    uniqueRoles: number;
    uniqueLocations: number;
  };
  workspace: {
    count: number;
    uniqueRoles: number;
    uniqueLocations: number;
    sources: string[];
  };
};

export type LensSummaryCard = {
  label: string;
  value: string;
  description: string;
  tone: "neutral" | "warning" | "positive" | "market" | "overlay";
};

export function getDashboardOverviewRoutes(): Array<{ href: string; label: string }> {
  return [
    { href: "/dashboard/overview", label: "Company Overview" },
    { href: "/dashboard/market", label: "Market Overview" },
    { href: "/dashboard/benchmarks", label: "Benchmarking" },
  ];
}

export function buildCompareLensCards(
  metrics: CompanyMetrics,
  departmentSummaries: DepartmentSummary[],
  benchmarkCoverage?: {
    activeEmployees: number;
    benchmarkedEmployees: number;
  },
): LensSummaryCard[] {
  const coveragePct =
    benchmarkCoverage && benchmarkCoverage.activeEmployees > 0
      ? Math.round((benchmarkCoverage.benchmarkedEmployees / benchmarkCoverage.activeEmployees) * 100)
      : 0;
  const laggingDepartments = departmentSummaries.filter((summary) => summary.avgVsMarket <= -5).length;

  return [
    {
      label: "Company Gap to Market",
      value: formatSignedPercentage(metrics.avgMarketPosition),
      description: "median position across benchmarked employees",
      tone: metrics.avgMarketPosition < 0 ? "warning" : "positive",
    },
    {
      label: "Employees Below Target",
      value: `${metrics.bandDistribution.below}%`,
      description: "below market-aligned pay range",
      tone: metrics.bandDistribution.below > 15 ? "warning" : "neutral",
    },
    {
      label: "Priority Departments",
      value: `${laggingDepartments}`,
      description: "functions lagging market by 5%+",
      tone: laggingDepartments > 0 ? "warning" : "positive",
    },
    {
      label: "Coverage Confidence",
      value: `${coveragePct}%`,
      description: "active employees mapped to market data",
      tone: coveragePct >= 90 ? "positive" : "neutral",
    },
  ];
}

export function buildCompanyOverviewHeadlineCards(
  metrics: CompanyMetrics,
  benchmarkCoverage?: {
    activeEmployees: number;
    benchmarkedEmployees: number;
  },
): LensSummaryCard[] {
  const coveragePct =
    benchmarkCoverage && benchmarkCoverage.activeEmployees > 0
      ? Math.round((benchmarkCoverage.benchmarkedEmployees / benchmarkCoverage.activeEmployees) * 100)
      : 0;

  return [
    {
      label: "Compensation Health",
      value: `${metrics.healthScore}/100`,
      description: "overall pay health score",
      tone: metrics.healthScore < 60 ? "warning" : metrics.healthScore >= 80 ? "positive" : "neutral",
    },
    {
      label: "Coverage Confidence",
      value: `${coveragePct}%`,
      description: "active employees benchmarked to market",
      tone: coveragePct >= 90 ? "positive" : "neutral",
    },
  ];
}

export function buildMarketLensCards(stats: BenchmarkStatsSummary): LensSummaryCard[] {
  return [
    {
      label: "Qeemly Market Rows",
      value: `${stats.market.count}`,
      description: "aggregated benchmark rows available now",
      tone: "market",
    },
    {
      label: "Roles Covered",
      value: `${stats.market.uniqueRoles}`,
      description: "unique roles across the market dataset",
      tone: "market",
    },
    {
      label: "Markets Covered",
      value: `${stats.market.uniqueLocations}`,
      description: "locations represented in Qeemly data",
      tone: "market",
    },
    {
      label: "Your Data Overlay",
      value: `${stats.workspace.count}`,
      description: "workspace band rows augmenting market gaps",
      tone: "overlay",
    },
  ];
}

function formatSignedPercentage(value: number): string {
  return `${value > 0 ? "+" : ""}${value}%`;
}
