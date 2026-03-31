/** @vitest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const benchmarkStateMock = vi.hoisted(() => ({
  updateFormField: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  Search: () => React.createElement("svg"),
  ChevronDown: () => React.createElement("svg"),
  ArrowRight: () => React.createElement("svg"),
  Loader2: () => React.createElement("svg"),
  X: () => React.createElement("svg"),
}));

vi.mock("@/lib/benchmarks/benchmark-state", () => ({
  useBenchmarkState: () => ({
    formData: {
      context: "existing" as const,
      roleId: null,
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
    isFormComplete: false,
    isSubmitting: false,
    submissionError: null,
    updateFormField: benchmarkStateMock.updateFormField,
    runBenchmark: vi.fn(),
  }),
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

describe("Benchmark role picker", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(async () => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(BenchmarkForm));
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("opens the role picker modal and lets the user choose a role", async () => {
    const trigger = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Role title"),
    );

    expect(trigger).toBeTruthy();

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain("Choose a role");

    const searchInput = document.body.querySelector(
      'input[placeholder="Search roles or families"]',
    ) as HTMLInputElement | null;
    expect(searchInput).toBeTruthy();

    await act(async () => {
      if (searchInput) {
        searchInput.value = "product";
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    const productManagerButton = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Product Manager"),
    );

    expect(productManagerButton).toBeTruthy();

    await act(async () => {
      productManagerButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(benchmarkStateMock.updateFormField).toHaveBeenCalledWith("roleId", "pm");
  });

  it("filters visible roles by family inside the modal", async () => {
    const trigger = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Role title"),
    );

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const productFilter = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Product",
    );

    expect(productFilter).toBeTruthy();

    await act(async () => {
      productFilter?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.textContent).toContain("Product Manager");
    expect(document.body.textContent).not.toContain("Software Engineer");
  });

  it("renders cleaner role cards without abbreviation badges", async () => {
    const trigger = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Role title"),
    );

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialog = document.body.querySelector('[role="dialog"]');

    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain("Software Engineer");
    expect(dialog?.textContent).not.toContain("SWE");
    expect(dialog?.textContent).not.toContain("FE");
  });
});
