import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { loadSalaryReviewProposalDetail } from "@/lib/salary-review/proposal-server";
import {
  buildProposalDraftRecords,
  validateSalaryReviewProposalCreateBody,
  type SalaryReviewProposalCreateBody,
} from "@/lib/salary-review/proposals";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const latestOnly = request.nextUrl.searchParams.get("latest") === "1";
  const approvalQueueOnly = request.nextUrl.searchParams.get("approvalQueue") === "1";
  const view = request.nextUrl.searchParams.get("view");
  let baseQuery = supabase
    .from("salary_review_cycles")
    .select("*")
    .eq("workspace_id", wsContext.context.workspace_id);

  if (approvalQueueOnly && view !== "cycles") {
    baseQuery = baseQuery.neq("status", "draft");
  }

  baseQuery = baseQuery.order("updated_at", { ascending: false });

  if (latestOnly) {
    const { data, error } = await baseQuery.limit(1);
    if (error) {
      return jsonServerError(error, {
        defaultMessage: "We could not load salary review proposals right now.",
        logLabel: "Salary review proposals latest load failed",
      });
    }
    const latest = data?.[0];
    if (!latest) {
      return NextResponse.json({
        proposal: null,
        items: [],
        approvalSteps: [],
        notes: [],
        auditEvents: [],
        departmentAllocations: [],
        childCycles: [],
      });
    }
    const detail = await loadSalaryReviewProposalDetail(supabase, latest.id);
    return NextResponse.json(detail);
  }

  const { data, error } = await baseQuery.limit(50);
  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not load salary review proposals right now.",
      logLabel: "Salary review proposals list load failed",
    });
  }

  return NextResponse.json({ proposals: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const body = (await request.json().catch(() => null)) as SalaryReviewProposalCreateBody | null;
  const validation = validateSalaryReviewProposalCreateBody(body || {});
  if (!validation.ok) {
    return jsonValidationError({
      message: validation.error,
    });
  }

  const validatedBody = validation.value as Required<
    Pick<SalaryReviewProposalCreateBody, "cycle" | "budgetType" | "effectiveDate">
  > &
    SalaryReviewProposalCreateBody;

  const draftRecords = buildProposalDraftRecords({
    workspaceId: wsContext.context.workspace_id,
    userId: wsContext.context.user_id,
    body: validatedBody,
  });

  const { data: cycle, error: cycleError } = await supabase
    .from("salary_review_cycles")
    .insert(draftRecords.cycleInsert)
    .select("*")
    .single();

  if (cycleError || !cycle) {
    return jsonServerError(cycleError ?? new Error("Could not create proposal draft"), {
      defaultMessage: "We could not create this proposal right now.",
      logLabel: "Salary review proposal create failed",
    });
  }

  const masterItems = draftRecords.itemInserts(cycle.id);
  if (masterItems.length > 0) {
    const { error: itemsError } = await supabase
      .from("salary_review_proposal_items")
      .insert(masterItems)
      .select("*");

    if (itemsError) {
      return jsonServerError(itemsError, {
        defaultMessage: "We could not save proposal items right now.",
        logLabel: "Salary review proposal items create failed",
      });
    }
  }

  const masterApprovalSteps = draftRecords.approvalStepInserts(cycle.id);
  if (masterApprovalSteps.length > 0) {
    const { error: stepsError } = await supabase
      .from("salary_review_approval_steps")
      .insert(masterApprovalSteps)
      .select("*");

    if (stepsError) {
      return jsonServerError(stepsError, {
        defaultMessage: "We could not save approval steps right now.",
        logLabel: "Salary review approval steps create failed",
      });
    }
  }

  const { error: auditError } = await supabase
    .from("salary_review_audit_events")
    .insert(draftRecords.auditInsert(cycle.id));

  if (auditError) {
    return jsonServerError(auditError, {
      defaultMessage: "We could not save proposal audit history right now.",
      logLabel: "Salary review proposal audit create failed",
    });
  }

  const childCycleDrafts = draftRecords.childCycleInserts(cycle.id);
  if (childCycleDrafts.length > 0) {
    const { data: childCycles, error: childCyclesError } = await supabase
      .from("salary_review_cycles")
      .insert(childCycleDrafts)
      .select("*");
    if (childCyclesError) {
      return jsonServerError(childCyclesError, {
        defaultMessage: "We could not create split review drafts right now.",
        logLabel: "Salary review child cycles create failed",
      });
    }

    const allocationInserts = draftRecords.departmentAllocationInserts(cycle.id).map((allocation) => ({
      ...allocation,
      child_cycle_id:
        childCycles?.find((childCycle) => childCycle.department === allocation.department)?.id ?? null,
    }));
    if (allocationInserts.length > 0) {
      const { error: allocationError } = await supabase
        .from("salary_review_department_allocations")
        .insert(allocationInserts)
        .select("*");
      if (allocationError) {
        return jsonServerError(allocationError, {
          defaultMessage: "We could not save department allocations right now.",
          logLabel: "Salary review department allocations create failed",
        });
      }
    }

    for (const childCycle of childCycles || []) {
      const childItems = draftRecords.childCycleItemInserts(childCycle.id, childCycle.department ?? "");
      if (childItems.length > 0) {
        const { error } = await supabase.from("salary_review_proposal_items").insert(childItems).select("*");
        if (error) {
          return jsonServerError(error, {
            defaultMessage: "We could not save split review proposal items right now.",
            logLabel: "Salary review child proposal items create failed",
          });
        }
      }

      const childSteps = draftRecords.childApprovalStepInserts(
        childCycle.id,
        childCycle.department ?? ""
      );
      if (childSteps.length > 0) {
        const { error } = await supabase
          .from("salary_review_approval_steps")
          .insert(childSteps)
          .select("*");
        if (error) {
          return jsonServerError(error, {
            defaultMessage: "We could not save split review approval steps right now.",
            logLabel: "Salary review child approval steps create failed",
          });
        }
      }
    }
  }

  const detail = await loadSalaryReviewProposalDetail(supabase, cycle.id);
  return NextResponse.json(detail, { status: 201 });
}
