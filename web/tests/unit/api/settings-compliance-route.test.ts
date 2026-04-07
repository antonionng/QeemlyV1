import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getWorkspaceContextOrErrorMock,
  requireAdminForWorkspaceMock,
  sanitizeComplianceSettingsPayloadMock,
  createClientMock,
  upsertMock,
  selectMock,
  singleMock,
} = vi.hoisted(() => ({
  getWorkspaceContextOrErrorMock: vi.fn(),
  requireAdminForWorkspaceMock: vi.fn(),
  sanitizeComplianceSettingsPayloadMock: vi.fn(),
  createClientMock: vi.fn(),
  upsertMock: vi.fn(),
  selectMock: vi.fn(),
  singleMock: vi.fn(),
}));

vi.mock("@/app/api/settings/compliance/_shared", () => ({
  getWorkspaceContextOrError: getWorkspaceContextOrErrorMock,
  requireAdminForWorkspace: requireAdminForWorkspaceMock,
  sanitizeComplianceSettingsPayload: sanitizeComplianceSettingsPayloadMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { PATCH } from "@/app/api/settings/compliance/route";

describe("PATCH /api/settings/compliance", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getWorkspaceContextOrErrorMock.mockResolvedValue({
      context: {
        workspace_id: "workspace-1",
        user_id: "user-1",
        is_super_admin: false,
      },
    });
    requireAdminForWorkspaceMock.mockResolvedValue(null);
    sanitizeComplianceSettingsPayloadMock.mockReturnValue({
      updates: {
        default_jurisdictions: ["UAE"],
        allow_manual_overrides: true,
      },
    });

    singleMock.mockResolvedValue({
      data: {
        workspace_id: "workspace-1",
        default_jurisdictions: ["UAE"],
        allow_manual_overrides: true,
        is_compliance_configured: true,
      },
      error: null,
    });
    selectMock.mockReturnValue({ single: singleMock });
    upsertMock.mockReturnValue({ select: selectMock });
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        upsert: upsertMock,
      })),
    });
  });

  it("marks compliance settings configured on successful save", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/settings/compliance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_jurisdictions: ["UAE"],
          allow_manual_overrides: true,
        }),
      }) as never,
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: "workspace-1",
        default_jurisdictions: ["UAE"],
        allow_manual_overrides: true,
        is_compliance_configured: true,
      }),
      { onConflict: "workspace_id" },
    );

    const payload = await response.json();
    expect(payload).toEqual({
      success: true,
      settings: {
        workspace_id: "workspace-1",
        default_jurisdictions: ["UAE"],
        allow_manual_overrides: true,
        is_compliance_configured: true,
      },
    });
  });

  it("hides raw database details when the save fails", async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: {
        code: "42P01",
        message: 'relation "workspace_compliance_settings" does not exist',
      },
    });

    const response = await PATCH(
      new Request("http://localhost/api/settings/compliance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_jurisdictions: ["UAE"],
          allow_manual_overrides: true,
        }),
      }) as never,
    );

    expect(response.status).toBe(500);

    const payload = await response.json();
    expect(payload).toEqual({
      error: "This feature is temporarily unavailable. Please try again in a moment.",
      message: "This feature is temporarily unavailable. Please try again in a moment.",
      code: "service_unavailable",
      action: "Refresh the page or try again in a few minutes.",
    });
  });
});
