import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  createServiceClientMock,
  fetchMarketBenchmarksMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  fetchMarketBenchmarksMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/benchmarks/platform-market", () => ({
  fetchMarketBenchmarks: fetchMarketBenchmarksMock,
}));

import { GET } from "@/app/api/admin/executive-insights/route";

function createAdminSessionSupabase(email = "ag@experrt.com") {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "admin-1", email } },
      }),
    },
  };
}

function createServiceSupabase() {
  return {
    from(table: string) {
      if (table === "workspaces") {
        return {
          select() {
            return {
              limit() {
                return Promise.resolve({
                  data: [
                    { id: "w1", name: "Alpha" },
                    { id: "w2", name: "Beta" },
                  ],
                  error: null,
                });
              },
            };
          },
        };
      }

      if (table === "employees") {
        return {
          select() {
            return {
              in() {
                return Promise.resolve({
                  data: [
                    { workspace_id: "w1" },
                    { workspace_id: "w1" },
                    { workspace_id: "w1" },
                    { workspace_id: "w2" },
                  ],
                  error: null,
                });
              },
            };
          },
        };
      }

      if (table === "data_uploads") {
        return {
          select() {
            return {
              in() {
                return {
                  gte() {
                    return {
                      order() {
                        return Promise.resolve({
                          data: [
                            { workspace_id: "w1", created_at: "2026-03-09T12:00:00.000Z" },
                            { workspace_id: "w2", created_at: "2026-03-08T12:00:00.000Z" },
                          ],
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

      if (table === "salary_benchmarks") {
        return {
          select() {
            return {
              in() {
                return {
                  eq() {
                    return Promise.resolve({
                      data: [
                        { workspace_id: "w1", source: "uploaded" },
                        { workspace_id: "w2", source: "uploaded" },
                      ],
                      error: null,
                    });
                  },
                };
              },
            };
          },
        };
      }

      if (table === "ingestion_sources") {
        return {
          select() {
            return Promise.resolve({
              data: [
                { id: "s1", enabled: true, config: { health: "live" } },
                { id: "s2", enabled: true, config: { health: "degraded" } },
                { id: "s3", enabled: false, config: { health: "static" } },
              ],
              error: null,
            });
          },
        };
      }

      if (table === "ingestion_jobs") {
        return {
          select() {
            return {
              gte() {
                return Promise.resolve({
                  data: [
                    { status: "success" },
                    { status: "failed" },
                    { status: "running" },
                  ],
                  error: null,
                });
              },
            };
          },
        };
      }

      if (table === "data_freshness_metrics") {
        return {
          select() {
            return {
              limit() {
                return Promise.resolve({
                  data: [
                    { last_updated_at: "2026-03-10T08:00:00.000Z" },
                    { last_updated_at: "2026-03-09T22:00:00.000Z" },
                  ],
                  error: null,
                });
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("GET /api/admin/executive-insights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00.000Z"));
    createClientMock.mockResolvedValue(createAdminSessionSupabase());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("returns a combined executive rollup for market, tenant health, ops, and integrity flags", async () => {
    createServiceClientMock.mockReturnValue(createServiceSupabase());
    fetchMarketBenchmarksMock.mockResolvedValue([
      {
        role_id: "swe-devops",
        location_id: "dubai",
        level_id: "ic2",
        currency: "AED",
        p10: 12000,
        p25: 14000,
        p50: 16000,
        p75: 18000,
        p90: 20000,
        sample_size: 24,
        contributor_count: 4,
        provenance: "blended",
        freshness_at: "2026-03-10T00:00:00.000Z",
        source_breakdown: { employee: 2, uploaded: 1 },
        source: "market",
      },
      {
        role_id: "swe-devops",
        location_id: "riyadh",
        level_id: "ic3",
        currency: "SAR",
        p10: 15000,
        p25: 17000,
        p50: 19000,
        p75: 21000,
        p90: 23000,
        sample_size: 18,
        contributor_count: 3,
        provenance: "employee",
        freshness_at: "2026-03-08T00:00:00.000Z",
        source_breakdown: { employee: 3 },
        source: "market",
      },
      {
        role_id: "designer-product",
        location_id: "riyadh",
        level_id: "ic3",
        currency: "SAR",
        p10: 11000,
        p25: 12000,
        p50: 13000,
        p75: 14000,
        p90: 15000,
        sample_size: 2,
        contributor_count: 2,
        provenance: "admin",
        freshness_at: "2026-01-01T00:00:00.000Z",
        source_breakdown: { admin: 2 },
        source: "market",
      },
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.market.summary).toEqual({
      benchmarkCount: 3,
      uniqueRoles: 2,
      uniqueLocations: 2,
      uniqueLevels: 2,
      contributorQualifiedRows: 2,
      staleRows: 1,
      lowConfidenceRows: 1,
      coverageStrength: "developing",
    });
    expect(payload.market.topRoles[0]).toEqual({
      roleId: "swe-devops",
      benchmarkCount: 2,
      locationCount: 2,
      levelCount: 2,
      contributorQualifiedCount: 2,
    });
    expect(payload.market.sourceMix[0]).toEqual({
      sourceType: "employee",
      contributionCount: 5,
      rowCount: 2,
    });
    expect(payload.tenantHealth).toEqual({
      workspaceCount: 2,
      activeWorkspaceCount: 2,
      employeeCount: 4,
      uploadsLast30Days: 2,
      uploadedBenchmarkRows: 2,
      topWorkspaces: [
        {
          workspaceId: "w1",
          workspaceName: "Alpha",
          employeeCount: 3,
          uploadCount: 1,
          uploadedBenchmarkCount: 1,
        },
        {
          workspaceId: "w2",
          workspaceName: "Beta",
          employeeCount: 1,
          uploadCount: 1,
          uploadedBenchmarkCount: 1,
        },
      ],
    });
    expect(payload.ops).toEqual({
      sources: {
        total: 3,
        enabled: 2,
        degraded: 1,
      },
      jobs24h: {
        total: 3,
        success: 1,
        failed: 1,
        running: 1,
        partial: 0,
      },
      freshness: {
        score: "fresh",
        lastUpdatedAt: "2026-03-10T08:00:00.000Z",
        stalenessHours: 4,
      },
    });
    expect(payload.integrityFlags).toEqual([
      {
        id: "low-density-market-rows",
        severity: "warning",
        title: "Some pooled rows are below the contributor threshold",
      },
      {
        id: "degraded-sources",
        severity: "warning",
        title: "One or more ingestion sources are degraded",
      },
    ]);
  });

  it("preserves admin auth behavior", async () => {
    createClientMock.mockResolvedValue(createAdminSessionSupabase("someone@example.com"));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
  });
});
