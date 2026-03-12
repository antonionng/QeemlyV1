import { describe, expect, it } from "vitest";
import {
  buildApprovalQueueCounts,
  canAddApprovalNote,
  canTakeApprovalAction,
  resolveSelectedApprovalProposalId,
} from "@/lib/salary-review/approval-center";
import type { SalaryReviewProposalRecord } from "@/lib/salary-review/proposal-types";

function makeProposal(
  id: string,
  status: SalaryReviewProposalRecord["status"]
): SalaryReviewProposalRecord {
  return {
    id,
    workspace_id: "ws-1",
    created_by: "user-1",
    source: "manual",
    cycle: "annual",
    budget_type: "absolute",
    budget_percentage: 0,
    budget_absolute: 10_000,
    effective_date: "2026-04-01",
    status,
    summary: {
      selectedEmployees: 1,
      proposedEmployees: 1,
      totalCurrentPayroll: 100_000,
      totalIncrease: 5_000,
      totalProposedPayroll: 105_000,
      maxIncreasePercentage: 5,
    },
  };
}

describe("salary review approval center helpers", () => {
  it("resolves the requested selected proposal id when it exists", () => {
    const proposals = [makeProposal("submitted-1", "submitted"), makeProposal("approved-1", "approved")];

    expect(resolveSelectedApprovalProposalId(proposals, "approved-1")).toBe("approved-1");
  });

  it("falls back to the first proposal when the requested id is missing", () => {
    const proposals = [makeProposal("submitted-1", "submitted"), makeProposal("approved-1", "approved")];

    expect(resolveSelectedApprovalProposalId(proposals, "missing")).toBe("submitted-1");
  });

  it("builds queue counts for active review and history proposals", () => {
    const proposals = [
      makeProposal("submitted-1", "submitted"),
      makeProposal("in-review-1", "in_review"),
      makeProposal("approved-1", "approved"),
      makeProposal("rejected-1", "rejected"),
    ];

    expect(buildApprovalQueueCounts(proposals)).toEqual({
      awaitingReview: 2,
      completed: 2,
      total: 4,
    });
  });

  it("allows notes and reviewer actions only while the proposal is under review", () => {
    expect(canTakeApprovalAction("submitted")).toBe(true);
    expect(canTakeApprovalAction("in_review")).toBe(true);
    expect(canTakeApprovalAction("approved")).toBe(false);

    expect(canAddApprovalNote("submitted")).toBe(true);
    expect(canAddApprovalNote("in_review")).toBe(true);
    expect(canAddApprovalNote("rejected")).toBe(false);
  });
});
