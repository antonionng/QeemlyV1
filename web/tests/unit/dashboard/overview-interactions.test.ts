import { describe, expect, it } from "vitest";
import type { CompanyOverviewSnapshot } from "@/lib/dashboard/company-overview";
import { buildOverviewInteractionMap } from "@/lib/dashboard/overview-interactions";

const snapshot = {
  metrics: {
    totalEmployees: 150,
    activeEmployees: 141,
    benchmarkedEmployees: 120,
    totalPayroll: 68_600_000,
    inBandPercentage: 65,
    outOfBandPercentage: 35,
    avgMarketPosition: 2,
    rolesOutsideBand: 42,
    departmentsOverBenchmark: 3,
    payrollRiskFlags: 24,
    healthScore: 68,
    headcountTrend: [
      { month: "2023", value: 108 },
      { month: "2024", value: 118 },
      { month: "2025", value: 132 },
      { month: "2026", value: 141 },
    ],
    payrollTrend: [
      { month: "2023", value: 22_000_000 },
      { month: "2024", value: 25_400_000 },
      { month: "2025", value: 28_700_000 },
      { month: "2026", value: 32_600_000 },
    ],
    riskBreakdown: [
      { severity: "critical", count: 4, label: "Critical (>25% above)" },
      { severity: "high", count: 8, label: "High (15-25% above)" },
      { severity: "medium", count: 12, label: "Medium (5-15% above)" },
      { severity: "low", count: 0, label: "Low (slightly above)" },
    ],
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
    inBandChange: 0,
    trendMode: "inferred_from_current_roster",
  },
  departmentSummaries: [
    {
      department: "Engineering",
      headcount: 42,
      activeCount: 42,
      benchmarkedCount: 38,
      inBandCount: 21,
      belowBandCount: 5,
      aboveBandCount: 12,
      totalPayroll: 14_200_000,
      avgVsMarket: 6.4,
      coveragePct: 90,
      inBandPct: 55,
      aboveBandPct: 32,
      belowBandPct: 13,
    },
  ],
  benchmarkCoverage: {
    activeEmployees: 141,
    benchmarkedEmployees: 120,
    unbenchmarkedEmployees: 21,
    coveragePct: 85,
  },
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
    totalAtRisk: 24,
    methodologyLabel: "Tracks benchmarked employees whose pay sits above market thresholds.",
    coverageNote: "Counts are based on benchmarked employees only.",
    departmentRows: [{ name: "Engineering", value: 12 }],
  },
  dataHealth: {
    latestBenchmarkFreshness: null,
    lastSync: null,
  },
} satisfies CompanyOverviewSnapshot;

describe("buildOverviewInteractionMap", () => {
  it("routes employee drill-downs to salary review cohort URLs", () => {
    const map = buildOverviewInteractionMap(snapshot);

    expect(map.healthScoreFactors.bandAlignment.action).toBe("link");
    expect(map.healthScoreFactors.bandAlignment.href).toBe("/dashboard/salary-review?cohort=outside-band");
    expect(map.healthScoreFactors.marketPosition.action).toBe("link");
    expect(map.healthScoreFactors.marketPosition.href).toBe("/dashboard/benchmarks");
    expect(map.healthScoreFactors.riskManagement.action).toBe("link");
    expect(map.healthScoreFactors.riskManagement.href).toBe("/dashboard/salary-review?cohort=above-band");

    expect(map.statCards.activeEmployees.action).toBe("link");
    expect(map.statCards.activeEmployees.href).toBe("/dashboard/salary-review?cohort=active-employees");
    expect(map.statCards.inBand.action).toBe("link");
    expect(map.statCards.inBand.href).toBe("/dashboard/salary-review?cohort=in-band");
    expect(map.statCards.riskFlags.action).toBe("link");
    expect(map.statCards.riskFlags.href).toBe("/dashboard/salary-review?cohort=above-band");
  });

  it("uses drawer fallback content for overview-only surfaces", () => {
    const map = buildOverviewInteractionMap(snapshot);

    expect(map.healthScoreGauge.action).toBe("drawer");
    expect(map.healthScoreGauge.drawer?.type).toBe("health-score");
    expect(map.healthScoreGauge.drawer?.sections).toHaveLength(3);

    expect(map.statCards.totalPayroll.action).toBe("drawer");
    expect(map.statCards.totalPayroll.drawer?.type).toBe("total-payroll");
    expect(map.statCards.totalPayroll.drawer?.metricValue).toBe("AED 68.6M");
  });
});
