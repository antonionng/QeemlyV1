import {
  buildApprovalChain,
  summarizeProposalDraft,
  type SalaryReviewApprovalStep,
  type SalaryReviewDraftItemInput,
} from "./proposal-workflow";

export type SalaryReviewProposalSource = "manual" | "ai";

export type SalaryReviewProposalCreateBody = {
  source?: SalaryReviewProposalSource;
  cycle?: "monthly" | "annual";
  budgetType?: "percentage" | "absolute";
  budgetPercentage?: number;
  budgetAbsolute?: number;
  effectiveDate?: string;
  items?: Array<
    SalaryReviewDraftItemInput & {
      bandPosition?: "below" | "in-band" | "above";
    }
  >;
};

export function validateSalaryReviewProposalCreateBody(body: SalaryReviewProposalCreateBody) {
  if (body.cycle !== "monthly" && body.cycle !== "annual") {
    return { ok: false as const, error: "cycle must be one of: monthly, annual" };
  }
  if (body.budgetType !== "percentage" && body.budgetType !== "absolute") {
    return { ok: false as const, error: "budgetType must be one of: percentage, absolute" };
  }
  if (!body.effectiveDate?.trim()) {
    return { ok: false as const, error: "effectiveDate is required" };
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { ok: false as const, error: "items must contain at least one proposal item" };
  }

  for (const item of body.items) {
    if (!item.employeeId || !item.employeeName) {
      return { ok: false as const, error: "each proposal item requires employeeId and employeeName" };
    }
  }

  return { ok: true as const, value: body };
}

export function buildProposalDraftRecords(args: {
  workspaceId: string;
  userId: string;
  body: Required<Pick<SalaryReviewProposalCreateBody, "cycle" | "budgetType" | "effectiveDate">> &
    SalaryReviewProposalCreateBody;
}) {
  const source = args.body.source ?? "manual";
  const items = args.body.items ?? [];
  const summary = summarizeProposalDraft(items);
  const approvalSteps = buildApprovalChain({
    totalIncrease: summary.totalIncrease,
    maxIncreasePercentage: summary.maxIncreasePercentage,
    hasAboveBandIncreases: items.some((item) => item.bandPosition === "above" && item.selected),
  });

  return {
    cycleInsert: {
      workspace_id: args.workspaceId,
      created_by: args.userId,
      source,
      cycle: args.body.cycle,
      budget_type: args.body.budgetType,
      budget_percentage: args.body.budgetPercentage ?? 0,
      budget_absolute: args.body.budgetAbsolute ?? 0,
      effective_date: args.body.effectiveDate,
      status: "draft",
      summary,
    },
    itemInserts: (cycleId: string) =>
      items.map((item) => ({
        cycle_id: cycleId,
        employee_id: item.employeeId,
        employee_name: item.employeeName,
        selected: item.selected,
        current_salary: item.currentSalary,
        proposed_increase: item.proposedIncrease,
        proposed_salary: item.proposedSalary,
        proposed_percentage: item.proposedPercentage,
        reason_summary: item.reasonSummary,
        benchmark_snapshot: {
          ...(item.benchmarkSnapshot ?? {}),
          bandPosition: item.bandPosition ?? null,
        },
      })),
    approvalStepInserts: (cycleId: string) =>
      approvalSteps.map((step, index) => mapApprovalStepToInsert(cycleId, step, index)),
    auditInsert: (cycleId: string) => ({
      cycle_id: cycleId,
      workspace_id: args.workspaceId,
      actor_user_id: args.userId,
      event_type: "proposal_created",
      payload: {
        source,
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
