/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TeamPage from "@/app/(dashboard)/dashboard/team/page";

function createJsonResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  } satisfies Partial<Response>;
}

describe("TeamPage workspace refresh", () => {
  let container: HTMLDivElement;
  let canManageTeam = true;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    canManageTeam = true;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === "/api/team") {
          return createJsonResponse({
            members: [],
            invitations: [],
            current_user_role: "admin",
            can_manage_team: canManageTeam,
            management_notice: canManageTeam
              ? null
              : "Team management is read-only while viewing another workspace as super admin.",
          });
        }

        throw new Error(`Unexpected fetch: ${String(input)}`);
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    container.remove();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  });

  it("reloads team data when the active workspace changes", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(TeamPage));
      await Promise.resolve();
    });

    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("qeemly:workspace-changed", {
          detail: { workspaceId: "workspace-2", source: "override" },
        }),
      );
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      root.unmount();
    });
  });

  it("shows a read-only notice and hides invite controls when team management is restricted", async () => {
    canManageTeam = false;
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(TeamPage));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("read-only");
    expect(container.textContent).not.toContain("Invite Team Member");
    expect(container.textContent).not.toContain("Send Invitation");

    await act(async () => {
      root.unmount();
    });
  });
});
