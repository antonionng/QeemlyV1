import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((href: string) => {
  throw new Error(`redirect:${href}`);
});

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

function buildSupabaseClient(options: { userId: string | null; role?: string | null }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.userId ? { id: options.userId } : null },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: options.userId ? { role: options.role ?? "admin" } : null,
          }),
        })),
      })),
    })),
  };
}

describe("root route redirect", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    createClientMock.mockReset();
  });

  it("redirects anonymous users to marketing home", async () => {
    createClientMock.mockResolvedValue(buildSupabaseClient({ userId: null }));
    const { default: RootPage } = await import("@/app/page");

    await expect(RootPage()).rejects.toThrowError("redirect:/home");
    expect(redirectMock).toHaveBeenCalledWith("/home");
  });

  it("redirects authenticated admins to dashboard overview", async () => {
    createClientMock.mockResolvedValue(buildSupabaseClient({ userId: "user-1", role: "admin" }));
    const { default: RootPage } = await import("@/app/page");

    await expect(RootPage()).rejects.toThrowError("redirect:/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects authenticated employees to employee dashboard", async () => {
    createClientMock.mockResolvedValue(buildSupabaseClient({ userId: "user-2", role: "employee" }));
    const { default: RootPage } = await import("@/app/page");

    await expect(RootPage()).rejects.toThrowError("redirect:/dashboard/me");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/me");
  });
});
