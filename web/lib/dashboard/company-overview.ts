import type { CompanyMetrics, DepartmentSummary, Employee } from "@/lib/employees";
import { summarizeBenchmarkTrust, type BenchmarkTrustSummary } from "@/lib/benchmarks/trust";

export type OverviewFreshnessRow = {
  id: string;
  metric_type: string;
  last_updated_at: string;
  record_count: number;
  confidence: string;
};

export type OverviewSyncLog = {
  id: string;
  status: string;
  records_created: number;
  records_updated: number;
  records_failed: number;
  started_at: string;
  completed_at: string | null;
};

export type OverviewBenchmarkCoverage = {
  activeEmployees: number;
  benchmarkedEmployees: number;
  unbenchmarkedEmployees: number;
  coveragePct: number;
};

export type OverviewMetrics = CompanyMetrics & {
  benchmarkedEmployees: number;
  bandDistributionCounts: {
    inBand: number;
    above: number;
    below: number;
  };
  trendMode: "inferred_from_current_roster";
};

export type OverviewDepartmentSummary = DepartmentSummary & {
  benchmarkedCount: number;
  coveragePct: number;
  inBandPct: number;
  aboveBandPct: number;
  belowBandPct: number;
};

export type OverviewActionTone = "danger" | "warning" | "info" | "positive";

export type OverviewAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  countLabel?: string;
  tone: OverviewActionTone;
  icon: "users" | "alert" | "shield" | "chart" | "upload";
};

export type OverviewInsight = {
  id: string;
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
  tone: OverviewActionTone;
};

export type OverviewRiskSummary = {
  totalAtRisk: number;
  methodologyLabel: string;
  coverageNote: string;
  departmentRows: Array<{
    name: string;
    value: number;
  }>;
};

export type OverviewDataHealth = {
  latestBenchmarkFreshness: {
    metricType: string;
    lastUpdatedAt: string;
    confidence: string;
    recordCount: number;
  } | null;
  lastSync: {
    status: string;
    startedAt: string;
    completedAt: string | null;
    recordsCreated: number;
    recordsUpdated: number;
    recordsFailed: number;
  } | null;
};

export type CompanyOverviewSnapshot = {
  metrics: OverviewMetrics;
  departmentSummaries: OverviewDepartmentSummary[];
  benchmarkCoverage: OverviewBenchmarkCoverage;
  benchmarkTrust: BenchmarkTrustSummary;
  advisoryCandidates: Employee[];
  actions: OverviewAction[];
  insights: OverviewInsight[];
  riskSummary: OverviewRiskSummary;
  dataHealth: OverviewDataHealth;
};

export function hydrateCompanyOverviewSnapshot(snapshot: CompanyOverviewSnapshot): CompanyOverviewSnapshot {
  return {
    ...snapshot,
    advisoryCandidates: snapshot.advisoryCandidates.map((employee) => ({
      ...employee,
      hireDate: employee.hireDate instanceof Date ? employee.hireDate : new Date(employee.hireDate),
      lastReviewDate: employee.lastReviewDate
        ? employee.lastReviewDate instanceof Date
          ? employee.lastReviewDate
          : new Date(employee.lastReviewDate)
        : undefined,
      visaExpiryDate: employee.visaExpiryDate
        ? employee.visaExpiryDate instanceof Date
          ? employee.visaExpiryDate
          : new Date(employee.visaExpiryDate)
        : undefined,
    })),
  };
}

export function buildCompanyOverviewSnapshot({
  employees,
  freshness,
  syncLogs,
}: {
  employees: Employee[];
  freshness: OverviewFreshnessRow[];
  syncLogs: OverviewSyncLog[];
}): CompanyOverviewSnapshot {
  const metrics = buildOverviewMetrics(employees);
  const departmentSummaries = buildOverviewDepartmentSummaries(employees);
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const benchmarkCoverage = buildBenchmarkCoverage(activeEmployees);
  const benchmarkTrust = summarizeBenchmarkTrust(activeEmployees);

  return {
    metrics,
    departmentSummaries,
    benchmarkCoverage,
    benchmarkTrust,
    advisoryCandidates: buildAdvisoryCandidates(activeEmployees),
    actions: buildOverviewActions(metrics, departmentSummaries, benchmarkCoverage),
    insights: buildOverviewInsights(metrics, departmentSummaries, benchmarkCoverage),
    riskSummary: buildOverviewRiskSummary(metrics, departmentSummaries),
    dataHealth: buildOverviewDataHealth(freshness, syncLogs),
  };
}

export function buildOverviewMetrics(employees: Employee[]): OverviewMetrics {
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const benchmarkedEmployees = activeEmployees.filter((employee) => employee.hasBenchmark);
  const totalPayroll = activeEmployees.reduce((sum, employee) => sum + employee.totalComp, 0);
  const inBandCount = benchmarkedEmployees.filter((employee) => employee.bandPosition === "in-band").length;
  const belowBandCount = benchmarkedEmployees.filter((employee) => employee.bandPosition === "below").length;
  const aboveBandCount = benchmarkedEmployees.filter((employee) => employee.bandPosition === "above").length;
  const benchmarkedCount = benchmarkedEmployees.length;
  const outOfBandCount = belowBandCount + aboveBandCount;
  const avgMarketPosition =
    benchmarkedCount > 0
      ? benchmarkedEmployees.reduce((sum, employee) => sum + employee.marketComparison, 0) / benchmarkedCount
      : 0;
  const payrollRiskFlags = benchmarkedEmployees.filter((employee) => employee.marketComparison > 15).length;
  const inBandPercentage =
    benchmarkedCount > 0 ? Math.round((inBandCount / benchmarkedCount) * 100) : 0;
  const outOfBandPercentage =
    benchmarkedCount > 0 ? Math.round((outOfBandCount / benchmarkedCount) * 100) : 0;
  const bandDistribution = {
    below: benchmarkedCount > 0 ? Math.round((belowBandCount / benchmarkedCount) * 100) : 0,
    inBand: inBandPercentage,
    above: benchmarkedCount > 0 ? Math.round((aboveBandCount / benchmarkedCount) * 100) : 0,
  };
  const headcountTrend = calculateHeadcountTrend(activeEmployees);
  const payrollTrend = calculatePayrollTrend(activeEmployees);
  const riskBreakdown = calculateRiskBreakdown(benchmarkedEmployees);
  const healthScore = calculateHealthScore({
    inBandPercentage,
    avgMarketPosition,
    payrollRiskFlags,
    benchmarkedEmployees: benchmarkedCount,
  });

  return {
    totalEmployees: employees.length,
    activeEmployees: activeEmployees.length,
    benchmarkedEmployees: benchmarkedCount,
    totalPayroll,
    inBandPercentage,
    outOfBandPercentage,
    avgMarketPosition: round1(avgMarketPosition),
    rolesOutsideBand: outOfBandCount,
    departmentsOverBenchmark: buildOverviewDepartmentSummaries(activeEmployees).filter(
      (summary) => summary.avgVsMarket > 5,
    ).length,
    payrollRiskFlags,
    healthScore,
    headcountTrend,
    payrollTrend,
    riskBreakdown,
    bandDistribution,
    bandDistributionCounts: {
      inBand: inBandCount,
      above: aboveBandCount,
      below: belowBandCount,
    },
    headcountChange: percentChangeFromTrend(headcountTrend),
    payrollChange: percentChangeFromTrend(payrollTrend),
    inBandChange: 0,
    trendMode: "inferred_from_current_roster",
  };
}

export function buildOverviewDepartmentSummaries(employees: Employee[]): OverviewDepartmentSummary[] {
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const departments = [...new Set(activeEmployees.map((employee) => employee.department))];

  return departments.map((department) => {
    const departmentEmployees = activeEmployees.filter((employee) => employee.department === department);
    const benchmarkedEmployees = departmentEmployees.filter((employee) => employee.hasBenchmark);
    const benchmarkedCount = benchmarkedEmployees.length;
    const inBandCount = benchmarkedEmployees.filter((employee) => employee.bandPosition === "in-band").length;
    const belowBandCount = benchmarkedEmployees.filter((employee) => employee.bandPosition === "below").length;
    const aboveBandCount = benchmarkedEmployees.filter((employee) => employee.bandPosition === "above").length;
    const totalPayroll = departmentEmployees.reduce((sum, employee) => sum + employee.totalComp, 0);
    const avgVsMarket =
      benchmarkedCount > 0
        ? benchmarkedEmployees.reduce((sum, employee) => sum + employee.marketComparison, 0) / benchmarkedCount
        : 0;

    return {
      department,
      headcount: departmentEmployees.length,
      activeCount: departmentEmployees.length,
      benchmarkedCount,
      inBandCount,
      belowBandCount,
      aboveBandCount,
      totalPayroll,
      avgVsMarket: round1(avgVsMarket),
      coveragePct:
        departmentEmployees.length > 0
          ? Math.round((benchmarkedCount / departmentEmployees.length) * 100)
          : 0,
      inBandPct: benchmarkedCount > 0 ? Math.round((inBandCount / benchmarkedCount) * 100) : 0,
      aboveBandPct: benchmarkedCount > 0 ? Math.round((aboveBandCount / benchmarkedCount) * 100) : 0,
      belowBandPct: benchmarkedCount > 0 ? Math.round((belowBandCount / benchmarkedCount) * 100) : 0,
    };
  });
}

function buildBenchmarkCoverage(activeEmployees: Employee[]): OverviewBenchmarkCoverage {
  const benchmarkedEmployees = activeEmployees.filter((employee) => employee.hasBenchmark).length;
  const activeCount = activeEmployees.length;
  return {
    activeEmployees: activeCount,
    benchmarkedEmployees,
    unbenchmarkedEmployees: Math.max(0, activeCount - benchmarkedEmployees),
    coveragePct: activeCount > 0 ? Math.round((benchmarkedEmployees / activeCount) * 100) : 0,
  };
}

function buildOverviewActions(
  metrics: OverviewMetrics,
  departmentSummaries: OverviewDepartmentSummary[],
  benchmarkCoverage: OverviewBenchmarkCoverage,
): OverviewAction[] {
  const actions: OverviewAction[] = [];

  if (metrics.activeEmployees === 0) {
    actions.push({
      id: "import-company-data",
      title: "Import your company data to unlock insights",
      description:
        "Add your latest employee roster to compare your company against Qeemly market data.",
      href: "/dashboard/upload",
      actionLabel: "Import company data",
      countLabel: "No active employees",
      tone: "info",
      icon: "upload",
    });
  }

  if (metrics.rolesOutsideBand > 0) {
    const benchmarkedLabel =
      metrics.benchmarkedEmployees === 1
        ? "1 benchmarked employee"
        : `${metrics.benchmarkedEmployees} benchmarked employees`;
    actions.push({
      id: "outside-band",
      title: `${metrics.rolesOutsideBand} of ${benchmarkedLabel} outside band`,
      description: "Review employees whose pay sits outside the market-aligned range.",
      href: "/dashboard/salary-review?filter=outside-band",
      actionLabel: "Review employees",
      countLabel: `${metrics.rolesOutsideBand} flagged`,
      tone: metrics.rolesOutsideBand >= 2 ? "danger" : "warning",
      icon: "users",
    });
  }

  if (benchmarkCoverage.unbenchmarkedEmployees > 0) {
    actions.push({
      id: "coverage-gap",
      title: `${benchmarkCoverage.unbenchmarkedEmployees} active employee${benchmarkCoverage.unbenchmarkedEmployees === 1 ? "" : "s"} missing benchmark coverage`,
      description: "Complete role, level, or location mapping to improve dashboard confidence.",
      href: "/dashboard/people",
      actionLabel: "Review data gaps",
      countLabel: `${benchmarkCoverage.coveragePct}% coverage`,
      tone: benchmarkCoverage.coveragePct < 90 ? "warning" : "info",
      icon: "alert",
    });

    if (benchmarkCoverage.coveragePct < 90) {
      actions.push({
        id: "import-company-data",
        title: "Import a refreshed roster or benchmark overlay",
        description:
          "Upload incremental updates or replace your current roster to improve company coverage before review cycles.",
        href: "/dashboard/upload",
        actionLabel: "Import company data",
        countLabel: `${benchmarkCoverage.coveragePct}% coverage`,
        tone: benchmarkCoverage.coveragePct < 75 ? "warning" : "info",
        icon: "upload",
      });
    }
  }

  const highestRiskDepartment = [...departmentSummaries]
    .filter((summary) => summary.aboveBandCount > 0)
    .sort((left, right) => right.aboveBandCount - left.aboveBandCount)[0];
  if (highestRiskDepartment) {
    actions.push({
      id: "department-risk",
      title: `${highestRiskDepartment.department} has the highest above-market concentration`,
      description: "Inspect the department with the largest cluster of above-band employees.",
      href: `/dashboard/salary-review?department=${encodeURIComponent(highestRiskDepartment.department)}`,
      actionLabel: `View ${highestRiskDepartment.department}`,
      countLabel: `${highestRiskDepartment.aboveBandCount} above band`,
      tone: "info",
      icon: "chart",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "healthy-overview",
      title: "No immediate compensation actions",
      description: "Benchmark coverage and pay alignment are currently within healthy ranges.",
      href: "/dashboard/market",
      actionLabel: "Open market overview",
      tone: "positive",
      icon: "shield",
    });
  }

  return actions.slice(0, 4);
}

function buildOverviewInsights(
  metrics: OverviewMetrics,
  departmentSummaries: OverviewDepartmentSummary[],
  benchmarkCoverage: OverviewBenchmarkCoverage,
): OverviewInsight[] {
  const insights: OverviewInsight[] = [];

  if (metrics.rolesOutsideBand > 0) {
    insights.push({
      id: "outside-band-summary",
      title: `${metrics.rolesOutsideBand} benchmarked employee${metrics.rolesOutsideBand === 1 ? "" : "s"} sit outside the market-aligned band`,
      description: "Review above-band and below-band cases first to address the clearest compensation gaps.",
      href: "/dashboard/salary-review?filter=outside-band",
      actionLabel: "Open salary review",
      tone: "danger",
    });
  }

  if (benchmarkCoverage.unbenchmarkedEmployees > 0) {
    insights.push({
      id: "coverage-summary",
      title: `${benchmarkCoverage.coveragePct}% benchmark coverage across active employees`,
      description: "Some employee records still need matching role, location, or level data before they can influence market views.",
      href: "/dashboard/people",
      actionLabel: "Inspect people data",
      tone: "warning",
    });
  }

  const belowMarketDepartment = [...departmentSummaries]
    .filter((summary) => summary.benchmarkedCount > 0 && summary.avgVsMarket <= -5)
    .sort((left, right) => left.avgVsMarket - right.avgVsMarket)[0];
  if (belowMarketDepartment) {
    insights.push({
      id: "department-below-market",
      title: `${belowMarketDepartment.department} is furthest below market`,
      description: `${belowMarketDepartment.department} averages ${belowMarketDepartment.avgVsMarket}% versus market across benchmarked employees.`,
      href: `/dashboard/salary-review?department=${encodeURIComponent(belowMarketDepartment.department)}`,
      actionLabel: `Review ${belowMarketDepartment.department}`,
      tone: "info",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "healthy-summary",
      title: "Compensation signals are currently stable",
      description: "No major pay alignment or coverage issues require immediate action.",
      tone: "positive",
    });
  }

  return insights.slice(0, 5);
}

function buildOverviewRiskSummary(
  metrics: OverviewMetrics,
  departmentSummaries: OverviewDepartmentSummary[],
): OverviewRiskSummary {
  return {
    totalAtRisk: metrics.payrollRiskFlags,
    methodologyLabel: "Tracks benchmarked employees whose pay sits above market thresholds.",
    coverageNote: "Counts are based on benchmarked employees only.",
    departmentRows: departmentSummaries
      .map((summary) => ({
        name: summary.department,
        value: summary.aboveBandCount,
      }))
      .filter((summary) => summary.value > 0)
      .sort((left, right) => right.value - left.value),
  };
}

function buildOverviewDataHealth(
  freshness: OverviewFreshnessRow[],
  syncLogs: OverviewSyncLog[],
): OverviewDataHealth {
  const benchmarkFreshness =
    freshness.find((row) => row.metric_type === "benchmarks") ?? freshness[0] ?? null;
  const latestSync = syncLogs[0] ?? null;

  return {
    latestBenchmarkFreshness: benchmarkFreshness
      ? {
          metricType: benchmarkFreshness.metric_type,
          lastUpdatedAt: benchmarkFreshness.last_updated_at,
          confidence: benchmarkFreshness.confidence,
          recordCount: benchmarkFreshness.record_count,
        }
      : null,
    lastSync: latestSync
      ? {
          status: latestSync.status,
          startedAt: latestSync.started_at,
          completedAt: latestSync.completed_at,
          recordsCreated: latestSync.records_created,
          recordsUpdated: latestSync.records_updated,
          recordsFailed: latestSync.records_failed,
        }
      : null,
  };
}

function buildAdvisoryCandidates(activeEmployees: Employee[]): Employee[] {
  return activeEmployees
    .filter((employee) => employee.hasBenchmark)
    .map((employee) => ({
      employee,
      riskScore: scoreAdvisoryCandidate(employee),
    }))
    .sort((left, right) => right.riskScore - left.riskScore)
    .slice(0, 5)
    .map((entry) => entry.employee);
}

function scoreAdvisoryCandidate(employee: Employee): number {
  let riskScore = 0;
  if (employee.bandPosition === "below") riskScore += 20;
  if (employee.bandPosition === "above") riskScore += 8;
  if (employee.performanceRating === "exceptional") riskScore += 20;
  if (employee.performanceRating === "exceeds") riskScore += 12;
  if (employee.performanceRating === "low") riskScore += 16;
  if (employee.marketComparison < 0) riskScore += Math.min(30, Math.abs(employee.marketComparison));
  if (employee.marketComparison > 10) riskScore += 8;
  return riskScore;
}

function buildLast12MonthStarts(): Date[] {
  const now = new Date();
  const starts: Date[] = [];
  for (let index = 11; index >= 0; index -= 1) {
    starts.push(new Date(now.getFullYear(), now.getMonth() - index, 1));
  }
  return starts;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" });
}

function calculateHeadcountTrend(activeEmployees: Employee[]): { month: string; value: number }[] {
  return buildLast12MonthStarts().map((start) => ({
    month: formatMonthLabel(start),
    value: activeEmployees.filter((employee) => new Date(employee.hireDate) <= start).length,
  }));
}

function calculatePayrollTrend(activeEmployees: Employee[]): { month: string; value: number }[] {
  return buildLast12MonthStarts().map((start) => ({
    month: formatMonthLabel(start),
    value: Math.round(
      activeEmployees
        .filter((employee) => new Date(employee.hireDate) <= start)
        .reduce((sum, employee) => sum + employee.totalComp, 0),
    ),
  }));
}

function calculateRiskBreakdown(employees: Employee[]) {
  const critical = employees.filter((employee) => employee.marketComparison > 25).length;
  const high = employees.filter(
    (employee) => employee.marketComparison > 15 && employee.marketComparison <= 25,
  ).length;
  const medium = employees.filter(
    (employee) => employee.marketComparison > 5 && employee.marketComparison <= 15,
  ).length;
  const low = employees.filter(
    (employee) => employee.bandPosition === "above" && employee.marketComparison <= 5,
  ).length;

  return [
    { severity: "critical" as const, count: critical, label: "Critical (>25% above)" },
    { severity: "high" as const, count: high, label: "High (15-25% above)" },
    { severity: "medium" as const, count: medium, label: "Medium (5-15% above)" },
    { severity: "low" as const, count: low, label: "Low (slightly above)" },
  ];
}

function calculateHealthScore({
  inBandPercentage,
  avgMarketPosition,
  payrollRiskFlags,
  benchmarkedEmployees,
}: {
  inBandPercentage: number;
  avgMarketPosition: number;
  payrollRiskFlags: number;
  benchmarkedEmployees: number;
}): number {
  const marketScore =
    avgMarketPosition >= 0 && avgMarketPosition <= 5
      ? 100
      : avgMarketPosition < 0
        ? Math.max(0, 100 + avgMarketPosition * 5)
        : Math.max(0, 100 - (avgMarketPosition - 5) * 3);
  const riskPercentage =
    benchmarkedEmployees > 0 ? (payrollRiskFlags / benchmarkedEmployees) * 100 : 0;
  const riskScore = Math.max(0, 100 - riskPercentage * 5);
  return Math.round(Math.min(100, Math.max(0, inBandPercentage * 0.4 + marketScore * 0.35 + riskScore * 0.25)));
}

function percentChangeFromTrend(trend: { value: number }[]): number {
  const first = trend[0]?.value ?? 0;
  const last = trend[trend.length - 1]?.value ?? 0;
  if (first <= 0) return 0;
  return round1(((last - first) / first) * 100);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
