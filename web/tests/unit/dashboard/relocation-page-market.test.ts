// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("@/components/dashboard/relocation/input-panel", () => ({
  InputPanel: () => React.createElement("div", null, "InputPanel"),
}));

vi.mock("@/lib/relocation/calculator", () => ({
  calculateRelocation: () => ({
    homeCity: {
      id: "london",
      name: "London",
      country: "United Kingdom",
      flag: "GB",
      colIndex: 145,
      currency: "GBP",
      breakdown: { rent: 12800, transport: 1650, food: 2900, utilities: 900, other: 2200 },
    },
    targetCity: {
      id: "dubai",
      name: "Dubai",
      country: "UAE",
      flag: "AE",
      colIndex: 100,
      currency: "AED",
      breakdown: { rent: 9000, transport: 1100, food: 2200, utilities: 750, other: 1500 },
    },
    colRatio: 0.69,
    baseSalary: 95_000,
    baseSalaryCurrency: "GBP",
    baseSalaryAed: 441_750,
    purchasingPowerSalary: 304_655,
    recommendedSalary: 320_000,
    recommendedRange: { min: 304_000, max: 336_000 },
    annualDifference: -52_800,
    monthlyDifference: -4_400,
    costBreakdown: {
      home: { rent: 12800, transport: 1650, food: 2900, utilities: 900, other: 2200 },
      target: { rent: 9000, transport: 1100, food: 2200, utilities: 750, other: 1500 },
    },
  }),
  formatCurrency: (amount: number, compact?: boolean) => {
    if (compact && amount >= 1000) return `AED ${Math.round(amount / 1000)}K`;
    return `AED ${amount.toLocaleString()}`;
  },
  getApproachExplanation: () =>
    "This approach adjusts for purchasing power but caps the increase.",
}));

vi.mock("@/lib/relocation/col-data", () => ({
  setRelocationCities: vi.fn(),
  getTotalMonthlyCost: (b: Record<string, number>) =>
    Object.values(b).reduce((s, v) => s + v, 0),
}));

import RelocationPage from "@/app/(dashboard)/dashboard/relocation/page";

describe("RelocationPage market comparison", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/api/relocation/cities")) {
          return Promise.resolve(
            new Response(JSON.stringify({ cities: [] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if (url.includes("/api/relocation/advisory")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                deterministicResult: {
                  recommendedSalary: 304_655,
                  recommendedRange: { min: 289_422, max: 319_888 },
                },
                homeMarketContext: {
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
                  matchLabel: "Exact match",
                  fallbackReason: null,
                },
                targetMarketContext: {
                  requestedLocationId: "dubai",
                  matchedLocationId: "dubai",
                  currency: "AED",
                  p25: 280_000,
                  p50: 320_000,
                  p75: 370_000,
                  p90: 420_000,
                  benchmarkSource: "ai-estimated",
                  sourceLabel: "Qeemly AI Benchmark",
                  matchType: "exact",
                  matchLabel: "Exact match",
                  fallbackReason: null,
                },
                salaryComparisons: {
                  benchmarkToBenchmark: {
                    homeMarketP50: 100_000,
                    homeMarketCurrency: "GBP",
                    homeMarketP50Aed: 465_000,
                    targetMarketP50: 320_000,
                    targetMarketCurrency: "AED",
                    targetMarketP50Aed: 320_000,
                    differenceInAed: -145_000,
                    percentChange: -31.18,
                  },
                  currentToDestinationMarket: {
                    currentSalary: 95_000,
                    currentSalaryCurrency: "GBP",
                    currentSalaryAed: 441_750,
                    currentSalaryInTargetCurrency: 441_750,
                    targetMarketP50: 320_000,
                    targetMarketCurrency: "AED",
                    targetMarketP50Aed: 320_000,
                    gapInAed: -121_750,
                    gapPercent: -27.56,
                  },
                },
                aiAdvisory: null,
                recommendedResult: {
                  recommendedSalary: 320_000,
                  recommendedRange: { min: 304_000, max: 336_000 },
                },
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        return Promise.reject(new Error(`Unhandled fetch: ${url}`));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    container.remove();
  });

  it("renders market-to-market and current-to-market salary comparisons with local and AED references", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(RelocationPage));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Origin market salary");
    expect(container.textContent).toContain("Destination market salary");
    expect(container.textContent).toContain("Current salary vs destination market");
    expect(container.textContent).toContain("Qeemly Market Dataset");
    expect(container.textContent).toContain("Qeemly AI Benchmark");
    expect(container.textContent).toContain("AED reference");
    expect(container.textContent).toContain("95,000");
    expect(container.textContent).toContain("320,000");
  });
});
