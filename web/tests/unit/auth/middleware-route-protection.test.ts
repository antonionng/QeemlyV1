import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

import { updateSession } from "@/lib/supabase/middleware";

type MockRequest = {
  nextUrl: URL & { clone: () => URL };
  cookies: {
    getAll: () => Array<{ name: string; value: string }>;
    get: (name: string) => { name: string; value: string } | undefined;
  };
};

function createRequest(
  pathname: string,
  options: { cookies?: Record<string, string> } = {},
): MockRequest {
  const nextUrl = new URL(`http://localhost${pathname}`) as URL & { clone: () => URL };
  nextUrl.clone = () => new URL(nextUrl.toString());

  const cookies = options.cookies ?? {};

  return {
    nextUrl,
    cookies: {
      getAll: () =>
        Object.entries(cookies).map(([name, value]) => ({ name, value })),
      get: (name: string) =>
        name in cookies ? { name, value: cookies[name] } : undefined,
    },
  };
}

describe("updateSession", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalSuperadmins = process.env.QEEMLY_SUPERADMINS;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    delete process.env.QEEMLY_SUPERADMINS;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
    if (originalSuperadmins === undefined) {
      delete process.env.QEEMLY_SUPERADMINS;
    } else {
      process.env.QEEMLY_SUPERADMINS = originalSuperadmins;
    }
  });

  it("redirects dashboard requests to login when auth env is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await updateSession(createRequest("/dashboard/overview") as never);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects admin requests to admin login when auth lookup throws", async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockRejectedValue(new Error("Supabase auth timeout")),
      },
    });

    const response = await updateSession(createRequest("/admin") as never);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/admin/login");
  });

  it("keeps public auth routes accessible when auth env is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await updateSession(createRequest("/login") as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects incomplete admin workspaces from dashboard to onboarding", async () => {
    process.env.QEEMLY_SUPERADMINS = "other@example.com";

    const profilesSingle = vi.fn().mockResolvedValue({
      data: { role: "admin", workspace_id: "00000000-0000-0000-0000-000000000099" },
      error: null,
    });
    const workspaceMaybeSingle = vi.fn().mockResolvedValue({
      data: { onboarding_completed_at: null, is_configured: false },
      error: null,
    });

    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "admin@example.com" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: profilesSingle,
          };
        }
        if (table === "workspace_settings") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: workspaceMaybeSingle,
          };
        }
        return {};
      }),
    });

    const response = await updateSession(createRequest("/dashboard/overview") as never);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/onboarding");
  });

  it("does not redirect admins from exempt dashboard paths when onboarding is incomplete", async () => {
    process.env.QEEMLY_SUPERADMINS = "other@example.com";

    const profilesSingle = vi.fn().mockResolvedValue({
      data: { role: "admin", workspace_id: "00000000-0000-0000-0000-000000000099" },
      error: null,
    });

    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "admin@example.com" } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: profilesSingle,
          };
        }
        return {};
      }),
    });

    const response = await updateSession(createRequest("/dashboard/upload") as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(createServerClientMock.mock.results[0]?.value.from).not.toHaveBeenCalledWith(
      "workspace_settings",
    );
  });
});
