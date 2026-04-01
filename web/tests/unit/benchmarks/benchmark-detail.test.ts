/** @vitest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  useBenchmarkStateMock,
  useDrilldownPreferencesMock,
  fetchAiBriefingMock,
} = vi.hoisted(() => ({
  useBenchmarkStateMock: vi.fn(),
  useDrilldownPreferencesMock: vi.fn(),
  fetchAiBriefingMock: vi.fn(),
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
  fetchAiBriefing: fetchAiBriefingMock,
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

const DETAIL_BRIEFING = {
  executiveBriefing: "Shared AI executive market view.",
  hiringSignal: "Hiring remains competitive for this role.",
  negotiationPosture: "Keep room for movement at final offer stage.",
  views: {
    levelTable: { summary: "Level spacing remains healthy through IC4.", action: "Use the selected band as the anchor." },
    aiInsights: { summary: "Above-median positioning will improve close rates.", action: "Stay disciplined around the target percentile." },
    trend: { summary: "Momentum remains positive in the latest data window.", action: "Avoid assuming near-term cooling." },
    salaryBreakdown: { summary: "Candidates react best to a clear cash-led package.", action: "Keep allowances easy to explain." },
    industry: { summary: "Fintech keeps a persistent premium in this market.", action: "Expect comp references above general market norms." },
    companySize: { summary: "Structured mid-market bands are still competitive.", action: "Use policy clarity as a differentiator." },
    geoComparison: { summary: "Regional market gaps remain meaningful.", action: "Benchmark relocation cases separately." },
    compMix: { summary: "Most value is concentrated in fixed cash.", action: "Avoid unnecessary package complexity." },
    offerBuilder: { summary: "A decisive first offer still matters.", action: "Hold a small negotiation buffer in reserve." },
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
    aiDetailBriefing: null,
    aiDetailBriefingStatus: "idle" as const,
    createdAt: new Date("2026-03-12T00:00:00.000Z"),
  };
}

describe("BenchmarkDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    useBenchmarkStateMock.setState = vi.fn();
    useBenchmarkStateMock.mockReturnValue({
      goToStep: vi.fn(),
    });
    useDrilldownPreferencesMock.mockReturnValue({
      enabledViews: ["ai-insights"],
      viewOrder: ["ai-insights"],
    });
  });

  it("lazy-loads the AI detail briefing when drilldown opens without one", async () => {
    fetchAiBriefingMock.mockResolvedValue(DETAIL_BRIEFING);

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(BenchmarkDetail, { result: makeResult() }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchAiBriefingMock).toHaveBeenCalledWith("pm", "riyadh", "ic3", {
      industry: "Fintech",
      companySize: "1-50",
    });
    expect(useBenchmarkStateMock.setState).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });
});
