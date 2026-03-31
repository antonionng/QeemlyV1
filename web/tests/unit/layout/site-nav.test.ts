/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  pushMock,
  usePathnameMock,
  createClientMock,
  isFeatureEnabledMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  usePathnameMock: vi.fn(),
  createClientMock: vi.fn(),
  isFeatureEnabledMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: React.ComponentProps<"img"> & { priority?: boolean; unoptimized?: boolean }) => React.createElement("img", props),
}));

vi.mock("@/components/logo", () => ({
  Logo: () => React.createElement("div", { "data-testid": "light-logo" }, "Qeemly"),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/release/ga-scope", () => ({
  isFeatureEnabled: isFeatureEnabledMock,
}));

import { SiteNav } from "@/components/layout/site-nav";

describe("SiteNav", () => {
  const cleanupFns: Array<() => void> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    usePathnameMock.mockReturnValue("/home");
    isFeatureEnabledMock.mockReturnValue(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    cleanupFns.splice(0).forEach((cleanup) => cleanup());
    vi.unstubAllGlobals();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    document.body.innerHTML = "";
  });

  function createSupabaseClient({
    user,
    getUserImplementation,
    profile = null,
  }: {
    user?: { id: string; email?: string | null } | null;
    getUserImplementation?: () => Promise<{ data: { user: { id: string; email?: string | null } | null } }>;
    profile?: { full_name?: string | null; avatar_url?: string | null } | null;
  }) {
    return {
      auth: {
        getUser: getUserImplementation ?? vi.fn().mockResolvedValue({ data: { user: user ?? null } }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }),
        signOut: vi.fn().mockResolvedValue({}),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: profile }),
          }),
        }),
      }),
    };
  }

  function renderNav(props?: React.ComponentProps<typeof SiteNav>) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(SiteNav, props));
    });

    const cleanup = () => {
      act(() => root.unmount());
      container.remove();
    };

    cleanupFns.push(cleanup);

    return { container, cleanup };
  }

  async function flushEffects() {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("renders the simplified shared public menu and anonymous actions", async () => {
    createClientMock.mockReturnValue(createSupabaseClient({ user: null }));
    const { container } = renderNav();
    await flushEffects();
    const html = container.innerHTML;

    expect(html).toContain("Home");
    expect(html).toContain("Contact");
    expect(html).toContain("Early access");
    expect(html).toContain("Log in");
    expect(html).not.toContain("Search");
    expect(html).not.toContain("Pricing");
    expect(html).not.toContain("Product");
    expect(html).not.toContain("Solutions");
    expect(html).not.toContain("Get Started");
  });

  it("renders the dark home variant with the white logo and active home pill", async () => {
    createClientMock.mockReturnValue(createSupabaseClient({ user: null }));
    const { container } = renderNav({ variant: "dark" });

    await flushEffects();

    expect(container.innerHTML).toContain("logo-white.svg");
    expect(container.innerHTML).toContain("bg-[#111233]");
    expect(container.innerHTML).toContain("bg-[rgba(92,69,253,0.2)]");
    expect(container.innerHTML).toContain("rounded-[32px]");
    expect(container.innerHTML).toContain("h-28");
  });

  it("shows a loading placeholder before auth resolves", async () => {
    let resolveUser: ((value: { data: { user: null } }) => void) | undefined;

    createClientMock.mockReturnValue(
      createSupabaseClient({
        getUserImplementation: () =>
          new Promise((resolve) => {
            resolveUser = resolve;
          }),
      }),
    );

    const { container } = renderNav({ variant: "dark" });

    expect(container.textContent).toContain("Loading account");
    expect(container.textContent).not.toContain("Early access");
    expect(container.textContent).not.toContain("Log in");
    expect(container.textContent).not.toContain("Dashboard");

    await act(async () => {
      resolveUser?.({ data: { user: null } });
      await Promise.resolve();
    });
  });

  it("falls back to signed-out actions after auth resolves with no session", async () => {
    createClientMock.mockReturnValue(createSupabaseClient({ user: null }));

    const { container } = renderNav({ variant: "dark" });

    await flushEffects();

    expect(container.textContent).toContain("Early access");
    expect(container.textContent).toContain("Log in");
  });

  it("renders the authenticated marketing account trigger instead of Dashboard", async () => {
    createClientMock.mockReturnValue(
      createSupabaseClient({
        user: { id: "user-1", email: "ada@qeemly.com" },
        profile: { full_name: "Ada Lovelace", avatar_url: null },
      }),
    );

    const { container } = renderNav({ variant: "dark" });

    await flushEffects();

    expect(container.textContent).toContain("Ada Lovelace");
    expect(container.textContent).not.toContain("Dashboard");
  });

  it("renders signed-in mobile account destinations instead of a Dashboard button", async () => {
    createClientMock.mockReturnValue(
      createSupabaseClient({
        user: { id: "user-1", email: "ada@qeemly.com" },
        profile: { full_name: "Ada Lovelace", avatar_url: null },
      }),
    );

    const { container } = renderNav({ variant: "dark" });

    await flushEffects();

    const toggle = Array.from(container.querySelectorAll("button")).find(
      (button) => button.getAttribute("aria-label") === "Toggle menu",
    );

    await act(async () => {
      toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Profile");
    expect(container.textContent).toContain("Account Settings");
    expect(container.textContent).toContain("Billing");
    expect(container.textContent).toContain("Team");
    expect(container.textContent).toContain("Help");
    expect(container.textContent).toContain("Super Admin");
    expect(container.textContent).toContain("Sign Out");
    expect(container.textContent).not.toContain("Dashboard");
  });

  it("swaps Super Admin for Dashboard when the user is already in admin", async () => {
    usePathnameMock.mockReturnValue("/admin");
    createClientMock.mockReturnValue(
      createSupabaseClient({
        user: { id: "user-1", email: "ada@qeemly.com" },
        profile: { full_name: "Ada Lovelace", avatar_url: null },
      }),
    );

    const { container } = renderNav({ variant: "dark" });

    await flushEffects();

    const accountTrigger = Array.from(container.querySelectorAll("button")).find(
      (button) => button.getAttribute("aria-haspopup") === "true",
    );

    await act(async () => {
      accountTrigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Dashboard");
    expect(container.textContent).not.toContain("Super Admin");
  });
});
