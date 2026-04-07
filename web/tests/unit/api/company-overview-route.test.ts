import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  createServiceClientMock,
  getWorkspaceContextMock,
  fetchMarketBenchmarksMock,
  invalidateMarketBenchmarkCacheMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  getWorkspaceContextMock: vi.fn(),
  fetchMarketBenchmarksMock: vi.fn(),
  invalidateMarketBenchmarkCacheMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/workspace-context", () => ({
  getWorkspaceContext: getWorkspaceContextMock,
}));

vi.mock("@/lib/benchmarks/platform-market", () => ({
  fetchMarketBenchmarks: fetchMarketBenchmarksMock,
  invalidateMarketBenchmarkCache: invalidateMarketBenchmarkCacheMock,
}));

import { GET } from "@/app/api/dashboard/company-overview/route";

function createQueryChain(rows: unknown[], options?: { chainOrder?: boolean }) {
  const orderedResult = {
    order: vi.fn().mockResolvedValue({
      data: rows,
      error: null,
    }),
  };

  const eqChain = {
    eq: vi.fn(() => eqChain),
    neq: vi.fn(() => ({
      order: vi.fn().mockResolvedValue({
        data: rows,
        error: null,
      }),
    })),
    order: options?.chainOrder
      ? vi.fn(() => orderedResult)
      : vi.fn().mockResolvedValue({
          data: rows,
          error: null,
        }),
    in: vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue({
          data: rows,
          error: null,
        }),
      })),
    })),
  };

  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => eqChain),
      order: options?.chainOrder
        ? vi.fn(() => orderedResult)
        : vi.fn().mockResolvedValue({
            data: rows,
            error: null,
          }),
    })),
  };
}

function createSessionSupabase() {
  return {
    from(table: string) {
      if (table === "employees") {
        return createQueryChain([
          {
            id: "emp-1",
            first_name: "Ada",
            last_name: "Lovelace",
            email: "ada@example.com",
            department: "Engineering",
            role_id: "swe",
            level_id: "ic3",
            location_id: "dubai",
            base_salary: 120_000,
            bonus: 0,
            equity: 0,
            status: "active",
            employment_type: "national",
            hire_date: "2024-01-01",
            performance_rating: "meets",
          },
          {
            id: "emp-2",
            first_name: "Grace",
            last_name: "Hopper",
            email: "grace@example.com",
            department: "Engineering",
            role_id: "swe",
            level_id: "ic3",
            location_id: "dubai",
            base_salary: 150_000,
            bonus: 0,
            equity: 0,
            status: "active",
            employment_type: "national",
            hire_date: "2023-06-01",
            performance_rating: "exceptional",
          },
          {
            id: "emp-3",
            first_name: "Mina",
            last_name: "Patel",
            email: "mina@example.com",
            department: "Product",
            role_id: "pm",
            level_id: "ic2",
            location_id: "dubai",
            base_salary: 110_000,
            bonus: 0,
            equity: 0,
            status: "active",
            employment_type: "national",
            hire_date: "2024-03-01",
            performance_rating: "meets",
          },
          {
            id: "emp-4",
            first_name: "Lina",
            last_name: "Khan",
            email: "lina@example.com",
            department: "Product",
            role_id: "pm",
            level_id: "ic3",
            location_id: "dubai",
            base_salary: 90_000,
            bonus: 0,
            equity: 0,
            status: "active",
            employment_type: "national",
            hire_date: "2022-04-01",
            performance_rating: "exceeds",
          },
        ]);
      }

      if (table === "salary_benchmarks") {
        return createQueryChain(
          [
            {
              role_id: "pm",
              location_id: "dubai",
              level_id: "ic3",
              p10: 80_000,
              p25: 100_000,
              p50: 105_000,
              p75: 120_000,
              p90: 140_000,
              valid_from: "2026-03-01",
              created_at: "2026-03-01T00:00:00.000Z",
              source: "uploaded",
              sample_size: 12,
              confidence: "medium",
            },
          ],
          { chainOrder: true },
        );
      }

      if (table === "employee_profile_enrichment") {
        return createQueryChain([]);
      }

      if (table === "employee_visa_records") {
        return createQueryChain([]);
      }

      if (table === "data_freshness_metrics") {
        return createQueryChain([
          {
            id: "freshness-payroll",
            metric_type: "payroll",
            last_updated_at: "2026-03-11T09:00:00.000Z",
            record_count: 10,
            confidence: "high",
            computed_at: "2026-03-11T09:00:00.000Z",
          },
          {
            id: "freshness-benchmarks",
            metric_type: "benchmarks",
            last_updated_at: "2026-03-10T18:00:00.000Z",
            record_count: 85,
            confidence: "medium",
            computed_at: "2026-03-10T18:00:00.000Z",
          },
        ]);
      }

      if (table === "integrations") {
        return createQueryChain([{ id: "integration-1" }]);
      }

      if (table === "integration_sync_logs") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: "sync-1",
                      integration_id: "integration-1",
                      status: "success",
                      records_created: 10,
                      records_updated: 4,
                      records_failed: 0,
                      started_at: "2026-03-11T08:00:00.000Z",
                      completed_at: "2026-03-11T08:10:00.000Z",
                    },
                  ],
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      if (table === "benchmark_coverage_snapshots") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("GET /api/dashboard/company-overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockResolvedValue(createSessionSupabase());
    createServiceClientMock.mockReturnValue(createSessionSupabase());
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "workspace-1",
        is_override: false,
        override_workspace_id: null,
        profile_workspace_id: "workspace-1",
        is_super_admin: false,
        user_id: "user-1",
        user_email: "user@example.com",
      },
    });
    fetchMarketBenchmarksMock.mockResolvedValue([
      {
        role_id: "swe",
        level_id: "ic3",
        location_id: "dubai",
        currency: "AED",
        p10: 100_000,
        p25: 110_000,
        p50: 120_000,
        p75: 130_000,
        p90: 140_000,
        sample_size: 24,
        source: "market",
        provenance: "blended",
        freshness_at: "2026-03-10T00:00:00.000Z",
      },
    ]);
  });

  it("returns one overview snapshot with dynamic actions, trust metadata, and filtered benchmark freshness", async () => {
    const response = await GET(new Request("http://localhost/api/dashboard/company-overview"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.benchmarkCoverage).toEqual({
      activeEmployees: 4,
      benchmarkedEmployees: 4,
      unbenchmarkedEmployees: 0,
      coveragePct: 100,
    });
    expect(payload.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "outside-band" }),
      ]),
    );
    expect(payload.dataHealth.latestBenchmarkFreshness).toEqual({
      metricType: "benchmarks",
      lastUpdatedAt: "2026-03-10T18:00:00.000Z",
      confidence: "medium",
      recordCount: 85,
    });
    expect(payload.benchmarkTrust.primarySourceLabel).toBe("Qeemly Market Dataset");
    expect(payload.benchmarkTrust.marketBacked).toBeGreaterThan(0);
  });

  it("invalidates the market cache when refresh is requested", async () => {
    await GET(new Request("http://localhost/api/dashboard/company-overview?refresh=1"));
    expect(invalidateMarketBenchmarkCacheMock).toHaveBeenCalledTimes(1);
  });

  it("prefers the persisted coverage snapshot when one exists", async () => {
    const supabase = createSessionSupabase();
    const originalFrom = supabase.from;
    supabase.from = (table: string) => {
      if (table === "benchmark_coverage_snapshots") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  workspace_id: "workspace-1",
                  employee_count: 4,
                  exact_match_count: 2,
                  fallback_match_count: 1,
                  unresolved_count: 1,
                  market_coverage_rate: 75,
                },
                error: null,
              }),
            })),
          })),
        };
      }

      return originalFrom(table);
    };

    createClientMock.mockResolvedValue(supabase);

    const response = await GET(new Request("http://localhost/api/dashboard/company-overview"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.benchmarkCoverage).toEqual({
      activeEmployees: 4,
      benchmarkedEmployees: 3,
      unbenchmarkedEmployees: 1,
      coveragePct: 75,
    });
  });

  it("returns a safe server error when employee data cannot be loaded", async () => {
    const failingSupabase = createSessionSupabase();
    const originalFrom = failingSupabase.from;
    failingSupabase.from = (table: string) => {
      if (table === "employees") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "relation employees exploded with secret details" },
                }),
              })),
            })),
          })),
        };
      }

      return originalFrom(table);
    };

    createClientMock.mockResolvedValue(failingSupabase);
    createServiceClientMock.mockReturnValue(failingSupabase);

    const response = await GET(new Request("http://localhost/api/dashboard/company-overview"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("We could not load your company overview right now.");
    expect(payload.message).toBe("We could not load your company overview right now.");
    expect(payload.code).toBe("unknown_error");
  });
});
