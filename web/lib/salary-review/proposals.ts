import {
  buildApprovalChain,
  summarizeProposalDraft,
  type SalaryReviewApprovalStep,
  type SalaryReviewDraftItemInput,
} from "./proposal-workflow";

export type SalaryReviewProposalSource = "manual" | "ai";
export type SalaryReviewMode = "company_wide" | "department_split";
export type SalaryReviewAllocationMethod = "direct" | "finance_approval";

type SalaryReviewDraftItemWithBand = SalaryReviewDraftItemInput & {
  bandPosition?: "below" | "in-band" | "above";
};

export type SalaryReviewDepartmentAllocationInput = {
  department: string;
  allocatedBudget: number;
  selectedEmployeeIds?: string[];
  items?: SalaryReviewDraftItemWithBand[];
};

export type SalaryReviewProposalCreateBody = {
  source?: SalaryReviewProposalSource;
  reviewMode?: SalaryReviewMode;
  allocationMethod?: SalaryReviewAllocationMethod;
  cycle?: "monthly" | "annual";
  budgetType?: "percentage" | "absolute";
  budgetPercentage?: number;
  budgetAbsolute?: number;
  effectiveDate?: string;
  items?: SalaryReviewDraftItemWithBand[];
  departmentAllocations?: SalaryReviewDepartmentAllocationInput[];
};

function summarizeSplitDepartmentAllocations(
  departmentAllocations: Array<{
    items: SalaryReviewDraftItemWithBand[];
  }>
) {
  return departmentAllocations.reduce(
    (totals, allocation) => {
      const summary = summarizeProposalDraft(allocation.items);
      return {
        selectedEmployees: totals.selectedEmployees + summary.selectedEmployees,
        proposedEmployees: totals.proposedEmployees + summary.proposedEmployees,
        totalCurrentPayroll: totals.totalCurrentPayroll + summary.totalCurrentPayroll,
        totalIncrease: totals.totalIncrease + summary.totalIncrease,
        totalProposedPayroll: totals.totalProposedPayroll + summary.totalProposedPayroll,
        maxIncreasePercentage: Math.max(totals.maxIncreasePercentage, summary.maxIncreasePercentage),
      };
    },
    {
      selectedEmployees: 0,
      proposedEmployees: 0,
      totalCurrentPayroll: 0,
      totalIncrease: 0,
      totalProposedPayroll: 0,
      maxIncreasePercentage: 0,
    }
  );
}

function mapDraftItemToInsert(item: SalaryReviewDraftItemWithBand, cycleId: string) {
  return {
    cycle_id: cycleId,
    employee_id: item.employeeId,
    employee_name: item.employeeName,
    selected: item.selected,
    current_salary: item.currentSalary,
    proposed_increase: item.proposedIncrease,
    proposed_salary: item.proposedSalary,
    proposed_percentage: item.proposedPercentage,
    reason_summary: item.reasonSummary,
    change_reason: item.changeReason ?? null,
    recommended_level_id: item.recommendedLevelId ?? null,
    recommended_level_name: item.recommendedLevelName ?? null,
    benchmark_snapshot: {
      ...(item.benchmarkSnapshot ?? {}),
      bandPosition: item.bandPosition ?? null,
    },
  };
}

function buildItemApprovalSteps(items: SalaryReviewDraftItemWithBand[]) {
  const summary = summarizeProposalDraft(items);
  const approvalSteps = buildApprovalChain({
    totalIncrease: summary.totalIncrease,
    maxIncreasePercentage: summary.maxIncreasePercentage,
    hasAboveBandIncreases: items.some((item) => item.bandPosition === "above" && item.selected),
    hasBandUpgradeRecommendations: items.some((item) => item.recommendedLevelId && item.selected),
  });

  return {
    summary,
    approvalSteps,
  };
}

export function validateSalaryReviewProposalCreateBody(body: SalaryReviewProposalCreateBody) {
  const reviewMode = body.reviewMode ?? "company_wide";

  if (body.cycle !== "monthly" && body.cycle !== "annual") {
    return { ok: false as const, error: "cycle must be one of: monthly, annual" };
  }
  if (body.budgetType !== "percentage" && body.budgetType !== "absolute") {
    return { ok: false as const, error: "budgetType must be one of: percentage, absolute" };
  }
  if (!body.effectiveDate?.trim()) {
    return { ok: false as const, error: "effectiveDate is required" };
  }
  if (reviewMode !== "company_wide" && reviewMode !== "department_split") {
    return {
      ok: false as const,
      error: "reviewMode must be one of: company_wide, department_split",
    };
  }

  if (reviewMode === "company_wide") {
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return { ok: false as const, error: "items must contain at least one proposal item" };
    }

    for (const item of body.items) {
      if (!item.employeeId || !item.employeeName) {
        return {
          ok: false as const,
          error: "each proposal item requires employeeId and employeeName",
        };
      }
    }

    return { ok: true as const, value: { ...body, reviewMode } };
  }

  if (body.allocationMethod !== "direct" && body.allocationMethod !== "finance_approval") {
    return {
      ok: false as const,
      error: "allocationMethod must be one of: direct, finance_approval",
    };
  }
  if (!Array.isArray(body.departmentAllocations) || body.departmentAllocations.length === 0) {
    return {
      ok: false as const,
      error: "departmentAllocations must contain at least one department budget",
    };
  }

  for (const allocation of body.departmentAllocations) {
    if (!allocation.department?.trim()) {
      return { ok: false as const, error: "each department allocation requires a department" };
    }
    if (!Number.isFinite(allocation.allocatedBudget) || allocation.allocatedBudget < 0) {
      return {
        ok: false as const,
        error: "each department allocation requires a valid allocatedBudget",
      };
    }
    for (const item of allocation.items ?? []) {
      if (!item.employeeId || !item.employeeName) {
        return {
          ok: false as const,
          error: "each proposal item requires employeeId and employeeName",
        };
      }
    }
  }

  return { ok: true as const, value: { ...body, reviewMode } };
}

export function buildProposalDraftRecords(args: {
  workspaceId: string;
  userId: string;
  body: Required<Pick<SalaryReviewProposalCreateBody, "cycle" | "budgetType" | "effectiveDate">> &
    SalaryReviewProposalCreateBody;
}) {
  const source = args.body.source ?? "manual";
  const reviewMode = args.body.reviewMode ?? "company_wide";

  if (reviewMode === "department_split") {
    const allocationMethod = args.body.allocationMethod ?? "direct";
    const allocationStatus = allocationMethod === "finance_approval" ? "pending" : "approved";
    const departmentAllocations = (args.body.departmentAllocations ?? []).map((allocation) => {
      const items = allocation.items ?? [];
      const { summary, approvalSteps } = buildItemApprovalSteps(items);

      return {
        ...allocation,
        items,
        summary,
        approvalSteps,
      };
    });
    const summary = summarizeSplitDepartmentAllocations(departmentAllocations);

    return {
      cycleInsert: {
        workspace_id: args.workspaceId,
        created_by: args.userId,
        source,
        review_mode: "department_split",
        review_scope: "master",
        parent_cycle_id: null,
        department: null,
        allocation_method: allocationMethod,
        allocation_status: allocationStatus,
        cycle: args.body.cycle,
        budget_type: args.body.budgetType,
        budget_percentage: args.body.budgetPercentage ?? 0,
        budget_absolute: args.body.budgetAbsolute ?? 0,
        effective_date: args.body.effectiveDate,
        status: allocationMethod === "finance_approval" ? "submitted" : "approved",
        summary,
      },
      itemInserts: () => [],
      approvalStepInserts: () => [],
      departmentAllocationInserts: (cycleId: string) =>
        departmentAllocations.map((allocation) => ({
          master_cycle_id: cycleId,
          department: allocation.department,
          allocated_budget: allocation.allocatedBudget,
          allocation_method: allocationMethod,
          allocation_status: allocationStatus,
          selected_employee_ids: allocation.selectedEmployeeIds ?? [],
        })),
      childCycleInserts: (cycleId: string) =>
        departmentAllocations.map((allocation) => ({
          workspace_id: args.workspaceId,
          created_by: args.userId,
          source,
          review_mode: "department_split",
          review_scope: "department",
          parent_cycle_id: cycleId,
          department: allocation.department,
          allocation_method: allocationMethod,
          allocation_status: allocationStatus,
          cycle: args.body.cycle,
          budget_type: "absolute" as const,
          budget_percentage: 0,
          budget_absolute: allocation.allocatedBudget,
          effective_date: args.body.effectiveDate,
          status: "draft",
          summary: allocation.summary,
        })),
      childCycleItemInserts: (childCycleId: string, department: string) => {
        const allocation = departmentAllocations.find((entry) => entry.department === department);
        return (allocation?.items ?? []).map((item) => mapDraftItemToInsert(item, childCycleId));
      },
      childApprovalStepInserts: (childCycleId: string, department: string) => {
        const allocation = departmentAllocations.find((entry) => entry.department === department);
        return (allocation?.approvalSteps ?? []).map((step, index) =>
          mapApprovalStepToInsert(childCycleId, step, index)
        );
      },
      auditInsert: (cycleId: string) => ({
        cycle_id: cycleId,
        workspace_id: args.workspaceId,
        actor_user_id: args.userId,
        event_type: "proposal_created",
        payload: {
          source,
          reviewMode,
          allocationMethod,
          summary,
          departmentCount: departmentAllocations.length,
        },
      }),
      summary,
      approvalSteps: [],
    };
  }

  const items = args.body.items ?? [];
  const { summary, approvalSteps } = buildItemApprovalSteps(items);

  return {
    cycleInsert: {
      workspace_id: args.workspaceId,
      created_by: args.userId,
      source,
      review_mode: "company_wide",
      review_scope: "company_wide",
      parent_cycle_id: null,
      department: null,
      allocation_method: null,
      allocation_status: null,
      cycle: args.body.cycle,
      budget_type: args.body.budgetType,
      budget_percentage: args.body.budgetPercentage ?? 0,
      budget_absolute: args.body.budgetAbsolute ?? 0,
      effective_date: args.body.effectiveDate,
      status: "draft",
      summary,
    },
    itemInserts: (cycleId: string) => items.map((item) => mapDraftItemToInsert(item, cycleId)),
    approvalStepInserts: (cycleId: string) =>
      approvalSteps.map((step, index) => mapApprovalStepToInsert(cycleId, step, index)),
    departmentAllocationInserts: () => [],
    childCycleInserts: () => [],
    childCycleItemInserts: () => [],
    childApprovalStepInserts: () => [],
    auditInsert: (cycleId: string) => ({
      cycle_id: cycleId,
      workspace_id: args.workspaceId,
      actor_user_id: args.userId,
      event_type: "proposal_created",
      payload: {
        source,
        reviewMode,
        summary,
      },
    }),
    summary,
    approvalSteps,
  };
}

function mapApprovalStepToInsert(
  cycleId: string,
  step: SalaryReviewApprovalStep,
  index: number
) {
  return {
    cycle_id: cycleId,
    step_order: index + 1,
    step_key: step.stepKey,
    step_label: step.label,
    status: step.status,
    trigger_reason: step.triggerReason,
    actor_user_id: step.actorUserId,
    acted_at: step.actedAt,
    note: step.note,
  };
}
