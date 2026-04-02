import { beforeEach, describe, expect, it, vi } from "vitest";
import { invalidateMarketBenchmarkCache } from "@/lib/benchmarks/platform-market";

const {
  createClientMock,
  createServiceClientMock,
  getAiBenchmarkAdvisoryLightMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  getAiBenchmarkAdvisoryLightMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/benchmarks/ai-estimate", () => ({
  getAiBenchmarkAdvisoryLight: getAiBenchmarkAdvisoryLightMock,
}));

import { POST } from "@/app/api/benchmarks/lookup-batch/route";

function createSessionSupabase(
  workspaceId = "workspace-1",
  marketRows: Array<Record<string, unknown>> = [],
) {
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

      if (table === "platform_market_benchmarks") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn().mockResolvedValue({
                  data: marketRows,
                }),
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
      if (table !== "platform_market_benchmarks") {
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
                    pay_period: "monthly",
                    p10: 12000,
                    p25: 14000,
                    p50: 16247,
                    p75: 19000,
                    p90: 21500,
                    sample_size: 18,
                    contributor_count: 18,
                    provenance: "blended",
                    freshness_at: "2026-03-11T00:00:00.000Z",
                    source_breakdown: { employee: 8, uploaded: 5, admin: 5 },
                  },
                  {
                    role_id: "swe-devops",
                    location_id: "dubai",
                    level_id: "ic3",
                    currency: "AED",
                    pay_period: "monthly",
                    p10: 15000,
                    p25: 18000,
                    p50: 21000,
                    p75: 24000,
                    p90: 28000,
                    sample_size: 18,
                    contributor_count: 18,
                    provenance: "blended",
                    freshness_at: "2026-03-11T00:00:00.000Z",
                    source_breakdown: { employee: 8, uploaded: 5, admin: 5 },
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

describe("POST /api/benchmarks/lookup-batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateMarketBenchmarkCache();
    getAiBenchmarkAdvisoryLightMock.mockResolvedValue({
      levels: [
        {
          levelId: "ic2",
          levelName: "Mid-Level (IC2)",
          p10: 180000,
          p25: 200000,
          p50: 240000,
          p75: 280000,
          p90: 320000,
        },
        {
          levelId: "ic3",
          levelName: "Senior (IC3)",
          p10: 240000,
          p25: 270000,
          p50: 310000,
          p75: 350000,
          p90: 390000,
        },
      ],
      currency: "AED",
      payPeriod: "annual",
      summary: "AI benchmark levels are available for the requested cohort.",
    });
  });

  it("returns AI-generated benchmarks for batch entries by default", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase());
    createServiceClientMock.mockReturnValue(createMarketSupabase());

    const request = new Request("http://localhost/api/benchmarks/lookup-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: [
          { roleId: "swe-devops", locationId: "dubai", levelId: "ic2" },
          { roleId: "swe-devops", locationId: "dubai", levelId: "ic3" },
        ],
      }),
    }) as unknown as Parameters<typeof POST>[0];

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.benchmarks["swe-devops::dubai::ic2::::"]).toMatchObject({
      benchmarkSource: "ai-estimated",
      percentiles: { p50: 240000 },
    });
    expect(payload.benchmarks["swe-devops::dubai::ic3::::"]).toMatchObject({
      benchmarkSource: "ai-estimated",
      percentiles: { p50: 310000 },
    });
  });
});
