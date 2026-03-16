import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  getWorkspaceContextMock,
  applyApprovalActionToStepsMock,
  loadSalaryReviewProposalDetailMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getWorkspaceContextMock: vi.fn(),
  applyApprovalActionToStepsMock: vi.fn(),
  loadSalaryReviewProposalDetailMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/workspace-context", () => ({
  getWorkspaceContext: getWorkspaceContextMock,
}));

vi.mock("@/lib/salary-review/proposal-server", () => ({
  applyApprovalActionToSteps: applyApprovalActionToStepsMock,
  loadSalaryReviewProposalDetail: loadSalaryReviewProposalDetailMock,
}));

import { PATCH } from "@/app/api/salary-review/proposals/[proposalId]/route";

describe("PATCH /api/salary-review/proposals/[proposalId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves a pending finance allocation on a split master cycle and unlocks child cycles", async () => {
    const existingProposal = {
      id: "master-1",
      workspace_id: "ws-1",
      status: "submitted",
      review_mode: "department_split",
      review_scope: "master",
      allocation_method: "finance_approval",
      allocation_status: "pending",
    };
    const cycleUpdateMock = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));
    const allocationUpdateMock = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));
    const approvalStepSelectMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    }));
    const auditInsertMock = vi.fn().mockResolvedValue({ error: null });

    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "salary_review_cycles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn((field: string) => {
                if (field === "id") {
                  return {
                    eq: vi.fn(() => ({
                      single: vi.fn().mockResolvedValue({ data: existingProposal, error: null }),
                    })),
                  };
                }
                throw new Error(`Unexpected cycle select field: ${field}`);
              }),
            })),
            update: cycleUpdateMock,
          };
        }
        if (table === "salary_review_department_allocations") {
          return {
            update: allocationUpdateMock,
          };
        }
        if (table === "salary_review_approval_steps") {
          return {
            select: approvalStepSelectMock,
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ error: null }),
              })),
            })),
          };
        }
        if (table === "salary_review_audit_events") {
          return {
            insert: auditInsertMock,
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "ws-1",
        user_id: "user-1",
      },
    });

    applyApprovalActionToStepsMock.mockReturnValue({
      proposalStatus: "approved",
      steps: [],
      finalStatus: "approved",
    });
    loadSalaryReviewProposalDetailMock.mockResolvedValue({
      proposal: {
        ...existingProposal,
        allocation_status: "approved",
      },
      items: [],
      approvalSteps: [],
      notes: [],
      auditEvents: [],
      departmentAllocations: [],
      childCycles: [],
    });

    const response = await PATCH(
      new Request("http://localhost/api/salary-review/proposals/master-1", {
        method: "PATCH",
        body: JSON.stringify({
          action: "approve",
          note: "Finance approved allocations",
        }),
      }) as never,
      { params: Promise.resolve({ proposalId: "master-1" }) }
    );

    expect(response.status).toBe(200);
    expect(cycleUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        allocation_status: "approved",
      })
    );
    expect(allocationUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        allocation_status: "approved",
      })
    );
  });
});
