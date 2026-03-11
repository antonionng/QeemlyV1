import { describe, expect, it } from "vitest";
import {
  buildMarketOverviewCards,
  filterMarketDrilldownRows,
  formatMarketEntityLabel,
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
  it("builds premium headline cards instead of raw operational labels", () => {
    expect(buildMarketOverviewCards(insights)).toEqual([
      {
        label: "Coverage Quality",
        value: "80%",
        description: "960 of 1,200 visible market cohorts meet the contributor threshold.",
        tone: "positive",
      },
      {
        label: "Roles Covered",
        value: "15",
        description: "Active market coverage across the visible Qeemly dataset.",
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
