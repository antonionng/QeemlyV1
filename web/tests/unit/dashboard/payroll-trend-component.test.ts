// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("div", { className }, children),
}));

vi.mock("@/lib/salary-view-store", () => ({
  useSalaryView: () => ({ salaryView: "annual" as const }),
  applyViewMode: (value: number) => value,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "responsive-container" }, children),
  AreaChart: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "area-chart" }, children),
  CartesianGrid: () => React.createElement("div"),
  Tooltip: () => React.createElement("div"),
  XAxis: () => React.createElement("div"),
  YAxis: () => React.createElement("div"),
  Area: () => React.createElement("div"),
}));

import { PayrollTrend } from "@/components/dashboard/overview/payroll-trend";
import type { OverviewMetrics } from "@/lib/dashboard/company-overview";

const metrics: OverviewMetrics = {
  totalEmployees: 10,
  activeEmployees: 10,
  benchmarkedEmployees: 10,
  totalPayroll: 12_000_000,
  inBandPercentage: 80,
  outOfBandPercentage: 20,
  avgMarketPosition: 0,
  rolesOutsideBand: 2,
  departmentsOverBenchmark: 1,
  payrollRiskFlags: 1,
  healthScore: 80,
  headcountTrend: [
    { month: "Jan", value: 9 },
    { month: "Feb", value: 10 },
  ],
  payrollTrend: [
    { month: "Jan", value: 11_000_000 },
    { month: "Feb", value: 12_000_000 },
  ],
  riskBreakdown: [],
  bandDistribution: {
    inBand: 80,
    above: 10,
    below: 10,
  },
  bandDistributionCounts: {
    inBand: 8,
    above: 1,
    below: 1,
  },
  headcountChange: 11.1,
  payrollChange: 9.1,
  inBandChange: 0,
  trendMode: "inferred_from_current_roster",
};

describe("PayrollTrend", () => {
  let container: HTMLDivElement;
  let resizeObserverCallback: ResizeObserverCallback | null;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    resizeObserverCallback = null;

    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserverMock {
        constructor(callback: ResizeObserverCallback) {
          resizeObserverCallback = callback;
        }

        observe() {}

        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    container.remove();
  });

  it("waits for measured dimensions before mounting the chart", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(PayrollTrend, { metrics }));
    });

    expect(container.querySelector('[data-testid="responsive-container"]')).toBeNull();
    expect(container.querySelector('[data-testid="payroll-trend-chart-placeholder"]')).not.toBeNull();

    await act(async () => {
      resizeObserverCallback?.(
        [
          {
            contentRect: {
              width: 640,
              height: 280,
              x: 0,
              y: 0,
              top: 0,
              right: 640,
              bottom: 280,
              left: 0,
              toJSON: () => ({}),
            },
          } as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      );
    });

    expect(container.querySelector('[data-testid="payroll-trend-chart-placeholder"]')).toBeNull();
    expect(container.querySelector('[data-testid="responsive-container"]')).not.toBeNull();
  });
});
