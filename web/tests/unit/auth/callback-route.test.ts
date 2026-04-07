import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("redirects successful exchanges to a safe relative path", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    const response = await GET(
      new Request("http://localhost/auth/callback?code=abc123&next=/dashboard/settings"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard/settings");
  });

  it("falls back to the default dashboard when next is an absolute URL", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    const response = await GET(
      new Request("http://localhost/auth/callback?code=abc123&next=https://evil.example/steal"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("redirects failed exchanges to login with a visible error code", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: { message: "bad code" } }),
      },
    });

    const response = await GET(
      new Request("http://localhost/auth/callback?code=bad-code&next=/admin"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login?error=auth_callback_failed");
  });
});
