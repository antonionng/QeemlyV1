import type { SupabaseClient } from "@supabase/supabase-js";
import {
  advanceApprovalChain,
  buildApprovalChain,
  getProposalStatusFromSteps,
  summarizeProposalDraft,
  type SalaryReviewDraftItemInput,
} from "./proposal-workflow";

type GenericSupabaseClient = SupabaseClient<any, "public", any>;

function isMissingDepartmentAllocationsTableError(error: { code?: string | null; message?: string | null } | null) {
  const message = error?.message ?? "";
  return (
    error?.code === "PGRST205" &&
    message.includes("salary_review_department_allocations") &&
    message.includes("schema cache")
  );
}

function isMissingParentCycleColumnError(error: { code?: string | null; message?: string | null } | null) {
  const message = error?.message ?? "";
  return error?.code === "42703" && message.includes("salary_review_cycles.parent_cycle_id");
}

export async function loadSalaryReviewProposalDetail(
  supabase: GenericSupabaseClient,
  cycleId: string
) {
  const [
    { data: proposal, error: proposalError },
    { data: items, error: itemsError },
    { data: approvalSteps, error: approvalStepsError },
    { data: notes, error: notesError },
    { data: auditEvents, error: auditEventsError },
    { data: departmentAllocations, error: departmentAllocationsError },
    { data: childCycles, error: childCyclesError },
  ] = await Promise.all([
    supabase.from("salary_review_cycles").select("*").eq("id", cycleId).single(),
    supabase
      .from("salary_review_proposal_items")
      .select("*")
      .eq("cycle_id", cycleId)
      .order("employee_name", { ascending: true }),
    supabase
      .from("salary_review_approval_steps")
      .select("*")
      .eq("cycle_id", cycleId)
      .order("step_order", { ascending: true }),
    supabase
      .from("salary_review_notes")
      .select("*")
      .eq("cycle_id", cycleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("salary_review_audit_events")
      .select("*")
      .eq("cycle_id", cycleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("salary_review_department_allocations")
      .select("*")
      .eq("master_cycle_id", cycleId)
      .order("department", { ascending: true }),
    supabase
      .from("salary_review_cycles")
      .select("*")
      .eq("parent_cycle_id", cycleId)
      .order("department", { ascending: true }),
  ]);

  if (proposalError) throw new Error(proposalError.message);
  if (itemsError) throw new Error(itemsError.message);
  if (approvalStepsError) throw new Error(approvalStepsError.message);
  if (notesError) throw new Error(notesError.message);
  if (auditEventsError) throw new Error(auditEventsError.message);
  if (departmentAllocationsError && !isMissingDepartmentAllocationsTableError(departmentAllocationsError)) {
    throw new Error(departmentAllocationsError.message);
  }
  if (childCyclesError && !isMissingParentCycleColumnError(childCyclesError)) {
    throw new Error(childCyclesError.message);
  }

  return {
    proposal,
    items: items || [],
    approvalSteps: approvalSteps || [],
    notes: notes || [],
    auditEvents: auditEvents || [],
    departmentAllocations: departmentAllocationsError ? [] : departmentAllocations || [],
    childCycles: childCyclesError ? [] : childCycles || [],
  };
}

export function buildDraftItemsFromRecords(
  items: Array<{
    employee_id: string | null;
    employee_name: string;
    current_salary: number;
    proposed_increase: number;
    proposed_salary: number;
    proposed_percentage: number;
    selected: boolean;
    reason_summary: string | null;
    benchmark_snapshot: Record<string, unknown>;
  }>
): SalaryReviewDraftItemInput[] {
  return items.map((item) => ({
    employeeId: item.employee_id || "",
    employeeName: item.employee_name,
    currentSalary: Number(item.current_salary || 0),
    proposedIncrease: Number(item.proposed_increase || 0),
    proposedSalary: Number(item.proposed_salary || 0),
    proposedPercentage: Number(item.proposed_percentage || 0),
    selected: Boolean(item.selected),
    reasonSummary: item.reason_summary || "",
    benchmarkSnapshot: item.benchmark_snapshot || {},
  }));
}

export function rebuildApprovalStepsForItems(args: {
  items: SalaryReviewDraftItemInput[];
  hasAboveBandIncreases?: boolean;
}) {
  const summary = summarizeProposalDraft(args.items);
  const workflowSteps = buildApprovalChain({
    totalIncrease: summary.totalIncrease,
    maxIncreasePercentage: summary.maxIncreasePercentage,
    hasAboveBandIncreases: Boolean(args.hasAboveBandIncreases),
  });
  return {
    summary,
    steps: workflowSteps.map((step, index) => ({
      step_order: index + 1,
      step_key: step.stepKey,
      step_label: step.label,
      status: step.status,
      trigger_reason: step.triggerReason,
      actor_user_id: step.actorUserId,
      acted_at: step.actedAt,
      note: step.note,
    })),
  };
}

export function applyApprovalActionToSteps(
  steps: Array<{
    step_key: "manager" | "director" | "hr" | "exec";
    step_label: string;
    status: "pending" | "approved" | "rejected" | "returned";
    trigger_reason: string | null;
    actor_user_id: string | null;
    acted_at: string | null;
    note: string | null;
  }>,
  args: {
    action: "approve" | "reject" | "return";
    actorUserId: string;
    note?: string;
  }
) {
  const updated = advanceApprovalChain(
    steps.map((step) => ({
      stepKey: step.step_key,
      label: step.step_label,
      status: step.status,
      triggerReason: step.trigger_reason,
      actorUserId: step.actor_user_id,
      actedAt: step.acted_at,
      note: step.note,
    })),
    args
  );

  return {
    proposalStatus: updated.proposalStatus,
    steps: updated.steps.map((step, index) => ({
      step_order: index + 1,
      step_key: step.stepKey,
      step_label: step.label,
      status: step.status,
      trigger_reason: step.triggerReason,
      actor_user_id: step.actorUserId,
      acted_at: step.actedAt,
      note: step.note,
    })),
    finalStatus: getProposalStatusFromSteps(updated.steps),
  };
}
