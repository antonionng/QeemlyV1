import { describe, expect, it } from "vitest";
import {
  getBenchmarkMarkerLabel,
  getBenchmarkConfidenceLabel,
  getOrgPeerHoverMessage,
  getBenchmarkPageTitle,
  getBenchmarkResultsInsights,
  shouldEnableOrgPeerHover,
} from "@/lib/benchmarks/results-presentation";

describe("benchmark results presentation", () => {
  it("keeps the March 6 page titles for the flow steps", () => {
    expect(getBenchmarkPageTitle("form")).toBe("Benchmarking");
    expect(getBenchmarkPageTitle("results")).toBe("Benchmark Results");
    expect(getBenchmarkPageTitle("detail")).toBe("Detailed Breakdown");
  });

  it("uses the simpler March 6 confidence labels", () => {
    expect(getBenchmarkConfidenceLabel("High")).toBe("Very High Confidence");
    expect(getBenchmarkConfidenceLabel("Medium")).toBe("Medium Confidence");
    expect(getBenchmarkConfidenceLabel("Low")).toBe("AI Estimated");
  });

  it("restores the March 6 summary insight copy", () => {
    expect(
      getBenchmarkResultsInsights({
        targetPercentile: 50,
        confidence: "High",
        sampleSize: 0,
      }),
    ).toEqual([
      {
        type: "info",
        message: "Targeting market median for competitive positioning",
      },
      {
        type: "success",
        message: "High confidence data (0 data points)",
      },
    ]);
  });

  it("formats the org peer hover copy for loading, empty, singular, and plural states", () => {
    expect(getOrgPeerHoverMessage({ isLoading: true, summary: null })).toBe(
      "Checking your org data...",
    );
    expect(
      getOrgPeerHoverMessage({
        isLoading: false,
        summary: {
          benchmarkSource: null,
          bandLow: null,
          bandHigh: null,
          matchingEmployeeCount: 0,
          inBandCount: 0,
        },
      }),
    ).toBe("Org peer count is unavailable for this band");
    expect(
      getOrgPeerHoverMessage({
        isLoading: false,
        summary: {
          benchmarkSource: "market",
          bandLow: 168_000,
          bandHigh: 216_000,
          matchingEmployeeCount: 2,
          inBandCount: 0,
        },
      }),
    ).toBe("No active employees in your org are in this band");
    expect(
      getOrgPeerHoverMessage({
        isLoading: false,
        summary: {
          benchmarkSource: "market",
          bandLow: 168_000,
          bandHigh: 216_000,
          matchingEmployeeCount: 2,
          inBandCount: 1,
        },
      }),
    ).toBe("1 employee in your org is in this band");
    expect(
      getOrgPeerHoverMessage({
        isLoading: false,
        summary: {
          benchmarkSource: "market",
          bandLow: 168_000,
          bandHigh: 216_000,
          matchingEmployeeCount: 5,
          inBandCount: 3,
        },
      }),
    ).toBe("3 employees in your org are in this band");
  });

  it("enables org peer hover for every visible benchmark row", () => {
    expect(shouldEnableOrgPeerHover("ic3", "ic3")).toBe(true);
    expect(shouldEnableOrgPeerHover("ic2", "ic3")).toBe(true);
  });

  it("derives a dynamic marker label from the shared target value for each row", () => {
    expect(
      getBenchmarkMarkerLabel(200, {
        p10: 100,
        p25: 150,
        p50: 200,
        p75: 250,
        p90: 300,
      }),
    ).toBe("50");
    expect(
      getBenchmarkMarkerLabel(125, {
        p10: 100,
        p25: 150,
        p50: 200,
        p75: 250,
        p90: 300,
      }),
    ).toBe("18");
    expect(
      getBenchmarkMarkerLabel(260, {
        p10: 100,
        p25: 150,
        p50: 200,
        p75: 250,
        p90: 300,
      }),
    ).toBe("78");
    expect(
      getBenchmarkMarkerLabel(80, {
        p10: 100,
        p25: 150,
        p50: 200,
        p75: 250,
        p90: 300,
      }),
    ).toBe("10");
  });
});
