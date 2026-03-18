/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("lucide-react", () => ({
  Sparkles: () => React.createElement("svg"),
  X: () => React.createElement("svg"),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

import { MarketRefreshBanner } from "@/components/dashboard/market-refresh-banner";

describe("MarketRefreshBanner", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
    });
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    container.remove();
  });

  it("renders the latest publish event and dismisses it per event id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            event: {
              id: "publish-1",
              title: "Qeemly Market Data Updated",
              summary: "Fresh GCC benchmark coverage is now live across the platform.",
              rowCount: 212,
              publishedAt: "2026-03-17T10:00:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(MarketRefreshBanner));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Qeemly Market Data Updated");
    expect(container.textContent).toContain("Fresh GCC benchmark coverage is now live across the platform.");
    expect(container.textContent).toContain("212");

    const dismissButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.getAttribute("aria-label") === "Dismiss market update announcement",
    );
    expect(dismissButton).toBeDefined();

    await act(async () => {
      dismissButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).not.toContain("Qeemly Market Data Updated");

    await act(async () => {
      root.unmount();
    });

    const rerenderRoot = createRoot(container);
    await act(async () => {
      rerenderRoot.render(React.createElement(MarketRefreshBanner));
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).not.toContain("Qeemly Market Data Updated");

    await act(async () => {
      rerenderRoot.unmount();
    });
  });
});
