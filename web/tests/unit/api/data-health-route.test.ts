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

import { GET } from "@/app/api/data/health/route";

describe("GET /api/data/health", () => {
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

  it("loads freshness and sync logs for the effective override workspace", async () => {
    const freshnessEqMock = vi.fn(() => ({
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: "freshness-1",
            metric_type: "benchmarks",
          },
        ],
      }),
    }));
    const integrationsEqMock = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: [{ id: "integration-1" }],
      }),
    }));
    const syncLogsInMock = vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue({
          data: [{ id: "sync-1", integration_id: "integration-1", status: "success" }],
        }),
      })),
    }));

    createClientMock.mockResolvedValue({});
    createServiceClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "data_freshness_metrics") {
          return {
            select: vi.fn(() => ({
              eq: freshnessEqMock,
            })),
          };
        }

        if (table === "integrations") {
          return {
            select: vi.fn(() => ({
              eq: integrationsEqMock,
            })),
          };
        }

        if (table === "integration_sync_logs") {
          return {
            select: vi.fn(() => ({
              in: syncLogsInMock,
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(freshnessEqMock).toHaveBeenCalledWith("workspace_id", "workspace-override");
    expect(integrationsEqMock).toHaveBeenCalledWith("workspace_id", "workspace-override");
    expect(payload.freshness).toHaveLength(1);
    expect(payload.syncLogs).toHaveLength(1);
  });

  it("returns a safe warning when the service client is unavailable", async () => {
    createClientMock.mockResolvedValue({});
    createServiceClientMock.mockImplementation(() => {
      throw new Error("service_role_key missing from environment");
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      freshness: [],
      syncLogs: [],
      warning: "Data health details are temporarily unavailable. Please try again in a few minutes.",
    });
  });
});
