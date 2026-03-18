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
  isSubmitting: false,
  submissionError: null,
  updateFormField: vi.fn(),
  runBenchmark: vi.fn(),
}));

vi.mock("@/lib/benchmarks/benchmark-state", () => ({
  useBenchmarkState: () => benchmarkStateMock,
  BENCHMARK_LOCATIONS: [
    { id: "dubai", city: "Dubai", country: "UAE", countryCode: "AE", currency: "AED", flag: "AE" },
    { id: "abu-dhabi", city: "Abu Dhabi", country: "UAE", countryCode: "AE", currency: "AED", flag: "AE" },
  ],
}));

vi.mock("@/lib/company", () => ({
  useCompanySettings: () => ({
    industry: "Fintech",
    companySize: "201-500",
    fundingStage: "Seed",
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

describe("BenchmarkForm pill spacing", () => {
  it("gives the employment and percentile selects enough room for the chevron", () => {
    const html = renderToStaticMarkup(React.createElement(BenchmarkForm));

    expect(html).toContain('data-testid="benchmark-employment-type-select"');
    expect(html).toContain('data-testid="benchmark-target-percentile-select"');
    expect(html).toContain('class="bench-pill-select min-w-[128px] pr-11"');
    expect(html).toContain('class="bench-pill-select min-w-[170px] pr-11"');
  });
});
