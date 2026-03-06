import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { GET } from "@/app/api/benchmarks/stats/route";

function createSessionSupabase({
  workspaceId = "workspace-1",
  workspaceBenchmarks = [],
}: {
  workspaceId?: string | null;
  workspaceBenchmarks?: Array<{
    id: string;
    role_id: string;
    location_id: string;
    source: string;
    updated_at: string;
  }>;
}) {
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
                data: workspaceId ? { workspace_id: workspaceId } : null,
              }),
            })),
          })),
        };
      }

      if (table === "salary_benchmarks") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: workspaceBenchmarks,
              error: null,
            }),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe("GET /api/benchmarks/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns market counts when the shared market accessor succeeds", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase({ workspaceBenchmarks: [] }));
    createServiceClientMock.mockReturnValue({ from: vi.fn() });
    fetchMarketBenchmarksMock.mockResolvedValue([
      {
        role_id: "swe-devops",
        location_id: "dubai",
        level_id: "ic2",
      },
      {
        role_id: "designer-product",
        location_id: "riyadh",
        level_id: "ic3",
      },
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.market.count).toBe(2);
    expect(payload.market.uniqueRoles).toBe(2);
    expect(payload.market.uniqueLocations).toBe(2);
    expect(payload.diagnostics.market.error).toBeNull();
    expect(payload.diagnostics.market.readMode).toBe("service");
  });

  it("deduplicates roles and unions locations across market and workspace layers", async () => {
    createClientMock.mockResolvedValue(
      createSessionSupabase({
        workspaceBenchmarks: [
          {
            id: "uploaded-1",
            role_id: "swe-devops",
            location_id: "doha",
            source: "uploaded",
            updated_at: "2026-03-06T00:00:00.000Z",
          },
        ],
      }),
    );
    createServiceClientMock.mockReturnValue({ from: vi.fn() });
    fetchMarketBenchmarksMock.mockResolvedValue([
      {
        role_id: "swe-devops",
        location_id: "dubai",
        level_id: "ic2",
      },
      {
        role_id: "designer-product",
        location_id: "riyadh",
        level_id: "ic3",
      },
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.uniqueRoles).toBe(2);
    expect(payload.uniqueLocations).toBe(3);
  });

  it("returns market diagnostics instead of silently pretending everything is zero", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase({ workspaceBenchmarks: [] }));
    createServiceClientMock.mockImplementation(() => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for service client usage.");
    });
    fetchMarketBenchmarksMock.mockRejectedValue(new Error("market read failed"));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.market.count).toBe(0);
    expect(payload.diagnostics.market.error).toBe("market read failed");
    expect(payload.diagnostics.market.readMode).toBe("session");
    expect(payload.diagnostics.market.clientWarning).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
