import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, getWorkspaceContextMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getWorkspaceContextMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/workspace-context", () => ({
  getWorkspaceContext: getWorkspaceContextMock,
}));

import { GET, PATCH } from "@/app/api/onboarding/route";

const baseContext = {
  workspace_id: "ws-1",
  is_override: false,
  override_workspace_id: null as string | null,
  profile_workspace_id: "ws-1",
  is_super_admin: false,
  user_id: "user-1",
  user_email: "u@example.com",
};

function emptyStep() {
  return { completed: false, completedAt: null };
}

describe("GET /api/onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWorkspaceContextMock.mockResolvedValue({ context: baseContext });
  });

  it("returns 401 when workspace context is missing", async () => {
    getWorkspaceContextMock.mockResolvedValue({ error: "Unauthorized", status: 401 });
    createClientMock.mockResolvedValue({ from: vi.fn() });

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns default onboarding state when no settings row exists", async () => {
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.steps.company_profile).toEqual(emptyStep());
    expect(body.steps.compensation_defaults).toEqual(emptyStep());
    expect(body.steps.upload_completed).toEqual(emptyStep());
    expect(body.steps.upload_skipped).toEqual(emptyStep());
    expect(body.steps.first_benchmark).toEqual(emptyStep());
    expect(body.steps.completed).toEqual(emptyStep());
    expect(body.currentStep).toBe("company_profile");
    expect(body.isComplete).toBe(false);
    expect(body.canBenchmark).toBe(false);
  });

  it("computes currentStep, canBenchmark, and isComplete from timestamps", async () => {
    const t1 = "2026-04-10T10:00:00.000Z";
    const t2 = "2026-04-10T11:00:00.000Z";
    const t3 = "2026-04-10T12:00:00.000Z";

    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                onboarding_company_profile_completed_at: t1,
                onboarding_compensation_defaults_completed_at: t2,
                onboarding_upload_completed_at: null,
                onboarding_upload_skipped_at: t3,
                onboarding_first_benchmark_completed_at: null,
                onboarding_completed_at: null,
              },
              error: null,
            }),
          })),
        })),
      })),
    });

    const res = await GET();
    const body = await res.json();

    expect(body.canBenchmark).toBe(true);
    expect(body.currentStep).toBe("first_benchmark");
    expect(body.isComplete).toBe(false);
    expect(body.steps.upload_skipped.completedAt).toBe(t3);
  });

  it("returns complete when onboarding_completed_at is set", async () => {
    const done = "2026-04-15T08:00:00.000Z";
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                onboarding_company_profile_completed_at: "2026-04-01T00:00:00.000Z",
                onboarding_compensation_defaults_completed_at: "2026-04-02T00:00:00.000Z",
                onboarding_upload_completed_at: "2026-04-03T00:00:00.000Z",
                onboarding_upload_skipped_at: null,
                onboarding_first_benchmark_completed_at: "2026-04-04T00:00:00.000Z",
                onboarding_completed_at: done,
              },
              error: null,
            }),
          })),
        })),
      })),
    });

    const res = await GET();
    const body = await res.json();
    expect(body.currentStep).toBe("complete");
    expect(body.isComplete).toBe(true);
    expect(body.steps.completed.completed).toBe(true);
    expect(body.steps.completed.completedAt).toBe(done);
  });
});

describe("PATCH /api/onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWorkspaceContextMock.mockResolvedValue({ context: baseContext });
  });

  it("returns 403 for non-admin members", async () => {
    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: { role: "member" }, error: null }),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const res = await PATCH(
      new Request("http://localhost/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "company_profile" }),
      }) as never,
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 for an invalid step", async () => {
    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const res = await PATCH(
      new Request("http://localhost/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "not_a_step" }),
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("inserts a new workspace_settings row when none exists", async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            onboarding_company_profile_completed_at: "2026-04-15T09:00:00.000Z",
            onboarding_compensation_defaults_completed_at: null,
            onboarding_upload_completed_at: null,
            onboarding_upload_skipped_at: null,
            onboarding_first_benchmark_completed_at: null,
            onboarding_completed_at: null,
            is_configured: false,
          },
          error: null,
        }),
      }),
    });

    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
              })),
            })),
          };
        }
        if (table === "workspace_settings") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
              })),
            })),
            insert: insertMock,
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const res = await PATCH(
      new Request("http://localhost/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "company_profile" }),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalled();
    const insertArg = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.workspace_id).toBe("ws-1");
    expect(insertArg.onboarding_company_profile_completed_at).toBeDefined();
    const body = await res.json();
    expect(body.steps.company_profile.completed).toBe(true);
  });

  it("updates an existing row and sets is_configured when step is completed", async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              onboarding_company_profile_completed_at: "2026-04-01T00:00:00.000Z",
              onboarding_compensation_defaults_completed_at: "2026-04-02T00:00:00.000Z",
              onboarding_upload_completed_at: "2026-04-03T00:00:00.000Z",
              onboarding_upload_skipped_at: null,
              onboarding_first_benchmark_completed_at: "2026-04-04T00:00:00.000Z",
              onboarding_completed_at: "2026-04-15T10:00:00.000Z",
              is_configured: true,
            },
            error: null,
          }),
        }),
      }),
    });

    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
              })),
            })),
          };
        }
        if (table === "workspace_settings") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "settings-1" }, error: null }),
              })),
            })),
            update: updateMock,
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const res = await PATCH(
      new Request("http://localhost/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "completed" }),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalled();
    const updateArg = updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(updateArg.is_configured).toBe(true);
    expect(updateArg.onboarding_completed_at).toBeDefined();
    const body = await res.json();
    expect(body.isComplete).toBe(true);
    expect(body.currentStep).toBe("complete");
  });

  it("allows super admins without admin profile role", async () => {
    getWorkspaceContextMock.mockResolvedValue({
      context: { ...baseContext, is_super_admin: true },
    });

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              onboarding_company_profile_completed_at: "2026-04-15T09:00:00.000Z",
              onboarding_compensation_defaults_completed_at: null,
              onboarding_upload_completed_at: null,
              onboarding_upload_skipped_at: null,
              onboarding_first_benchmark_completed_at: null,
              onboarding_completed_at: null,
              is_configured: false,
            },
            error: null,
          }),
        }),
      }),
    });

    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "workspace_settings") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "settings-1" }, error: null }),
              })),
            })),
            update: updateMock,
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const res = await PATCH(
      new Request("http://localhost/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "company_profile" }),
      }) as never,
    );

    expect(res.status).toBe(200);
  });
});
