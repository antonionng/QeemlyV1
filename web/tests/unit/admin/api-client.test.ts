import { describe, expect, it } from "vitest";
import {
  AdminApiError,
  adminErrorResponse,
  adminRouteErrorResponse,
  fetchAdminJson,
  normalizeAdminApiError,
  throwIfAdminQueryError,
} from "@/lib/admin/api-client";

describe("adminRouteErrorResponse", () => {
  it("maps missing service role errors to a configuration response", async () => {
    const response = adminRouteErrorResponse(
      new Error("SUPABASE_SERVICE_ROLE_KEY is required for service client usage.")
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "Admin configuration error",
      detail: "SUPABASE_SERVICE_ROLE_KEY is missing on the server.",
    });
  });

  it("maps unexpected failures to a safe default response", async () => {
    const response = adminRouteErrorResponse(new Error("boom"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "Admin request failed",
      detail: "boom",
    });
  });
});

describe("adminErrorResponse", () => {
  it("creates typed route error responses", async () => {
    const response = adminErrorResponse("Forbidden", { status: 403, detail: "Not a superadmin" });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      error: "Forbidden",
      detail: "Not a superadmin",
    });
  });
});

describe("fetchAdminJson", () => {
  it("throws a typed admin api error for failed json responses", async () => {
    const originalFetch = global.fetch;
    global.fetch = (async () =>
      new Response(JSON.stringify({ error: "Admin configuration error", detail: "Missing key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;

    await expect(fetchAdminJson("/api/admin/stats")).rejects.toMatchObject({
      name: "AdminApiError",
      status: 500,
      message: "Admin configuration error",
      detail: "Missing key",
    });

    global.fetch = originalFetch;
  });

  it("throws a typed admin api error for failed text responses", async () => {
    const originalFetch = global.fetch;
    global.fetch = (async () =>
      new Response("Gateway exploded", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      })) as typeof fetch;

    await expect(fetchAdminJson("/api/admin/stats")).rejects.toMatchObject({
      name: "AdminApiError",
      status: 502,
      message: "Gateway exploded",
      detail: null,
    });

    global.fetch = originalFetch;
  });

  it("returns parsed json for successful responses", async () => {
    const originalFetch = global.fetch;
    global.fetch = (async () =>
      new Response(JSON.stringify({ total: 3 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;

    await expect(fetchAdminJson<{ total: number }>("/api/admin/stats")).resolves.toEqual({ total: 3 });

    global.fetch = originalFetch;
  });
});

describe("normalizeAdminApiError", () => {
  it("preserves typed admin api errors", () => {
    const error = normalizeAdminApiError(
      new AdminApiError("Admin configuration error", 500, "SUPABASE_SERVICE_ROLE_KEY is missing on the server.")
    );

    expect(error).toEqual({
      title: "Admin configuration error",
      detail: "SUPABASE_SERVICE_ROLE_KEY is missing on the server.",
      status: 500,
    });
  });

  it("falls back to generic details for unknown failures", () => {
    const error = normalizeAdminApiError(new Error("boom"));

    expect(error).toEqual({
      title: "Admin request failed",
      detail: "boom",
      status: null,
    });
  });
});

describe("throwIfAdminQueryError", () => {
  it("does nothing when the query succeeded", () => {
    expect(() => throwIfAdminQueryError(null, "Load sources")).not.toThrow();
  });

  it("throws a contextual error when the query failed", () => {
    expect(() =>
      throwIfAdminQueryError({ message: "relation does not exist" }, "Load sources")
    ).toThrow("Load sources: relation does not exist");
  });
});
