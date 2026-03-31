/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRef } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, createClientMock, isFeatureEnabledMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  createClientMock: vi.fn(),
  isFeatureEnabledMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/components/logo", () => ({
  Logo: () => React.createElement("div", { "data-testid": "dashboard-logo" }, "Qeemly"),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.ComponentProps<"input">) => React.createElement("input", props),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) =>
    React.createElement("div", null, trigger, children),
  DropdownItem: ({ children, href }: { children: React.ReactNode; href?: string }) =>
    React.createElement(href ? "a" : "button", href ? { href } : {}, children),
  DropdownDivider: () => React.createElement("hr"),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/release/ga-scope", () => ({
  isFeatureEnabled: isFeatureEnabledMock,
}));

import { DashboardTopBar } from "@/components/dashboard/topbar";

describe("DashboardTopBar", () => {
  const cleanupFns: Array<() => void> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        signOut: vi.fn().mockResolvedValue({}),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    });
    isFeatureEnabledMock.mockReturnValue(true);
  });

  afterEach(() => {
    cleanupFns.splice(0).forEach((cleanup) => cleanup());
    vi.unstubAllGlobals();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    document.body.innerHTML = "";
  });

  function renderTopBar() {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        React.createElement(DashboardTopBar, {
          onMobileOpen: vi.fn(),
          onAIOpen: vi.fn(),
          mobileTriggerRef: createRef<HTMLButtonElement>(),
        }),
      );
    });

    const cleanup = () => {
      act(() => root.unmount());
      container.remove();
    };

    cleanupFns.push(cleanup);

    return { container };
  }

  async function flushEffects() {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("does not render a global annual or monthly toggle in the dashboard header", () => {
    const html = renderToStaticMarkup(
      React.createElement(DashboardTopBar, {
        onMobileOpen: vi.fn(),
        onAIOpen: vi.fn(),
        mobileTriggerRef: createRef<HTMLButtonElement>(),
      }),
    );

    expect(html).toContain('aria-label="Chat with Qeemly AI"');
    expect(html).not.toContain(">Annual<");
    expect(html).not.toContain(">Monthly<");
  });

  it("keeps the compact authenticated menu with shared destinations after extraction", async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "ada@qeemly.com",
            },
          },
        }),
        signOut: vi.fn().mockResolvedValue({}),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                full_name: "Ada Lovelace",
                avatar_url: null,
              },
            }),
          }),
        }),
      }),
    });

    const { container } = renderTopBar();

    await flushEffects();

    expect(container.textContent).toContain("A");
    expect(container.textContent).toContain("Ada Lovelace");
    expect(container.textContent).toContain("Profile");
    expect(container.textContent).toContain("Account Settings");
    expect(container.textContent).toContain("Billing");
    expect(container.textContent).toContain("Team");
    expect(container.textContent).toContain("Help");
    expect(container.textContent).toContain("Sign Out");
  });
});
