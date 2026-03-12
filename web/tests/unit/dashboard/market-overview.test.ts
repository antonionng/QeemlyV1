import { describe, expect, it } from "vitest";
import {
  buildMarketOverviewCards,
  filterMarketDrilldownRows,
  formatMarketEntityLabel,
  getMarketTrustExplainer,
  getMarketTrustState,
  type MarketOverviewFilters,
} from "@/lib/benchmarks/market-overview";
import type { MarketInsightsResponse } from "@/lib/benchmarks/market-insights";

const insights: MarketInsightsResponse = {
  summary: {
    benchmarkCount: 1200,
    uniqueRoles: 15,
    uniqueLocations: 8,
    uniqueLevels: 10,
    contributorQualifiedRows: 960,
    lowConfidenceRows: 240,
    coverageStrength: "strong",
  },
  freshness: {
    latest: "2026-03-10T00:00:00.000Z",
    staleRows: 48,
    staleThresholdDays: 30,
    freshnessStatus: "mixed",
  },
  hero: {
    title: "Market coverage is broad, but freshness needs attention.",
    summary:
      "The visible Qeemly market dataset covers 15 roles across 8 locations, with strong density in most cohorts and a smaller watchlist of stale rows.",
    recommendedAction: "Review stale cohorts, then drill into pricing for your priority roles.",
  },
  coverage: {
    topRoles: [],
    topLocations: [],
    topLevels: [],
    sourceMix: [],
    lowDensityRows: [],
  },
  drilldowns: {
    rows: [
      {
        roleId: "data-analyst",
        locationId: "abu-dhabi",
        levelId: "ic2",
        currency: "AED",
        p25: 18000,
        p50: 22000,
        p75: 26000,
        contributorCount: 4,
        sampleSize: 24,
        provenance: "blended",
        freshnessAt: "2026-03-10T00:00:00.000Z",
        confidence: "high",
      },
      {
        roleId: "data-analyst",
        locationId: "riyadh",
        levelId: "ic3",
        currency: "SAR",
        p25: 21000,
        p50: 25000,
        p75: 29000,
        contributorCount: 2,
        sampleSize: 8,
        provenance: "employee",
        freshnessAt: "2026-02-10T00:00:00.000Z",
        confidence: "use-caution",
      },
    ],
  },
  workspaceOverlay: {
    count: 12,
    uniqueRoles: 4,
    uniqueLocations: 2,
    sources: ["uploaded"],
  },
  diagnostics: {
    market: {
      readMode: "service",
      clientWarning: null,
      error: null,
      warning: null,
      hasServiceRoleKey: true,
      hasPlatformWorkspaceId: true,
    },
  },
  status: "ready",
};

describe("market overview helpers", () => {
  it("builds customer-facing trust cards for healthy coverage", () => {
    expect(buildMarketOverviewCards(insights)).toEqual([
      {
        label: "Trusted Benchmark Coverage",
        value: "80%",
        description:
          "960 of 1,200 visible market cohorts currently meet Qeemly's minimum contributor requirement for trusted benchmarking.",
        tone: "positive",
      },
      {
        label: "Roles Covered",
        value: "15",
        description: "Visible market role coverage in the current benchmarking view.",
        tone: "market",
      },
      {
        label: "Freshness Watch",
        value: "48",
        description: "Cohorts are older than the 30-day freshness target.",
        tone: "warning",
      },
      {
        label: "Company Overlay",
        value: "12",
        description: "Company pay bands are available as a secondary policy overlay.",
        tone: "overlay",
      },
    ]);
  });

  it("surfaces a safer warning state when no trusted cohorts are visible", () => {
    expect(
      buildMarketOverviewCards({
        ...insights,
        summary: {
          ...insights.summary,
          benchmarkCount: 1200,
          contributorQualifiedRows: 0,
          lowConfidenceRows: 1200,
          coverageStrength: "thin",
        },
      }),
    ).toEqual([
      {
        label: "Trusted Benchmark Coverage",
        value: "No trusted cohorts in view",
        description:
          "Visible market cohorts are below Qeemly's contributor threshold for higher-confidence benchmarking in this view.",
        tone: "warning",
      },
      {
        label: "Roles Covered",
        value: "15",
        description: "Visible market role coverage in the current benchmarking view.",
        tone: "market",
      },
      {
        label: "Freshness Watch",
        value: "48",
        description: "Cohorts are older than the 30-day freshness target.",
        tone: "warning",
      },
      {
        label: "Company Overlay",
        value: "12",
        description: "Company pay bands are available as a secondary policy overlay.",
        tone: "overlay",
      },
    ]);
  });

  it("classifies the current view by trusted benchmark state", () => {
    expect(getMarketTrustState(insights)).toBe("healthy");
    expect(
      getMarketTrustState({
        ...insights,
        summary: {
          ...insights.summary,
          contributorQualifiedRows: 2,
          coverageStrength: "developing",
        },
      }),
    ).toBe("limited");
    expect(
      getMarketTrustState({
        ...insights,
        summary: {
          ...insights.summary,
          contributorQualifiedRows: 0,
          coverageStrength: "thin",
        },
      }),
    ).toBe("untrusted");
  });

  it("explains trusted benchmarks in plain language", () => {
    expect(getMarketTrustExplainer(insights)).toContain(
      "A trusted benchmark is a visible market cohort that meets Qeemly's minimum contributor requirement.",
    );
    expect(
      getMarketTrustExplainer({
        ...insights,
        summary: {
          ...insights.summary,
          contributorQualifiedRows: 0,
          coverageStrength: "thin",
        },
      }),
    ).toContain(
      "Qeemly market coverage is visible in the current view, but none of the cohorts currently clear the contributor threshold for trusted benchmarking.",
    );
  });

  it("humanizes market entities into premium labels", () => {
    expect(formatMarketEntityLabel("data-analyst", "role")).toBe("Data Analyst");
    expect(formatMarketEntityLabel("abu-dhabi", "location")).toBe("Abu Dhabi");
    expect(formatMarketEntityLabel("ic2", "level")).toBe("IC2");
    expect(formatMarketEntityLabel("blended", "provenance")).toBe("Blended Market Data");
  });

  it("filters cohort rows by role, location, and level while preserving order", () => {
    const filters: MarketOverviewFilters = {
      roleId: "data-analyst",
      locationId: "riyadh",
      levelId: "",
    };

    expect(filterMarketDrilldownRows(insights, filters)).toEqual([
      {
        roleId: "data-analyst",
        locationId: "riyadh",
        levelId: "ic3",
        currency: "SAR",
        p25: 21000,
        p50: 25000,
        p75: 29000,
        contributorCount: 2,
        sampleSize: 8,
        provenance: "employee",
        freshnessAt: "2026-02-10T00:00:00.000Z",
        confidence: "use-caution",
      },
    ]);
  });
});
