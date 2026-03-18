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

import { GET } from "@/app/api/benchmarks/market-insights/route";

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

describe("GET /api/benchmarks/market-insights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns rich market insights for the redesigned page", async () => {
    createClientMock.mockResolvedValue(
      createSessionSupabase({
        workspaceBenchmarks: [
          {
            id: "uploaded-1",
            role_id: "swe-devops",
            location_id: "doha",
            source: "uploaded",
            updated_at: "2026-03-07T00:00:00.000Z",
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
    expect(payload.status).toBe("ready");
    expect(payload.summary).toEqual({
      benchmarkCount: 3,
      uniqueRoles: 2,
      uniqueLocations: 2,
      uniqueLevels: 2,
      contributorQualifiedRows: 2,
      lowConfidenceRows: 1,
      coverageStrength: "developing",
    });
    expect(payload.freshness).toEqual({
      latest: "2026-03-10T00:00:00.000Z",
      staleRows: 1,
      staleThresholdDays: 30,
      freshnessStatus: "mixed",
    });
    expect(payload.hero).toEqual({
      title: "Trusted benchmark coverage is available, but mixed in this view.",
      summary:
        "The visible Qeemly market dataset covers 2 roles across 2 locations, with 2 cohorts currently meeting Qeemly's minimum contributor requirement for trusted benchmarking.",
      recommendedAction:
        "Start with the strongest coverage areas below, review aging cohorts, and use caution when pricing against thinner segments.",
    });
    expect(payload.coverage.topRoles[0]).toEqual({
      roleId: "swe-devops",
      benchmarkCount: 2,
      locationCount: 2,
      levelCount: 2,
      contributorQualifiedCount: 2,
    });
    expect(payload.coverage.topLocations[0]).toEqual({
      locationId: "riyadh",
      benchmarkCount: 2,
      roleCount: 2,
      levelCount: 1,
      contributorQualifiedCount: 1,
    });
    expect(payload.coverage.topLevels).toEqual([
      {
        levelId: "ic3",
        benchmarkCount: 2,
        roleCount: 2,
        locationCount: 1,
        contributorQualifiedCount: 1,
      },
      {
        levelId: "ic2",
        benchmarkCount: 1,
        roleCount: 1,
        locationCount: 1,
        contributorQualifiedCount: 1,
      },
    ]);
    expect(payload.coverage.sourceMix).toEqual([
      { sourceType: "employee", contributionCount: 5, rowCount: 2 },
      { sourceType: "admin", contributionCount: 2, rowCount: 1 },
      { sourceType: "uploaded", contributionCount: 1, rowCount: 1 },
    ]);
    expect(payload.coverage.lowDensityRows).toEqual([
      {
        roleId: "designer-product",
        locationId: "riyadh",
        levelId: "ic3",
        contributorCount: 2,
        sampleSize: 2,
        provenance: "admin",
        freshnessAt: "2026-01-01T00:00:00.000Z",
        confidence: "moderate",
      },
    ]);
    expect(payload.drilldowns.rows).toEqual([
      {
        roleId: "swe-devops",
        locationId: "dubai",
        levelId: "ic2",
        currency: "AED",
        p25: 14000,
        p50: 16000,
        p75: 18000,
        contributorCount: 4,
        sampleSize: 24,
        provenance: "blended",
        freshnessAt: "2026-03-10T00:00:00.000Z",
        confidence: "high",
      },
      {
        roleId: "swe-devops",
        locationId: "riyadh",
        levelId: "ic3",
        currency: "SAR",
        p25: 17000,
        p50: 19000,
        p75: 21000,
        contributorCount: 3,
        sampleSize: 18,
        provenance: "employee",
        freshnessAt: "2026-03-08T00:00:00.000Z",
        confidence: "high",
      },
      {
        roleId: "designer-product",
        locationId: "riyadh",
        levelId: "ic3",
        currency: "SAR",
        p25: 12000,
        p50: 13000,
        p75: 14000,
        contributorCount: 2,
        sampleSize: 2,
        provenance: "admin",
        freshnessAt: "2026-01-01T00:00:00.000Z",
        confidence: "moderate",
      },
    ]);
    expect(payload.workspaceOverlay).toEqual({
      count: 1,
      uniqueRoles: 1,
      uniqueLocations: 1,
      sources: ["uploaded"],
    });
    expect(payload.diagnostics.market.readMode).toBe("service");
    expect(payload.diagnostics.market.error).toBeNull();
  });

  it("returns an empty status when no visible market rows are available", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase({ workspaceId: null }));
    createServiceClientMock.mockReturnValue({ from: vi.fn() });
    fetchMarketBenchmarksMock.mockResolvedValue([]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("empty");
    expect(payload.hero.title).toBe("Market data is not ready yet.");
    expect(payload.summary.benchmarkCount).toBe(0);
    expect(payload.workspaceOverlay.count).toBe(0);
    expect(payload.diagnostics.market.warning).toBe(
      "No market benchmark rows were returned from the platform market dataset.",
    );
  });

  it("returns a customer-safe warning summary when visible cohorts do not meet the trust bar", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase({ workspaceId: null }));
    createServiceClientMock.mockReturnValue({ from: vi.fn() });
    fetchMarketBenchmarksMock.mockResolvedValue([
      {
        role_id: "data-analyst",
        location_id: "dubai",
        level_id: "ic1",
        currency: "AED",
        p10: 8000,
        p25: 9000,
        p50: 10000,
        p75: 11000,
        p90: 12000,
        sample_size: 3,
        contributor_count: 0,
        provenance: "employee",
        freshness_at: "2026-03-10T00:00:00.000Z",
        source_breakdown: { employee: 1 },
        source: "market",
      },
      {
        role_id: "data-analyst",
        location_id: "abu-dhabi",
        level_id: "ic2",
        currency: "AED",
        p10: 9000,
        p25: 10000,
        p50: 11000,
        p75: 12000,
        p90: 13000,
        sample_size: 6,
        contributor_count: 2,
        provenance: "admin",
        freshness_at: "2026-03-09T00:00:00.000Z",
        source_breakdown: { admin: 2 },
        source: "market",
      },
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("ready");
    expect(payload.summary.contributorQualifiedRows).toBe(0);
    expect(payload.hero).toEqual({
      title: "Qeemly market coverage is available, but confidence is limited in this view.",
      summary:
        "We found Qeemly market coverage across 1 role and 2 locations, but the currently visible cohorts are below Qeemly's contributor threshold for trusted benchmarking.",
      recommendedAction:
        "Broaden your view, start with the strongest coverage areas below, and use extra caution before making compensation decisions from low-density cohorts.",
    });
  });

  it("falls back to the session client when the service client query fails with an invalid API key", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase({ workspaceId: null }));
    createServiceClientMock.mockReturnValue({ from: vi.fn() });
    fetchMarketBenchmarksMock
      .mockRejectedValueOnce(new Error("Invalid API key"))
      .mockResolvedValueOnce([
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
      ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("ready");
    expect(payload.summary.benchmarkCount).toBe(1);
    expect(payload.diagnostics.market.readMode).toBe("session");
    expect(payload.diagnostics.market.error).toBeNull();
    expect(payload.diagnostics.market.clientWarning).toBeNull();
    expect(fetchMarketBenchmarksMock).toHaveBeenCalledTimes(2);
  });
});
