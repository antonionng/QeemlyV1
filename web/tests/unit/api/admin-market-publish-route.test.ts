import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireSuperAdminMock,
  createServiceClientMock,
  refreshPlatformMarketPoolMock,
  invalidateMarketBenchmarkCacheMock,
  getPublishedBenchmarkCoverageSummaryMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  refreshPlatformMarketPoolMock: vi.fn(),
  invalidateMarketBenchmarkCacheMock: vi.fn(),
  getPublishedBenchmarkCoverageSummaryMock: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/benchmarks/platform-market-pool", () => ({
  refreshPlatformMarketPool: refreshPlatformMarketPoolMock,
}));

vi.mock("@/lib/benchmarks/platform-market", () => ({
  invalidateMarketBenchmarkCache: invalidateMarketBenchmarkCacheMock,
}));

vi.mock("@/lib/benchmarks/coverage-contract", () => ({
  getPublishedBenchmarkCoverageSummary: getPublishedBenchmarkCoverageSummaryMock,
}));

import { POST } from "@/app/api/admin/market-publish/route";

function createServiceSupabase() {
  return {
    from(table: string) {
      if (table !== "market_publish_events") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        insert(payload: Record<string, unknown>) {
          return {
            select() {
              return {
                single() {
                  return Promise.resolve({
                    data: {
                      id: "publish-1",
                      ...payload,
                      published_at: "2026-03-17T10:00:00.000Z",
                    },
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("POST /api/admin/market-publish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSuperAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    getPublishedBenchmarkCoverageSummaryMock.mockResolvedValue({
      supportedExactTriples: 1200,
      coveredExactTriples: 1200,
      officialCoveredExactTriples: 1000,
      proxyBackedExactTriples: 200,
      missingExactTriples: 0,
      coveragePercent: 100,
      missingExamples: [],
    });
  });

  it("refreshes the market pool, records a tenant-visible publish event, and clears the cache", async () => {
    createServiceClientMock.mockReturnValue(createServiceSupabase());
    refreshPlatformMarketPoolMock.mockResolvedValue({ rowCount: 212 });

    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(refreshPlatformMarketPoolMock).toHaveBeenCalledTimes(1);
    expect(invalidateMarketBenchmarkCacheMock).toHaveBeenCalledTimes(1);
    expect(payload).toEqual({
      ok: true,
      event: {
        id: "publish-1",
        title: "Qeemly Market Data Updated",
        summary: "Fresh GCC benchmark coverage is now live across the platform.",
        rowCount: 212,
        publishedAt: "2026-03-17T10:00:00.000Z",
      },
      coverage: {
        supportedExactTriples: 1200,
        coveredExactTriples: 1200,
        officialCoveredExactTriples: 1000,
        proxyBackedExactTriples: 200,
        missingExactTriples: 0,
        coveragePercent: 100,
        missingExamples: [],
      },
    });
  });

  it("blocks publish when exact shared-market coverage is still incomplete", async () => {
    createServiceClientMock.mockReturnValue(createServiceSupabase());
    refreshPlatformMarketPoolMock.mockResolvedValue({ rowCount: 244 });
    getPublishedBenchmarkCoverageSummaryMock.mockResolvedValue({
      supportedExactTriples: 1200,
      coveredExactTriples: 244,
      officialCoveredExactTriples: 180,
      proxyBackedExactTriples: 64,
      missingExactTriples: 956,
      coveragePercent: 20.33,
      missingExamples: ["swe::ic1::abu-dhabi", "tpm::ic5::riyadh"],
    });

    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload).toEqual({
      error: "Cannot publish market dataset until exact benchmark coverage is complete.",
      detail:
        "956 of 1200 exact benchmark rows are still missing. Examples: swe::ic1::abu-dhabi, tpm::ic5::riyadh.",
      coverage: {
        supportedExactTriples: 1200,
        coveredExactTriples: 244,
        officialCoveredExactTriples: 180,
        proxyBackedExactTriples: 64,
        missingExactTriples: 956,
        coveragePercent: 20.33,
        missingExamples: ["swe::ic1::abu-dhabi", "tpm::ic5::riyadh"],
      },
    });
  });
});
