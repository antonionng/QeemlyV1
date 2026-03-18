import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  usePathnameMock,
  pushMock,
  createClientMock,
  companySettingsState,
  isFeatureEnabledMock,
} = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
  pushMock: vi.fn(),
  createClientMock: vi.fn(),
  companySettingsState: {
    companyName: "Qeemly",
    companyLogo: null,
    updateSettings: vi.fn(),
    markAsConfigured: vi.fn(),
  },
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

vi.mock("@/components/logo", () => ({
  Logo: ({ compact }: { compact?: boolean }) =>
    React.createElement(
      "div",
      {
        "data-testid": compact ? "sidebar-logo-compact" : "sidebar-logo",
      },
      "Qeemly",
    ),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/company", () => ({
  useCompanySettings: () => companySettingsState,
}));

vi.mock("@/lib/release/ga-scope", () => ({
  isFeatureEnabled: isFeatureEnabledMock,
}));

vi.mock("@/components/dashboard/workspace-switcher", () => ({
  WorkspaceSwitcher: ({ collapsed = false }: { collapsed?: boolean }) =>
    React.createElement(
      "div",
      { "data-testid": collapsed ? "workspace-switcher-collapsed" : "workspace-switcher" },
      collapsed ? "Collapsed Workspace" : "Expanded Workspace",
    ),
}));

import { DashboardSidebar } from "@/components/dashboard/sidebar";

describe("DashboardSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/dashboard/overview");
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });
    isFeatureEnabledMock.mockImplementation(() => true);
  });

  it("renders the approved expanded navigation structure with section labels and tools", () => {
    const html = renderToStaticMarkup(React.createElement(DashboardSidebar, { collapsed: false }));

    expect(html).toContain('data-testid="workspace-switcher"');
    expect(html).toContain("Company Overview");
    expect(html).toContain("Benchmarking");
    expect(html).toContain("People");
    expect(html).toContain("Salary Review");
    expect(html).toContain("ANALYTICS");
    expect(html).toContain("Reports");
    expect(html).not.toContain("/dashboard/compliance");
    expect(html).toContain("TOOLS");
    expect(html).toContain("CoL Calculator");
    expect(html).toContain("Upload Data");
    expect(html).toContain("Integrations");
    expect(html).toContain("Data Runs");
    expect(html).toContain("Settings");
    expect(html).toContain("text-[15px]");
    expect(html).toContain("font-medium");
  });

  it("renders a collapsed icon rail with hidden labels, hidden headers, hidden workspace switcher, and tooltips", () => {
    const html = renderToStaticMarkup(React.createElement(DashboardSidebar, { collapsed: true }));

    expect(html).not.toContain("Company Overview</span>");
    expect(html).not.toContain("Benchmarking</span>");
    expect(html).not.toContain("People</span>");
    expect(html).not.toContain("Salary Review</span>");
    expect(html).not.toContain("ANALYTICS");
    expect(html).not.toContain("TOOLS");
    expect(html).not.toContain('data-testid="workspace-switcher"');
    expect(html).toContain('title="Company Overview"');
    expect(html).toContain('title="Benchmarking"');
    expect(html).toContain('title="People"');
    expect(html).toContain('title="Salary Review"');
    expect(html).toContain('title="Reports"');
    expect(html).not.toContain("/dashboard/compliance");
    expect(html).toContain('title="CoL Calculator"');
    expect(html).toContain('title="Upload Data"');
    expect(html).toContain('title="Integrations"');
    expect(html).toContain('title="Data Runs"');
    expect(html).toContain('title="Settings"');
    expect(html).toContain("h-11 w-11");
  });

  it("uses the approved dashboard shell widths and transition timing", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "app/globals.css"),
      "utf8",
    );

    expect(source).toContain("--sidebar-width: 260px;");
    expect(source).toContain("--sidebar-collapsed-width: 72px;");
    expect(source).toContain("--sidebar-transition: 200ms ease;");
    expect(source).toContain("border-right: 1px solid #eef1f6;");
  });
});
