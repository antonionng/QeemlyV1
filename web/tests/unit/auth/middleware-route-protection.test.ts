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
  cookies: { getAll: () => Array<{ name: string; value: string }> };
};

function createRequest(pathname: string): MockRequest {
  const nextUrl = new URL(`http://localhost${pathname}`) as URL & { clone: () => URL };
  nextUrl.clone = () => new URL(nextUrl.toString());

  return {
    nextUrl,
    cookies: {
      getAll: () => [],
    },
  };
}

describe("updateSession", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
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
});
