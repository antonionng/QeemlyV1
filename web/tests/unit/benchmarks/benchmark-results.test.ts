/** @vitest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  useBenchmarkStateMock,
  getBenchmarkMock,
  useCompanySettingsMock,
  useSalaryViewMock,
} = vi.hoisted(() => ({
  useBenchmarkStateMock: vi.fn(),
  getBenchmarkMock: vi.fn(),
  useCompanySettingsMock: vi.fn(),
  useSalaryViewMock: vi.fn(),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) =>
    React.createElement("button", props, children),
}));

vi.mock("@/components/ui/benchmark-source-badge", () => ({
  BenchmarkSourceBadge: ({ source }: { source: string }) =>
    React.createElement("span", null, source),
}));

vi.mock("@/lib/benchmarks/benchmark-state", () => ({
  useBenchmarkState: useBenchmarkStateMock,
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

vi.mock("@/lib/benchmarks/role-descriptions", () => ({
  getRoleDescription: () => null,
}));

vi.mock("@/lib/utils/currency", () => ({
  convertCurrency: (value: number) => value,
  monthlyToAnnual: (value: number) => value * 12,
  roundToThousand: (value: number) => value,
  useCurrencyFormatter: () => ({
    defaultCurrency: "AED",
    format: (value: number) => `AED ${value}`,
  }),
}));

import { BenchmarkResults } from "@/components/dashboard/benchmarks/benchmark-results";

const baseBenchmark = {
  roleId: "pm",
  locationId: "riyadh",
  levelId: "ic3",
  currency: "AED" as const,
  percentiles: {
    p10: 10000,
    p25: 12000,
    p50: 14000,
    p75: 16000,
    p90: 18000,
  },
  sampleSize: 0,
  confidence: "Low" as const,
  lastUpdated: "2026-03-12T00:00:00.000Z",
  momChange: 0,
  yoyChange: 0,
  trend: [],
  benchmarkSource: "market" as const,
};

describe("BenchmarkResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBenchmarkStateMock.mockReturnValue({
      clearResult: vi.fn(),
      goToStep: vi.fn(),
      saveCurrentFilter: vi.fn(),
    });
    useCompanySettingsMock.mockReturnValue({
      targetPercentile: 50,
    });
    useSalaryViewMock.mockReturnValue({
      salaryView: "annual",
      setSalaryView: vi.fn(),
    });
    getBenchmarkMock.mockImplementation(async (_roleId: string, _locationId: string, levelId: string) => ({
      ...baseBenchmark,
      levelId,
    }));
  });

  it("loads org peer summaries once per visible row without retriggering forever", async () => {
    let fetchCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        fetchCalls += 1;
        if (fetchCalls > 4) {
          throw new Error(`org peer effect looped unexpectedly (${fetchCalls} fetches)`);
        }

        return {
          ok: true,
          json: async () => ({
            benchmarkSource: "market",
            bandLow: 120000,
            bandHigh: 180000,
            matchingEmployeeCount: 0,
            inBandCount: 0,
          }),
        };
      }),
    );

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(BenchmarkResults, {
          result: {
            formData: {
              context: "existing",
              roleId: "pm",
              levelId: "ic3",
              locationId: "riyadh",
              employmentType: "national",
              currentSalaryLow: null,
              currentSalaryHigh: null,
              industry: "Fintech",
              companySize: "1-50",
              fundingStage: null,
              targetPercentile: 50,
            },
            benchmark: baseBenchmark,
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
            createdAt: new Date("2026-03-12T00:00:00.000Z"),
          },
        }),
      );
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchCalls).toBe(4);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchCalls).toBe(4);

    root.unmount();
    vi.unstubAllGlobals();
  });

  it("skips org peer fetches and tenant phrasing when the workspace has no employee data", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(BenchmarkResults, {
          hasCompanyData: false,
          result: {
            formData: {
              context: "existing",
              roleId: "pm",
              levelId: "ic3",
              locationId: "riyadh",
              employmentType: "national",
              currentSalaryLow: null,
              currentSalaryHigh: null,
              industry: "Fintech",
              companySize: "1-50",
              fundingStage: null,
              targetPercentile: 50,
            },
            benchmark: baseBenchmark,
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
            createdAt: new Date("2026-03-12T00:00:00.000Z"),
          },
        }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Target (P50)");
    expect(container.textContent).not.toContain("Your Target");

    root.unmount();
    vi.unstubAllGlobals();
  });

  it("renders the summary after the table and boxplot rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          benchmarkSource: "market",
          bandLow: 120000,
          bandHigh: 180000,
          matchingEmployeeCount: 0,
          inBandCount: 0,
        }),
      })),
    );

    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(BenchmarkResults, {
          result: {
            formData: {
              context: "existing",
              roleId: "pm",
              levelId: "ic3",
              locationId: "riyadh",
              employmentType: "national",
              currentSalaryLow: null,
              currentSalaryHigh: null,
              industry: "Fintech",
              companySize: "1-50",
              fundingStage: null,
              targetPercentile: 50,
            },
            benchmark: baseBenchmark,
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
            createdAt: new Date("2026-03-12T00:00:00.000Z"),
          },
        }),
      );
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const summarySection = container.querySelector('[data-testid="benchmark-results-summary"]');
    const graphSection = container.querySelector('[data-testid="benchmark-results-boxplot-section"]');
    const tableSection = container.querySelector('[data-testid="benchmark-results-level-table"]');

    expect(tableSection).not.toBeNull();
    expect(graphSection).not.toBeNull();
    expect(summarySection).not.toBeNull();
    expect(tableSection?.compareDocumentPosition(summarySection as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(graphSection?.compareDocumentPosition(summarySection as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    root.unmount();
    vi.unstubAllGlobals();
  });
});
