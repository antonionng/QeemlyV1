// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const inputPanelRenderSpy = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("@/components/dashboard/relocation/input-panel", () => ({
  InputPanel: (props: {
    data: { baseSalary: number };
    onChange: (next: {
      homeCityId: string;
      targetCityId: string;
      baseSalary: number;
      compApproach: "local" | "purchasing-power" | "hybrid";
      hybridCap: number;
      roleId: string;
      levelId: string;
      rentOverride?: number;
    }) => void;
    onRunAnalysis: () => void;
    isAnalysisPending: boolean;
    isAnalyzing: boolean;
  }) =>
    React.createElement(
      "div",
      null,
      React.createElement("div", null, `Salary:${props.data.baseSalary}`),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            props.onChange({
              ...props.data,
              homeCityId: "london",
              targetCityId: "dubai",
              compApproach: "hybrid",
              hybridCap: 110,
              roleId: "swe",
              levelId: "ic3",
              baseSalary: 900000,
            });
          },
        },
        "Change Salary",
      ),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: props.onRunAnalysis,
        },
        "Run analysis",
      ),
      React.createElement(
        "div",
        null,
        props.isAnalysisPending ? "Pending refresh" : "Up to date",
      ),
      React.createElement(
        "div",
        null,
        props.isAnalyzing ? "Analyzing" : "Idle",
      ),
      inputPanelRenderSpy(props.isAnalysisPending),
    ),
}));

vi.mock("@/lib/relocation/calculator", () => ({
  calculateRelocation: () => ({
    homeCity: {
      id: "london",
      name: "London",
      country: "United Kingdom",
      flag: "GB",
      colIndex: 145,
      breakdown: { rent: 12800, transport: 1650, food: 2900, utilities: 900, other: 2200 },
    },
    targetCity: {
      id: "dubai",
      name: "Dubai",
      country: "UAE",
      flag: "AE",
      colIndex: 100,
      breakdown: { rent: 9000, transport: 1100, food: 2200, utilities: 750, other: 1500 },
    },
    colRatio: 0.69,
    baseSalary: 450000,
    purchasingPowerSalary: 310500,
    localMarketSalary: 330000,
    recommendedSalary: 320000,
    recommendedRange: { min: 304000, max: 336000 },
    annualDifference: -52800,
    monthlyDifference: -4400,
    costBreakdown: {
      home: { rent: 12800, transport: 1650, food: 2900, utilities: 900, other: 2200 },
      target: { rent: 9000, transport: 1100, food: 2200, utilities: 750, other: 1500 },
    },
  }),
  formatCurrency: (amount: number, compact?: boolean) => {
    if (compact && amount >= 1000) return `AED ${Math.round(amount / 1000)}K`;
    return `AED ${amount.toLocaleString()}`;
  },
  getApproachExplanation: () =>
    "This approach adjusts for purchasing power but caps the increase.",
}));

vi.mock("@/lib/relocation/col-data", () => ({
  setRelocationCities: vi.fn(),
  getTotalMonthlyCost: (b: Record<string, number>) =>
    Object.values(b).reduce((s, v) => s + v, 0),
}));

import RelocationPage from "@/app/(dashboard)/dashboard/relocation/page";

describe("RelocationPage AI advisory", () => {
  let container: HTMLDivElement;
  let advisoryResponses: Array<{
    deterministicResult: {
      recommendedSalary: number;
      recommendedRange: { min: number; max: number };
    };
    aiAdvisory: {
      recommendationHeadline: string;
      summary: string;
      recommendedSalary: number;
      recommendedRange: { min: number; max: number };
      rationale: string;
      risks: string[];
    };
    recommendedResult: {
      recommendedSalary: number;
      recommendedRange: { min: number; max: number };
    };
  }>;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    inputPanelRenderSpy.mockReset();
    advisoryResponses = [
      {
        deterministicResult: {
          recommendedSalary: 320000,
          recommendedRange: { min: 304000, max: 336000 },
        },
        aiAdvisory: {
          recommendationHeadline: "Qeemly AI Relocation Advisory",
          summary:
            "Use a moderated uplift rather than a full market reset for this move.",
          recommendedSalary: 338000,
          recommendedRange: { min: 325000, max: 352000 },
          rationale:
            "Dubai market pay still supports a premium above pure purchasing-power parity.",
          risks: ["Candidate may compare against Dubai software engineer medians."],
        },
        recommendedResult: {
          recommendedSalary: 338000,
          recommendedRange: { min: 325000, max: 352000 },
        },
      },
      {
        deterministicResult: {
          recommendedSalary: 640000,
          recommendedRange: { min: 608000, max: 672000 },
        },
        aiAdvisory: {
          recommendationHeadline: "Qeemly AI Relocation Advisory",
          summary:
            "The revised salary input supports a materially higher relocation recommendation.",
          recommendedSalary: 701000,
          recommendedRange: { min: 680000, max: 720000 },
          rationale:
            "Higher current pay increases the defensible market-aligned relocation package.",
          risks: ["Budget sensitivity increases at the higher salary anchor."],
        },
        recommendedResult: {
          recommendedSalary: 701000,
          recommendedRange: { min: 680000, max: 720000 },
        },
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/api/relocation/cities")) {
          return Promise.resolve(
            new Response(JSON.stringify({ cities: [] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if (url.includes("/api/relocation/advisory")) {
          return Promise.resolve(
            new Response(
              JSON.stringify(advisoryResponses.shift()),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        return Promise.reject(new Error(`Unhandled fetch: ${url}`));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    container.remove();
  });

  it("shows the AI relocation recommendation as the primary salary recommendation when available", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(RelocationPage));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Qeemly AI Relocation Advisory");
    expect(container.textContent).toContain(
      "Use a moderated uplift rather than a full market reset for this move.",
    );
    expect(container.textContent).toContain("AED 338,000");
    expect(container.textContent).toContain("AED 320,000");
    expect(container.textContent).toContain(
      "Candidate may compare against Dubai software engineer medians.",
    );
  });

  it("waits for run analysis before refreshing figures after inputs change", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(RelocationPage));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("AED 338,000");
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/relocation/advisory"))).toHaveLength(1);

    const buttons = Array.from(container.querySelectorAll("button"));
    const changeSalaryButton = buttons.find((button) => button.textContent === "Change Salary");
    const runAnalysisButton = buttons.find((button) => button.textContent === "Run analysis");

    await act(async () => {
      changeSalaryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Salary:900000");
    expect(container.textContent).toContain("Pending refresh");
    expect(container.textContent).toContain("AED 338,000");
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/relocation/advisory"))).toHaveLength(1);

    await act(async () => {
      runAnalysisButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("AED 701,000");
    expect(container.textContent).toContain(
      "The revised salary input supports a materially higher relocation recommendation.",
    );
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/relocation/advisory"))).toHaveLength(2);
  });

  it("keeps the deterministic recommendation visible when the AI request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/api/relocation/cities")) {
          return Promise.resolve(
            new Response(JSON.stringify({ cities: [] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        if (url.includes("/api/relocation/advisory")) {
          return Promise.resolve(
            new Response(JSON.stringify({ error: "AI unavailable" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        return Promise.reject(new Error(`Unhandled fetch: ${url}`));
      }),
    );

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(RelocationPage));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("AED 320,000");
    expect(container.textContent).not.toContain("Qeemly AI Relocation Advisory");
  });
});
