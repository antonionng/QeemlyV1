import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const benchmarkStateMock = vi.hoisted(() => ({
  formData: {
    context: "existing" as const,
    roleId: "software-engineer",
    levelId: "ic3",
    locationId: "dubai",
    employmentType: "national" as const,
    currentSalaryLow: null,
    currentSalaryHigh: null,
    industry: null,
    companySize: null,
    fundingStage: null,
    targetPercentile: null,
  },
  isFormComplete: true,
  updateFormField: vi.fn(),
  runBenchmark: vi.fn(),
}));

vi.mock("@/lib/benchmarks/benchmark-state", () => ({
  useBenchmarkState: () => benchmarkStateMock,
  BENCHMARK_LOCATIONS: [
    { id: "dubai", city: "Dubai", country: "UAE", countryCode: "AE", currency: "AED", flag: "AE" },
    { id: "abu-dhabi", city: "Abu Dhabi", country: "UAE", countryCode: "AE", currency: "AED", flag: "AE" },
    { id: "riyadh", city: "Riyadh", country: "Saudi Arabia", countryCode: "SA", currency: "SAR", flag: "SA" },
  ],
}));

vi.mock("@/lib/company", () => ({
  useCompanySettings: () => ({
    industry: "Fintech",
    companySize: "201-500",
    fundingStage: "Series A",
    targetPercentile: 50,
  }),
  FUNDING_STAGES: ["Seed", "Series A", "Series B"],
}));

vi.mock("@/lib/salary-view-store", () => ({
  useSalaryView: () => ({
    salaryView: "annual",
    setSalaryView: vi.fn(),
  }),
}));

import { BenchmarkForm } from "@/components/dashboard/benchmarks/benchmark-form";
import { FilterSidebar } from "@/components/dashboard/benchmarks/filter-sidebar";

describe("benchmark location selectors", () => {
  it("renders only GCC locations in the benchmark form selector", () => {
    const html = renderToStaticMarkup(React.createElement(BenchmarkForm));

    expect(html).toContain("Dubai, UAE");
    expect(html).toContain("Abu Dhabi, UAE");
    expect(html).toContain("Riyadh, Saudi Arabia");
    expect(html).not.toContain("United Kingdom");
    expect(html).not.toContain("London");
    expect(html).not.toContain("Manchester");
  });

  it("renders only GCC locations in the benchmark filter sidebar", () => {
    const html = renderToStaticMarkup(React.createElement(FilterSidebar));

    expect(html).toContain(">Dubai<");
    expect(html).toContain(">Abu Dhabi<");
    expect(html).toContain(">Riyadh<");
    expect(html).not.toContain("United Kingdom");
    expect(html).not.toContain("London");
    expect(html).not.toContain("Manchester");
  });
});
