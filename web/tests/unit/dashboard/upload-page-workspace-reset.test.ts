/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { resetMock } = vi.hoisted(() => ({
  resetMock: vi.fn(),
}));

vi.mock("@/lib/upload", () => ({
  useUploadStore: () => ({
    reset: resetMock,
  }),
}));

vi.mock("@/components/dashboard/upload", () => ({
  UploadWizard: () => React.createElement("div", null, "upload wizard"),
}));

import UploadPage from "@/app/(dashboard)/dashboard/upload/page";

describe("UploadPage workspace reset", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    container.remove();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  });

  it("resets the upload wizard when the workspace changes", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(UploadPage));
      await Promise.resolve();
    });

    expect(resetMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("qeemly:workspace-changed", {
          detail: { workspaceId: "workspace-2", source: "override" },
        }),
      );
      await Promise.resolve();
    });

    expect(resetMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      root.unmount();
    });
  });
});
