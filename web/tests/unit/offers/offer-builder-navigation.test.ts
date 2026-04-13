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
  getOrderedEnabledViews: () => [],
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

vi.mock("@/components/dashboard/benchmarks/drilldown/module-state-banner", () => ({
  ModuleStateBanner: () => null,
}));

import { BenchmarkDetail } from "@/components/dashboard/benchmarks/benchmark-detail";

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
      percentiles: { p10: 120000, p25: 144000, p50: 168000, p75: 192000, p90: 216000 },
      sampleSize: 0,
      confidence: "Low" as const,
      lastUpdated: "2026-03-12T00:00:00.000Z",
      momChange: 0,
      yoyChange: 0,
      trend: [],
      benchmarkSource: "market" as const,
    },
    role: { id: "pm", title: "Product Manager", family: "Product", icon: "PM" },
    level: { id: "ic3", name: "Senior (IC3)", category: "IC" },
    location: { id: "riyadh", city: "Riyadh", country: "Saudi Arabia", countryCode: "SA", currency: "AED", flag: "SA" },
    isOverridden: false,
    detailSurface: null,
    detailSurfaceStatus: "idle" as const,
    createdAt: new Date("2026-03-12T00:00:00.000Z"),
  };
}

describe("Offer Builder CTA navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    useBenchmarkStateMock.setState = vi.fn();
    fetchDetailSurfaceMock.mockResolvedValue(null);
    useBenchmarkStateMock.mockReturnValue({ goToStep: vi.fn() });
    useDrilldownPreferencesMock.mockReturnValue({
      enabledViews: [],
      viewOrder: [],
    });
  });

  it("navigates to advised offer builder when Build Advised Offer is clicked", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(BenchmarkDetail, {
          result: makeResult(),
          hasCompanyData: true,
        }),
      );
      await Promise.resolve();
    });

    const advisedCta = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Build Advised Offer"),
    );
    expect(advisedCta).toBeTruthy();

    await act(async () => {
      advisedCta?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/offers/builder?from=current&mode=candidate_advised",
    );

    await act(async () => {
      root.unmount();
    });
  });

  it("navigates to internal brief builder when Build Internal Brief is clicked", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(BenchmarkDetail, {
          result: makeResult(),
          hasCompanyData: true,
        }),
      );
      await Promise.resolve();
    });

    const internalCta = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Build Internal Brief"),
    );
    expect(internalCta).toBeTruthy();

    await act(async () => {
      internalCta?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/offers/builder?from=current&mode=internal",
    );

    await act(async () => {
      root.unmount();
    });
  });

  it("hides both CTAs when hasCompanyData is false", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(BenchmarkDetail, {
          result: makeResult(),
          hasCompanyData: false,
        }),
      );
      await Promise.resolve();
    });

    const advisedCta = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Build Advised Offer"),
    );
    const internalCta = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Build Internal Brief"),
    );
    expect(advisedCta).toBeUndefined();
    expect(internalCta).toBeUndefined();

    await act(async () => {
      root.unmount();
    });
  });
});
