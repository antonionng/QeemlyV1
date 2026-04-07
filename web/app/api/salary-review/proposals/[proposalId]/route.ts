import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import {
  applyApprovalActionToSteps,
  loadSalaryReviewProposalDetail,
} from "@/lib/salary-review/proposal-server";
import { summarizeProposalDraft } from "@/lib/salary-review/proposal-workflow";
import type { SalaryReviewProposalCreateBody } from "@/lib/salary-review/proposals";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

type ProposalPatchBody = {
  action?: "approve" | "reject" | "return";
  note?: string;
  items?: SalaryReviewProposalCreateBody["items"];
  cycle?: "monthly" | "annual";
  effectiveDate?: string;
  budgetType?: "percentage" | "absolute";
  budgetPercentage?: number;
  budgetAbsolute?: number;
};

async function ensureProposalAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  proposalId: string
) {
  const { data: proposal, error } = await supabase
    .from("salary_review_cycles")
    .select("*")
    .eq("id", proposalId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !proposal) {
    return null;
  }

  return proposal;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { proposalId } = await params;
  const proposal = await ensureProposalAccess(supabase, wsContext.context.workspace_id, proposalId);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const detail = await loadSalaryReviewProposalDetail(supabase, proposalId);
  return NextResponse.json(detail);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { proposalId } = await params;
  const existing = await ensureProposalAccess(supabase, wsContext.context.workspace_id, proposalId);
  if (!existing) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as ProposalPatchBody | null;
  if (!body) {
    return jsonValidationError({
      message: "Please correct the request and try again.",
    });
  }

  if (Array.isArray(body.items)) {
    for (const item of body.items) {
      const { error } = await supabase
        .from("salary_review_proposal_items")
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq("cycle_id", proposalId)
        .eq("employee_id", item.employeeId);
      if (error) {
        return jsonServerError(error, {
          defaultMessage: "We could not update this proposal right now.",
          logLabel: "Salary review proposal items update failed",
        });
      }
    }

    const summary = summarizeProposalDraft(
      body.items.map((item) => ({
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        currentSalary: item.currentSalary,
        proposedIncrease: item.proposedIncrease,
        proposedSalary: item.proposedSalary,
        proposedPercentage: item.proposedPercentage,
        selected: item.selected,
        reasonSummary: item.reasonSummary,
        changeReason: item.changeReason ?? null,
        recommendedLevelId: item.recommendedLevelId ?? null,
        recommendedLevelName: item.recommendedLevelName ?? null,
        benchmarkSnapshot: item.benchmarkSnapshot ?? {},
      }))
    );

    const { error: cycleUpdateError } = await supabase
      .from("salary_review_cycles")
      .update({
        summary,
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);
    if (cycleUpdateError) {
      return jsonServerError(cycleUpdateError, {
        defaultMessage: "We could not update this proposal right now.",
        logLabel: "Salary review proposal summary update failed",
      });
    }

    const { error: auditError } = await supabase.from("salary_review_audit_events").insert({
      cycle_id: proposalId,
      workspace_id: wsContext.context.workspace_id,
      actor_user_id: wsContext.context.user_id,
      event_type: "proposal_draft_updated",
      payload: {
        itemCount: body.items.length,
        summary,
      },
    });
    if (auditError) {
      return jsonServerError(auditError, {
        defaultMessage: "We could not save proposal activity right now.",
        logLabel: "Salary review proposal draft audit failed",
      });
    }
  }

  if (body.action) {
    if (
      existing.review_mode === "department_split" &&
      existing.review_scope === "master" &&
      existing.allocation_method === "finance_approval" &&
      existing.allocation_status === "pending"
    ) {
      const nextAllocationStatus = body.action === "approve" ? "approved" : "returned";
      const nextCycleStatus =
        body.action === "approve"
          ? "approved"
          : body.action === "reject"
            ? "rejected"
            : "draft";

      const { error: cycleUpdateError } = await supabase
        .from("salary_review_cycles")
        .update({
          allocation_status: nextAllocationStatus,
          status: nextCycleStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId);
      if (cycleUpdateError) {
        return jsonServerError(cycleUpdateError, {
          defaultMessage: "We could not update this allocation right now.",
          logLabel: "Salary review allocation cycle update failed",
        });
      }

      const { error: allocationUpdateError } = await supabase
        .from("salary_review_department_allocations")
        .update({
          allocation_status: nextAllocationStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("master_cycle_id", proposalId);
      if (allocationUpdateError) {
        return jsonServerError(allocationUpdateError, {
          defaultMessage: "We could not update this allocation right now.",
          logLabel: "Salary review allocation rows update failed",
        });
      }

      const { error: childCycleUpdateError } = await supabase
        .from("salary_review_cycles")
        .update({
          allocation_status: nextAllocationStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("parent_cycle_id", proposalId);
      if (childCycleUpdateError) {
        return jsonServerError(childCycleUpdateError, {
          defaultMessage: "We could not update split review allocations right now.",
          logLabel: "Salary review child allocation update failed",
        });
      }

      const { error: auditError } = await supabase.from("salary_review_audit_events").insert({
        cycle_id: proposalId,
        workspace_id: wsContext.context.workspace_id,
        actor_user_id: wsContext.context.user_id,
        event_type:
          body.action === "approve"
            ? "allocation_approved"
            : body.action === "reject"
              ? "allocation_rejected"
              : "allocation_returned",
        payload: {
          note: body.note ?? null,
        },
      });
      if (auditError) {
        return jsonServerError(auditError, {
          defaultMessage: "We could not save proposal activity right now.",
          logLabel: "Salary review allocation audit failed",
        });
      }

      const detail = await loadSalaryReviewProposalDetail(supabase, proposalId);
      return NextResponse.json(detail);
    }

    if (existing.status !== "submitted" && existing.status !== "in_review") {
      return NextResponse.json({ error: "Proposal is not awaiting review." }, { status: 400 });
    }
    const { data: steps, error: stepsError } = await supabase
      .from("salary_review_approval_steps")
      .select("*")
      .eq("cycle_id", proposalId)
      .order("step_order", { ascending: true });
    if (stepsError) {
      return jsonServerError(stepsError, {
        defaultMessage: "We could not load approval steps right now.",
        logLabel: "Salary review approval steps load failed",
      });
    }

    const applied = applyApprovalActionToSteps(steps || [], {
      action: body.action,
      actorUserId: wsContext.context.user_id,
      note: body.note,
    });

    for (const step of applied.steps) {
      const { error } = await supabase
        .from("salary_review_approval_steps")
        .update({
          status: step.status,
          actor_user_id: step.actor_user_id,
          acted_at: step.acted_at,
          note: step.note,
          updated_at: new Date().toISOString(),
        })
        .eq("cycle_id", proposalId)
        .eq("step_order", step.step_order);
      if (error) {
        return jsonServerError(error, {
          defaultMessage: "We could not update approval steps right now.",
          logLabel: "Salary review approval step update failed",
        });
      }
    }

    const { error: cycleUpdateError } = await supabase
      .from("salary_review_cycles")
      .update({
        status: applied.proposalStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);
    if (cycleUpdateError) {
      return jsonServerError(cycleUpdateError, {
        defaultMessage: "We could not update this proposal right now.",
        logLabel: "Salary review proposal status update failed",
      });
    }

    const { error: auditError } = await supabase.from("salary_review_audit_events").insert({
      cycle_id: proposalId,
      workspace_id: wsContext.context.workspace_id,
      actor_user_id: wsContext.context.user_id,
      event_type:
        body.action === "approve"
          ? "proposal_approved"
          : body.action === "reject"
            ? "proposal_rejected"
            : "proposal_returned",
      payload: {
        note: body.note ?? null,
      },
    });
    if (auditError) {
      return jsonServerError(auditError, {
        defaultMessage: "We could not save proposal activity right now.",
        logLabel: "Salary review proposal action audit failed",
      });
    }
  } else if (
    body.cycle ||
    body.effectiveDate ||
    body.budgetType ||
    body.budgetPercentage !== undefined ||
    body.budgetAbsolute !== undefined
  ) {
    const { error: cycleUpdateError } = await supabase
      .from("salary_review_cycles")
      .update({
        cycle: body.cycle ?? existing.cycle,
        effective_date: body.effectiveDate ?? existing.effective_date,
        budget_type: body.budgetType ?? existing.budget_type,
        budget_percentage: body.budgetPercentage ?? existing.budget_percentage,
        budget_absolute: body.budgetAbsolute ?? existing.budget_absolute,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);
    if (cycleUpdateError) {
      return jsonServerError(cycleUpdateError, {
        defaultMessage: "We could not update this proposal right now.",
        logLabel: "Salary review proposal metadata update failed",
      });
    }

    const { error: auditError } = await supabase.from("salary_review_audit_events").insert({
      cycle_id: proposalId,
      workspace_id: wsContext.context.workspace_id,
      actor_user_id: wsContext.context.user_id,
      event_type: "proposal_metadata_updated",
      payload: {
        cycle: body.cycle ?? existing.cycle,
        effectiveDate: body.effectiveDate ?? existing.effective_date,
        budgetType: body.budgetType ?? existing.budget_type,
      },
    });
    if (auditError) {
      return jsonServerError(auditError, {
        defaultMessage: "We could not save proposal activity right now.",
        logLabel: "Salary review proposal metadata audit failed",
      });
    }
  }

  const detail = await loadSalaryReviewProposalDetail(supabase, proposalId);
  return NextResponse.json(detail);
}
