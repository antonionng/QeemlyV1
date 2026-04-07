/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { isFeatureEnabledMock } = vi.hoisted(() => ({
  isFeatureEnabledMock: vi.fn(),
}));

vi.mock("@/lib/release/ga-scope", () => ({
  isFeatureEnabled: isFeatureEnabledMock,
}));

import BillingPage from "@/app/(dashboard)/dashboard/billing/page";

function createJsonResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  } satisfies Partial<Response>;
}

describe("BillingPage", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.clearAllMocks();
    isFeatureEnabledMock.mockReturnValue(true);

    let activeWorkspace = "Workspace One";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/settings") {
          return createJsonResponse({
            workspace_name: activeWorkspace,
          });
        }

        if (url === "/api/billing") {
          return createJsonResponse({
            subscription: null,
            plans: [],
            invoices: [],
          });
        }

        if (url === "__switch_workspace__") {
          activeWorkspace = "Workspace Two";
          return createJsonResponse({ ok: true });
        }

        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    container.remove();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  });

  it("renders an honest empty subscription state and refetches on workspace change", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(BillingPage));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("No active plan");
    expect(container.textContent).not.toContain("Active");

    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock).toHaveBeenCalledWith("/api/settings");
    expect(fetchMock).toHaveBeenCalledWith("/api/billing");

    await act(async () => {
      await globalThis.fetch("__switch_workspace__");
      window.dispatchEvent(
        new CustomEvent("qeemly:workspace-changed", {
          detail: { workspaceId: "workspace-2", source: "override" },
        }),
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Workspace Two");

    await act(async () => {
      root.unmount();
    });
  });
});
