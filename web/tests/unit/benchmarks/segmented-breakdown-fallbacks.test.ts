/** @vitest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BenchmarkResult } from "@/lib/benchmarks/benchmark-state";

const {
  getBenchmarkMock,
  useCompanySettingsMock,
  useSalaryViewMock,
} = vi.hoisted(() => ({
  getBenchmarkMock: vi.fn(),
  useCompanySettingsMock: vi.fn(),
  useSalaryViewMock: vi.fn(),
}));

vi.mock("@/lib/benchmarks/data-service", () => ({
  getBenchmark: getBenchmarkMock,
}));

vi.mock("@/lib/company", () => ({
  useCompanySettings: useCompanySettingsMock,
}));

vi.mock("@/lib/salary-view-store", () => ({
  useSalaryView: useSalaryViewMock,
}));

vi.mock("@/lib/utils/currency", () => ({
  formatBenchmarkCompact: (value: number) => `AED ${value}`,
  toBenchmarkDisplayValue: (value: number) => value,
}));

import { CompanySizeView } from "@/components/dashboard/benchmarks/drilldown/views/company-size-view";
import { IndustryView } from "@/components/dashboard/benchmarks/drilldown/views/industry-view";

const baseResult: BenchmarkResult = {
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
    percentiles: {
      p10: 10000,
      p25: 12000,
      p50: 16247,
      p75: 18000,
      p90: 21000,
    },
    sampleSize: 18,
    confidence: "Medium" as const,
    lastUpdated: "2026-03-12T00:00:00.000Z",
    momChange: 0,
    yoyChange: 0,
    trend: [],
    benchmarkSource: "market" as const,
    benchmarkSegmentation: {
      requestedIndustry: "Fintech",
      requestedCompanySize: "1-50",
      matchedIndustry: null,
      matchedCompanySize: null,
      isSegmented: false,
      isFallback: true,
    },
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
    currency: "AED" as const,
    flag: "SA",
  },
  isOverridden: false,
  createdAt: new Date("2026-03-12T00:00:00.000Z"),
};

describe("segmented benchmark breakdown fallbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCompanySettingsMock.mockReturnValue({
      industry: "Fintech",
      companySize: "1-50",
      primaryColor: "#6366f1",
    });
    useSalaryViewMock.mockReturnValue({
      salaryView: "annual",
    });
    getBenchmarkMock.mockResolvedValue(baseResult.benchmark);
  });

  it("shows a broader market row in the industry card when no segmented industry cohort exists", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(IndustryView, { result: baseResult }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Broader market");
    expect(container.textContent).toContain("AED 16247");
    expect(container.textContent).toContain(
      "No industry-specific cohort is available for this role yet. Showing the broader market benchmark instead.",
    );

    root.unmount();
  });

  it("shows a broader market row in the company size card when no segmented size cohort exists", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(CompanySizeView, { result: baseResult }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Broader market");
    expect(container.textContent).toContain("AED 16247");
    expect(container.textContent).toContain(
      "No company-size-specific cohort is available for this role yet. Showing the broader market benchmark instead.",
    );

    root.unmount();
  });
});
