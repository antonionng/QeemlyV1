import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  fetchSalaryReviewProposalDetailMock,
  createSalaryReviewProposalMock,
  updateSalaryReviewProposalMock,
} = vi.hoisted(() => ({
  fetchSalaryReviewProposalDetailMock: vi.fn(),
  createSalaryReviewProposalMock: vi.fn(),
  updateSalaryReviewProposalMock: vi.fn(),
}));

vi.mock("@/lib/salary-review/proposal-api", () => ({
  fetchSalaryReviewProposalDetail: fetchSalaryReviewProposalDetailMock,
  createSalaryReviewProposal: createSalaryReviewProposalMock,
  updateSalaryReviewProposal: updateSalaryReviewProposalMock,
}));

import { useSalaryReview, type ReviewEmployee } from "@/lib/salary-review";

function makeEmployee(overrides: Partial<ReviewEmployee> = {}): ReviewEmployee {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    firstName: overrides.firstName ?? "Test",
    lastName: overrides.lastName ?? "User",
    email: overrides.email ?? "test@example.com",
    department: overrides.department ?? "Engineering",
    role: overrides.role ?? {
      id: "r1",
      title: "Software Engineer",
      family: "Engineering",
      icon: "SWE",
    },
    level: overrides.level ?? { id: "l1", name: "L3", category: "IC" },
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
    baseSalary: overrides.baseSalary ?? 100_000,
    bonus: overrides.bonus,
    equity: overrides.equity,
    totalComp: overrides.totalComp ?? overrides.baseSalary ?? 100_000,
    bandPosition: overrides.bandPosition ?? "in-band",
    bandPercentile: overrides.bandPercentile ?? 50,
    marketComparison: overrides.marketComparison ?? 0,
    hasBenchmark: overrides.hasBenchmark ?? true,
    benchmarkContext: overrides.benchmarkContext,
    hireDate: overrides.hireDate ?? new Date("2020-01-01"),
    lastReviewDate: overrides.lastReviewDate,
    performanceRating: overrides.performanceRating ?? "meets",
    proposedIncrease: overrides.proposedIncrease ?? 0,
    proposedPercentage: overrides.proposedPercentage ?? 0,
    newSalary: overrides.newSalary ?? ((overrides.baseSalary ?? 100_000) + (overrides.proposedIncrease ?? 0)),
    isSelected: overrides.isSelected ?? true,
    changeReason: overrides.changeReason ?? null,
    recommendedLevelId: overrides.recommendedLevelId ?? null,
    recommendedLevelName: overrides.recommendedLevelName ?? null,
    guidance: overrides.guidance,
    avatar: overrides.avatar,
    visaExpiryDate: overrides.visaExpiryDate,
    visaStatus: overrides.visaStatus,
  };
}

describe("salary review department draft state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSalaryReview.setState({
      settings: {
        cycle: "annual",
        reviewMode: "company_wide",
        allocationMethod: "direct",
        budgetType: "absolute",
        budgetPercentage: 0,
        budgetAbsolute: 20_000,
        effectiveDate: "2026-04-01",
        includeBonus: false,
      },
      employees: [
        makeEmployee({
          id: "eng-1",
          department: "Engineering",
          baseSalary: 100_000,
        }),
        makeEmployee({
          id: "design-1",
          department: "Design",
          baseSalary: 90_000,
        }),
      ],
      workflowByEmployee: {},
      totalCurrentPayroll: 190_000,
      totalProposedPayroll: 190_000,
      totalIncrease: 0,
      budgetUsed: 0,
      budgetRemaining: 20_000,
      visibleColumns: useSalaryReview.getState().visibleColumns,
      filters: useSalaryReview.getState().filters,
      isLoading: false,
      isUsingMockData: false,
      cycles: [],
      activeProposal: null,
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

  it("scopes loaded employees to the selected department child cycle", async () => {
    fetchSalaryReviewProposalDetailMock.mockResolvedValue({
      proposal: {
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
      items: [
        {
          id: "item-1",
          cycle_id: "child-1",
          employee_id: "eng-1",
          employee_name: "Test User",
          current_salary: 100_000,
          proposed_increase: 0,
          proposed_salary: 100_000,
          proposed_percentage: 0,
          selected: true,
          reason_summary: "Department draft",
          benchmark_snapshot: {},
          created_at: "2026-03-31T00:00:00.000Z",
          updated_at: "2026-03-31T00:00:00.000Z",
        },
      ],
      approvalSteps: [],
      notes: [],
      auditEvents: [],
      departmentAllocations: [],
      childCycles: [],
    });

    await useSalaryReview.getState().selectCycle("child-1");

    const state = useSalaryReview.getState();
    expect(state.activeProposal?.review_scope).toBe("department");
    expect(state.employees.find((employee) => employee.id === "eng-1")?.isSelected).toBe(true);
    expect(state.employees.find((employee) => employee.id === "design-1")?.isSelected).toBe(false);
  });

  it("updates an existing department child draft instead of creating a new split review", async () => {
    useSalaryReview.setState({
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
          proposedEmployees: 1,
          totalCurrentPayroll: 100_000,
          totalIncrease: 5_000,
          totalProposedPayroll: 105_000,
          maxIncreasePercentage: 5,
        },
        created_at: "2026-03-31T00:00:00.000Z",
        updated_at: "2026-03-31T00:00:00.000Z",
      },
      proposalItemsByEmployee: {
        "eng-1": {
          id: "item-1",
          cycle_id: "child-1",
          employee_id: "eng-1",
          employee_name: "Test User",
          current_salary: 100_000,
          proposed_increase: 5_000,
          proposed_salary: 105_000,
          proposed_percentage: 5,
          selected: true,
          reason_summary: "Department draft",
          benchmark_snapshot: {},
          created_at: "2026-03-31T00:00:00.000Z",
          updated_at: "2026-03-31T00:00:00.000Z",
        },
      },
      employees: [
        makeEmployee({
          id: "eng-1",
          department: "Engineering",
          baseSalary: 100_000,
          proposedIncrease: 5_000,
          proposedPercentage: 5,
          newSalary: 105_000,
          isSelected: true,
        }),
        makeEmployee({
          id: "design-1",
          department: "Design",
          baseSalary: 90_000,
          isSelected: false,
        }),
      ],
    });

    updateSalaryReviewProposalMock.mockResolvedValue({
      proposal: useSalaryReview.getState().activeProposal,
      items: [
        {
          id: "item-1",
          cycle_id: "child-1",
          employee_id: "eng-1",
          employee_name: "Test User",
          current_salary: 100_000,
          proposed_increase: 5_000,
          proposed_salary: 105_000,
          proposed_percentage: 5,
          selected: true,
          reason_summary: "Department draft",
          benchmark_snapshot: {},
          created_at: "2026-03-31T00:00:00.000Z",
          updated_at: "2026-03-31T00:00:00.000Z",
        },
      ],
      approvalSteps: [],
      notes: [],
      auditEvents: [],
      departmentAllocations: [],
      childCycles: [],
    });

    await useSalaryReview.getState().saveDraftProposal("manual");

    expect(updateSalaryReviewProposalMock).toHaveBeenCalledWith(
      "child-1",
      expect.objectContaining({
        items: [
          expect.objectContaining({
            employeeId: "eng-1",
          }),
        ],
      }),
    );
    expect(createSalaryReviewProposalMock).not.toHaveBeenCalled();
  });
});
