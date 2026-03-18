// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@/lib/company", () => ({
  useCompanySettings: () => ({
    companyName: "Qeemly",
    isConfigured: true,
  }),
}));

vi.mock("@/lib/company-vs-market", () => ({
  buildCompanyOverviewHeadlineCards: () => [
    {
      label: "Headline",
      value: "42",
      description: "Mock headline",
      tone: "neutral",
    },
  ],
}));

vi.mock("@/components/dashboard/overview", () => ({
  StatCards: () => React.createElement("div", null, "StatCards"),
  DataHealthCard: () => React.createElement("div", null, "DataHealthCard"),
  DepartmentTabs: () => React.createElement("div", null, "DepartmentTabs"),
  HealthScore: () => React.createElement("div", null, "HealthScore"),
  PayrollTrend: () => React.createElement("div", null, "PayrollTrend"),
  BandDistributionChart: ({
    interactions,
    onInteract,
  }: {
    interactions?: { bandDistribution: { belowBand: unknown } };
    onInteract?: (target: unknown) => void;
  }) =>
    React.createElement(
      "button",
      {
        type: "button",
        "data-testid": "band-distribution-chart-action",
        onClick: () => {
          if (interactions?.bandDistribution.belowBand) {
            onInteract?.(interactions.bandDistribution.belowBand);
          }
        },
      },
      "BandDistributionChart",
    ),
  QuickActions: () => React.createElement("div", null, "QuickActions"),
  ShortcutsRow: () => React.createElement("div", null, "ShortcutsRow"),
  AdvisoryPanel: () => React.createElement("div", null, "AdvisoryPanel"),
  OverviewDetailDrawer: () => React.createElement("div", null, "OverviewDetailDrawer"),
}));

import CompanyOverviewPage from "@/app/(dashboard)/dashboard/overview/page";

const snapshot = {
  metrics: {
    totalEmployees: 10,
    activeEmployees: 10,
    benchmarkedEmployees: 8,
    totalPayroll: 1_000_000,
    inBandPercentage: 70,
    outOfBandPercentage: 30,
    avgMarketPosition: 3,
    rolesOutsideBand: 3,
    departmentsOverBenchmark: 1,
    payrollRiskFlags: 2,
    healthScore: 72,
    headcountTrend: [{ month: "2026", value: 10 }],
    payrollTrend: [{ month: "2026", value: 1_000_000 }],
    riskBreakdown: [],
    bandDistribution: {
      inBand: 70,
      above: 20,
      below: 10,
    },
    bandDistributionCounts: {
      inBand: 7,
      above: 2,
      below: 1,
    },
    headcountChange: 0,
    payrollChange: 0,
    inBandChange: 0,
    trendMode: "inferred_from_current_roster",
  },
  departmentSummaries: [],
  benchmarkCoverage: {
    activeEmployees: 10,
    benchmarkedEmployees: 8,
    unbenchmarkedEmployees: 2,
    coveragePct: 80,
  },
  benchmarkTrust: {
    coveragePercent: 80,
    matchRatePercent: 90,
    benchmarkedEmployees: 8,
    totalEmployees: 10,
    confidenceLabel: "High confidence",
    confidenceScore: 80,
    coverageLabel: "80% covered",
    methodologyLabel: "Mock methodology",
    benchmarkSourceLabel: "Market",
  },
  advisoryCandidates: [],
  actions: [],
  insights: [],
  riskSummary: {
    totalAtRisk: 2,
    methodologyLabel: "Mock risk methodology",
    coverageNote: "Mock coverage note",
    departmentRows: [],
  },
  dataHealth: {
    latestBenchmarkFreshness: null,
    lastSync: null,
  },
};

describe("CompanyOverviewPage", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(snapshot), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    container.remove();
  });

  it("keeps hook order stable while transitioning from loading to loaded state", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(CompanyOverviewPage));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Company Overview");
    expect(container.textContent).toContain("StatCards");
    expect(container.textContent).not.toContain("Executive Summary");
  });

  it("routes band distribution drilldowns through the shared overview interaction handler", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(CompanyOverviewPage));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const bandAction = container.querySelector('[data-testid="band-distribution-chart-action"]');
    expect(bandAction).toBeTruthy();

    await act(async () => {
      bandAction?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });

    expect(pushMock).toHaveBeenCalledWith("/dashboard/salary-review?filter=below-band");
  });
});
