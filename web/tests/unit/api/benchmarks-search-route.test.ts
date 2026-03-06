import { beforeEach, describe, expect, it, vi } from "vitest";
import { invalidateMarketBenchmarkCache } from "@/lib/benchmarks/platform-market";

const {
  createClientMock,
  createServiceClientMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createServiceClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

import { GET } from "@/app/api/benchmarks/search/route";

function createSessionSupabase(workspaceId = "workspace-1") {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { workspace_id: workspaceId },
              }),
            })),
          })),
        };
      }

      if (table === "salary_benchmarks") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function createMarketSupabase() {
  return {
    from: vi.fn((table: string) => {
      if (table !== "public_benchmark_snapshots") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn().mockResolvedValue({
                data: [
                  {
                    role_id: "swe-devops",
                    location_id: "dubai",
                    level_id: "ic2",
                    currency: "AED",
                    p25: 14000,
                    p50: 16247,
                    p75: 19000,
                  },
                ],
              }),
            })),
          })),
        })),
      };
    }),
  };
}

describe("GET /api/benchmarks/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateMarketBenchmarkCache();
  });

  it("returns the market benchmark through the real platform-market helper", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase());
    createServiceClientMock.mockReturnValue(createMarketSupabase());

    const request = new Request(
      "http://localhost/api/benchmarks/search?roleId=swe-devops&locationId=dubai&levelId=ic2",
    ) as unknown as Parameters<typeof GET>[0];

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.benchmark).toMatchObject({
      roleId: "swe-devops",
      locationId: "dubai",
      levelId: "ic2",
      benchmarkSource: "market",
    });
    expect(payload.benchmark.percentiles.p50).toBe(16247);
    expect(payload.diagnostics.market.error).toBeNull();
    expect(payload.diagnostics.market.readMode).toBe("service");
  });
});
