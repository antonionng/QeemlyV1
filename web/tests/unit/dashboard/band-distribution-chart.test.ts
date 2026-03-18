/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BandDistributionChart } from "@/components/dashboard/overview/band-distribution-chart";
import type { OverviewBenchmarkCoverage, OverviewMetrics } from "@/lib/dashboard/company-overview";
import { buildOverviewInteractionMap } from "@/lib/dashboard/overview-interactions";

const metrics: OverviewMetrics = {
  totalEmployees: 150,
  activeEmployees: 144,
  benchmarkedEmployees: 144,
  totalPayroll: 68_600_000,
  inBandPercentage: 0,
  outOfBandPercentage: 100,
  avgMarketPosition: -12,
  rolesOutsideBand: 144,
  departmentsOverBenchmark: 0,
  payrollRiskFlags: 0,
  healthScore: 20,
  headcountTrend: [],
  payrollTrend: [],
  riskBreakdown: [],
  bandDistribution: {
    inBand: 0,
    above: 0,
    below: 100,
  },
  bandDistributionCounts: {
    inBand: 0,
    above: 0,
    below: 144,
  },
  headcountChange: 0,
  payrollChange: 0,
  inBandChange: 0,
  trendMode: "inferred_from_current_roster",
};

const benchmarkCoverage: OverviewBenchmarkCoverage = {
  activeEmployees: 144,
  benchmarkedEmployees: 144,
  unbenchmarkedEmployees: 0,
  coveragePct: 100,
};

const interactions = buildOverviewInteractionMap({
  metrics,
  departmentSummaries: [],
  benchmarkCoverage,
  benchmarkTrust: {
    coveragePercent: 100,
    matchRatePercent: 100,
    benchmarkedEmployees: 144,
    totalEmployees: 144,
    confidenceLabel: "High confidence",
    confidenceScore: 100,
    coverageLabel: "100% covered",
    methodologyLabel: "Uses matched market benchmarks for covered roles.",
    benchmarkSourceLabel: "Market",
  },
  advisoryCandidates: [],
  actions: [],
  insights: [],
  riskSummary: {
    totalAtRisk: 0,
    methodologyLabel: "Tracks benchmarked employees whose pay sits above market thresholds.",
    coverageNote: "Counts are based on benchmarked employees only.",
    departmentRows: [],
  },
  dataHealth: {
    latestBenchmarkFreshness: null,
    lastSync: null,
  },
});

describe("BandDistributionChart", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("shows hover detail and click drilldowns for rows and donut segments", async () => {
    const onInteract = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(BandDistributionChart as unknown as React.ComponentType<any>, {
          metrics,
          benchmarkCoverage,
          interactions,
          onInteract,
        }),
      );
    });

    const belowBandRow = container.querySelector('[data-testid="band-distribution-below-band-action"]');
    expect(belowBandRow).toBeTruthy();

    await act(async () => {
      belowBandRow?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      await Promise.resolve();
    });

    const tooltip = document.body.querySelector('[role="tooltip"]');
    expect(tooltip?.textContent).toContain("Below Band");
    expect(tooltip?.textContent).toContain("100%");

    const rowHref = belowBandRow?.getAttribute("href");
    belowBandRow?.removeAttribute("href");

    await act(async () => {
      belowBandRow?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true }));
    });

    expect(onInteract).not.toHaveBeenCalled();
    if (rowHref) {
      belowBandRow?.setAttribute("href", rowHref);
    }

    await act(async () => {
      belowBandRow?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });

    expect(onInteract).toHaveBeenCalledWith(interactions.bandDistribution.belowBand);

    const belowBandSegment = container.querySelector(
      '[data-testid="band-distribution-below-band-segment-action"]',
    );
    expect(belowBandSegment).toBeTruthy();

    await act(async () => {
      belowBandSegment?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    });

    expect(onInteract).toHaveBeenLastCalledWith(interactions.bandDistribution.belowBand);

    await act(async () => {
      root.unmount();
    });
  });
});
