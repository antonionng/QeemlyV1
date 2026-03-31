/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("lucide-react", () => ({
  Sparkles: () => React.createElement("svg"),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) =>
    React.createElement("button", props, children),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("div", { className }, children),
}));

vi.mock("@/components/dashboard/salary-review", () => ({
  AiDistributionModal: () => React.createElement("div", null, "AiDistributionModal"),
}));

vi.mock("@/components/salary-review/workspace", () => ({
  BudgetUsageBar: () => React.createElement("div", null, "BudgetUsageBar"),
  ColumnVisibilityPanel: () => React.createElement("div", null, "ColumnVisibilityPanel"),
  PayrollSummaryCards: () => React.createElement("div", null, "PayrollSummaryCards"),
  ReviewSettingsCard: () => React.createElement("div", null, "ReviewSettingsCard"),
  SalaryReviewFilters: ({
    scopeDepartment,
    showEntireTeam,
  }: {
    scopeDepartment?: string | null;
    showEntireTeam?: boolean;
  }) =>
    React.createElement(
      "div",
      null,
      `SalaryReviewFilters:${scopeDepartment ?? "none"}:${showEntireTeam ? "team" : "scoped"}`,
    ),
  SalaryReviewHeader: () => React.createElement("div", null, "SalaryReviewHeader"),
  SalaryReviewTable: ({
    scopeDepartment,
    showEntireTeam,
  }: {
    scopeDepartment?: string | null;
    showEntireTeam?: boolean;
  }) =>
    React.createElement(
      "div",
      null,
      `SalaryReviewTable:${scopeDepartment ?? "none"}:${showEntireTeam ? "team" : "scoped"}`,
    ),
}));

vi.mock("@/lib/salary-review/workspace-budget", () => ({
  buildSalaryReviewBudgetModel: () => ({
    totalBudget: 20_000,
    remainingAmount: 20_000,
  }),
}));

const {
  saveDraftProposalMock,
  submitActiveProposalMock,
  applyAiProposalMock,
  applyDefaultIncreasesMock,
  updateSettingsMock,
  syncDepartmentAllocationsMock,
  updateDepartmentAllocationMock,
} = vi.hoisted(() => ({
  saveDraftProposalMock: vi.fn().mockResolvedValue(undefined),
  submitActiveProposalMock: vi.fn().mockResolvedValue(undefined),
  applyAiProposalMock: vi.fn(),
  applyDefaultIncreasesMock: vi.fn(),
  updateSettingsMock: vi.fn(),
  syncDepartmentAllocationsMock: vi.fn(),
  updateDepartmentAllocationMock: vi.fn(),
}));

vi.mock("@/lib/salary-review", () => ({
  useSalaryReview: () => ({
    settings: {
      cycle: "annual",
      reviewMode: "department_split",
      allocationMethod: "direct",
      budgetType: "absolute",
      budgetPercentage: 0,
      budgetAbsolute: 20_000,
      effectiveDate: "2026-04-01",
      includeBonus: false,
    },
    employees: [
      {
        id: "eng-1",
        firstName: "Ava",
        lastName: "Stone",
        isSelected: true,
        proposedIncrease: 0,
      },
    ],
    activeProposal: {
      id: "child-1",
      workspace_id: "ws-1",
      created_by: "user-1",
      source: "manual",
      review_mode: "department_split",
      review_scope: "department",
      parent_cycle_id: "master-1",
      department: "Engineering",
      allocation_method: "direct",
      allocation_status: "approved",
      cycle: "annual",
      budget_type: "absolute",
      budget_percentage: 0,
      budget_absolute: 20_000,
      effective_date: "2026-04-01",
      status: "draft",
      summary: {
        selectedEmployees: 1,
        proposedEmployees: 0,
        totalCurrentPayroll: 100_000,
        totalIncrease: 0,
        totalProposedPayroll: 100_000,
        maxIncreasePercentage: 0,
      },
      created_at: "2026-03-31T00:00:00.000Z",
      updated_at: "2026-03-31T00:00:00.000Z",
    },
    approvalSteps: [],
    totalCurrentPayroll: 100_000,
    budgetUsed: 0,
    departmentAllocations: [],
    saveDraftProposal: saveDraftProposalMock,
    submitActiveProposal: submitActiveProposalMock,
    applyAiProposal: applyAiProposalMock,
    applyDefaultIncreases: applyDefaultIncreasesMock,
    updateSettings: updateSettingsMock,
    syncDepartmentAllocations: syncDepartmentAllocationsMock,
    updateDepartmentAllocation: updateDepartmentAllocationMock,
  }),
}));

import { SalaryReviewWizard } from "@/components/salary-review/wizard";

describe("SalaryReviewWizard", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.clearAllMocks();
    container.remove();
  });

  it("opens department child proposals in the draft workspace instead of split setup", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(SalaryReviewWizard, {
          onBack: vi.fn(),
          onImport: vi.fn(),
          onExport: vi.fn(),
          onReset: vi.fn(),
          onSubmitSuccess: vi.fn(),
          resumeRequestedProposal: true,
        }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Adjust the salary draft");
    expect(container.textContent).toContain("SalaryReviewFilters:Engineering:scoped");
    expect(container.textContent).toContain("SalaryReviewTable:Engineering:scoped");
    expect(container.textContent).not.toContain("Choose how this salary review should run");

    await act(async () => {
      root.unmount();
    });
  });

  it("keeps the AI recommendation rail stacked until very wide layouts", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(SalaryReviewWizard, {
          onBack: vi.fn(),
          onImport: vi.fn(),
          onExport: vi.fn(),
          onReset: vi.fn(),
          onSubmitSuccess: vi.fn(),
          resumeRequestedProposal: true,
        }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    const draftGrid = Array.from(container.querySelectorAll("div")).find(
      (element) =>
        element.className.includes("grid") &&
        element.textContent?.includes("AI Recommendation Panel"),
    );
    const mainColumn = draftGrid?.children.item(0) as HTMLDivElement | null;

    expect(draftGrid?.className).toContain("2xl:grid-cols-[minmax(0,1fr)_320px]");
    expect(mainColumn?.className).toContain("min-w-0");

    await act(async () => {
      root.unmount();
    });
  });
});
