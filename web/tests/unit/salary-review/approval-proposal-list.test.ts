import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ApprovalProposalList } from "@/components/dashboard/salary-review/approval-proposal-list";
import type { SalaryReviewProposalRecord } from "@/lib/salary-review/proposal-types";

function makeProposal(
  overrides: Partial<SalaryReviewProposalRecord> = {}
): SalaryReviewProposalRecord {
  return {
    id: overrides.id ?? "proposal-1",
    workspace_id: overrides.workspace_id ?? "workspace-1",
    created_by: overrides.created_by ?? "user-1",
    source: overrides.source ?? "manual",
    review_mode: overrides.review_mode ?? "company_wide",
    review_scope: overrides.review_scope ?? "company_wide",
    parent_cycle_id: overrides.parent_cycle_id ?? null,
    department: overrides.department ?? null,
    allocation_method: overrides.allocation_method ?? null,
    allocation_status: overrides.allocation_status ?? null,
    cycle: overrides.cycle ?? "annual",
    budget_type: overrides.budget_type ?? "percentage",
    budget_percentage: overrides.budget_percentage ?? 5,
    budget_absolute: overrides.budget_absolute ?? 0,
    effective_date: overrides.effective_date ?? "2026-04-01",
    status: overrides.status ?? "submitted",
    summary: overrides.summary ?? {
      selectedEmployees: 12,
      proposedEmployees: 10,
      totalCurrentPayroll: 1_000_000,
      totalIncrease: 75_000,
      totalProposedPayroll: 1_075_000,
      maxIncreasePercentage: 10,
    },
    created_at: overrides.created_at ?? "2026-03-12T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-03-12T00:00:00.000Z",
  };
}

describe("ApprovalProposalList", () => {
  it("renders proposal batches as drill-in cards with an explicit open action", () => {
    const html = renderToStaticMarkup(
      React.createElement(ApprovalProposalList, {
        proposals: [
          makeProposal({ id: "proposal-1", source: "ai" }),
          makeProposal({ id: "proposal-2", source: "manual", status: "in_review" }),
        ],
        isLoading: false,
        onSelect: () => undefined,
      })
    );

    expect(html).toContain("Open Batch");
    expect(html).toContain("Open the employee list, comments, routing, and actions for this batch.");
    expect(html).toContain("AI proposal");
    expect(html).toContain("Manual proposal");
  });

  it("labels split master reviews as finance allocation reviews", () => {
    const html = renderToStaticMarkup(
      React.createElement(ApprovalProposalList, {
        proposals: [
          makeProposal({
            id: "master-1",
            review_mode: "department_split",
            review_scope: "master",
            allocation_method: "finance_approval",
            status: "submitted",
          }),
        ],
        isLoading: false,
        onSelect: () => undefined,
      })
    );

    expect(html).toContain("Finance allocation review");
  });
});
