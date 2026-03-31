/** @vitest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BenchmarkResult } from "@/lib/benchmarks/benchmark-state";

const {
  useCompanySettingsMock,
  useSalaryViewMock,
  fetchDbEmployeesMock,
  createOfferMock,
  getBenchmarkMock,
  getBenchmarksBatchMock,
} = vi.hoisted(() => ({
  useCompanySettingsMock: vi.fn(),
  useSalaryViewMock: vi.fn(),
  fetchDbEmployeesMock: vi.fn(),
  createOfferMock: vi.fn(),
  getBenchmarkMock: vi.fn(),
  getBenchmarksBatchMock: vi.fn(),
}));

vi.mock("@/lib/company", () => ({
  useCompanySettings: useCompanySettingsMock,
  getCompanyInitials: () => "Q",
}));

vi.mock("@/lib/salary-view-store", () => ({
  useSalaryView: useSalaryViewMock,
}));

vi.mock("@/lib/employees/data-service", () => ({
  fetchDbEmployees: fetchDbEmployeesMock,
}));

vi.mock("@/lib/offers/store", () => ({
  useOffersStore: () => ({
    createOffer: createOfferMock,
  }),
}));

vi.mock("@/lib/benchmarks/data-service", () => ({
  getBenchmark: getBenchmarkMock,
  getBenchmarksBatch: getBenchmarksBatchMock,
  makeBenchmarkLookupKey: ({
    roleId,
    locationId,
    levelId,
    industry,
    companySize,
  }: {
    roleId: string;
    locationId: string;
    levelId: string;
    industry?: string | null;
    companySize?: string | null;
  }) => [roleId, locationId, levelId, industry ?? "", companySize ?? ""].join("::"),
}));

vi.mock("@/lib/utils/currency", () => ({
  formatBenchmarkCompact: (value: number, currency: string) => `${currency} ${value}`,
  formatCurrency: (value: number, currency: string) => `${currency} ${value}`,
  toBenchmarkDisplayValue: (value: number) => value,
  convertCurrency: (value: number) => value,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "responsive-container" }, children),
  AreaChart: ({ children, data }: { children?: React.ReactNode; data?: Array<Record<string, unknown>> }) =>
    React.createElement("div", { "data-testid": "area-chart", "data-chart-data": JSON.stringify(data ?? []) }, children),
  CartesianGrid: () => React.createElement("div", { "data-testid": "cartesian-grid" }),
  Tooltip: () => React.createElement("div", { "data-testid": "chart-tooltip" }),
  XAxis: () => React.createElement("div", { "data-testid": "x-axis" }),
  YAxis: () => React.createElement("div", { "data-testid": "y-axis" }),
  Area: ({ dot, activeDot }: { dot?: unknown; activeDot?: unknown }) =>
    React.createElement("div", {
      "data-testid": "area-series",
      "data-has-dot": dot ? "yes" : "no",
      "data-has-active-dot": activeDot ? "yes" : "no",
    }),
}));

import { CompanySizeView } from "@/components/dashboard/benchmarks/drilldown/views/company-size-view";
import { GeoView } from "@/components/dashboard/benchmarks/drilldown/views/geo-view";
import { IndustryView } from "@/components/dashboard/benchmarks/drilldown/views/industry-view";
import { LevelTableView } from "@/components/dashboard/benchmarks/drilldown/views/level-table-view";
import { OfferBuilderView } from "@/components/dashboard/benchmarks/drilldown/views/offer-builder-view";
import { SalaryBreakdownView } from "@/components/dashboard/benchmarks/drilldown/views/salary-breakdown-view";
import { TrendView } from "@/components/dashboard/benchmarks/drilldown/views/trend-view";

const baseBenchmark = {
  roleId: "swe-fe",
  locationId: "riyadh",
  levelId: "ic4",
  currency: "AED" as const,
  payPeriod: "annual" as const,
  sourcePayPeriod: "annual" as const,
  percentiles: {
    p10: 250000,
    p25: 300000,
    p50: 384000,
    p75: 420000,
    p90: 460000,
  },
  sampleSize: 12,
  confidence: "Medium" as const,
  lastUpdated: "2026-03-31T00:00:00.000Z",
  momChange: 1.2,
  yoyChange: 6.1,
  trend: [],
  benchmarkSource: "market" as const,
};

const aiDetailBriefing = {
  executiveBriefing: "Shared AI view.",
  hiringSignal: "Competitive market.",
  negotiationPosture: "Use a clear package.",
  views: {
    levelTable: {
      summary: "Level guidance",
      action: "Hold the band.",
      packageBreakdown: null,
      compensationMix: null,
      levelBands: [
        { levelId: "ic3", levelName: "Senior (IC3)", p10: 192000, p25: 228000, p50: 276000, p75: 336000, p90: 390000 },
        { levelId: "ic4", levelName: "Staff (IC4)", p10: 264000, p25: 312000, p50: 384000, p75: 456000, p90: 540000 },
        { levelId: "ic5", levelName: "Principal (IC5)", p10: 360000, p25: 432000, p50: 516000, p75: 624000, p90: 744000 },
      ],
      comparisonPoints: null,
      trendPoints: null,
    },
    aiInsights: {
      summary: "Insight guidance",
      action: "Stay above median.",
      packageBreakdown: null,
      compensationMix: null,
      levelBands: null,
      comparisonPoints: null,
      trendPoints: null,
    },
    trend: {
      summary: "Trend guidance",
      action: "Move quickly.",
      packageBreakdown: null,
      compensationMix: null,
      levelBands: null,
      comparisonPoints: null,
      trendPoints: [
        { month: "Jan", p25: 300000, p50: 360000, p75: 410000 },
        { month: "Feb", p25: 305000, p50: 372000, p75: 422000 },
        { month: "Mar", p25: 312000, p50: 384000, p75: 436000 },
      ],
    },
    salaryBreakdown: {
      summary: "Breakdown guidance",
      action: "Explain each component.",
      packageBreakdown: {
        basicSalaryPct: 70,
        housingPct: 15,
        transportPct: 10,
        otherAllowancesPct: 5,
      },
      compensationMix: null,
      levelBands: null,
      comparisonPoints: null,
      trendPoints: null,
    },
    industry: {
      summary: "Industry guidance",
      action: "Expect premium asks.",
      packageBreakdown: null,
      compensationMix: null,
      levelBands: null,
      comparisonPoints: [
        { id: "Technology", label: "Technology", median: 410000, currency: "AED", sampleSize: 17, yoyChange: null, relativeValue: 410000 },
        { id: "Fintech", label: "Fintech", median: 438000, currency: "AED", sampleSize: 12, yoyChange: null, relativeValue: 438000 },
        { id: "Banking", label: "Banking", median: 392000, currency: "AED", sampleSize: 10, yoyChange: null, relativeValue: 392000 },
      ],
      trendPoints: null,
    },
    companySize: {
      summary: "Company-size guidance",
      action: "Use clarity.",
      packageBreakdown: null,
      compensationMix: null,
      levelBands: null,
      comparisonPoints: [
        { id: "51-200", label: "51-200", median: 350000, currency: "AED", sampleSize: null, yoyChange: null, relativeValue: 350000 },
        { id: "201-500", label: "201-500", median: 384000, currency: "AED", sampleSize: null, yoyChange: null, relativeValue: 384000 },
        { id: "1001-5000", label: "1001-5000", median: 430000, currency: "AED", sampleSize: null, yoyChange: null, relativeValue: 430000 },
      ],
      trendPoints: null,
    },
    geoComparison: {
      summary: "Geo guidance",
      action: "Watch market gaps.",
      packageBreakdown: null,
      compensationMix: null,
      levelBands: null,
      comparisonPoints: [
        { id: "dubai", label: "Dubai", median: 440000, currency: "AED", sampleSize: 18, yoyChange: 6.5, relativeValue: 440000 },
        { id: "riyadh", label: "Riyadh", median: 384000, currency: "AED", sampleSize: 16, yoyChange: 5.2, relativeValue: 384000 },
        { id: "doha", label: "Doha", median: 395000, currency: "QAR", sampleSize: 10, yoyChange: 4.4, relativeValue: 403000 },
      ],
      trendPoints: null,
    },
    compMix: {
      summary: "Mix guidance",
      action: "Keep the mix market-aligned.",
      packageBreakdown: null,
      compensationMix: {
        basicSalaryPct: 70,
        housingPct: 15,
        transportPct: 8,
        otherAllowancesPct: 7,
      },
      levelBands: null,
      comparisonPoints: null,
      trendPoints: null,
    },
    offerBuilder: {
      summary: "Offer guidance",
      action: "Lead with the strongest cash anchor.",
      packageBreakdown: {
        basicSalaryPct: 72,
        housingPct: 14,
        transportPct: 8,
        otherAllowancesPct: 6,
      },
      compensationMix: null,
      levelBands: [
        { levelId: "ic3", levelName: "Senior (IC3)", p10: 192000, p25: 228000, p50: 276000, p75: 336000, p90: 390000 },
        { levelId: "ic4", levelName: "Staff (IC4)", p10: 264000, p25: 312000, p50: 384000, p75: 456000, p90: 540000 },
        { levelId: "ic5", levelName: "Principal (IC5)", p10: 360000, p25: 432000, p50: 516000, p75: 624000, p90: 744000 },
      ],
      comparisonPoints: null,
      trendPoints: null,
    },
  },
};

function makeResult(): BenchmarkResult {
  return {
    formData: {
      context: "existing",
      roleId: "swe-fe",
      levelId: "ic4",
      locationId: "riyadh",
      employmentType: "national",
      currentSalaryLow: null,
      currentSalaryHigh: null,
      industry: "Technology",
      companySize: "201-500",
      fundingStage: null,
      targetPercentile: 50,
    },
    benchmark: baseBenchmark,
    role: {
      id: "swe-fe",
      title: "Frontend Engineer",
      family: "Engineering",
      icon: "FE",
    },
    level: {
      id: "ic4",
      name: "Staff (IC4)",
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
    aiDetailBriefing,
    aiDetailBriefingStatus: "ready",
    createdAt: new Date("2026-03-31T00:00:00.000Z"),
  };
}

describe("benchmark AI detail numeric views", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;

    useCompanySettingsMock.mockReturnValue({
      targetPercentile: 50,
      companyName: "Qeemly",
      primaryColor: "#6366f1",
      companyLogo: null,
      isConfigured: false,
      industry: "Technology",
      companySize: "201-500",
    });
    useSalaryViewMock.mockReturnValue({
      salaryView: "annual",
      setSalaryView: vi.fn(),
    });
    fetchDbEmployeesMock.mockResolvedValue([]);
    createOfferMock.mockResolvedValue(null);
    getBenchmarkMock.mockResolvedValue(baseBenchmark);
    getBenchmarksBatchMock.mockResolvedValue({});
  });

  it("uses AI level bands for the level table instead of fetching comparison rows", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(LevelTableView, { result: makeResult() }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Senior (IC3)");
    expect(container.textContent).toContain("AED 228k");
    expect(container.textContent).toContain("AED 516k");
    expect(getBenchmarkMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("uses AI package breakdown numbers in salary breakdown instead of the cash-only placeholder", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(SalaryBreakdownView, { result: makeResult() }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Basic Salary");
    expect(container.textContent).toContain("Housing");
    expect(container.textContent).toContain("Transport");
    expect(container.textContent).toContain("Other Allowances");
    expect(container.textContent).toContain("70%");
    expect(container.textContent).not.toContain("Cash Compensation");

    await act(async () => {
      root.unmount();
    });
  });

  it("uses AI adjacent-level anchors in offer builder instead of separate benchmark fetches", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(OfferBuilderView, { result: makeResult() }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Senior (IC3)");
    expect(container.textContent).toContain("Principal (IC5)");
    expect(container.textContent).toContain("AED 228000");
    expect(container.textContent).toContain("AED 744000");
    expect(getBenchmarkMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("uses AI comparison medians for industry and company size panels", async () => {
    const industryContainer = document.createElement("div");
    const industryRoot = createRoot(industryContainer);

    await act(async () => {
      industryRoot.render(React.createElement(IndustryView, { result: makeResult() }));
      await Promise.resolve();
    });

    expect(industryContainer.textContent).toContain("Technology");
    expect(industryContainer.textContent).toContain("AED 410000");
    expect(industryContainer.textContent).toContain("Fintech");
    expect(getBenchmarkMock).not.toHaveBeenCalled();

    await act(async () => {
      industryRoot.unmount();
    });

    const companySizeContainer = document.createElement("div");
    const companySizeRoot = createRoot(companySizeContainer);

    await act(async () => {
      companySizeRoot.render(React.createElement(CompanySizeView, { result: makeResult() }));
      await Promise.resolve();
    });

    expect(companySizeContainer.textContent).toContain("201-500");
    expect(companySizeContainer.textContent).toContain("AED 384000");
    expect(companySizeContainer.textContent).toContain("1001-5000");
    expect(companySizeContainer.textContent).not.toContain("n=0");
    expect(getBenchmarkMock).not.toHaveBeenCalled();

    await act(async () => {
      companySizeRoot.unmount();
    });
  });

  it("uses AI geography medians and trend points for geo and trend views", async () => {
    const geoContainer = document.createElement("div");
    const geoRoot = createRoot(geoContainer);

    await act(async () => {
      geoRoot.render(React.createElement(GeoView, { result: makeResult() }));
      await Promise.resolve();
    });

    expect(geoContainer.textContent).toContain("Dubai");
    expect(geoContainer.textContent).toContain("AED 440000");
    expect(geoContainer.textContent).toContain("+6.5%");
    expect(getBenchmarkMock).not.toHaveBeenCalled();

    await act(async () => {
      geoRoot.unmount();
    });

    const trendContainer = document.createElement("div");
    const trendRoot = createRoot(trendContainer);

    await act(async () => {
      trendRoot.render(React.createElement(TrendView, { result: makeResult() }));
      await Promise.resolve();
    });

    expect(trendContainer.textContent).toContain("Current");
    expect(trendContainer.textContent).toContain("AED 384k");
    expect(trendContainer.textContent).not.toContain("Historical trend points are not available");
    expect(trendContainer.textContent).toContain("Monthly avg: +3.3%");
    expect(trendContainer.textContent).toContain("YoY: +6.7%");
    expect(trendContainer.querySelector('[data-testid="responsive-container"]')).not.toBeNull();
    const areaChart = trendContainer.querySelector('[data-testid="area-chart"]');
    expect(areaChart).not.toBeNull();
    expect(areaChart?.getAttribute("data-chart-data")).toContain("\"month\":\"Jan\"");
    expect(trendContainer.querySelector('[data-testid="area-series"]')?.getAttribute("data-has-dot")).toBe("yes");
    expect(trendContainer.querySelector('[data-testid="area-series"]')?.getAttribute("data-has-active-dot")).toBe("yes");

    await act(async () => {
      trendRoot.unmount();
    });
  });

  it("builds a numeric fallback trend when the AI series is missing", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const resultWithoutAiTrend: BenchmarkResult = {
      ...makeResult(),
      aiDetailBriefing: {
        ...aiDetailBriefing,
        views: {
          ...aiDetailBriefing.views,
          trend: {
            ...aiDetailBriefing.views.trend,
            trendPoints: null,
          },
        },
      },
      benchmark: {
        ...baseBenchmark,
        yoyChange: 8,
        trend: [],
      },
    };

    await act(async () => {
      root.render(React.createElement(TrendView, { result: resultWithoutAiTrend }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Current");
    expect(container.textContent).toContain("AED 384k");
    expect(container.textContent).not.toContain("AED 0");
    expect(container.textContent).not.toContain("Historical trend points are not available");
    expect(container.textContent).toContain("Monthly avg:");
    expect(container.textContent).toContain("YoY:");

    await act(async () => {
      root.unmount();
    });
  });

  it("labels adjacent-level anchors as AI-driven when shared level bands are present", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(OfferBuilderView, { result: makeResult() }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("AI-derived adjacent-level anchors are being used for this market view.");

    await act(async () => {
      root.unmount();
    });
  });

  it("uses batched benchmark lookups when fallback numeric views need live market rows", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const resultWithoutAiComparisons: BenchmarkResult = {
      ...makeResult(),
      aiDetailBriefing: {
        ...aiDetailBriefing,
        views: {
          ...aiDetailBriefing.views,
          levelTable: {
            ...aiDetailBriefing.views.levelTable,
            levelBands: null,
          },
          industry: {
            ...aiDetailBriefing.views.industry,
            comparisonPoints: null,
          },
          companySize: {
            ...aiDetailBriefing.views.companySize,
            comparisonPoints: null,
          },
          geoComparison: {
            ...aiDetailBriefing.views.geoComparison,
            comparisonPoints: null,
          },
          offerBuilder: {
            ...aiDetailBriefing.views.offerBuilder,
            levelBands: null,
          },
        },
      },
    };

    getBenchmarksBatchMock.mockImplementation(async (entries: Array<{ roleId: string; locationId: string; levelId: string; industry?: string | null; companySize?: string | null }>) =>
      Object.fromEntries(
        entries.map((entry) => [
          `${entry.roleId}::${entry.locationId}::${entry.levelId}::${entry.industry ?? ""}::${entry.companySize ?? ""}`,
          {
            ...baseBenchmark,
            locationId: entry.locationId,
            levelId: entry.levelId,
          },
        ]),
      ),
    );

    await act(async () => {
      root.render(
        React.createElement("div", null,
          React.createElement(LevelTableView, { result: resultWithoutAiComparisons }),
          React.createElement(IndustryView, { result: resultWithoutAiComparisons }),
          React.createElement(CompanySizeView, { result: resultWithoutAiComparisons }),
          React.createElement(GeoView, { result: resultWithoutAiComparisons }),
          React.createElement(OfferBuilderView, { result: resultWithoutAiComparisons }),
        ),
      );
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getBenchmarksBatchMock).toHaveBeenCalled();
    expect(getBenchmarkMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });
});
