import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import {
  buildDraftItemsFromRecords,
  loadSalaryReviewProposalDetail,
  rebuildApprovalStepsForItems,
} from "@/lib/salary-review/proposal-server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { proposalId } = await params;
  const detail = await loadSalaryReviewProposalDetail(supabase, proposalId).catch(() => null);
  if (!detail?.proposal || detail.proposal.workspace_id !== wsContext.context.workspace_id) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (
    detail.proposal.review_mode === "department_split" &&
    detail.proposal.review_scope === "department" &&
    detail.proposal.allocation_method === "finance_approval" &&
    detail.proposal.allocation_status !== "approved"
  ) {
    return NextResponse.json(
      { error: "Department review is locked until Finance approves the department budget." },
      { status: 400 }
    );
  }

  const draftItems = buildDraftItemsFromRecords(detail.items);
  const rebuilt = rebuildApprovalStepsForItems({
    items: draftItems,
    hasAboveBandIncreases: detail.items.some(
      (item) =>
        Boolean(item.selected) &&
        (item.benchmark_snapshot as { bandPosition?: string } | null)?.bandPosition === "above"
    ),
    hasBandUpgradeRecommendations: draftItems.some(
      (item) => item.selected && Boolean(item.recommendedLevelId)
    ),
  });

  const { error: deleteError } = await supabase
    .from("salary_review_approval_steps")
    .delete()
    .eq("cycle_id", proposalId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { error: insertError } = await supabase
    .from("salary_review_approval_steps")
    .insert(
      rebuilt.steps.map((step) => ({
        cycle_id: proposalId,
        ...step,
      }))
    );
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const proposalStatus = rebuilt.steps.length > 0 ? "in_review" : "submitted";

  const { error: cycleUpdateError } = await supabase
    .from("salary_review_cycles")
    .update({
      status: proposalStatus,
      summary: rebuilt.summary,
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId);
  if (cycleUpdateError) {
    return NextResponse.json({ error: cycleUpdateError.message }, { status: 500 });
  }

  const { error: auditError } = await supabase.from("salary_review_audit_events").insert({
    cycle_id: proposalId,
    workspace_id: wsContext.context.workspace_id,
    actor_user_id: wsContext.context.user_id,
    event_type: "proposal_submitted",
    payload: {
      summary: rebuilt.summary,
      approvalStepCount: rebuilt.steps.length,
    },
  });
  if (auditError) {
    return NextResponse.json({ error: auditError.message }, { status: 500 });
  }

  const updatedDetail = await loadSalaryReviewProposalDetail(supabase, proposalId);
  return NextResponse.json(updatedDetail);
}
