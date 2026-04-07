import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { GET } from "@/app/auth/accept-invite/route";

describe("GET /auth/accept-invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login with an error when linking an existing account fails", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "team_invitations") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "invite-1",
                    email: "employee@example.com",
                    workspace_id: "workspace-1",
                    role: "employee",
                    status: "pending",
                  },
                }),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            })),
          };
        }

        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "user-1",
                    role: "member",
                    workspace_id: "workspace-1",
                  },
                }),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                error: { message: "profile update failed" },
              }),
            })),
          };
        }

        if (table === "employees") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "employee-1" },
                  }),
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const response = await GET(
      new Request("http://localhost/auth/accept-invite?token=invite-token"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login?error=invite_accept_failed");
  });
});
