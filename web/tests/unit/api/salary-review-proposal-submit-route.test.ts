import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  getWorkspaceContextMock,
  buildDraftItemsFromRecordsMock,
  loadSalaryReviewProposalDetailMock,
  rebuildApprovalStepsForItemsMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getWorkspaceContextMock: vi.fn(),
  buildDraftItemsFromRecordsMock: vi.fn(),
  loadSalaryReviewProposalDetailMock: vi.fn(),
  rebuildApprovalStepsForItemsMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/workspace-context", () => ({
  getWorkspaceContext: getWorkspaceContextMock,
}));

vi.mock("@/lib/salary-review/proposal-server", () => ({
  buildDraftItemsFromRecords: buildDraftItemsFromRecordsMock,
  loadSalaryReviewProposalDetail: loadSalaryReviewProposalDetailMock,
  rebuildApprovalStepsForItems: rebuildApprovalStepsForItemsMock,
}));

import { POST } from "@/app/api/salary-review/proposals/[proposalId]/submit/route";

describe("POST /api/salary-review/proposals/[proposalId]/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks department submission until Finance approves the split allocation", async () => {
    createClientMock.mockResolvedValue({
      from: vi.fn(),
    });
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "ws-1",
        user_id: "user-1",
      },
    });
    loadSalaryReviewProposalDetailMock.mockResolvedValue({
      proposal: {
        id: "child-1",
        workspace_id: "ws-1",
        review_mode: "department_split",
        review_scope: "department",
        allocation_method: "finance_approval",
        allocation_status: "pending",
      },
      items: [],
      approvalSteps: [],
      notes: [],
      auditEvents: [],
      departmentAllocations: [],
      childCycles: [],
    });

    const response = await POST(
      new Request("http://localhost/api/salary-review/proposals/child-1/submit", {
        method: "POST",
      }) as never,
      { params: Promise.resolve({ proposalId: "child-1" }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "Department review is locked until Finance approves the department budget.",
    });
  });
});
