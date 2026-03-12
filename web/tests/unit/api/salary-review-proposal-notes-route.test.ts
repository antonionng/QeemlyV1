import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  getWorkspaceContextMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getWorkspaceContextMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/workspace-context", () => ({
  getWorkspaceContext: getWorkspaceContextMock,
}));

import { POST } from "@/app/api/salary-review/proposals/[proposalId]/notes/route";

describe("POST /api/salary-review/proposals/[proposalId]/notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects notes on draft proposals", async () => {
    const insertMock = vi.fn();
    const fromMock = vi.fn((table: string) => {
      if (table === "salary_review_cycles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "proposal-1",
                    workspace_id: "ws-1",
                    status: "draft",
                  },
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      return {
        insert: insertMock,
      };
    });

    createClientMock.mockResolvedValue({ from: fromMock });
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "ws-1",
        is_override: false,
        override_workspace_id: null,
        profile_workspace_id: "ws-1",
        is_super_admin: false,
        user_id: "user-1",
        user_email: "user@example.com",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/salary-review/proposals/proposal-1/notes", {
        method: "POST",
        body: JSON.stringify({ note: "Need context" }),
      }) as never,
      { params: Promise.resolve({ proposalId: "proposal-1" }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Notes are only available after submission." });
    expect(insertMock).not.toHaveBeenCalled();
  });
});
