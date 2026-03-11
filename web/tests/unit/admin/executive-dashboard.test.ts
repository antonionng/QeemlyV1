import { describe, expect, it } from "vitest";
import {
  buildExecutiveHeadlineCards,
  getIntegrityFlagTone,
} from "@/lib/admin/executive-dashboard";
import type { ExecutiveInsightsResponse } from "@/lib/admin/executive-insights";

const insights: ExecutiveInsightsResponse = {
  market: {
    summary: {
      benchmarkCount: 320,
      uniqueRoles: 42,
      uniqueLocations: 6,
      uniqueLevels: 5,
      contributorQualifiedRows: 250,
      staleRows: 18,
    },
    topRoles: [],
    topLocations: [],
    topLevels: [],
    sourceMix: [],
    lowDensityRows: [],
  },
  tenantHealth: {
    workspaceCount: 12,
    activeWorkspaceCount: 9,
    employeeCount: 840,
    uploadsLast30Days: 27,
    uploadedBenchmarkRows: 60,
    topWorkspaces: [],
  },
  ops: {
    sources: {
      total: 8,
      enabled: 6,
      degraded: 1,
    },
    jobs24h: {
      total: 14,
      success: 11,
      failed: 1,
      running: 2,
      partial: 0,
    },
    freshness: {
      score: "fresh",
      lastUpdatedAt: "2026-03-10T08:00:00.000Z",
      stalenessHours: 4,
    },
  },
  integrityFlags: [
    {
      id: "low-density-market-rows",
      severity: "warning",
      title: "Some pooled rows are below the contributor threshold",
    },
  ],
};

describe("executive dashboard helpers", () => {
  it("builds balanced headline cards across market, tenant health, and ops", () => {
    expect(buildExecutiveHeadlineCards(insights)).toEqual([
      {
        label: "Market Rows",
        value: "320",
        description: "pooled benchmark rows in the platform market",
        tone: "market",
      },
      {
        label: "Roles Covered",
        value: "42",
        description: "unique roles across the pooled market",
        tone: "market",
      },
      {
        label: "Active Workspaces",
        value: "9",
        description: "tenants with employee, upload, or benchmark activity",
        tone: "positive",
      },
      {
        label: "Employees Tracked",
        value: "840",
        description: "employees contributing to tenant health telemetry",
        tone: "neutral",
      },
      {
        label: "Enabled Sources",
        value: "6",
        description: "ingestion sources currently enabled",
        tone: "positive",
      },
      {
        label: "Integrity Flags",
        value: "1",
        description: "platform conditions requiring operator attention",
        tone: "warning",
      },
    ]);
  });

  it("maps integrity flags onto dashboard-friendly tones", () => {
    expect(getIntegrityFlagTone("warning")).toBe("border-amber-200 bg-amber-50 text-amber-900");
  });
});
