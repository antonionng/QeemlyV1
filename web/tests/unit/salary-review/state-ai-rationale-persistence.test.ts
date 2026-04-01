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
    "@/lib/salary-review/proposal-api",
  );
  return {
    ...actual,
    createSalaryReviewProposal: createSalaryReviewProposalMock,
    updateSalaryReviewProposal: updateSalaryReviewProposalMock,
  };
});

import { useSalaryReview, type ReviewEmployee, type SalaryReviewAiPlanResponse } from "@/lib/salary-review";

function makeEmployee(overrides: Partial<ReviewEmployee> = {}): ReviewEmployee {
  return {
    id: overrides.id ?? "emp-1",
    firstName: overrides.firstName ?? "Ava",
    lastName: overrides.lastName ?? "Stone",
    email: overrides.email ?? "ava@example.com",
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
    baseSalary: overrides.baseSalary ?? 200_000,
    bonus: overrides.bonus,
    equity: overrides.equity,
    totalComp: overrides.totalComp ?? overrides.baseSalary ?? 200_000,
    bandPosition: overrides.bandPosition ?? "below",
    bandPercentile: overrides.bandPercentile ?? 40,
    marketComparison: overrides.marketComparison ?? -10,
    hasBenchmark: overrides.hasBenchmark ?? true,
    benchmarkContext: overrides.benchmarkContext,
    hireDate: overrides.hireDate ?? new Date("2021-01-10"),
    lastReviewDate: overrides.lastReviewDate,
    performanceRating: overrides.performanceRating ?? "exceeds",
    proposedIncrease: overrides.proposedIncrease ?? 0,
    proposedPercentage: overrides.proposedPercentage ?? 0,
    newSalary:
      overrides.newSalary ?? (overrides.baseSalary ?? 200_000) + (overrides.proposedIncrease ?? 0),
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

const aiPlan: SalaryReviewAiPlanResponse = {
  generatedAt: "2026-03-31T10:00:00.000Z",
  strategicSummary:
    "Use the strongest increases to close clear market gaps first, then hold back on cases where the evidence is less complete.",
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
        "Ava is below market and has stronger performance evidence, so the recommendation leans toward a more assertive increase in this cycle.",
      factors: [],
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
};

describe("salary review AI rationale persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    createSalaryReviewProposalMock.mockResolvedValue({
      proposal: {
        id: "proposal-1",
        workspace_id: "ws-1",
        created_by: "user-1",
        source: "ai",
        review_mode: "company_wide",
        review_scope: "company_wide",
        parent_cycle_id: null,
        department: null,
        allocation_method: null,
        allocation_status: null,
        cycle: "annual",
        budget_type: "absolute",
        budget_percentage: 0,
        budget_absolute: 25_000,
        effective_date: "2026-04-01",
        status: "draft",
        summary: {
          selectedEmployees: 1,
          proposedEmployees: 1,
          totalCurrentPayroll: 200_000,
          totalIncrease: 25_000,
          totalProposedPayroll: 225_000,
          maxIncreasePercentage: 12.5,
        },
      },
      items: [],
      approvalSteps: [],
      notes: [],
      auditEvents: [],
      departmentAllocations: [],
      childCycles: [],
    });

    useSalaryReview.setState({
      settings: {
        cycle: "annual",
        reviewMode: "company_wide",
        allocationMethod: "direct",
        budgetType: "absolute",
        budgetPercentage: 0,
        budgetAbsolute: 25_000,
        effectiveDate: "2026-04-01",
        includeBonus: false,
      },
      employees: [makeEmployee()],
      totalCurrentPayroll: 200_000,
      totalProposedPayroll: 200_000,
      totalIncrease: 0,
      budgetUsed: 0,
      budgetRemaining: 25_000,
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

  it("stores AI rationale as the draft reason summary after applying an AI plan", async () => {
    useSalaryReview.getState().applyAiProposal(aiPlan);

    expect(useSalaryReview.getState().employees[0].guidance?.message).toContain("below market");

    await useSalaryReview.getState().saveDraftProposal("ai");

    expect(createSalaryReviewProposalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "ai",
        items: [
          expect.objectContaining({
            employeeId: "emp-1",
            reasonSummary:
              "Ava is below market and has stronger performance evidence, so the recommendation leans toward a more assertive increase in this cycle.",
          }),
        ],
      }),
    );
  });
});
