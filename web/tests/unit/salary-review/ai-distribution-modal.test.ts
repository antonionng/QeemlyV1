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
import { useSalaryReview } from "@/lib/salary-review/state";

describe("AiDistributionModal", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    useSalaryReview.setState({
      employees: [
        {
          id: "emp-1",
          firstName: "Ava",
          lastName: "Stone",
          email: "ava@test.com",
          department: { id: "d1", name: "Engineering" },
          role: { id: "r1", name: "Engineer" },
          level: { id: "l1", name: "Senior" },
          location: { id: "loc1", name: "Dubai", country: "UAE" },
          status: "active",
          employmentType: "full-time",
          baseSalary: 200_000,
          totalComp: 200_000,
          bandPosition: "in-band",
          bandPercentile: 50,
          proposedIncrease: 0,
          proposedPercentage: 0,
          newSalary: 200_000,
          isSelected: true,
          changeReason: null,
          recommendedLevelId: null,
          recommendedLevelName: null,
        },
      ] as ReturnType<typeof useSalaryReview.getState>["employees"],
    });

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

  it("shows the preferences step first when modal opens", async () => {
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
            selectedEmployeeIds: ["emp-1"],
          },
          onApprove: vi.fn(),
        }),
      );
    });

    expect(document.body.textContent).toContain("AI Review Preferences");
    expect(document.body.textContent).toContain("Balanced");
    expect(document.body.textContent).toContain("Retention");
    expect(document.body.textContent).toContain("Generate Scenarios");
    expect(document.body.textContent).toContain("1 of 1 employee included");

    await act(async () => {
      root.unmount();
    });
  });

  it("renders the legacy plan view after generating with a non-scenario response", async () => {
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
            selectedEmployeeIds: ["emp-1"],
          },
          onApprove: vi.fn(),
        }),
      );
    });

    const generateButton = Array.from(document.querySelectorAll("button")).find(
      (btn) => btn.textContent?.includes("Generate Scenarios"),
    );
    expect(generateButton).toBeTruthy();

    await act(async () => {
      generateButton!.click();
      await new Promise((r) => setTimeout(r, 50));
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

  it("renders scenario cards when the response contains scenarios", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          generatedAt: "2026-04-01T10:00:00.000Z",
          scenarios: [
            {
              id: "hold",
              label: "Budget Hold",
              description: "No increases applied.",
              isRecommended: false,
              strategicSummary: "Holding flat preserves cash but increases flight risk.",
              summary: {
                mode: "assistive",
                budget: 0,
                budgetUsed: 0,
                budgetRemaining: 0,
                budgetUsedPercentage: 0,
                totalCurrentPayroll: 200_000,
                totalProposedPayroll: 200_000,
                employeesConsidered: 1,
                employeesWithWarnings: 0,
              },
              items: [],
              warnings: [],
              riskSummary: {
                belowMarketCount: 1,
                belowMarketTotalGap: 25_000,
                retentionRiskCount: 1,
                avgMarketGapPercent: 12.5,
              },
            },
            {
              id: "balanced",
              label: "Balanced",
              description: "Even weight across signals.",
              isRecommended: true,
              strategicSummary: "A balanced approach that addresses the largest gaps.",
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
              items: [],
              warnings: [],
              riskSummary: {
                belowMarketCount: 0,
                belowMarketTotalGap: 0,
                retentionRiskCount: 0,
                avgMarketGapPercent: 0,
              },
            },
          ],
          cohortContext: {
            totalEmployees: 1,
            totalCurrentPayroll: 200_000,
            benchmarkCoverage: 100,
            avgMarketGapPercent: 12.5,
          },
        }),
      }),
    );

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
            selectedEmployeeIds: ["emp-1"],
          },
          onApprove: vi.fn(),
        }),
      );
    });

    const generateButton = Array.from(document.querySelectorAll("button")).find(
      (btn) => btn.textContent?.includes("Generate Scenarios"),
    );

    await act(async () => {
      generateButton!.click();
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(document.body.textContent).toContain("Compare Scenarios");
    expect(document.body.textContent).toContain("Budget Hold");
    expect(document.body.textContent).toContain("Balanced");
    expect(document.body.textContent).toContain("Recommended");
    expect(document.body.textContent).toContain("Holding flat preserves cash but increases flight risk.");

    await act(async () => {
      root.unmount();
    });
  });
});
