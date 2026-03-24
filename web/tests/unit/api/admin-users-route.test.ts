import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireSuperAdminMock, createServiceClientMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  createServiceClientMock: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

import { GET } from "@/app/api/admin/users/route";

function createServiceSupabase() {
  return {
    from(table: string) {
      if (table === "profiles") {
        return {
          select(columns: string) {
            if (columns.includes("created_at")) {
              return Promise.resolve({
                data: null,
                error: { message: "column profiles.created_at does not exist" },
              });
            }

            return {
              limit() {
                return Promise.resolve({
                  data: [
                    {
                      id: "user-1",
                      full_name: "Ada Lovelace",
                      role: "admin",
                      workspace_id: "workspace-1",
                    },
                  ],
                  error: null,
                });
              },
            };
          },
        };
      }

      if (table === "workspaces") {
        return {
          select() {
            return {
              in() {
                return Promise.resolve({
                  data: [{ id: "workspace-1", name: "Qeemly" }],
                  error: null,
                });
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
    auth: {
      admin: {
        listUsers() {
          return Promise.resolve({
            data: {
              users: [
                {
                  id: "user-1",
                  email: "ada@qeemly.com",
                  created_at: "2026-03-01T10:00:00.000Z",
                  last_sign_in_at: "2026-03-24T09:00:00.000Z",
                },
              ],
            },
            error: null,
          });
        },
      },
    },
  };
}

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSuperAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
  });

  it("returns users even when profiles has no created_at column", async () => {
    createServiceClientMock.mockReturnValue(createServiceSupabase());

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual([
      {
        id: "user-1",
        full_name: "Ada Lovelace",
        role: "admin",
        email: "ada@qeemly.com",
        created_at: "2026-03-01T10:00:00.000Z",
        last_sign_in_at: "2026-03-24T09:00:00.000Z",
        workspace_name: "Qeemly",
      },
    ]);
  });
});
