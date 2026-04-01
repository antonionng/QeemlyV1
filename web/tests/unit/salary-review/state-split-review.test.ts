import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSalaryReviewProposalMock,
  updateSalaryReviewProposalMock,
} = vi.hoisted(() => ({
  createSalaryReviewProposalMock: vi.fn(),
  updateSalaryReviewProposalMock: vi.fn(),
}));

vi.mock("@/lib/salary-review/proposal-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/salary-review/proposal-api")>(
    "@/lib/salary-review/proposal-api"
  );
  return {
    ...actual,
    createSalaryReviewProposal: createSalaryReviewProposalMock,
    updateSalaryReviewProposal: updateSalaryReviewProposalMock,
  };
});

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
    newSalary:
      overrides.newSalary ?? (overrides.baseSalary ?? 100_000) + (overrides.proposedIncrease ?? 0),
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

describe("salary review split setup state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSalaryReview.setState({
      settings: {
        cycle: "annual",
        reviewMode: "department_split",
        allocationMethod: "direct",
        budgetType: "absolute",
        budgetPercentage: 0,
        budgetAbsolute: 30_000,
        effectiveDate: "2026-04-01",
        includeBonus: false,
      },
      employees: [
        makeEmployee({
          id: "eng-1",
          department: "Engineering",
          baseSalary: 100_000,
          proposedIncrease: 5_000,
          proposedPercentage: 5,
          newSalary: 105_000,
        }),
        makeEmployee({
          id: "design-1",
          department: "Design",
          baseSalary: 50_000,
          proposedIncrease: 2_500,
          proposedPercentage: 5,
          newSalary: 52_500,
        }),
      ],
      totalCurrentPayroll: 150_000,
      totalProposedPayroll: 157_500,
      totalIncrease: 7_500,
      budgetUsed: 7_500,
      budgetRemaining: 22_500,
      departmentAllocations: [],
      childCycles: [],
      activeProposal: null,
      proposalItemsByEmployee: {},
      approvalSteps: [],
      proposalNotes: [],
      proposalAuditEvents: [],
      cycles: [],
      approvalQueue: [],
      selectedApprovalProposalId: null,
      selectedApprovalProposal: null,
      selectedApprovalItemsByEmployee: {},
      selectedApprovalSteps: [],
      selectedApprovalNotes: [],
      selectedApprovalAuditEvents: [],
      filters: useSalaryReview.getState().filters,
      visibleColumns: useSalaryReview.getState().visibleColumns,
      workflowByEmployee: {},
      isLoading: false,
      isUsingMockData: false,
      isProposalLoading: false,
      isApprovalQueueLoading: false,
      isApprovalDetailLoading: false,
      draftChanges: {},
    });
  });

  it("builds department allocations from the selected employee population", () => {
    useSalaryReview.getState().syncDepartmentAllocations();

    const allocations = useSalaryReview.getState().departmentAllocations;
    expect(allocations).toHaveLength(2);
    expect(allocations.map((allocation) => allocation.department)).toEqual([
      "Design",
      "Engineering",
    ]);
    expect(allocations.reduce((sum, allocation) => sum + allocation.allocatedBudget, 0)).toBe(30_000);
  });

  it("saves a split review by sending department allocations to the proposal API", async () => {
    useSalaryReview.getState().syncDepartmentAllocations();
    createSalaryReviewProposalMock.mockResolvedValue({
      proposal: {
        id: "master-1",
        workspace_id: "ws-1",
        created_by: "user-1",
        source: "manual",
        review_mode: "department_split",
        review_scope: "master",
        parent_cycle_id: null,
        department: null,
        allocation_method: "direct",
        allocation_status: "approved",
        cycle: "annual",
        budget_type: "absolute",
        budget_percentage: 0,
        budget_absolute: 30_000,
        effective_date: "2026-04-01",
        status: "approved",
        summary: {
          selectedEmployees: 2,
          proposedEmployees: 2,
          totalCurrentPayroll: 150_000,
          totalIncrease: 7_500,
          totalProposedPayroll: 157_500,
          maxIncreasePercentage: 5,
        },
      },
      items: [],
      approvalSteps: [],
      notes: [],
      auditEvents: [],
      departmentAllocations: [],
      childCycles: [],
    });

    await useSalaryReview.getState().saveDraftProposal("manual");

    expect(createSalaryReviewProposalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewMode: "department_split",
        allocationMethod: "direct",
        departmentAllocations: [
          expect.objectContaining({
            department: "Design",
          }),
          expect.objectContaining({
            department: "Engineering",
          }),
        ],
      })
    );
  });
});
