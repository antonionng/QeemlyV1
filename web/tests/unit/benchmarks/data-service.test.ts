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

import { getBenchmark } from "@/lib/benchmarks/data-service";

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
      "/api/benchmarks/search?roleId=swe-devops&locationId=dubai&levelId=ic2",
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
      "/api/benchmarks/search?roleId=swe-devops&locationId=dubai&levelId=ic2&industry=Fintech&companySize=201-500",
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
});
