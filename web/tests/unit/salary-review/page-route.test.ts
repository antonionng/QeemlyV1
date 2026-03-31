/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  replaceMock,
  pushMock,
  searchParamsMock,
  salaryReviewOverviewPropsMock,
  reviewCycleListPropsMock,
} = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  pushMock: vi.fn(),
  searchParamsMock: { value: "tab=review&filter=outside-band" },
  salaryReviewOverviewPropsMock: vi.fn(),
  reviewCycleListPropsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/dashboard/salary-review",
  useSearchParams: () => new URLSearchParams(searchParamsMock.value),
}));

vi.mock("lucide-react", () => ({
  Calendar: () => React.createElement("svg"),
  RefreshCw: () => React.createElement("svg"),
  Download: () => React.createElement("svg"),
  Upload: () => React.createElement("svg"),
  Loader2: () => React.createElement("svg"),
  Sparkles: () => React.createElement("svg"),
  UserPlus: () => React.createElement("svg"),
  X: () => React.createElement("svg"),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) =>
    React.createElement("button", props, children),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ fullWidth: _fullWidth, ...props }: React.ComponentProps<"input"> & { fullWidth?: boolean }) =>
    React.createElement("input", props),
}));

vi.mock("@/components/dashboard/salary-review", () => ({
  AiDistributionModal: () => React.createElement("div", null, "AiDistributionModal"),
  ApprovalProposalDetail: () => React.createElement("div", null, "ApprovalProposalDetail"),
  ApprovalProposalList: () => React.createElement("div", null, "ApprovalProposalList"),
  ReviewTable: () => React.createElement("div", null, "ReviewTable"),
  ReviewTabs: ({ activeTab, items }: { activeTab: string; items: Array<{ label: string }> }) =>
    React.createElement("div", null, `ReviewTabs:${activeTab}:${items.map((item) => item.label).join("|")}`),
}));

vi.mock("@/components/dashboard/upload", () => ({
  UploadModal: () => React.createElement("div", null, "UploadModal"),
}));

vi.mock("@/components/salary-review", () => ({
  SalaryReviewOverview: (props: { actionLabel: string; initialQueryState: { bandFilter: string } }) => {
    salaryReviewOverviewPropsMock(props);
    return React.createElement(
      "div",
      null,
      `SalaryReviewOverview:${props.actionLabel}:${props.initialQueryState.bandFilter}`,
    );
  },
  ReviewCycleListCard: (props: {
    cycles: Array<{ id: string }>;
    onSelectCycle: (proposalId: string) => void;
  }) => {
    reviewCycleListPropsMock(props);
    return React.createElement(
      "button",
      {
        type: "button",
        onClick: () => props.onSelectCycle(props.cycles[0]?.id ?? "proposal-1"),
      },
      "Open Draft Cycle",
    );
  },
}));

vi.mock("@/components/dashboard/salary-review/review-action-cards", () => ({
  ReviewActionCards: () => React.createElement("div", null, "ReviewActionCards"),
}));

vi.mock("@/components/dashboard/salary-review/review-data-health", () => ({
  ReviewDataHealth: () => React.createElement("div", null, "ReviewDataHealth"),
}));

vi.mock("@/components/dashboard/salary-review/review-summary-hero", () => ({
  ReviewSummaryHero: () => React.createElement("div", null, "ReviewSummaryHero"),
}));

vi.mock("@/components/dashboard/salary-review/review-watchouts", () => ({
  ReviewWatchouts: () => React.createElement("div", null, "ReviewWatchouts"),
}));

vi.mock("@/app/(dashboard)/dashboard/salary-review/actions", () => ({
  createEmployee: vi.fn(),
}));

vi.mock("@/lib/salary-view-store", () => ({
  useSalaryView: () => ({
    salaryView: "annual",
    setSalaryView: vi.fn(),
  }),
  applyViewMode: (value: number) => value,
}));

vi.mock("@/lib/benchmarks/trust", () => ({
  summarizeBenchmarkTrust: () => ({
    benchmarkedEmployees: 1,
  }),
}));

vi.mock("@/lib/salary-review/export", () => ({
  buildSalaryReviewCsv: () => "employee_id\n1",
}));

vi.mock("@/lib/salary-review/insights", () => ({
  buildSalaryReviewInsightModel: () => ({
    summary: {
      selectedEmployees: 1,
      coveredEmployees: 1,
      totalEmployees: 1,
      belowBandEmployees: 0,
      proposedEmployees: 0,
      benchmarkTrustLabel: "High confidence",
    },
    watchouts: [],
  }),
}));

vi.mock("@/lib/salary-review/workspace-budget", () => ({
  buildSalaryReviewBudgetModel: () => ({
    usageLabel: "Usage",
    policyLabel: "Policy",
    allocationLabel: "Allocation",
    remainingLabel: "Remaining",
    applicationLabel: "Apply",
    effectiveDateLabel: "1 Apr 2026",
    totalBudget: 0,
  }),
}));

vi.mock("@/lib/salary-review/approval-center", () => ({
  canAddApprovalNote: () => false,
  canTakeApprovalAction: () => false,
}));

vi.mock("@/lib/salary-review", async () => {
  const actual = await vi.importActual<typeof import("@/lib/salary-review")>("@/lib/salary-review");

  return {
    ...actual,
    useSalaryReview: () => ({
      settings: {
        cycle: "annual",
        budgetType: "percentage",
        budgetPercentage: 5,
        budgetAbsolute: 0,
        effectiveDate: "2026-04-01",
      },
      employees: [
        {
          id: "emp-1",
          firstName: "Ava",
          lastName: "Stone",
          department: "Engineering",
          role: { id: "role-1", title: "Software Engineer", family: "Engineering", icon: "SWE" },
          level: { id: "level-1", name: "L3", category: "IC" },
          location: {
            id: "dubai",
            city: "Dubai",
            country: "UAE",
            countryCode: "AE",
            currency: "AED",
            flag: "AE",
          },
          baseSalary: 120000,
          totalComp: 120000,
          bandPosition: "below",
          bandPercentile: 20,
          marketComparison: -5,
          hasBenchmark: true,
          hireDate: new Date("2024-01-01"),
          performanceRating: "meets",
          proposedIncrease: 0,
          proposedPercentage: 0,
          newSalary: 120000,
          isSelected: true,
          status: "active",
          employmentType: "national",
        },
      ],
      isLoading: false,
      totalCurrentPayroll: 120000,
      budgetUsed: 0,
      budgetRemaining: 6000,
      updateSettings: vi.fn(),
      applyDefaultIncreases: vi.fn(),
      applyAiProposal: vi.fn(),
      resetReview: vi.fn(),
      loadEmployeesFromDb: vi.fn().mockResolvedValue(undefined),
      loadCycles: vi.fn().mockResolvedValue(undefined),
      cycles: [
        {
          id: "proposal-1",
          workspace_id: "workspace-1",
          created_by: "user-1",
          source: "manual",
          review_mode: "company_wide",
          review_scope: "company_wide",
          parent_cycle_id: null,
          department: null,
          allocation_method: null,
          allocation_status: null,
          cycle: "annual",
          budget_type: "percentage",
          budget_percentage: 5,
          budget_absolute: 0,
          effective_date: "2026-04-01",
          status: "draft",
          summary: {
            selectedEmployees: 1,
            proposedEmployees: 0,
            totalCurrentPayroll: 120000,
            totalIncrease: 0,
            totalProposedPayroll: 120000,
            maxIncreasePercentage: 0,
          },
          created_at: "2026-03-12T00:00:00.000Z",
          updated_at: "2026-03-12T00:00:00.000Z",
        },
      ],
      activeProposal: null,
      departmentAllocations: [],
      childCycles: [],
      isProposalLoading: false,
      loadLatestProposal: vi.fn().mockResolvedValue(undefined),
      loadApprovalProposalList: vi.fn().mockResolvedValue(undefined),
      selectCycle: vi.fn().mockResolvedValue(undefined),
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
      reviewSelectedApprovalProposal: vi.fn().mockResolvedValue(undefined),
      addApprovalProposalNote: vi.fn().mockResolvedValue(undefined),
      saveDraftProposal: vi.fn().mockResolvedValue(undefined),
      submitActiveProposal: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

import SalaryReviewPage from "@/app/(dashboard)/dashboard/salary-review/page";

describe("SalaryReviewPage", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    replaceMock.mockReset();
    pushMock.mockReset();
    salaryReviewOverviewPropsMock.mockReset();
    reviewCycleListPropsMock.mockReset();
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.restoreAllMocks();
    container.remove();
  });

  it("keeps a legacy drill-down link on the overview workspace", async () => {
    searchParamsMock.value = "tab=review&filter=outside-band";
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(SalaryReviewPage));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(replaceMock).not.toHaveBeenCalledWith("/dashboard/salary-review/new");
    expect(container.textContent).toContain("ReviewTabs:overview:Overview|Drafts|Approvals|History");
    expect(container.textContent).toContain("SalaryReviewOverview:Start Review Cycle:outside-band");

    await act(async () => {
      root.unmount();
    });
  });

  it("still redirects an explicit review-builder tab into the wizard route", async () => {
    searchParamsMock.value = "tab=review";
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(SalaryReviewPage));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(replaceMock).toHaveBeenCalledWith("/dashboard/salary-review/new");

    await act(async () => {
      root.unmount();
    });
  });

  it("opens a selected draft cycle in the wizard route", async () => {
    searchParamsMock.value = "tab=drafts";
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(SalaryReviewPage));
      await Promise.resolve();
      await Promise.resolve();
    });

    const button = container.querySelector("button");
    expect(button?.textContent).toBe("Open Draft Cycle");

    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(pushMock).toHaveBeenCalledWith("/dashboard/salary-review/new?proposalId=proposal-1");

    await act(async () => {
      root.unmount();
    });
  });
});
