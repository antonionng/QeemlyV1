import type {
  SalaryReviewApprovalStepRecord,
  SalaryReviewAuditEventRecord,
  SalaryReviewNoteRecord,
  SalaryReviewProposalItemRecord,
  SalaryReviewProposalRecord,
} from "./proposal-types";
import type { SalaryReviewProposalCreateBody } from "./proposals";

export type SalaryReviewProposalDetail = {
  proposal: SalaryReviewProposalRecord | null;
  items: SalaryReviewProposalItemRecord[];
  approvalSteps: SalaryReviewApprovalStepRecord[];
  notes: SalaryReviewNoteRecord[];
  auditEvents: SalaryReviewAuditEventRecord[];
};

export type SalaryReviewProposalListResponse = {
  proposals: SalaryReviewProposalRecord[];
};

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error || "Request failed");
  }
  return payload;
}

export async function fetchLatestSalaryReviewProposal(): Promise<SalaryReviewProposalDetail> {
  const response = await fetch("/api/salary-review/proposals?latest=1", { cache: "no-store" });
  return parseJson<SalaryReviewProposalDetail>(response);
}

export async function fetchApprovalQueueSalaryReviewProposals(): Promise<SalaryReviewProposalListResponse> {
  const response = await fetch("/api/salary-review/proposals?approvalQueue=1", { cache: "no-store" });
  return parseJson<SalaryReviewProposalListResponse>(response);
}

export async function fetchSalaryReviewProposalDetail(
  proposalId: string
): Promise<SalaryReviewProposalDetail> {
  const response = await fetch(`/api/salary-review/proposals/${proposalId}`, { cache: "no-store" });
  return parseJson<SalaryReviewProposalDetail>(response);
}

export async function createSalaryReviewProposal(
  body: SalaryReviewProposalCreateBody
): Promise<SalaryReviewProposalDetail> {
  const response = await fetch("/api/salary-review/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await parseJson<{
    proposal: SalaryReviewProposalRecord;
    items: SalaryReviewProposalItemRecord[];
    approvalSteps: SalaryReviewApprovalStepRecord[];
  }>(response);

  return {
    proposal: payload.proposal,
    items: payload.items,
    approvalSteps: payload.approvalSteps,
    notes: [],
    auditEvents: [],
  };
}

export async function updateSalaryReviewProposal(
  proposalId: string,
  body: {
    items?: SalaryReviewProposalCreateBody["items"];
    cycle?: "monthly" | "annual";
    effectiveDate?: string;
    budgetType?: "percentage" | "absolute";
    budgetPercentage?: number;
    budgetAbsolute?: number;
  }
): Promise<SalaryReviewProposalDetail> {
  const response = await fetch(`/api/salary-review/proposals/${proposalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson<SalaryReviewProposalDetail>(response);
}

export async function submitSalaryReviewProposal(proposalId: string): Promise<SalaryReviewProposalDetail> {
  const response = await fetch(`/api/salary-review/proposals/${proposalId}/submit`, {
    method: "POST",
  });
  return parseJson<SalaryReviewProposalDetail>(response);
}

export async function reviewSalaryReviewProposal(
  proposalId: string,
  body: { action: "approve" | "reject" | "return"; note?: string }
): Promise<SalaryReviewProposalDetail> {
  const response = await fetch(`/api/salary-review/proposals/${proposalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson<SalaryReviewProposalDetail>(response);
}

export async function addSalaryReviewProposalNote(
  proposalId: string,
  body: { note: string; employeeId?: string | null; stepId?: string | null }
) {
  const response = await fetch(`/api/salary-review/proposals/${proposalId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson<{ note: SalaryReviewNoteRecord }>(response);
}
