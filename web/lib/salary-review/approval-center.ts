import type { SalaryReviewProposalRecord } from "./proposal-types";

export function resolveSelectedApprovalProposalId(
  proposals: SalaryReviewProposalRecord[],
  requestedProposalId: string | null
) {
  if (requestedProposalId && proposals.some((proposal) => proposal.id === requestedProposalId)) {
    return requestedProposalId;
  }

  return proposals[0]?.id ?? null;
}

export function buildApprovalQueueCounts(proposals: SalaryReviewProposalRecord[]) {
  return {
    awaitingReview: proposals.filter(
      (proposal) => proposal.status === "submitted" || proposal.status === "in_review"
    ).length,
    completed: proposals.filter(
      (proposal) =>
        proposal.status === "approved" ||
        proposal.status === "rejected" ||
        proposal.status === "applied"
    ).length,
    total: proposals.length,
  };
}

export function canTakeApprovalAction(status: SalaryReviewProposalRecord["status"] | null | undefined) {
  return status === "submitted" || status === "in_review";
}

export function canAddApprovalNote(status: SalaryReviewProposalRecord["status"] | null | undefined) {
  return canTakeApprovalAction(status);
}
