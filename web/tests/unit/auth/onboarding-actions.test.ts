import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, revalidatePathMock, redirectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn((href: string) => {
    throw new Error(`redirect:${href}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { signup } from "@/app/login/actions";
import { employeeSignup } from "@/app/register/employee/actions";

describe("onboarding actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an actionable error when workspace creation fails during signup", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "workspaces") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "duplicate slug" },
                }),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set("email", "founder@example.com");
    formData.set("password", "password123");
    formData.set("name", "Founder");
    formData.set("company", "Qeemly");

    const result = await signup(formData);

    expect(result).toEqual({
      error: "We created your account but could not finish setting up your workspace. Please try again or contact support.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns an actionable error when employee profile creation fails", async () => {
    const profileInsertMock = vi.fn().mockResolvedValue({
      error: { message: "profile insert failed" },
    });
    const invitationUpdateMock = vi.fn();

    createClientMock.mockResolvedValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: "user-2" } },
          error: null,
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
            update: invitationUpdateMock,
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

        if (table === "profiles") {
          return {
            insert: profileInsertMock,
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set("email", "employee@example.com");
    formData.set("password", "password123");
    formData.set("name", "Employee");
    formData.set("token", "invite-token");

    const result = await employeeSignup(formData);

    expect(result).toEqual({
      error: "We created your account but could not finish linking your invitation. Please contact your workspace admin.",
    });
    expect(profileInsertMock).toHaveBeenCalledTimes(1);
    expect(invitationUpdateMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
