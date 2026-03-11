import { describe, expect, it } from "vitest";
import type { Employee } from "@/lib/employees";
import {
  buildCompanyOverviewSnapshot,
  hydrateCompanyOverviewSnapshot,
  type OverviewFreshnessRow,
  type OverviewSyncLog,
} from "@/lib/dashboard/company-overview";

function createEmployee(overrides: Partial<Employee>): Employee {
  return {
    id: overrides.id ?? "emp-1",
    firstName: overrides.firstName ?? "Ada",
    lastName: overrides.lastName ?? "Lovelace",
    email: overrides.email ?? "ada@example.com",
    department: overrides.department ?? "Engineering",
    role: overrides.role ?? {
      id: "swe",
      title: "Software Engineer",
      family: "Engineering",
      icon: "SWE",
    },
    level: overrides.level ?? {
      id: "ic3",
      name: "Senior (IC3)",
      category: "IC",
    },
    location: overrides.location ?? {
      id: "dubai",
      city: "Dubai",
      country: "UAE",
      countryCode: "AE",
      currency: "AED",
      flag: "AE",
    },
    status: overrides.status ?? "active",
    employmentType: overrides.employmentType ?? "national",
    baseSalary: overrides.baseSalary ?? 120_000,
    bonus: overrides.bonus,
    equity: overrides.equity,
    totalComp: overrides.totalComp ?? 120_000,
    bandPosition: overrides.bandPosition ?? "in-band",
    bandPercentile: overrides.bandPercentile ?? 50,
    marketComparison: overrides.marketComparison ?? 0,
    hasBenchmark: overrides.hasBenchmark ?? true,
    benchmarkContext: overrides.benchmarkContext,
    hireDate: overrides.hireDate ?? new Date("2024-01-01T00:00:00.000Z"),
    lastReviewDate: overrides.lastReviewDate,
    performanceRating: overrides.performanceRating ?? "meets",
  };
}

describe("buildCompanyOverviewSnapshot", () => {
  it("builds coverage-aware counts, department summaries, and action cards", () => {
    const employees: Employee[] = [
      createEmployee({
        id: "eng-in-band",
        department: "Engineering",
        totalComp: 120_000,
        bandPosition: "in-band",
        marketComparison: 0,
        benchmarkContext: {
          source: "market",
          provenance: "blended",
          matchQuality: "exact",
          freshnessAt: "2026-03-10T00:00:00.000Z",
        },
      }),
      createEmployee({
        id: "eng-above",
        department: "Engineering",
        totalComp: 150_000,
        bandPosition: "above",
        marketComparison: 18,
        performanceRating: "exceptional",
        benchmarkContext: {
          source: "market",
          provenance: "employee",
          matchQuality: "role_level_fallback",
          freshnessAt: "2026-03-08T00:00:00.000Z",
        },
      }),
      createEmployee({
        id: "product-unbenchmarked",
        department: "Product",
        totalComp: 110_000,
        hasBenchmark: false,
        benchmarkContext: undefined,
        bandPosition: "in-band",
        marketComparison: 0,
      }),
      createEmployee({
        id: "product-below",
        department: "Product",
        totalComp: 90_000,
        bandPosition: "below",
        marketComparison: -12,
        performanceRating: "exceeds",
        benchmarkContext: {
          source: "uploaded",
          provenance: "uploaded",
          matchQuality: "exact",
          freshnessAt: "2026-03-09T00:00:00.000Z",
        },
      }),
    ];

    const snapshot = buildCompanyOverviewSnapshot({
      employees,
      freshness: [],
      syncLogs: [],
    });

    expect(snapshot.benchmarkCoverage).toEqual({
      activeEmployees: 4,
      benchmarkedEmployees: 3,
      unbenchmarkedEmployees: 1,
      coveragePct: 75,
    });

    expect(snapshot.metrics.benchmarkedEmployees).toBe(3);
    expect(snapshot.metrics.bandDistributionCounts).toEqual({
      inBand: 1,
      above: 1,
      below: 1,
    });

    expect(snapshot.departmentSummaries).toEqual([
      expect.objectContaining({
        department: "Engineering",
        activeCount: 2,
        benchmarkedCount: 2,
        inBandCount: 1,
        aboveBandCount: 1,
        belowBandCount: 0,
        inBandPct: 50,
        coveragePct: 100,
      }),
      expect.objectContaining({
        department: "Product",
        activeCount: 2,
        benchmarkedCount: 1,
        inBandCount: 0,
        aboveBandCount: 0,
        belowBandCount: 1,
        inBandPct: 0,
        coveragePct: 50,
      }),
    ]);

    expect(snapshot.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "outside-band",
          title: "2 of 3 benchmarked employees outside band",
          tone: "danger",
          href: "/dashboard/salary-review?filter=outside-band",
        }),
        expect.objectContaining({
          id: "coverage-gap",
          tone: "warning",
          href: "/dashboard/people",
        }),
      ]),
    );

    expect(snapshot.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "outside-band-summary",
          tone: "danger",
        }),
      ]),
    );

    expect(snapshot.riskSummary).toEqual(
      expect.objectContaining({
        totalAtRisk: 1,
        methodologyLabel: "Tracks benchmarked employees whose pay sits above market thresholds.",
        coverageNote: "Counts are based on benchmarked employees only.",
      }),
    );
  });

  it("prefers benchmark freshness rows for benchmark health instead of the most recent unrelated metric", () => {
    const freshness: OverviewFreshnessRow[] = [
      {
        id: "freshness-payroll",
        metric_type: "payroll",
        last_updated_at: "2026-03-11T09:00:00.000Z",
        record_count: 10,
        confidence: "high",
      },
      {
        id: "freshness-benchmarks",
        metric_type: "benchmarks",
        last_updated_at: "2026-03-10T18:00:00.000Z",
        record_count: 85,
        confidence: "medium",
      },
    ];
    const syncLogs: OverviewSyncLog[] = [
      {
        id: "sync-1",
        status: "success",
        records_created: 10,
        records_updated: 4,
        records_failed: 0,
        started_at: "2026-03-11T08:00:00.000Z",
        completed_at: "2026-03-11T08:10:00.000Z",
      },
    ];

    const snapshot = buildCompanyOverviewSnapshot({
      employees: [createEmployee({ benchmarkContext: { source: "market", matchQuality: "exact" } })],
      freshness,
      syncLogs,
    });

    expect(snapshot.dataHealth.latestBenchmarkFreshness).toEqual({
      metricType: "benchmarks",
      lastUpdatedAt: "2026-03-10T18:00:00.000Z",
      confidence: "medium",
      recordCount: 85,
    });
    expect(snapshot.dataHealth.lastSync).toEqual({
      status: "success",
      startedAt: "2026-03-11T08:00:00.000Z",
      completedAt: "2026-03-11T08:10:00.000Z",
      recordsCreated: 10,
      recordsUpdated: 4,
      recordsFailed: 0,
    });
  });

  it("rehydrates advisory candidate dates after the snapshot crosses the API boundary", () => {
    const snapshot = buildCompanyOverviewSnapshot({
      employees: [
        createEmployee({
          hireDate: new Date("2023-01-15T00:00:00.000Z"),
          lastReviewDate: new Date("2025-12-01T00:00:00.000Z"),
          benchmarkContext: { source: "market", matchQuality: "exact" },
        }),
      ],
      freshness: [],
      syncLogs: [],
    });

    const serialized = JSON.parse(JSON.stringify(snapshot));
    const hydrated = hydrateCompanyOverviewSnapshot(serialized);

    expect(hydrated.advisoryCandidates[0]?.hireDate).toBeInstanceOf(Date);
    expect(hydrated.advisoryCandidates[0]?.lastReviewDate).toBeInstanceOf(Date);
    expect(hydrated.advisoryCandidates[0]?.hireDate.toISOString()).toBe("2023-01-15T00:00:00.000Z");
  });

  it("adds an import action when there are no active employees yet", () => {
    const snapshot = buildCompanyOverviewSnapshot({
      employees: [],
      freshness: [],
      syncLogs: [],
    });

    expect(snapshot.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "import-company-data",
          href: "/dashboard/upload",
          actionLabel: "Import company data",
        }),
      ]),
    );
  });

  it("adds an import action when benchmark coverage is still below target", () => {
    const snapshot = buildCompanyOverviewSnapshot({
      employees: [
        createEmployee({
          id: "benchmarked",
          hasBenchmark: true,
          benchmarkContext: { source: "market", matchQuality: "exact" },
        }),
        createEmployee({
          id: "missing-benchmark",
          email: "missing@example.com",
          hasBenchmark: false,
          benchmarkContext: undefined,
        }),
      ],
      freshness: [],
      syncLogs: [],
    });

    expect(snapshot.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "import-company-data",
          href: "/dashboard/upload",
        }),
      ]),
    );
  });
});
