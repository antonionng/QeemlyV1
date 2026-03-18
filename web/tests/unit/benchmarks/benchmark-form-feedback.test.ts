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
  submissionError: "No published benchmark matched this role, level, and location yet. Try another selection.",
  updateFormField: vi.fn(),
  runBenchmark: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  Search: () => React.createElement("svg"),
  ChevronDown: () => React.createElement("svg"),
  ArrowRight: () => React.createElement("svg"),
  Loader2: () => React.createElement("svg"),
}));

vi.mock("@/lib/benchmarks/benchmark-state", () => ({
  useBenchmarkState: () => benchmarkStateMock,
  BENCHMARK_LOCATIONS: [
    { id: "dubai", city: "Dubai", country: "UAE", countryCode: "AE", currency: "AED", flag: "AE" },
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

describe("BenchmarkForm feedback", () => {
  it("renders the no-match message when the benchmark search returns no result", () => {
    const html = renderToStaticMarkup(React.createElement(BenchmarkForm));

    expect(html).toContain("No published benchmark matched this role, level, and location yet. Try another selection.");
  });
});
