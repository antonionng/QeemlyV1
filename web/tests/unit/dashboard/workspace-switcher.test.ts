/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { refreshMock, companySettingsState } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  companySettingsState: {
    companyName: "Workspace One",
    companyLogo: null as string | null,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("lucide-react", () => ({
  Building2: () => React.createElement("svg"),
  ChevronDown: () => React.createElement("svg"),
  Check: () => React.createElement("svg"),
  Loader2: () => React.createElement("svg"),
  Eye: () => React.createElement("svg"),
  X: () => React.createElement("svg"),
  ShieldAlert: () => React.createElement("svg"),
}));

vi.mock("@/lib/company", () => ({
  useCompanySettings: () => companySettingsState,
  getCompanyInitials: (value: string) =>
    value
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase(),
}));

import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";

function createJsonResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  } satisfies Partial<Response>;
}

describe("WorkspaceSwitcher", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    refreshMock.mockReset();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (url === "/api/admin/workspaces/list") {
          return createJsonResponse({
            workspaces: [
              { id: "ws-1", name: "Workspace One", slug: "workspace-one" },
              { id: "ws-2", name: "Workspace Two", slug: "workspace-two" },
            ],
            current_workspace_id: "ws-1",
            is_super_admin: true,
          });
        }

        if (url === "/api/admin/workspace-override" && method === "GET") {
          return createJsonResponse({
            is_overriding: false,
            workspace: null,
          });
        }

        if (url === "/api/settings") {
          return createJsonResponse({
            workspace_id: "ws-1",
            workspace_name: "Workspace One",
            workspace_slug: "workspace-one",
          });
        }

        if (url === "/api/admin/workspace-override" && method === "POST") {
          return createJsonResponse({
            success: true,
            workspace: { id: "ws-2", name: "Workspace Two", slug: "workspace-two" },
          });
        }

        throw new Error(`Unexpected fetch: ${method} ${url}`);
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    container.remove();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  });

  it("emits a workspace change event after switching workspace", async () => {
    const root = createRoot(container);
    const eventSpy = vi.fn();

    window.addEventListener("qeemly:workspace-changed", ((event: Event) => {
      eventSpy((event as CustomEvent).detail);
    }) as EventListener);

    await act(async () => {
      root.render(React.createElement(WorkspaceSwitcher));
    });

    const openButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Workspace One"),
    );

    expect(openButton).toBeTruthy();

    await act(async () => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const workspaceButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Workspace Two"),
    );

    expect(workspaceButton).toBeTruthy();

    await act(async () => {
      workspaceButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith({
      workspaceId: "ws-2",
      source: "override",
    });

    await act(async () => {
      root.unmount();
    });
  });
});
