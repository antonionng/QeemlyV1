import { describe, expect, it } from "vitest";

import { buildRelocationMarketData } from "@/lib/relocation/market-context";

describe("buildRelocationMarketData", () => {
  it("returns exact home and target market contexts with comparison metadata", () => {
    const result = buildRelocationMarketData({
      roleId: "swe",
      levelId: "ic3",
      homeLocationId: "london",
      targetLocationId: "dubai",
      currentSalary: 95_000,
      currentSalaryCurrency: "GBP",
      marketBenchmarks: [
        {
          id: "market-london",
          role_id: "swe",
          level_id: "ic3",
          location_id: "london",
          currency: "GBP",
          pay_period: "annual",
          p10: 80_000,
          p25: 90_000,
          p50: 100_000,
          p75: 115_000,
          p90: 130_000,
          sample_size: 18,
          source: "market",
        },
        {
          id: "market-dubai",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          currency: "AED",
          pay_period: "annual",
          p10: 250_000,
          p25: 280_000,
          p50: 320_000,
          p75: 360_000,
          p90: 410_000,
          sample_size: 22,
          source: "market",
        },
      ],
    });

    expect(result.homeMarketContext).toMatchObject({
      requestedLocationId: "london",
      matchedLocationId: "london",
      currency: "GBP",
      p25: 90_000,
      p50: 100_000,
      p75: 115_000,
      p90: 130_000,
      benchmarkSource: "market",
      sourceLabel: "Qeemly Market Dataset",
      matchType: "exact",
    });
    expect(result.targetMarketContext).toMatchObject({
      requestedLocationId: "dubai",
      matchedLocationId: "dubai",
      currency: "AED",
      p25: 280_000,
      p50: 320_000,
      p75: 360_000,
      p90: 410_000,
      benchmarkSource: "market",
      sourceLabel: "Qeemly Market Dataset",
      matchType: "exact",
    });
    expect(result.salaryComparisons?.benchmarkToBenchmark.homeMarketP50).toBe(100_000);
    expect(result.salaryComparisons?.benchmarkToBenchmark.targetMarketP50).toBe(320_000);
    expect(result.salaryComparisons?.currentToDestinationMarket.currentSalary).toBe(95_000);
    expect(result.salaryComparisons?.currentToDestinationMarket.currentSalaryCurrency).toBe("GBP");
  });

  it("prefers AI-estimated rows over canonical market rows for the same location", () => {
    const result = buildRelocationMarketData({
      roleId: "swe",
      levelId: "ic3",
      homeLocationId: "london",
      targetLocationId: "dubai",
      currentSalary: 95_000,
      currentSalaryCurrency: "GBP",
      marketBenchmarks: [
        {
          id: "ai-dubai",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          currency: "AED",
          p10: 255_000,
          p25: 290_000,
          p50: 330_000,
          p75: 370_000,
          p90: 420_000,
          sample_size: 0,
          source: "ai-estimated",
        },
        {
          id: "market-dubai",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          currency: "AED",
          pay_period: "annual",
          p10: 250_000,
          p25: 280_000,
          p50: 320_000,
          p75: 360_000,
          p90: 410_000,
          sample_size: 22,
          source: "market",
        },
      ],
    });

    expect(result.targetMarketContext).toMatchObject({
      benchmarkSource: "ai-estimated",
      sourceLabel: "Qeemly AI Benchmark",
      p50: 330_000,
    });
  });

  it("uses same-country fallback when the selected city lacks an exact benchmark row", () => {
    const result = buildRelocationMarketData({
      roleId: "swe",
      levelId: "ic3",
      homeLocationId: "manchester",
      targetLocationId: "dubai",
      currentSalary: 80_000,
      currentSalaryCurrency: "GBP",
      marketBenchmarks: [
        {
          id: "market-london",
          role_id: "swe",
          level_id: "ic3",
          location_id: "london",
          currency: "GBP",
          pay_period: "annual",
          p10: 80_000,
          p25: 90_000,
          p50: 100_000,
          p75: 115_000,
          p90: 130_000,
          sample_size: 18,
          source: "market",
        },
        {
          id: "market-dubai",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          currency: "AED",
          pay_period: "annual",
          p10: 250_000,
          p25: 280_000,
          p50: 320_000,
          p75: 360_000,
          p90: 410_000,
          sample_size: 22,
          source: "market",
        },
      ],
    });

    expect(result.homeMarketContext).toMatchObject({
      requestedLocationId: "manchester",
      matchedLocationId: "london",
      matchType: "location_fallback",
      matchLabel: "Same-country market fallback",
      fallbackReason: "Used the closest market benchmark from the same country.",
    });
  });
});
