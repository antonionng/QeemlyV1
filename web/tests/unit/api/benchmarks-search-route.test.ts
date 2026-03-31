import { beforeEach, describe, expect, it, vi } from "vitest";
import { invalidateMarketBenchmarkCache } from "@/lib/benchmarks/platform-market";

const {
  createClientMock,
  createServiceClientMock,
  getAiBenchmarkForLevelMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  getAiBenchmarkForLevelMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/benchmarks/ai-estimate", () => ({
  getAiBenchmarkForLevel: getAiBenchmarkForLevelMock,
}));

import { GET } from "@/app/api/benchmarks/search/route";

const aiDetailBriefing = {
  executiveBriefing: "Shared AI executive market view.",
  hiringSignal: "Hiring remains competitive for this role.",
  negotiationPosture: "Keep room for negotiation at final offer stage.",
  views: {
    levelTable: { summary: "Level spacing remains healthy through IC4.", action: "Use the selected band as the anchor." },
    aiInsights: { summary: "Above-median positioning will improve close rates.", action: "Stay disciplined around the target percentile." },
    trend: { summary: "Momentum remains positive in the latest data window.", action: "Avoid assuming near-term cooling." },
    salaryBreakdown: { summary: "Candidates react best to a clear cash-led package.", action: "Keep allowances easy to explain." },
    industry: { summary: "Fintech keeps a persistent premium in this market.", action: "Expect comp references above general market norms." },
    companySize: { summary: "Structured mid-market bands are still competitive.", action: "Use policy clarity as a differentiator." },
    geoComparison: { summary: "Regional market gaps remain meaningful.", action: "Benchmark relocation cases separately." },
    compMix: { summary: "Most value is concentrated in fixed cash.", action: "Avoid unnecessary package complexity." },
    offerBuilder: { summary: "A decisive first offer still matters.", action: "Hold a small negotiation buffer in reserve." },
  },
};

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
                    p10: 12000,
                    p25: 14000,
                    p50: 16247,
                    p75: 19000,
                    p90: 21500,
                    sample_size: null,
                    contributor_count: 6,
                    provenance: "blended",
                    freshness_at: "2026-03-11T00:00:00.000Z",
                    source_breakdown: { employee: 2, uploaded: 2, admin: 2 },
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

function createSegmentedMarketSupabase(rows: Array<Record<string, unknown>>) {
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
                data: rows,
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
    getAiBenchmarkForLevelMock.mockResolvedValue(null);
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
      payPeriod: "annual",
      sourcePayPeriod: "monthly",
    });
    expect(payload.benchmark.percentiles.p50).toBe(194964);
    expect(payload.diagnostics.market.error).toBeNull();
    expect(payload.diagnostics.market.readMode).toBe("service");
  });

  it("does not mark a market row with no sample size as high confidence", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase());
    createServiceClientMock.mockReturnValue(createMarketSupabase());

    const request = new Request(
      "http://localhost/api/benchmarks/search?roleId=swe-devops&locationId=dubai&levelId=ic2",
    ) as unknown as Parameters<typeof GET>[0];

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.benchmark.sampleSize).toBe(0);
    expect(payload.benchmark.confidence).toBe("Low");
  });

  it("preserves annual benchmark rows without multiplying them again", async () => {
    createClientMock.mockResolvedValue(
      createSessionSupabase("workspace-1", [
        {
          role_id: "swe-devops",
          location_id: "dubai",
          level_id: "ic2",
          currency: "AED",
          p10: 180000,
          p25: 195000,
          p50: 210000,
          p75: 225000,
          p90: 240000,
          pay_period: "annual",
          sample_size: 10,
          contributor_count: 4,
          provenance: "blended",
          freshness_at: "2026-03-11T00:00:00.000Z",
          source_breakdown: { employee: 2, uploaded: 1, admin: 1 },
        },
      ]),
    );
    createServiceClientMock.mockReturnValue({
      from: vi.fn().mockImplementationOnce(() => {
        throw new Error("Invalid API key");
      }),
    });

    const request = new Request(
      "http://localhost/api/benchmarks/search?roleId=swe-devops&locationId=dubai&levelId=ic2",
    ) as unknown as Parameters<typeof GET>[0];

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.benchmark).toMatchObject({
      payPeriod: "annual",
      sourcePayPeriod: "annual",
    });
    expect(payload.benchmark.percentiles.p50).toBe(210000);
  });

  it("returns an exact segmented cohort when one exists", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase());
    createServiceClientMock.mockReturnValue(
      createSegmentedMarketSupabase([
        {
          role_id: "swe-devops",
          location_id: "dubai",
          level_id: "ic2",
          currency: "AED",
          industry: null,
          company_size: null,
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
          level_id: "ic2",
          currency: "AED",
          industry: "Fintech",
          company_size: "201-500",
          p10: 14000,
          p25: 15500,
          p50: 18000,
          p75: 20500,
          p90: 23000,
          sample_size: 8,
          contributor_count: 8,
          provenance: "blended",
          freshness_at: "2026-03-11T00:00:00.000Z",
          source_breakdown: { employee: 3, uploaded: 3, admin: 2 },
        },
      ]),
    );

    const request = new Request(
      "http://localhost/api/benchmarks/search?roleId=swe-devops&locationId=dubai&levelId=ic2&industry=Fintech&companySize=201-500",
    ) as unknown as Parameters<typeof GET>[0];

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.benchmark.percentiles.p50).toBe(216000);
    expect(payload.benchmark.benchmarkSegmentation).toMatchObject({
      matchedIndustry: "Fintech",
      matchedCompanySize: "201-500",
      isSegmented: true,
      isFallback: false,
    });
  });

  it("labels a broader-market fallback when no exact segmented cohort exists", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase());
    createServiceClientMock.mockReturnValue(
      createSegmentedMarketSupabase([
        {
          role_id: "swe-devops",
          location_id: "dubai",
          level_id: "ic2",
          currency: "AED",
          industry: null,
          company_size: null,
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
      ]),
    );

    const request = new Request(
      "http://localhost/api/benchmarks/search?roleId=swe-devops&locationId=dubai&levelId=ic2&industry=Fintech",
    ) as unknown as Parameters<typeof GET>[0];

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.benchmark.percentiles.p50).toBe(194964);
    expect(payload.benchmark.benchmarkSegmentation).toMatchObject({
      requestedIndustry: "Fintech",
      matchedIndustry: null,
      isSegmented: false,
      isFallback: true,
    });
  });

  it("falls back to the session client when the service client query fails with an invalid API key", async () => {
    createClientMock.mockResolvedValue(
      createSessionSupabase("workspace-1", [
        {
          role_id: "swe-devops",
          location_id: "dubai",
          level_id: "ic2",
          currency: "AED",
          p10: 12000,
          p25: 14000,
          p50: 16247,
          p75: 19000,
          p90: 21500,
          sample_size: null,
          contributor_count: 6,
          provenance: "blended",
          freshness_at: "2026-03-11T00:00:00.000Z",
          source_breakdown: { employee: 2, uploaded: 2, admin: 2 },
        },
      ]),
    );
    createServiceClientMock.mockReturnValue({
      from: vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error("Invalid API key");
        })
        .mockImplementationOnce((table: string) => createMarketSupabase().from(table)),
    });

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
    expect(payload.diagnostics.market.readMode).toBe("session");
    expect(payload.diagnostics.market.error).toBeNull();
    expect(payload.diagnostics.market.clientWarning).toBeNull();
  });

  it("shows AI advisory alongside market data when market is strong", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase());
    createServiceClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "platform_market_benchmarks") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [{
                role_id: "swe-devops",
                location_id: "dubai",
                level_id: "ic2",
                currency: "AED",
                pay_period: "monthly",
                p10: 12000,
                p25: 14500,
                p50: 16247,
                p75: 19000,
                p90: 21500,
                sample_size: 18,
                contributor_count: 18,
                provenance: "blended",
                industry: null,
                company_size: null,
              }],
            }),
          };
        }
        return createMarketSupabase().from(table);
      }),
    });
    getAiBenchmarkForLevelMock.mockResolvedValue({
      advisory: {
        levels: [
          { levelId: "ic2", levelName: "Mid-Level (IC2)", p10: 180000, p25: 200000, p50: 240000, p75: 280000, p90: 320000 },
        ],
        currency: "AED",
        payPeriod: "annual",
        reasoning: "Strong demand for DevOps in Dubai.",
        marketContext: "UAE tech market is competitive.",
        confidenceNote: "AI advisory based on regional patterns.",
        industryInsight: null,
        companySizeInsight: null,
        detailBriefing: aiDetailBriefing,
      },
      level: { levelId: "ic2", levelName: "Mid-Level (IC2)", p10: 180000, p25: 200000, p50: 240000, p75: 280000, p90: 320000 },
    });

    const request = new Request(
      "http://localhost/api/benchmarks/search?roleId=swe-devops&locationId=dubai&levelId=ic2",
    ) as unknown as Parameters<typeof GET>[0];

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.benchmark).toMatchObject({ benchmarkSource: "market" });
    expect(payload.aiAdvisory).toMatchObject({
      levelEstimate: { levelId: "ic2", p50: 240000 },
      reasoning: "Strong demand for DevOps in Dubai.",
    });
    expect(payload.aiDetailBriefing).toEqual(aiDetailBriefing);
    expect(payload.diagnostics.ai.called).toBe(true);
    expect(payload.diagnostics.ai.error).toBeNull();
  });

  it("replaces weak market data with AI as primary (no separate panel)", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase());
    createServiceClientMock.mockReturnValue(createMarketSupabase());
    getAiBenchmarkForLevelMock.mockResolvedValue({
      advisory: {
        levels: [
          { levelId: "ic2", levelName: "Mid-Level (IC2)", p10: 180000, p25: 200000, p50: 240000, p75: 280000, p90: 320000 },
        ],
        currency: "AED",
        payPeriod: "annual",
        reasoning: "Based on GCC market patterns.",
        marketContext: "UAE competitive market.",
        confidenceNote: "AI advisory.",
        industryInsight: null,
        companySizeInsight: null,
        detailBriefing: aiDetailBriefing,
      },
      level: { levelId: "ic2", levelName: "Mid-Level (IC2)", p10: 180000, p25: 200000, p50: 240000, p75: 280000, p90: 320000 },
    });

    const request = new Request(
      "http://localhost/api/benchmarks/search?roleId=swe-devops&locationId=dubai&levelId=ic2",
    ) as unknown as Parameters<typeof GET>[0];

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.benchmark).toMatchObject({
      benchmarkSource: "ai-estimated",
      percentiles: { p50: 240000 },
    });
    // AI data is folded into primary, no separate panel
    expect(payload.aiAdvisory).toBeNull();
    expect(payload.aiDetailBriefing).toEqual(aiDetailBriefing);
  });
});
