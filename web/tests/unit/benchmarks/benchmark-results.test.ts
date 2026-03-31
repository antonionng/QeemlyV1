/** @vitest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  useBenchmarkStateMock,
  getBenchmarkMock,
  getBenchmarkEnrichedMock,
  useCompanySettingsMock,
  useSalaryViewMock,
} = vi.hoisted(() => ({
  useBenchmarkStateMock: vi.fn(),
  getBenchmarkMock: vi.fn(),
  getBenchmarkEnrichedMock: vi.fn(),
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
  BENCHMARK_LOCATIONS: [
    {
      id: "riyadh",
      city: "Riyadh",
      country: "Saudi Arabia",
      countryCode: "SA",
      currency: "AED",
      flag: "SA",
    },
  ],
  useBenchmarkState: useBenchmarkStateMock,
}));

vi.mock("@/lib/benchmarks/data-service", () => ({
  getBenchmark: getBenchmarkMock,
  getBenchmarkEnriched: getBenchmarkEnrichedMock,
}));

vi.mock("@/lib/company", () => ({
  FUNDING_STAGES: ["Series B", "Series C"],
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
  toBenchmarkDisplayValue: (
    value: number,
    options: { salaryView: "monthly" | "annual"; payPeriod?: "monthly" | "annual" | null },
  ) => {
    const payPeriod = options.payPeriod || "annual";
    const annualValue = payPeriod === "annual" ? value : value * 12;
    return options.salaryView === "annual" ? annualValue : annualValue / 12;
  },
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
};

const aiDetailBriefing = {
  executiveBriefing: "Shared AI executive market view.",
  hiringSignal: "Hiring remains competitive for this role.",
  negotiationPosture: "Keep room for upward movement in late-stage offers.",
  views: {
    levelTable: { summary: "Levels stay tightly clustered until IC4.", action: "Use IC3 to IC4 spacing as your calibration guardrail." },
    aiInsights: { summary: "Position the role slightly above median to stay credible.", action: "Target a package near your selected percentile." },
    trend: { summary: "Momentum is positive over the latest quarters.", action: "Avoid waiting for the market to cool." },
    salaryBreakdown: { summary: "Cash remains the clearest anchor in this market.", action: "Keep the package structure easy to explain." },
    industry: { summary: "Fintech continues to command a premium.", action: "Expect candidate references to skew upward." },
    companySize: { summary: "Mid-sized employers can still compete with focused offers.", action: "Trade complexity for clarity and speed." },
    geoComparison: { summary: "Regional pay gaps remain meaningful across GCC hubs.", action: "Use location differentials carefully when relocating talent." },
    compMix: { summary: "Most value is still concentrated in fixed cash.", action: "Do not overcomplicate allowances without a policy reason." },
    offerBuilder: { summary: "Candidates respond best to a crisp core package.", action: "Lead with certainty, then use flexibility selectively." },
  },
};

describe("BenchmarkResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBenchmarkStateMock.setState = vi.fn();
    useBenchmarkStateMock.mockReturnValue({
      clearResult: vi.fn(),
      goToStep: vi.fn(),
      saveCurrentFilter: vi.fn(),
      formData: {
        roleId: "pm",
        levelId: "ic3",
        locationId: "riyadh",
        employmentType: "national",
        industry: "Fintech",
        companySize: "1-50",
        fundingStage: null,
        targetPercentile: 50,
      },
      updateFormField: vi.fn(),
      runBenchmark: vi.fn(),
      isSubmitting: false,
    });
    useCompanySettingsMock.mockReturnValue({
      targetPercentile: 50,
      industry: "Fintech",
      companySize: "1-50",
      fundingStage: "Series B",
    });
    useSalaryViewMock.mockReturnValue({
      salaryView: "annual",
      setSalaryView: vi.fn(),
    });
    getBenchmarkMock.mockImplementation(async (_roleId: string, _locationId: string, levelId: string) => ({
      ...baseBenchmark,
      levelId,
    }));
    getBenchmarkEnrichedMock.mockImplementation(async (_roleId: string, _locationId: string, levelId: string) => ({
      benchmark: { ...baseBenchmark, levelId },
      aiAdvisory: null,
      aiInsights: null,
      aiDetailBriefing: null,
    }));
  });

  it("preloads the shared detail briefing into benchmark state after the results page renders", async () => {
    getBenchmarkEnrichedMock.mockImplementation(async (_roleId: string, _locationId: string, levelId: string) => ({
      benchmark: { ...baseBenchmark, levelId },
      aiAdvisory: null,
      aiInsights: null,
      aiDetailBriefing,
    }));
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

    expect(useBenchmarkStateMock.setState).toHaveBeenCalled();
    const updaterCalls = (useBenchmarkStateMock.setState as ReturnType<typeof vi.fn>).mock.calls
      .map(([arg]) => arg)
      .filter((arg): arg is (state: { currentResult: Record<string, unknown> | null; recentResults: Array<Record<string, unknown>> }) => unknown => typeof arg === "function");
    const updater = updaterCalls.at(-1);

    expect(updater).toBeTypeOf("function");
    const nextState = updater?.({
      currentResult: {
        role: { id: "pm" },
        level: { id: "ic3" },
        location: { id: "riyadh" },
        createdAt: new Date("2026-03-12T00:00:00.000Z"),
      },
      recentResults: [],
    }) as { currentResult: { aiDetailBriefing: typeof aiDetailBriefing; aiDetailBriefingStatus: string } };

    expect(nextState.currentResult.aiDetailBriefing).toEqual(aiDetailBriefing);
    expect(nextState.currentResult.aiDetailBriefingStatus).toBe("ready");

    root.unmount();
    vi.unstubAllGlobals();
  });

  it("does not re-fetch the enriched benchmark when only AI preload state changes", async () => {
    getBenchmarkEnrichedMock.mockImplementation(async (_roleId: string, _locationId: string, levelId: string) => ({
      benchmark: { ...baseBenchmark, levelId },
      aiAdvisory: null,
      aiInsights: null,
      aiDetailBriefing,
    }));
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
    const sharedFormData = {
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
    };
    const sharedRole = {
      id: "pm",
      title: "Product Manager",
      family: "Product",
      icon: "PM",
    };
    const sharedLevel = {
      id: "ic3",
      name: "Senior (IC3)",
      category: "IC",
    };
    const sharedLocation = {
      id: "riyadh",
      city: "Riyadh",
      country: "Saudi Arabia",
      countryCode: "SA",
      currency: "AED",
      flag: "SA",
    };
    const sharedCreatedAt = new Date("2026-03-12T00:00:00.000Z");
    const makeResult = (status?: "idle" | "loading" | "ready" | "unavailable") => ({
      formData: sharedFormData,
      benchmark: baseBenchmark,
      role: sharedRole,
      level: sharedLevel,
      location: sharedLocation,
      isOverridden: false,
      aiDetailBriefing: status === "ready" ? aiDetailBriefing : null,
      aiDetailBriefingStatus: status,
      createdAt: sharedCreatedAt,
    });

    await act(async () => {
      root.render(React.createElement(BenchmarkResults, { result: makeResult("idle") }));
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      root.render(React.createElement(BenchmarkResults, { result: makeResult("loading") }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getBenchmarkEnrichedMock).toHaveBeenCalledTimes(1);

    root.unmount();
    vi.unstubAllGlobals();
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
    const summaryNode = summarySection as Node;
    const tableNode = tableSection as Node;
    const graphNode = graphSection as Node;
    expect(tableNode.compareDocumentPosition(summaryNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(graphNode.compareDocumentPosition(summaryNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    root.unmount();
    vi.unstubAllGlobals();
  });

  it("renders editable filters directly beneath the top-anchored back action", async () => {
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

    const editableFilters = container.querySelector('[data-testid="benchmark-results-editable-filters"]');
    const backButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Back",
    );
    const editableSelects = Array.from(
      container.querySelectorAll('[data-testid="benchmark-results-editable-filters"] select'),
    );

    expect(editableFilters).not.toBeNull();
    expect(backButton).toBeTruthy();
    const editableFiltersNode = editableFilters as Node;
    const backButtonNode = backButton as Node;
    expect(backButtonNode.compareDocumentPosition(editableFiltersNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.textContent).toContain("Edit Search");
    expect(container.textContent).toContain("Refresh Search");
    expect(editableSelects.length).toBeGreaterThan(0);
    editableSelects.forEach((select) => {
      expect(select.className).toContain("appearance-none");
    });

    root.unmount();
    vi.unstubAllGlobals();
  });

  it("does not multiply annual benchmark values by 12 again in annual view", async () => {
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

    expect(container.textContent).toContain("AED 168000");
    expect(container.textContent).not.toContain("AED 2016000");

    root.unmount();
    vi.unstubAllGlobals();
  });

  it("uses mobile-safe filter and chart wrappers for dense benchmark content", async () => {
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
    });

    expect(container.innerHTML).toContain("md:grid-cols-2");
    expect(container.innerHTML).toContain("2xl:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]");
    expect(container.innerHTML).toContain("data-testid=\"benchmark-results-boxplot-scroller\"");
    expect(container.innerHTML).toContain("min-w-[720px]");

    root.unmount();
    vi.unstubAllGlobals();
  });
});
