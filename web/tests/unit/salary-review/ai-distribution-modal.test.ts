/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) =>
    React.createElement("button", props, children),
}));

vi.mock("@/lib/salary-review/workspace-budget", () => ({
  buildSalaryReviewBudgetModel: () => ({
    policyLabel: "Annual budget policy.",
    allocationLabel: "Budget is fully allocated.",
    remainingLabel: "No budget remaining.",
  }),
}));

import { AiDistributionModal } from "@/components/dashboard/salary-review/ai-distribution-modal";

describe("AiDistributionModal", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          generatedAt: "2026-03-31T10:00:00.000Z",
          strategicSummary:
            "Prioritize the most under-market employees first, and keep weaker evidence cases measured until calibration has reviewed them.",
          summary: {
            mode: "assistive",
            budget: 25_000,
            budgetUsed: 25_000,
            budgetRemaining: 0,
            budgetUsedPercentage: 100,
            totalCurrentPayroll: 200_000,
            totalProposedPayroll: 225_000,
            employeesConsidered: 1,
            employeesWithWarnings: 0,
          },
          items: [
            {
              employeeId: "emp-1",
              employeeName: "Ava Stone",
              currentSalary: 200_000,
              proposedIncrease: 25_000,
              proposedSalary: 225_000,
              proposedPercentage: 12.5,
              confidence: 91,
              rationale: ["Market gap: 10.0% vs benchmark midpoint (P50)."],
              aiRationale:
                "Ava is below market and has stronger performance evidence, so the recommendation leans toward a larger corrective move in this cycle.",
              factors: [
                {
                  key: "market_gap",
                  label: "Market Gap",
                  value: "10.0% vs P50",
                  weight: 0.45,
                  impact: "positive",
                },
              ],
              benchmark: {
                provenance: "ingestion",
                sourceSlug: "qeemly_ingestion",
                sourceName: "Qeemly Ingestion",
                matchQuality: "exact",
                matchType: "exact",
                fallbackReason: null,
                freshness: {
                  lastUpdatedAt: "2026-03-01T00:00:00.000Z",
                  confidence: "high",
                },
              },
              warnings: [],
            },
          ],
          warnings: [],
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    container.remove();
    document.body.innerHTML = "";
  });

  it("renders the strategic summary and employee AI rationale", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(AiDistributionModal, {
          isOpen: true,
          onClose: vi.fn(),
          request: {
            mode: "assistive",
            cycle: "annual",
            budgetType: "absolute",
            budgetAbsolute: 25_000,
          },
          onApprove: vi.fn(),
        }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("Prioritize the most under-market employees first");
    expect(document.body.textContent).toContain(
      "Ava is below market and has stronger performance evidence",
    );
    expect(document.body.textContent).toContain("Market Gap: 10.0% vs P50");

    await act(async () => {
      root.unmount();
    });
  });
});
