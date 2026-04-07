/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchDbEmployeesMock } = vi.hoisted(() => ({
  fetchDbEmployeesMock: vi.fn(),
}));

vi.mock("@/lib/employees/data-service", () => ({
  fetchDbEmployees: fetchDbEmployeesMock,
}));

import { usePeople } from "@/lib/people/use-people";

function PeopleHarness() {
  usePeople();
  return React.createElement("div", null, "people");
}

describe("usePeople workspace refresh", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.clearAllMocks();
    fetchDbEmployeesMock.mockResolvedValue([]);
  });

  afterEach(() => {
    container.remove();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  });

  it("reloads employees when the active workspace changes", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(PeopleHarness));
      await Promise.resolve();
    });

    expect(fetchDbEmployeesMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("qeemly:workspace-changed", {
          detail: { workspaceId: "workspace-2", source: "override" },
        }),
      );
      await Promise.resolve();
    });

    expect(fetchDbEmployeesMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      root.unmount();
    });
  });
});
