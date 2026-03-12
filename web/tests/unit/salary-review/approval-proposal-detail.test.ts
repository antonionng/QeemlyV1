import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ApprovalProposalDetail } from "@/components/dashboard/salary-review/approval-proposal-detail";
import type {
  SalaryReviewApprovalStepRecord,
  SalaryReviewAuditEventRecord,
  SalaryReviewNoteRecord,
  SalaryReviewProposalItemRecord,
  SalaryReviewProposalRecord,
} from "@/lib/salary-review/proposal-types";

const proposal: SalaryReviewProposalRecord = {
  id: "proposal-1",
  workspace_id: "workspace-1",
  created_by: "user-1",
  source: "ai",
  cycle: "annual",
  budget_type: "percentage",
  budget_percentage: 5,
  budget_absolute: 0,
  effective_date: "2026-03-31",
  status: "in_review",
  summary: {
    selectedEmployees: 2,
    proposedEmployees: 2,
    totalCurrentPayroll: 200_000,
    totalIncrease: 15_000,
    totalProposedPayroll: 215_000,
    maxIncreasePercentage: 12,
  },
  created_at: "2026-03-12T10:00:00.000Z",
  updated_at: "2026-03-12T11:00:00.000Z",
};

const items: SalaryReviewProposalItemRecord[] = [
  {
    id: "item-1",
    cycle_id: "proposal-1",
    employee_id: "emp-1",
    employee_name: "Ava Stone",
    selected: true,
    current_salary: 80_000,
    proposed_increase: 8_000,
    proposed_salary: 88_000,
    proposed_percentage: 10,
    reason_summary: "Promotion signal",
    benchmark_snapshot: {
      bandPosition: "below",
    },
  },
  {
    id: "item-2",
    cycle_id: "proposal-1",
    employee_id: "emp-2",
    employee_name: "Lina Noor",
    selected: true,
    current_salary: 120_000,
    proposed_increase: 7_000,
    proposed_salary: 127_000,
    proposed_percentage: 5.83,
    reason_summary: "Retention risk",
    benchmark_snapshot: {
      bandPosition: "in_band",
    },
  },
];

const approvalSteps: SalaryReviewApprovalStepRecord[] = [
  {
    id: "step-1",
    cycle_id: "proposal-1",
    step_order: 1,
    step_key: "manager",
    step_label: "Manager review",
    status: "pending",
    trigger_reason: null,
    actor_user_id: null,
    acted_at: null,
    note: null,
  },
];

const proposalNotes: SalaryReviewNoteRecord[] = [
  {
    id: "note-1",
    cycle_id: "proposal-1",
    employee_id: "emp-1",
    step_id: null,
    workspace_id: "workspace-1",
    created_by: "user-2",
    note: "Focus the discussion on market catch-up.",
    created_at: "2026-03-12T12:00:00.000Z",
  },
];

const proposalAuditEvents: SalaryReviewAuditEventRecord[] = [
  {
    id: "audit-1",
    cycle_id: "proposal-1",
    workspace_id: "workspace-1",
    employee_id: "emp-1",
    actor_user_id: "user-2",
    event_type: "proposal_note_added",
    payload: {},
    created_at: "2026-03-12T12:05:00.000Z",
  },
];

describe("ApprovalProposalDetail", () => {
  it("renders one inline employee review list with expanded employee context", () => {
    const html = renderToStaticMarkup(
      React.createElement(ApprovalProposalDetail as never, {
        proposal,
        proposalItems: items,
        approvalSteps,
        proposalNotes,
        proposalAuditEvents,
        isLoading: false,
        canTakeAction: true,
        canAddNote: true,
        onAction: () => undefined,
        onAddNote: () => undefined,
        onBack: () => undefined,
      })
    );

    expect(html).toContain("Back to queue");
    expect(html).toContain("Employee Review List");
    expect(html).toContain("Ava Stone");
    expect(html).toContain("Lina Noor");
    expect(html).toContain("Reviewing Ava Stone");
    expect(html).toContain("Employee Review Notes");
    expect(html).toContain("Focus the discussion on market catch-up.");
    expect(html).toContain("Employee Activity");
    expect(html).not.toContain("Selected Employee");
  });
});
