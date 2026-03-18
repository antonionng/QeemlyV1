import { describe, expect, it } from "vitest";
import type { Employee } from "@/lib/employees";
import {
  buildCompanyOverviewSnapshot,
  hydrateCompanyOverviewSnapshot,
  type OverviewFreshnessRow,
  type OverviewSyncLog,
} from "@/lib/dashboard/company-overview";
import { buildOverviewInteractionMap } from "@/lib/dashboard/overview-interactions";

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
          href: "/dashboard/upload",
        }),
      ]),
    );

    expect(snapshot.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "outside-band-summary",
          tone: "danger",
        }),
        expect.objectContaining({
          id: "coverage-summary",
          href: "/dashboard/upload",
          actionLabel: "Inspect upload data",
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

    const interactionMap = buildOverviewInteractionMap(snapshot);

    expect(interactionMap.bandDistribution.inBand).toEqual({
      id: "band-distribution-in-band",
      label: "In Band",
      action: "link",
      href: "/dashboard/salary-review?cohort=in-band",
      tooltip: {
        title: "In Band",
        value: "34%",
        description: "34% of benchmarked employees. 1 employee is currently inside the target range.",
      },
    });
    expect(interactionMap.bandDistribution.aboveBand).toEqual({
      id: "band-distribution-above-band",
      label: "Above Band",
      action: "link",
      href: "/dashboard/salary-review?filter=above-band",
      tooltip: {
        title: "Above Band",
        value: "33%",
        description: "33% of benchmarked employees. 1 employee is currently above the target range.",
      },
    });
    expect(interactionMap.bandDistribution.belowBand).toEqual({
      id: "band-distribution-below-band",
      label: "Below Band",
      action: "link",
      href: "/dashboard/salary-review?filter=below-band",
      tooltip: {
        title: "Below Band",
        value: "33%",
        description: "33% of benchmarked employees. 1 employee is currently below the target range.",
      },
    });
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
    expect(snapshot.metrics.healthScore).toBe(0);
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

  it("falls back to benchmarking when no immediate compensation actions are needed", () => {
    const snapshot = buildCompanyOverviewSnapshot({
      employees: [
        createEmployee({
          id: "healthy-1",
          benchmarkContext: { source: "market", matchQuality: "exact" },
        }),
        createEmployee({
          id: "healthy-2",
          email: "healthy-2@example.com",
          benchmarkContext: { source: "market", matchQuality: "exact" },
        }),
      ],
      freshness: [],
      syncLogs: [],
    });

    expect(snapshot.actions).toEqual([
      expect.objectContaining({
        id: "healthy-overview",
        href: "/dashboard/benchmarks",
        actionLabel: "Open benchmarking",
      }),
    ]);
  });

  it("normalizes band percentages so overview and department cards add up to 100", () => {
    const employees: Employee[] = [
      ...Array.from({ length: 13 }, (_, index) =>
        createEmployee({
          id: `eng-in-${index}`,
          department: "Engineering",
          bandPosition: "in-band",
          benchmarkContext: { source: "market", matchQuality: "exact" },
        }),
      ),
      ...Array.from({ length: 70 }, (_, index) =>
        createEmployee({
          id: `eng-above-${index}`,
          department: "Engineering",
          email: `eng-above-${index}@example.com`,
          bandPosition: "above",
          benchmarkContext: { source: "market", matchQuality: "exact" },
        }),
      ),
      ...Array.from({ length: 12 }, (_, index) =>
        createEmployee({
          id: `eng-below-${index}`,
          department: "Engineering",
          email: `eng-below-${index}@example.com`,
          bandPosition: "below",
          benchmarkContext: { source: "market", matchQuality: "exact" },
        }),
      ),
    ];

    const snapshot = buildCompanyOverviewSnapshot({
      employees,
      freshness: [],
      syncLogs: [],
    });

    expect(snapshot.metrics.bandDistribution).toEqual({
      inBand: 14,
      above: 74,
      below: 12,
    });
    expect(
      snapshot.metrics.bandDistribution.inBand +
        snapshot.metrics.bandDistribution.above +
        snapshot.metrics.bandDistribution.below,
    ).toBe(100);
    expect(snapshot.departmentSummaries[0]).toEqual(
      expect.objectContaining({
        inBandPct: 14,
        aboveBandPct: 74,
        belowBandPct: 12,
      }),
    );
  });

  it("renders natural grammar for zero and plural band tooltip counts", () => {
    const snapshot = buildCompanyOverviewSnapshot({
      employees: [
        createEmployee({
          id: "eng-in-band",
          benchmarkContext: { source: "market", matchQuality: "exact" },
          bandPosition: "in-band",
        }),
        createEmployee({
          id: "eng-above-1",
          email: "eng-above-1@example.com",
          benchmarkContext: { source: "market", matchQuality: "exact" },
          bandPosition: "above",
        }),
        createEmployee({
          id: "eng-above-2",
          email: "eng-above-2@example.com",
          benchmarkContext: { source: "market", matchQuality: "exact" },
          bandPosition: "above",
        }),
      ],
      freshness: [],
      syncLogs: [],
    });

    const interactionMap = buildOverviewInteractionMap(snapshot);

    expect(interactionMap.bandDistribution.aboveBand.tooltip.description).toBe(
      "67% of benchmarked employees. 2 employees are currently above the target range.",
    );
    expect(interactionMap.bandDistribution.aboveBand.href).toBe(
      "/dashboard/salary-review?filter=above-band",
    );
    expect(interactionMap.bandDistribution.belowBand.tooltip.description).toBe(
      "0% of benchmarked employees. 0 employees are currently below the target range.",
    );
    expect(interactionMap.bandDistribution.belowBand.href).toBe(
      "/dashboard/salary-review?filter=below-band",
    );
  });
});
