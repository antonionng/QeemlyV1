import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SalaryBenchmark } from "@/lib/dashboard/dummy-data";

const {
  createClientMock,
  findMarketBenchmarkMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  findMarketBenchmarkMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/benchmarks/platform-market", () => ({
  fetchMarketBenchmarks: vi.fn(),
  findMarketBenchmark: findMarketBenchmarkMock,
}));

import {
  fetchAiBriefing,
  getBenchmark,
  getBenchmarkEnriched,
  getBenchmarksBatch,
} from "@/lib/benchmarks/data-service";

describe("getBenchmark", () => {
  const responseBenchmark: SalaryBenchmark = {
    roleId: "swe-devops",
    locationId: "dubai",
    levelId: "ic2",
    currency: "AED",
    percentiles: {
      p10: 12000,
      p25: 14000,
      p50: 16247,
      p75: 19000,
      p90: 21500,
    },
    sampleSize: 44,
    confidence: "High",
    lastUpdated: "2026-03-06T00:00:00.000Z",
    momChange: 0,
    yoyChange: 0,
    trend: [],
    benchmarkSource: "market",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        benchmark: responseBenchmark,
      }),
    }) as unknown as typeof fetch;
  });

  it("uses the server benchmark search API for role lookups", async () => {
    const result = await getBenchmark("swe-devops", "dubai", "ic2");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/benchmarks/lookup?roleId=swe-devops&locationId=dubai&levelId=ic2",
      { cache: "no-store" },
    );
    expect(result).toEqual(responseBenchmark);
  });

  it("passes live segmentation filters through the benchmark search API", async () => {
    await getBenchmark("swe-devops", "dubai", "ic2", {
      industry: "Fintech",
      companySize: "201-500",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/benchmarks/lookup?roleId=swe-devops&locationId=dubai&levelId=ic2&industry=Fintech&companySize=201-500",
      { cache: "no-store" },
    );
  });

  it("falls back to direct market reads when the search API is unavailable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;
    findMarketBenchmarkMock.mockResolvedValue({
      role_id: "swe-devops",
      location_id: "dubai",
      level_id: "ic2",
      currency: "AED",
      p10: 12000,
      p25: 14000,
      p50: 16247,
      p75: 19000,
      p90: 21500,
      sample_size: 44,
      source: "market",
    });

    const result = await getBenchmark("swe-devops", "dubai", "ic2");

    expect(findMarketBenchmarkMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      roleId: "swe-devops",
      locationId: "dubai",
      levelId: "ic2",
      benchmarkSource: "market",
    });
  });

  it("falls through to the enriched AI-backed search when lookup returns no benchmark", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          benchmark: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          benchmark: {
            ...responseBenchmark,
            benchmarkSource: "ai-estimated",
          },
        }),
      }) as unknown as typeof fetch;

    const result = await getBenchmark("swe-devops", "dubai", "ic2");

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/benchmarks/lookup?roleId=swe-devops&locationId=dubai&levelId=ic2",
      { cache: "no-store" },
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/benchmarks/search?roleId=swe-devops&locationId=dubai&levelId=ic2",
      { cache: "no-store" },
    );
    expect(result).toMatchObject({
      benchmarkSource: "ai-estimated",
    });
  });

  it("keeps the enriched helper on the AI-backed search route", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        benchmark: responseBenchmark,
        aiSummary: "Fintech compensation remains above the broader market in Dubai.",
      }),
    }) as unknown as typeof fetch;

    const result = await getBenchmarkEnriched("swe-devops", "dubai", "ic2", {
      industry: "Fintech",
      companySize: "201-500",
    });

    expect(result).toEqual({
      benchmark: responseBenchmark,
      aiSummary: "Fintech compensation remains above the broader market in Dubai.",
    });
    await getBenchmarkEnriched("swe-devops", "dubai", "ic2", {
      industry: "Fintech",
      companySize: "201-500",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/benchmarks/search?roleId=swe-devops&locationId=dubai&levelId=ic2&industry=Fintech&companySize=201-500",
      { cache: "no-store" },
    );
  });

  it("fetches the full AI briefing through the dedicated briefing API", async () => {
    const aiDetailBriefing = {
      executiveBriefing: "Shared AI executive market view.",
      hiringSignal: "Hiring remains competitive.",
      negotiationPosture: "Leave room to close above median.",
      views: {
        levelTable: { summary: "Level table summary", action: "Use the table." },
        aiInsights: { summary: "Insights summary", action: "Use the insights." },
        trend: { summary: "Trend summary", action: "Watch the trend." },
        salaryBreakdown: { summary: "Breakdown summary", action: "Keep the split simple." },
        industry: { summary: "Industry summary", action: "Expect premium asks." },
        companySize: { summary: "Company size summary", action: "Stay structured." },
        geoComparison: { summary: "Geo summary", action: "Account for location gaps." },
        compMix: { summary: "Mix summary", action: "Keep most value in cash." },
        offerBuilder: { summary: "Offer summary", action: "Lead with certainty." },
      },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        detailBriefing: aiDetailBriefing,
      }),
    }) as unknown as typeof fetch;

    const result = await fetchAiBriefing("swe-devops", "dubai", "ic2", {
      industry: "Fintech",
      companySize: "201-500",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/benchmarks/briefing?roleId=swe-devops&locationId=dubai&levelId=ic2&industry=Fintech&companySize=201-500",
      { cache: "no-store" },
    );
    expect(result).toEqual(aiDetailBriefing);
  });

  it("deduplicates concurrent AI briefing requests for the same benchmark key", async () => {
    const aiDetailBriefing = {
      executiveBriefing: "Shared AI executive market view.",
      hiringSignal: "Hiring remains competitive.",
      negotiationPosture: "Leave room to close above median.",
      views: {
        levelTable: { summary: "Level table summary", action: "Use the table." },
        aiInsights: { summary: "Insights summary", action: "Use the insights." },
        trend: { summary: "Trend summary", action: "Watch the trend." },
        salaryBreakdown: { summary: "Breakdown summary", action: "Keep the split simple." },
        industry: { summary: "Industry summary", action: "Expect premium asks." },
        companySize: { summary: "Company size summary", action: "Stay structured." },
        geoComparison: { summary: "Geo summary", action: "Account for location gaps." },
        compMix: { summary: "Mix summary", action: "Keep most value in cash." },
        offerBuilder: { summary: "Offer summary", action: "Lead with certainty." },
      },
    };
    const jsonMock = vi.fn().mockResolvedValue({
      detailBriefing: aiDetailBriefing,
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: jsonMock,
    }) as unknown as typeof fetch;

    const first = fetchAiBriefing("swe-devops", "dubai", "ic2", {
      industry: "Fintech",
      companySize: "201-500",
    });
    const second = fetchAiBriefing("swe-devops", "dubai", "ic2", {
      industry: "Fintech",
      companySize: "201-500",
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(aiDetailBriefing);
    expect(secondResult).toEqual(aiDetailBriefing);
  });

  it("returns null when the briefing API responds with non-OK status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: "AI detail briefing unavailable",
        reasonCode: "briefing_generation_failed",
      }),
    }) as unknown as typeof fetch;

    const result = await fetchAiBriefing("swe-devops", "dubai", "ic2");

    expect(result).toBeNull();
  });

  it("uses the batch lookup API for multi-entry market-backed requests", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        benchmarks: {
          "swe-devops::dubai::ic2::::": responseBenchmark,
          "swe-devops::dubai::ic3::::": {
            ...responseBenchmark,
            levelId: "ic3",
          },
        },
      }),
    }) as unknown as typeof fetch;

    const result = await getBenchmarksBatch([
      { roleId: "swe-devops", locationId: "dubai", levelId: "ic2" },
      { roleId: "swe-devops", locationId: "dubai", levelId: "ic3" },
    ]);

    expect(global.fetch).toHaveBeenCalledWith("/api/benchmarks/lookup-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        entries: [
          { roleId: "swe-devops", locationId: "dubai", levelId: "ic2" },
          { roleId: "swe-devops", locationId: "dubai", levelId: "ic3" },
        ],
      }),
    });
    expect(result["swe-devops::dubai::ic2::::"]).toEqual(responseBenchmark);
    expect(result["swe-devops::dubai::ic3::::"]).toMatchObject({
      levelId: "ic3",
    });
  });
});
