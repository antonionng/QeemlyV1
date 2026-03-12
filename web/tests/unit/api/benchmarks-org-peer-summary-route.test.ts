import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  createServiceClientMock,
  getWorkspaceContextMock,
  fetchMarketBenchmarksMock,
  getOrgPeerSummaryMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  getWorkspaceContextMock: vi.fn(),
  fetchMarketBenchmarksMock: vi.fn(),
  getOrgPeerSummaryMock: vi.fn(),
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
}));

vi.mock("@/lib/benchmarks/org-peer-summary", () => ({
  getOrgPeerSummary: getOrgPeerSummaryMock,
}));

import { GET } from "@/app/api/benchmarks/org-peer-summary/route";

function createQueryClient() {
  return {
    from(table: string) {
      if (table === "employees") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: "emp-1",
                      workspace_id: "ws-1",
                      role_id: "swe",
                      level_id: "ic3",
                      location_id: "dubai",
                      status: "active",
                      base_salary: 170_000,
                      bonus: 0,
                      equity: 0,
                    },
                  ],
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      if (table === "salary_benchmarks") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: "bench-1",
                      workspace_id: "ws-1",
                      role_id: "swe",
                      location_id: "dubai",
                      level_id: "ic3",
                      currency: "AED",
                      p10: 10_000,
                      p25: 11_000,
                      p50: 12_000,
                      p75: 13_000,
                      p90: 14_000,
                      sample_size: 6,
                      source: "uploaded",
                      confidence: "medium",
                      valid_from: "2026-03-12",
                      created_at: "2026-03-12T00:00:00.000Z",
                    },
                  ],
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("GET /api/benchmarks/org-peer-summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const sessionClient = createQueryClient();
    const serviceClient = createQueryClient();
    createClientMock.mockResolvedValue(sessionClient);
    createServiceClientMock.mockReturnValue(serviceClient);
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "ws-1",
        is_override: false,
        override_workspace_id: null,
        profile_workspace_id: "ws-1",
        is_super_admin: false,
        user_id: "user-1",
        user_email: "user@example.com",
      },
    });
    fetchMarketBenchmarksMock.mockResolvedValue([
      {
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        industry: null,
        company_size: null,
        p10: 12_000,
        p25: 14_000,
        p50: 16_000,
        p75: 18_000,
        p90: 20_000,
        sample_size: 8,
        source: "market",
      },
    ]);
    getOrgPeerSummaryMock.mockReturnValue({
      benchmarkSource: "market",
      bandLow: 168_000,
      bandHigh: 216_000,
      matchingEmployeeCount: 1,
      inBandCount: 1,
    });
  });

  it("returns a validation error when role, location, or level is missing", async () => {
    const response = await GET(
      new Request("http://localhost/api/benchmarks/org-peer-summary?roleId=swe") as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("roleId");
    expect(getOrgPeerSummaryMock).not.toHaveBeenCalled();
  });

  it("returns the real org peer summary for the current benchmark filters", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/benchmarks/org-peer-summary?roleId=swe&locationId=dubai&levelId=ic3&industry=Fintech&companySize=201-500",
      ) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMarketBenchmarksMock).toHaveBeenCalledTimes(1);
    expect(fetchMarketBenchmarksMock).toHaveBeenCalledWith(
      createServiceClientMock.mock.results[0]?.value,
      { includeSegmented: true },
    );
    expect(getOrgPeerSummaryMock).toHaveBeenCalledWith({
      employees: [
        expect.objectContaining({
          id: "emp-1",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          base_salary: 170_000,
        }),
      ],
      marketBenchmarks: expect.any(Array),
      workspaceBenchmarks: [
        expect.objectContaining({
          workspace_id: "ws-1",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
        }),
      ],
      roleId: "swe",
      locationId: "dubai",
      levelId: "ic3",
      industry: "Fintech",
      companySize: "201-500",
    });
    expect(payload).toEqual({
      benchmarkSource: "market",
      bandLow: 168_000,
      bandHigh: 216_000,
      matchingEmployeeCount: 1,
      inBandCount: 1,
    });
  });
});
