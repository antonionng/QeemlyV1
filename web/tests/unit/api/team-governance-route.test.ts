import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  createServiceClientMock,
  getWorkspaceContextMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  getWorkspaceContextMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/workspace-context", () => ({
  getWorkspaceContext: getWorkspaceContextMock,
}));

import { DELETE, GET, PATCH } from "@/app/api/team/route";
import { POST as invitePost } from "@/app/api/team/invite/route";

describe("team governance policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "workspace-override",
        is_override: true,
        override_workspace_id: "workspace-override",
        profile_workspace_id: "workspace-home",
        is_super_admin: true,
        user_id: "user-1",
        user_email: "admin@example.com",
      },
    });
  });

  it("marks override views as read-only in the team payload", async () => {
    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { role: "admin" },
                }),
              })),
              order: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            })),
          };
        }

        if (table === "team_invitations") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [],
                  }),
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });
    createServiceClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }

        if (table === "team_invitations") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [],
                  }),
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.can_manage_team).toBe(false);
    expect(payload.management_notice).toContain("read-only");
  });

  it("blocks role changes while a super admin is viewing another workspace", async () => {
    createClientMock.mockResolvedValue({ from: vi.fn() });

    const response = await PATCH(
      new Request("http://localhost/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: "member-1", role: "admin" }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toContain("read-only");
    expect(createServiceClientMock).not.toHaveBeenCalled();
  });

  it("blocks member removal while a super admin is viewing another workspace", async () => {
    createClientMock.mockResolvedValue({ from: vi.fn() });

    const response = await DELETE(
      new Request("http://localhost/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: "member-1" }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toContain("read-only");
    expect(createServiceClientMock).not.toHaveBeenCalled();
  });

  it("blocks invites while a super admin is viewing another workspace", async () => {
    createClientMock.mockResolvedValue({ from: vi.fn() });

    const response = await invitePost(
      new Request("http://localhost/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "new@example.com", role: "member" }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toContain("read-only");
  });
});
