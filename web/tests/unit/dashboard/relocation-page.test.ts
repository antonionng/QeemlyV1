// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) =>
    React.createElement("button", props, children),
}));

vi.mock("@/components/dashboard/relocation/input-panel", () => ({
  InputPanel: () => React.createElement("div", null, "InputPanel"),
}));

vi.mock("@/components/dashboard/relocation/layout-manager", () => ({
  RelocationLayoutManager: () => React.createElement("div", null, "RelocationLayoutManager"),
}));

vi.mock("@/components/dashboard/relocation/widgets/comparison", () => ({
  ComparisonWidget: () => React.createElement("div", null, "ComparisonWidget"),
}));

vi.mock("@/components/dashboard/relocation/widgets/col-index", () => ({
  ColIndexWidget: () => React.createElement("div", null, "ColIndexWidget"),
}));

vi.mock("@/components/dashboard/relocation/widgets/purchasing-power", () => ({
  PurchasingPowerWidget: () => React.createElement("div", null, "PurchasingPowerWidget"),
}));

vi.mock("@/components/dashboard/relocation/widgets/recommended-range", () => ({
  RecommendedRangeWidget: () => React.createElement("div", null, "RecommendedRangeWidget"),
}));

vi.mock("@/components/dashboard/relocation/widgets/cost-breakdown", () => ({
  CostBreakdownWidget: () => React.createElement("div", null, "CostBreakdownWidget"),
}));

vi.mock("@/components/dashboard/relocation/widgets/summary-export", () => ({
  SummaryExportWidget: () => React.createElement("div", null, "SummaryExportWidget"),
}));

vi.mock("@/lib/relocation/calculator", () => ({
  calculateRelocation: () => ({
    homeCity: {
      id: "dubai",
      name: "Dubai",
      country: "UAE",
      flag: "AE",
      colIndex: 100,
    },
    targetCity: {
      id: "london",
      name: "London",
      country: "United Kingdom",
      flag: "GB",
      colIndex: 145,
    },
    colRatio: 1.45,
    baseSalary: 450000,
    purchasingPowerSalary: 652500,
    recommendedSalary: 652500,
    recommendedRange: { min: 620000, max: 685000 },
    annualDifference: 174600,
    costBreakdown: {
      home: { rent: 1000, transport: 500, food: 800, utilities: 300, other: 400 },
      target: { rent: 1500, transport: 700, food: 900, utilities: 350, other: 500 },
    },
  }),
}));

vi.mock("@/lib/relocation/col-data", () => ({
  setRelocationCities: vi.fn(),
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

  it("uses platform sections instead of the widget dashboard shell", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(RelocationPage));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Decision summary");
    expect(container.textContent).toContain("Key outputs");
    expect(container.textContent).toContain("Share analysis");
    expect(container.textContent).toContain("Relocation strategy workspace");
    expect(container.textContent).toContain("Leadership-ready summary");
    expect(container.textContent).toContain("Calm, decision-ready guidance for every move.");
    expect(container.textContent).not.toContain("Reset Layout");
    expect(container.textContent).not.toContain("How it works");
    expect(container.textContent).not.toContain("MVP");
    expect(container.textContent).not.toContain("Policy guidance");
    expect(container.textContent).not.toContain("Structured for decision quality");
    expect(container.textContent).not.toContain("Build premium, decision-ready relocation recommendations");
    expect(container.textContent).not.toContain("Relocation analysis");
    expect(container.textContent).not.toContain("Source: Workspace relocation dataset");
    expect(container.textContent).not.toContain("Refreshed");
    expect(container.textContent).not.toContain("Base salary");
  });
});
