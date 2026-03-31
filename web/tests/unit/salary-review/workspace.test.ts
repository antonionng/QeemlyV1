/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ReviewCycleListCard,
  SalaryReviewFilters,
  SalaryReviewOverview,
  SalaryReviewTable,
} from "@/components/salary-review/workspace";
import { useSalaryReview, type ReviewEmployee } from "@/lib/salary-review";
import type { SalaryReviewProposalRecord } from "@/lib/salary-review/proposal-types";
import type { SalaryReviewQueryState } from "@/lib/salary-review/url-state";

vi.mock("lucide-react", () => ({
  Calendar: () => React.createElement("svg"),
  ChevronDown: () => React.createElement("svg"),
  Download: () => React.createElement("svg"),
  Sparkles: () => React.createElement("svg"),
  Search: () => React.createElement("svg"),
  Settings2: () => React.createElement("svg"),
  TrendingUp: () => React.createElement("svg"),
  Upload: () => React.createElement("svg"),
  RotateCcw: () => React.createElement("svg"),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) =>
    React.createElement("button", props, children),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("div", { className }, children),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ fullWidth: _fullWidth, ...props }: React.ComponentProps<"input"> & { fullWidth?: boolean }) =>
    React.createElement("input", props),
}));

vi.mock("@/lib/benchmarks/trust", () => ({
  buildBenchmarkTrustLabels: () => ({
    sourceLabel: "Market",
    matchLabel: "Exact match",
    confidenceLabel: "High confidence",
  }),
}));

vi.mock("@/components/dashboard/salary-review/employee-detail-panel", () => ({
  EmployeeDetailPanel: ({
    employee,
    onClose: _onClose,
  }: {
    employee: { firstName: string; lastName: string };
    onClose: () => void;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "employee-detail-panel" },
      `AI detail for ${employee.firstName} ${employee.lastName}`,
    ),
}));

function makeEmployee(overrides: Partial<ReviewEmployee> = {}): ReviewEmployee {
  return {
    id: overrides.id ?? "emp-1",
    firstName: overrides.firstName ?? "Ava",
    lastName: overrides.lastName ?? "Stone",
    email: overrides.email ?? "ava@example.com",
    department: overrides.department ?? "Engineering",
    role: overrides.role ?? {
      id: "role-1",
      title: "Software Engineer",
      family: "Engineering",
      icon: "SWE",
    },
    level: overrides.level ?? { id: "level-1", name: "L3", category: "IC" },
    location: overrides.location ?? {
      id: "dubai",
      city: "Dubai",
      country: "UAE",
      countryCode: "AE",
      currency: "AED",
      flag: "AE",
    },
    status: overrides.status ?? "active",
    employmentType: overrides.employmentType ?? "national",
    baseSalary: overrides.baseSalary ?? 120_000,
    bonus: overrides.bonus,
    equity: overrides.equity,
    totalComp: overrides.totalComp ?? overrides.baseSalary ?? 120_000,
    bandPosition: overrides.bandPosition ?? "in-band",
    bandPercentile: overrides.bandPercentile ?? 50,
    marketComparison: overrides.marketComparison ?? 0,
    hasBenchmark: overrides.hasBenchmark ?? true,
    benchmarkContext: overrides.benchmarkContext,
    hireDate: overrides.hireDate ?? new Date("2023-01-01"),
    lastReviewDate: overrides.lastReviewDate,
    performanceRating: overrides.performanceRating ?? "meets",
    proposedIncrease: overrides.proposedIncrease ?? 0,
    proposedPercentage: overrides.proposedPercentage ?? 0,
    newSalary:
      overrides.newSalary ?? (overrides.baseSalary ?? 120_000) + (overrides.proposedIncrease ?? 0),
    isSelected: overrides.isSelected ?? true,
    guidance: overrides.guidance,
    avatar: overrides.avatar,
    visaExpiryDate: overrides.visaExpiryDate,
    visaStatus: overrides.visaStatus,
  };
}

function makeCycle(overrides: Partial<SalaryReviewProposalRecord> = {}): SalaryReviewProposalRecord {
  return {
    id: overrides.id ?? "proposal-1",
    workspace_id: overrides.workspace_id ?? "workspace-1",
    created_by: overrides.created_by ?? "user-1",
    source: overrides.source ?? "manual",
    review_mode: overrides.review_mode ?? "company_wide",
    review_scope: overrides.review_scope ?? "company_wide",
    parent_cycle_id: overrides.parent_cycle_id ?? null,
    department: overrides.department ?? null,
    allocation_method: overrides.allocation_method ?? null,
    allocation_status: overrides.allocation_status ?? null,
    cycle: overrides.cycle ?? "annual",
    budget_type: overrides.budget_type ?? "percentage",
    budget_percentage: overrides.budget_percentage ?? 5,
    budget_absolute: overrides.budget_absolute ?? 0,
    effective_date: overrides.effective_date ?? "2026-04-01",
    status: overrides.status ?? "draft",
    summary: overrides.summary ?? {
      selectedEmployees: 1,
      proposedEmployees: 0,
      totalCurrentPayroll: 120_000,
      totalIncrease: 0,
      totalProposedPayroll: 120_000,
      maxIncreasePercentage: 0,
    },
    created_at: overrides.created_at ?? "2026-03-17T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-03-17T00:00:00.000Z",
  };
}

describe("SalaryReviewOverview", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    useSalaryReview.setState({
      settings: {
        cycle: "annual",
        reviewMode: "company_wide",
        allocationMethod: "direct",
        budgetType: "percentage",
        budgetPercentage: 5,
        budgetAbsolute: 0,
        effectiveDate: "2026-04-01",
        includeBonus: false,
      },
      employees: [makeEmployee()],
      totalCurrentPayroll: 120_000,
      totalProposedPayroll: 120_000,
      totalIncrease: 0,
      budgetUsed: 0,
      budgetRemaining: 6_000,
      filters: {
        department: "all",
        location: "all",
        pool: "all",
        benchmarkStatus: "all",
        workflowStatus: "all",
        bandFilter: "all",
        performance: "all",
        search: "",
      },
      visibleColumns: ["name", "role", "department", "location", "current", "proposed", "increase", "band", "performance"],
      activeProposal: null,
      cycles: [],
      workflowByEmployee: {},
      isLoading: false,
      isUsingMockData: false,
      departmentAllocations: [],
      childCycles: [],
      proposalItemsByEmployee: {},
      approvalSteps: [],
      proposalNotes: [],
      proposalAuditEvents: [],
      isProposalLoading: false,
      approvalQueue: [],
      selectedApprovalProposalId: null,
      selectedApprovalProposal: null,
      selectedApprovalDepartmentAllocations: [],
      selectedApprovalChildCycles: [],
      selectedApprovalItemsByEmployee: {},
      selectedApprovalSteps: [],
      selectedApprovalNotes: [],
      selectedApprovalAuditEvents: [],
      isApprovalQueueLoading: false,
      isApprovalDetailLoading: false,
      draftChanges: {},
    });
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.restoreAllMocks();
    container.remove();
  });

  it("shows the employee workspace first and keeps review-cycle setup behind an explicit action", async () => {
    const root = createRoot(container);
    const onAiDraft = vi.fn();

    await act(async () => {
      root.render(
        React.createElement(SalaryReviewOverview, {
          cycles: [makeCycle()],
          activeCycle: null,
          actionLabel: "Start Review Cycle",
          onPrimaryAction: vi.fn(),
          onAiDraft,
          onImport: vi.fn(),
          onExport: vi.fn(),
          onReset: vi.fn(),
          onSelectCycle: vi.fn(),
        }),
      );
    });

    expect(container.textContent).toContain("Salary Review");
    expect(container.textContent).toContain("Ava Stone");
    expect(container.textContent).toContain("Start Review Cycle");
    expect(container.textContent).toContain("AI Draft");
    expect(container.textContent).toContain("1 of 1 employees shown");
    expect(container.textContent).not.toContain("Review Settings");

    await act(async () => {
      root.unmount();
    });
  });

  it("shows a subtle filtered employee count when the overview is drilled into a cohort", async () => {
    const root = createRoot(container);

    useSalaryReview.setState({
      employees: [
        makeEmployee({ id: "emp-1", firstName: "Ava", bandPosition: "above" }),
        makeEmployee({ id: "emp-2", firstName: "Lina", bandPosition: "in-band" }),
      ],
      totalCurrentPayroll: 240_000,
      totalProposedPayroll: 240_000,
      budgetRemaining: 12_000,
    });

    const initialQueryState: SalaryReviewQueryState = {
      tab: "overview",
      proposalId: null,
      department: "all",
      location: "all",
      pool: "all",
      benchmarkStatus: "all",
      workflowStatus: "all",
      bandFilter: "above",
      performance: "all",
      search: "",
    };

    await act(async () => {
      root.render(
        React.createElement(SalaryReviewOverview, {
          cycles: [makeCycle()],
          activeCycle: null,
          actionLabel: "Start Review Cycle",
          onPrimaryAction: vi.fn(),
          onAiDraft: vi.fn(),
          onImport: vi.fn(),
          onExport: vi.fn(),
          onReset: vi.fn(),
          onSelectCycle: vi.fn(),
          initialQueryState,
        }),
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("1 of 2 employees shown");

    await act(async () => {
      root.unmount();
    });
  });

  it("opens the AI-capable employee detail panel from the overview table", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(SalaryReviewOverview, {
          cycles: [makeCycle()],
          activeCycle: null,
          actionLabel: "Start Review Cycle",
          onPrimaryAction: vi.fn(),
          onAiDraft: vi.fn(),
          onImport: vi.fn(),
          onExport: vi.fn(),
          onReset: vi.fn(),
          onSelectCycle: vi.fn(),
        }),
      );
    });

    const employeeButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Ava Stone"),
    );

    expect(employeeButton).toBeTruthy();

    await act(async () => {
      employeeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("AI detail for Ava Stone");

    await act(async () => {
      root.unmount();
    });
  });
});

describe("ReviewCycleListCard", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.restoreAllMocks();
    container.remove();
  });

  it("labels department-split drafts by department", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(ReviewCycleListCard, {
          cycles: [
            makeCycle({
              id: "dept-draft-1",
              review_mode: "department_split",
              review_scope: "department",
              department: "Engineering",
              status: "draft",
            }),
          ],
          activeCycleId: null,
          onStartWizard: vi.fn(),
          onSelectCycle: vi.fn(),
        }),
      );
    });

    expect(container.textContent).toContain("Engineering Review");
    expect(container.textContent).not.toContain("Annual Review");

    await act(async () => {
      root.unmount();
    });
  });
});

describe("Department-scoped draft workspace", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    useSalaryReview.setState({
      settings: {
        cycle: "annual",
        reviewMode: "department_split",
        allocationMethod: "direct",
        budgetType: "percentage",
        budgetPercentage: 5,
        budgetAbsolute: 0,
        effectiveDate: "2026-04-01",
        includeBonus: false,
      },
      employees: [
        makeEmployee({ id: "eng-1", firstName: "Ava", department: "Engineering" }),
        makeEmployee({ id: "data-1", firstName: "Lina", department: "Data" }),
      ],
      totalCurrentPayroll: 240_000,
      totalProposedPayroll: 240_000,
      totalIncrease: 0,
      budgetUsed: 0,
      budgetRemaining: 12_000,
      filters: {
        department: "all",
        location: "all",
        pool: "all",
        benchmarkStatus: "all",
        workflowStatus: "all",
        bandFilter: "all",
        performance: "all",
        search: "",
      },
      visibleColumns: ["name", "role", "department", "location", "current", "proposed", "increase", "band", "performance"],
      activeProposal: null,
      cycles: [],
      workflowByEmployee: {},
      isLoading: false,
      isUsingMockData: false,
      departmentAllocations: [],
      childCycles: [],
      proposalItemsByEmployee: {},
      approvalSteps: [],
      proposalNotes: [],
      proposalAuditEvents: [],
      isProposalLoading: false,
      approvalQueue: [],
      selectedApprovalProposalId: null,
      selectedApprovalProposal: null,
      selectedApprovalDepartmentAllocations: [],
      selectedApprovalChildCycles: [],
      selectedApprovalItemsByEmployee: {},
      selectedApprovalSteps: [],
      selectedApprovalNotes: [],
      selectedApprovalAuditEvents: [],
      isApprovalQueueLoading: false,
      isApprovalDetailLoading: false,
      draftChanges: {},
    });
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.restoreAllMocks();
    container.remove();
  });

  it("defaults department drafts to the scoped roster and exposes a compare action", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(SalaryReviewFilters, {
          scopeDepartment: "Engineering",
          showEntireTeam: false,
          onToggleEntireTeam: vi.fn(),
        }),
      );
    });

    expect(container.textContent).toContain("Show Entire Team");
    expect(container.textContent).toContain("1 of 1 employees shown");
    expect(container.textContent).toContain("Engineering roster");

    const departmentSelect = container.querySelector("select");
    expect(departmentSelect?.getAttribute("disabled")).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  it("shows only the scoped department by default and can expand to the full team", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(SalaryReviewTable, {
          onSelectEmployee: vi.fn(),
          scopeDepartment: "Engineering",
          showEntireTeam: false,
        }),
      );
    });

    expect(container.textContent).toContain("Ava Stone");
    expect(container.textContent).not.toContain("Lina Stone");

    await act(async () => {
      root.render(
        React.createElement(SalaryReviewTable, {
          onSelectEmployee: vi.fn(),
          scopeDepartment: "Engineering",
          showEntireTeam: true,
        }),
      );
    });

    expect(container.textContent).toContain("Ava Stone");
    expect(container.textContent).toContain("Lina Stone");

    await act(async () => {
      root.unmount();
    });
  });
});
