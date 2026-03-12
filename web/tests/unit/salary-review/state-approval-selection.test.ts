import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SalaryReviewProposalRecord } from "@/lib/salary-review/proposal-types";

const {
  fetchLatestSalaryReviewProposalMock,
  fetchApprovalQueueSalaryReviewProposalsMock,
  fetchSalaryReviewProposalDetailMock,
  createSalaryReviewProposalMock,
  updateSalaryReviewProposalMock,
  submitSalaryReviewProposalMock,
  reviewSalaryReviewProposalMock,
  addSalaryReviewProposalNoteMock,
} = vi.hoisted(() => ({
  fetchLatestSalaryReviewProposalMock: vi.fn(),
  fetchApprovalQueueSalaryReviewProposalsMock: vi.fn(),
  fetchSalaryReviewProposalDetailMock: vi.fn(),
  createSalaryReviewProposalMock: vi.fn(),
  updateSalaryReviewProposalMock: vi.fn(),
  submitSalaryReviewProposalMock: vi.fn(),
  reviewSalaryReviewProposalMock: vi.fn(),
  addSalaryReviewProposalNoteMock: vi.fn(),
}));

vi.mock("@/lib/salary-review/proposal-api", () => ({
  fetchLatestSalaryReviewProposal: fetchLatestSalaryReviewProposalMock,
  fetchApprovalQueueSalaryReviewProposals: fetchApprovalQueueSalaryReviewProposalsMock,
  fetchSalaryReviewProposalDetail: fetchSalaryReviewProposalDetailMock,
  createSalaryReviewProposal: createSalaryReviewProposalMock,
  updateSalaryReviewProposal: updateSalaryReviewProposalMock,
  submitSalaryReviewProposal: submitSalaryReviewProposalMock,
  reviewSalaryReviewProposal: reviewSalaryReviewProposalMock,
  addSalaryReviewProposalNote: addSalaryReviewProposalNoteMock,
}));

import { useSalaryReview } from "@/lib/salary-review";

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
    created_at: "2026-03-11T10:00:00.000Z",
    updated_at: "2026-03-11T10:00:00.000Z",
  };
}

describe("salary review approval selection state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSalaryReview.setState({
      activeProposal: makeProposal("draft-1", "draft"),
      proposalItemsByEmployee: {},
      approvalSteps: [],
      proposalNotes: [],
      proposalAuditEvents: [],
      isProposalLoading: false,
      approvalQueue: [],
      selectedApprovalProposalId: null,
      selectedApprovalProposal: null,
      selectedApprovalItemsByEmployee: {},
      selectedApprovalSteps: [],
      selectedApprovalNotes: [],
      selectedApprovalAuditEvents: [],
      isApprovalQueueLoading: false,
      isApprovalDetailLoading: false,
    });
  });

  it("loads the approval queue without overwriting the editable draft", async () => {
    fetchApprovalQueueSalaryReviewProposalsMock.mockResolvedValue({
      proposals: [makeProposal("submitted-1", "submitted"), makeProposal("approved-1", "approved")],
    });

    await useSalaryReview.getState().loadApprovalProposalList();

    const state = useSalaryReview.getState();
    expect(state.activeProposal?.id).toBe("draft-1");
    expect(state.approvalQueue.map((proposal) => proposal.id)).toEqual(["submitted-1", "approved-1"]);
  });

  it("selects an approval proposal and loads its detail separately from the draft", async () => {
    fetchSalaryReviewProposalDetailMock.mockResolvedValue({
      proposal: makeProposal("submitted-2", "submitted"),
      items: [],
      approvalSteps: [
        {
          id: "step-1",
          cycle_id: "submitted-2",
          step_order: 1,
          step_key: "manager",
          step_label: "Manager Approval",
          status: "pending",
          trigger_reason: null,
          actor_user_id: null,
          acted_at: null,
          note: null,
        },
      ],
      notes: [
        {
          id: "note-1",
          cycle_id: "submitted-2",
          employee_id: null,
          step_id: null,
          workspace_id: "ws-1",
          created_by: "user-1",
          note: "Ready for review",
          created_at: "2026-03-11T10:10:00.000Z",
        },
      ],
      auditEvents: [],
    });

    await useSalaryReview.getState().selectApprovalProposal("submitted-2");

    const state = useSalaryReview.getState();
    expect(fetchSalaryReviewProposalDetailMock).toHaveBeenCalledWith("submitted-2");
    expect(state.selectedApprovalProposalId).toBe("submitted-2");
    expect(state.selectedApprovalProposal?.id).toBe("submitted-2");
    expect(state.selectedApprovalSteps).toHaveLength(1);
    expect(state.selectedApprovalNotes[0]?.note).toBe("Ready for review");
    expect(state.activeProposal?.id).toBe("draft-1");
  });

  it("reviews the selected approval proposal without overwriting the draft state", async () => {
    useSalaryReview.setState({
      selectedApprovalProposalId: "submitted-3",
      selectedApprovalProposal: makeProposal("submitted-3", "submitted"),
      approvalQueue: [makeProposal("submitted-3", "submitted")],
    });

    reviewSalaryReviewProposalMock.mockResolvedValue({
      proposal: makeProposal("submitted-3", "approved"),
      items: [],
      approvalSteps: [],
      notes: [],
      auditEvents: [],
    });

    await useSalaryReview.getState().reviewSelectedApprovalProposal("approve", "Looks good");

    const state = useSalaryReview.getState();
    expect(reviewSalaryReviewProposalMock).toHaveBeenCalledWith("submitted-3", {
      action: "approve",
      note: "Looks good",
    });
    expect(state.selectedApprovalProposal?.status).toBe("approved");
    expect(state.approvalQueue[0]?.status).toBe("approved");
    expect(state.activeProposal?.id).toBe("draft-1");
  });

  it("reloads notes for the selected approval proposal by proposal id", async () => {
    useSalaryReview.setState({
      selectedApprovalProposalId: "submitted-4",
      selectedApprovalProposal: makeProposal("submitted-4", "in_review"),
    });

    addSalaryReviewProposalNoteMock.mockResolvedValue({
      note: {
        id: "note-2",
        cycle_id: "submitted-4",
        employee_id: null,
        step_id: null,
        workspace_id: "ws-1",
        created_by: "user-1",
        note: "Need supporting context",
        created_at: "2026-03-11T10:15:00.000Z",
      },
    });
    fetchSalaryReviewProposalDetailMock.mockResolvedValue({
      proposal: makeProposal("submitted-4", "in_review"),
      items: [],
      approvalSteps: [],
      notes: [
        {
          id: "note-2",
          cycle_id: "submitted-4",
          employee_id: null,
          step_id: null,
          workspace_id: "ws-1",
          created_by: "user-1",
          note: "Need supporting context",
          created_at: "2026-03-11T10:15:00.000Z",
        },
      ],
      auditEvents: [],
    });

    await useSalaryReview.getState().addApprovalProposalNote("Need supporting context");

    const state = useSalaryReview.getState();
    expect(addSalaryReviewProposalNoteMock).toHaveBeenCalledWith("submitted-4", {
      note: "Need supporting context",
      employeeId: undefined,
      stepId: undefined,
    });
    expect(fetchSalaryReviewProposalDetailMock).toHaveBeenCalledWith("submitted-4");
    expect(state.selectedApprovalNotes[0]?.note).toBe("Need supporting context");
    expect(state.activeProposal?.id).toBe("draft-1");
  });
});
