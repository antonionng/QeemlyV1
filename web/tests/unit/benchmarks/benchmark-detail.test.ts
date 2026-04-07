/** @vitest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  useBenchmarkStateMock,
  useDrilldownPreferencesMock,
  fetchDetailSurfaceMock,
  pushMock,
} = vi.hoisted(() => ({
  useBenchmarkStateMock: vi.fn(),
  useDrilldownPreferencesMock: vi.fn(),
  fetchDetailSurfaceMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) =>
    React.createElement("button", props, children),
}));

vi.mock("@/lib/benchmarks/benchmark-state", () => ({
  useBenchmarkState: useBenchmarkStateMock,
}));

vi.mock("@/lib/benchmarks/drilldown-views", () => ({
  filterDrilldownViewsForCompanyData: (views: Array<{ id: string }>) => views,
  useDrilldownPreferences: useDrilldownPreferencesMock,
  getOrderedEnabledViews: () => [{ id: "ai-insights" }],
}));

vi.mock("@/lib/benchmarks/data-service", () => ({
  fetchDetailSurface: fetchDetailSurfaceMock,
}));

vi.mock("@/components/dashboard/benchmarks/drilldown/view-selector", () => ({
  ViewSelector: () => React.createElement("div", null, "View Selector"),
}));

vi.mock("@/components/dashboard/benchmarks/drilldown/views", () => ({
  LevelTableView: () => React.createElement("div", null, "Level Table"),
  IndustryView: () => React.createElement("div", null, "Industry"),
  CompanySizeView: () => React.createElement("div", null, "Company Size"),
  TrendView: () => React.createElement("div", null, "Trend"),
  GeoView: () => React.createElement("div", null, "Geo"),
  CompMixView: () => React.createElement("div", null, "Comp Mix"),
  SalaryBreakdownView: () => React.createElement("div", null, "Salary Breakdown"),
  AIInsightsView: () => React.createElement("div", null, "AI Insights"),
  OfferBuilderView: () => React.createElement("div", null, "Offer Builder"),
}));

import { BenchmarkDetail } from "@/components/dashboard/benchmarks/benchmark-detail";

const DETAIL_SURFACE = {
  summary: { executiveBriefing: "Shared AI executive market view.", hiringSignal: "Hiring remains competitive for this role.", negotiationPosture: "Keep room for movement at final offer stage." },
  modules: {
    levelTable: { status: "ready", source: "ai", title: "", subtitle: "", data: { rows: [], breakdown: null }, narrative: { summary: "", action: null }, message: null },
    industry: { status: "empty", source: "derived", title: "", subtitle: "", data: { rows: [], fallbackLabel: null }, narrative: { summary: "", action: null }, message: null },
    companySize: { status: "empty", source: "derived", title: "", subtitle: "", data: { rows: [], fallbackLabel: null }, narrative: { summary: "", action: null }, message: null },
    trend: { status: "empty", source: "derived", title: "", subtitle: "", data: { points: [], periodChange: null, currentMedian: null, startMedian: null }, narrative: { summary: "", action: null }, message: null },
    geoComparison: { status: "empty", source: "derived", title: "", subtitle: "", data: { rows: [] }, narrative: { summary: "", action: null }, message: null },
    compMix: { status: "empty", source: "derived", title: "", subtitle: "", data: { breakdown: { basicSalaryPct: 0, housingPct: 0, transportPct: 0, otherAllowancesPct: 0 } }, narrative: { summary: "", action: null }, message: null },
    salaryBreakdown: { status: "empty", source: "derived", title: "", subtitle: "", data: { breakdown: { basicSalaryPct: 0, housingPct: 0, transportPct: 0, otherAllowancesPct: 0 } }, narrative: { summary: "", action: null }, message: null },
    aiInsights: { status: "empty", source: "derived", title: "", subtitle: "", data: { executiveBriefing: "", hiringSignal: "", negotiationPosture: "" }, narrative: { summary: "", action: null }, message: null },
    offerBuilder: { status: "empty", source: "derived", title: "", subtitle: "", data: { breakdown: null, adjacentLevels: [] }, narrative: { summary: "", action: null }, message: null },
  },
};

function makeResult() {
  return {
    formData: {
      context: "existing" as const,
      roleId: "pm",
      levelId: "ic3",
      locationId: "riyadh",
      employmentType: "national" as const,
      currentSalaryLow: null,
      currentSalaryHigh: null,
      industry: "Fintech",
      companySize: "1-50",
      fundingStage: null,
      targetPercentile: 50 as const,
    },
    benchmark: {
      roleId: "pm",
      locationId: "riyadh",
      levelId: "ic3",
      currency: "AED" as const,
      payPeriod: "annual" as const,
      sourcePayPeriod: "annual" as const,
      percentiles: {
        p10: 120000,
        p25: 144000,
        p50: 168000,
        p75: 192000,
        p90: 216000,
      },
      sampleSize: 0,
      confidence: "Low" as const,
      lastUpdated: "2026-03-12T00:00:00.000Z",
      momChange: 0,
      yoyChange: 0,
      trend: [],
      benchmarkSource: "market" as const,
    },
    role: {
      id: "pm",
      title: "Product Manager",
      family: "Product",
      icon: "PM",
    },
    level: {
      id: "ic3",
      name: "Senior (IC3)",
      category: "IC",
    },
    location: {
      id: "riyadh",
      city: "Riyadh",
      country: "Saudi Arabia",
      countryCode: "SA",
      currency: "AED",
      flag: "SA",
    },
    isOverridden: false,
    detailSurface: null,
    detailSurfaceStatus: "idle" as const,
    createdAt: new Date("2026-03-12T00:00:00.000Z"),
  };
}

describe("BenchmarkDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    useBenchmarkStateMock.setState = vi.fn();
    fetchDetailSurfaceMock.mockResolvedValue(null);
    useBenchmarkStateMock.mockReturnValue({
      goToStep: vi.fn(),
    });
    useDrilldownPreferencesMock.mockReturnValue({
      enabledViews: ["ai-insights"],
      viewOrder: ["ai-insights"],
    });
  });

  it("lazy-loads the AI detail briefing when drilldown opens without one", async () => {
    fetchDetailSurfaceMock.mockResolvedValue(DETAIL_SURFACE);

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(BenchmarkDetail, { result: makeResult() }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchDetailSurfaceMock).toHaveBeenCalledWith("pm", "riyadh", "ic3", {
      industry: "Fintech",
      companySize: "1-50",
    });
    expect(useBenchmarkStateMock.setState).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("shows unavailable banner and retries detail loads", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(BenchmarkDetail, {
          result: {
            ...makeResult(),
            detailSurfaceStatus: "unavailable",
          },
        }),
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Some detailed modules are unavailable right now");

    const retryButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Retry Modules",
    );
    expect(retryButton).toBeTruthy();

    await act(async () => {
      retryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(useBenchmarkStateMock.setState).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });
});
