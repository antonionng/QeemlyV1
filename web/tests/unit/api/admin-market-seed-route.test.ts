import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireSuperAdminMock,
  createServiceClientMock,
  runIngestionForJobMock,
  completeJobMock,
  failJobForRetryMock,
  refreshPlatformMarketPoolMock,
  invalidateMarketBenchmarkCacheMock,
  getPublishedBenchmarkCoverageSummaryMock,
  getMarketSourceCoverageSummaryMock,
  getMissingBenchmarkCoverageGroupsMock,
  getTopMissingBenchmarkTriplesMock,
  getPublishedContributionMixSummaryMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  runIngestionForJobMock: vi.fn(),
  completeJobMock: vi.fn(),
  failJobForRetryMock: vi.fn(),
  refreshPlatformMarketPoolMock: vi.fn(),
  invalidateMarketBenchmarkCacheMock: vi.fn(),
  getPublishedBenchmarkCoverageSummaryMock: vi.fn(),
  getMarketSourceCoverageSummaryMock: vi.fn(),
  getMissingBenchmarkCoverageGroupsMock: vi.fn(),
  getTopMissingBenchmarkTriplesMock: vi.fn(),
  getPublishedContributionMixSummaryMock: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/ingestion/worker", () => ({
  runIngestionForJob: runIngestionForJobMock,
}));

vi.mock("@/lib/ingestion/job-runner", () => ({
  completeJob: completeJobMock,
  failJobForRetry: failJobForRetryMock,
}));

vi.mock("@/lib/benchmarks/platform-market-pool", () => ({
  refreshPlatformMarketPool: refreshPlatformMarketPoolMock,
}));

vi.mock("@/lib/benchmarks/platform-market", () => ({
  invalidateMarketBenchmarkCache: invalidateMarketBenchmarkCacheMock,
}));

vi.mock("@/lib/benchmarks/coverage-contract", () => ({
  getPublishedBenchmarkCoverageSummary: getPublishedBenchmarkCoverageSummaryMock,
  getMarketSourceCoverageSummary: getMarketSourceCoverageSummaryMock,
  getMissingBenchmarkCoverageGroups: getMissingBenchmarkCoverageGroupsMock,
  getTopMissingBenchmarkTriples: getTopMissingBenchmarkTriplesMock,
  getPublishedContributionMixSummary: getPublishedContributionMixSummaryMock,
}));

import { POST } from "@/app/api/admin/market-seed/route";

function createServiceSupabase() {
  let jobCounter = 0;

  return {
    from(table: string) {
      if (table === "ingestion_sources") {
        return {
          select() {
            return Promise.resolve({
              data: [
                {
                  id: "source-1",
                  slug: "uae_fcsc_workforce_comp",
                  enabled: true,
                  approved_for_commercial: true,
                  needs_review: false,
                },
                {
                  id: "source-2",
                  slug: "qatar_wages",
                  enabled: true,
                  approved_for_commercial: true,
                  needs_review: false,
                },
                {
                  id: "source-3",
                  slug: "kuwait_open_labor",
                  enabled: true,
                  approved_for_commercial: true,
                  needs_review: false,
                },
                {
                  id: "source-4",
                  slug: "ilostat_gcc",
                  enabled: true,
                  approved_for_commercial: false,
                  needs_review: true,
                },
              ],
              error: null,
            });
          },
        };
      }

      if (table === "ingestion_jobs") {
        return {
          insert() {
            jobCounter += 1;
            return {
              select() {
                return {
                  single() {
                    return Promise.resolve({
                      data: { id: `job-${jobCounter}` },
                      error: null,
                    });
                  },
                };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("POST /api/admin/market-seed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    requireSuperAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    getPublishedBenchmarkCoverageSummaryMock.mockResolvedValue({
      supportedExactTriples: 1200,
      coveredExactTriples: 144,
      officialCoveredExactTriples: 96,
      proxyBackedExactTriples: 48,
      missingExactTriples: 1056,
      coveragePercent: 12,
      missingExamples: ["swe::ic1::dubai", "pm::ic3::riyadh"],
    });
    getMarketSourceCoverageSummaryMock.mockResolvedValue([
      {
        sourceSlug: "uae_fcsc_workforce_comp",
        exactTriples: 90,
        coveragePercent: 7.5,
        sampleTriples: ["swe::ic1::dubai", "swe::ic2::dubai"],
      },
      {
        sourceSlug: "qatar_wages",
        exactTriples: 54,
        coveragePercent: 4.5,
        sampleTriples: ["pm::ic3::riyadh"],
      },
    ]);
    getMissingBenchmarkCoverageGroupsMock.mockResolvedValue({
      byRoleFamily: [
        { label: "Engineering", missingExactTriples: 558 },
        { label: "Product", missingExactTriples: 79 },
      ],
      byCountry: [
        { label: "UAE", missingExactTriples: 299 },
        { label: "Saudi Arabia", missingExactTriples: 299 },
      ],
    });
    getTopMissingBenchmarkTriplesMock.mockResolvedValue([
      {
        key: "tpm::ic5::riyadh",
        roleTitle: "Technical PM",
        levelName: "Principal (IC5)",
        locationLabel: "Riyadh, Saudi Arabia",
      },
      {
        key: "pm::ic3::doha",
        roleTitle: "Product Manager",
        levelName: "Senior (IC3)",
        locationLabel: "Doha, Qatar",
      },
    ]);
    getPublishedContributionMixSummaryMock.mockResolvedValue({
      rowsWithEmployeeSupport: 18,
      rowsWithUploadedSupport: 9,
      rowsWithAdminSupport: 144,
    });
  });

  it("returns a configuration error when shared-market env is incomplete", async () => {
    vi.stubEnv("PLATFORM_WORKSPACE_ID", "");
    const response = await POST(
      new Request("http://localhost/api/admin/market-seed", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toBe("Server misconfiguration");
    expect(payload.missing).toContain("PLATFORM_WORKSPACE_ID");
    expect(createServiceClientMock).not.toHaveBeenCalled();
  });

  it("runs approved source ingestion and refreshes the market pool", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("PLATFORM_WORKSPACE_ID", "platform-workspace");
    createServiceClientMock.mockReturnValue(createServiceSupabase());
    runIngestionForJobMock
      .mockResolvedValueOnce({
        status: "success",
        records_created: 12,
        records_updated: 0,
        records_failed: 0,
        funnel: {
          outcome: "success",
          fetchedRows: 12,
          normalizedRows: 12,
          normalizeFailedRows: 0,
          dqPassedRows: 12,
          dqFailedRows: 0,
          upsertedRows: 12,
          upsertFailedRows: 0,
        },
      })
      .mockResolvedValueOnce({
        status: "partial",
        records_created: 4,
        records_updated: 0,
        records_failed: 1,
        funnel: {
          outcome: "partial_success",
          fetchedRows: 8,
          normalizedRows: 6,
          normalizeFailedRows: 1,
          dqPassedRows: 5,
          dqFailedRows: 1,
          upsertedRows: 4,
          upsertFailedRows: 1,
        },
      });
    refreshPlatformMarketPoolMock.mockResolvedValue({ rowCount: 144 });

    const response = await POST(
      new Request("http://localhost/api/admin/market-seed", {
        method: "POST",
        body: JSON.stringify({
          sourceSlugs: ["uae_fcsc_workforce_comp", "qatar_wages"],
        }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(runIngestionForJobMock).toHaveBeenCalledTimes(2);
    expect(completeJobMock).toHaveBeenCalledTimes(2);
    expect(refreshPlatformMarketPoolMock).toHaveBeenCalledTimes(1);
    expect(invalidateMarketBenchmarkCacheMock).toHaveBeenCalledTimes(1);
    expect(payload).toEqual({
      ok: true,
      ingested: [
        {
          jobId: "job-1",
          slug: "uae_fcsc_workforce_comp",
          status: "success",
          recordsCreated: 12,
          recordsFailed: 0,
          funnel: {
            outcome: "success",
            fetchedRows: 12,
            normalizedRows: 12,
            normalizeFailedRows: 0,
            dqPassedRows: 12,
            dqFailedRows: 0,
            upsertedRows: 12,
            upsertFailedRows: 0,
          },
        },
        {
          jobId: "job-2",
          slug: "qatar_wages",
          status: "partial",
          recordsCreated: 4,
          recordsFailed: 1,
          funnel: {
            outcome: "partial_success",
            fetchedRows: 8,
            normalizedRows: 6,
            normalizeFailedRows: 1,
            dqPassedRows: 5,
            dqFailedRows: 1,
            upsertedRows: 4,
            upsertFailedRows: 1,
          },
        },
      ],
      selectedSourceSlugs: ["uae_fcsc_workforce_comp", "qatar_wages"],
      poolRows: 144,
      coverage: {
        supportedExactTriples: 1200,
        coveredExactTriples: 144,
        officialCoveredExactTriples: 96,
        proxyBackedExactTriples: 48,
        missingExactTriples: 1056,
        coveragePercent: 12,
        missingExamples: ["swe::ic1::dubai", "pm::ic3::riyadh"],
      },
      sourceCoverage: [
        {
          sourceSlug: "uae_fcsc_workforce_comp",
          exactTriples: 90,
          coveragePercent: 7.5,
          sampleTriples: ["swe::ic1::dubai", "swe::ic2::dubai"],
        },
        {
          sourceSlug: "qatar_wages",
          exactTriples: 54,
          coveragePercent: 4.5,
          sampleTriples: ["pm::ic3::riyadh"],
        },
      ],
      sourceDiagnostics: [
        {
          sourceSlug: "uae_fcsc_workforce_comp",
          rawExactTriples: 90,
          coveragePercent: 7.5,
          outcome: "success",
          fetchedRows: 12,
          normalizedRows: 12,
          normalizeFailedRows: 0,
          dqPassedRows: 12,
          dqFailedRows: 0,
          upsertedRows: 12,
          upsertFailedRows: 0,
        },
        {
          sourceSlug: "qatar_wages",
          rawExactTriples: 54,
          coveragePercent: 4.5,
          outcome: "partial_success",
          fetchedRows: 8,
          normalizedRows: 6,
          normalizeFailedRows: 1,
          dqPassedRows: 5,
          dqFailedRows: 1,
          upsertedRows: 4,
          upsertFailedRows: 1,
        },
      ],
      contributionMix: {
        rowsWithEmployeeSupport: 18,
        rowsWithUploadedSupport: 9,
        rowsWithAdminSupport: 144,
      },
      missingCoverageGroups: {
        byRoleFamily: [
          { label: "Engineering", missingExactTriples: 558 },
          { label: "Product", missingExactTriples: 79 },
        ],
        byCountry: [
          { label: "UAE", missingExactTriples: 299 },
          { label: "Saudi Arabia", missingExactTriples: 299 },
        ],
      },
      topMissingExactTriples: [
        {
          key: "tpm::ic5::riyadh",
          roleTitle: "Technical PM",
          levelName: "Principal (IC5)",
          locationLabel: "Riyadh, Saudi Arabia",
        },
        {
          key: "pm::ic3::doha",
          roleTitle: "Product Manager",
          levelName: "Senior (IC3)",
          locationLabel: "Doha, Qatar",
        },
      ],
    });
  });

  it("uses all approved commercial sources by default when none are requested", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("PLATFORM_WORKSPACE_ID", "platform-workspace");
    createServiceClientMock.mockReturnValue(createServiceSupabase());
    runIngestionForJobMock.mockResolvedValue({
      status: "success",
      records_created: 10,
      records_updated: 0,
      records_failed: 0,
    });
    refreshPlatformMarketPoolMock.mockResolvedValue({ rowCount: 188 });

    const response = await POST(
      new Request("http://localhost/api/admin/market-seed", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(runIngestionForJobMock).toHaveBeenCalledTimes(3);
    expect(payload.selectedSourceSlugs).toEqual([
      "uae_fcsc_workforce_comp",
      "qatar_wages",
      "kuwait_open_labor",
    ]);
    expect(payload.poolRows).toBe(188);
    expect(payload.coverage).toEqual({
      supportedExactTriples: 1200,
      coveredExactTriples: 144,
      officialCoveredExactTriples: 96,
      proxyBackedExactTriples: 48,
      missingExactTriples: 1056,
      coveragePercent: 12,
      missingExamples: ["swe::ic1::dubai", "pm::ic3::riyadh"],
    });
    expect(payload.sourceCoverage).toEqual([
      {
        sourceSlug: "uae_fcsc_workforce_comp",
        exactTriples: 90,
        coveragePercent: 7.5,
        sampleTriples: ["swe::ic1::dubai", "swe::ic2::dubai"],
      },
      {
        sourceSlug: "qatar_wages",
        exactTriples: 54,
        coveragePercent: 4.5,
        sampleTriples: ["pm::ic3::riyadh"],
      },
    ]);
    expect(payload.missingCoverageGroups).toEqual({
      byRoleFamily: [
        { label: "Engineering", missingExactTriples: 558 },
        { label: "Product", missingExactTriples: 79 },
      ],
      byCountry: [
        { label: "UAE", missingExactTriples: 299 },
        { label: "Saudi Arabia", missingExactTriples: 299 },
      ],
    });
    expect(payload.topMissingExactTriples).toEqual([
      {
        key: "tpm::ic5::riyadh",
        roleTitle: "Technical PM",
        levelName: "Principal (IC5)",
        locationLabel: "Riyadh, Saudi Arabia",
      },
      {
        key: "pm::ic3::doha",
        roleTitle: "Product Manager",
        levelName: "Senior (IC3)",
        locationLabel: "Doha, Qatar",
      },
    ]);
  });
});
