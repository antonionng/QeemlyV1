// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("@/components/dashboard/relocation/input-panel", () => ({
  InputPanel: () => React.createElement("div", null, "InputPanel"),
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
    recommendedSalary: 310500,
    recommendedRange: { min: 294975, max: 326025 },
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

describe("RelocationPage", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ cities: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    container.remove();
  });

  it("renders the relocation calculator with shared dashboard page styling", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(RelocationPage));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const heading = container.querySelector("h1");

    expect(heading?.textContent).toBe("Relocation Calculator");
    expect(heading?.className).toContain("page-title");
    expect(container.textContent).toContain(
      "Compare cost of living, salary impact, and recommended compensation for relocation decisions.",
    );
    expect(container.textContent).toContain("COL Index");
    expect(container.textContent).toContain("Monthly estimated cost of living");
    expect(container.textContent).toContain("Recommended Salary Needed");
    expect(container.textContent).toContain("Recommended Range");
    expect(container.textContent).toContain("Export as PDF");
    expect(container.textContent).toContain("current salary");

    expect(container.textContent).not.toContain("Reset Layout");
    expect(container.textContent).not.toContain("MVP");
    expect(container.textContent).not.toContain("How it works");
  });
});
