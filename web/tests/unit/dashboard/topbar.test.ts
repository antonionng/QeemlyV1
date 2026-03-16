import React from "react";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        signOut: vi.fn().mockResolvedValue({}),
      },
    });
    isFeatureEnabledMock.mockReturnValue(true);
  });

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
});
