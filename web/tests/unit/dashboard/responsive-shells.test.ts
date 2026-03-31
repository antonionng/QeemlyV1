import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

vi.mock("@/components/layout/site-nav", () => ({
  SiteNav: () => React.createElement("nav", { "data-testid": "site-nav" }, "Nav"),
}));

vi.mock("@/components/layout/site-footer", () => ({
  SiteFooter: () => React.createElement("footer", { "data-testid": "site-footer" }, "Footer"),
}));

vi.mock("@/components/logo", () => ({
  Logo: ({ compact }: { compact?: boolean }) =>
    React.createElement("div", { "data-testid": compact ? "logo-compact" : "logo" }, "Qeemly"),
}));

vi.mock("@/lib/admin/navigation", () => ({
  ADMIN_NAV_GROUPS: [
    {
      heading: "Core",
      items: [
        {
          href: "/admin",
          label: "Executive dashboard",
          description: "Monitor the platform",
          icon: () => React.createElement("svg", { "data-testid": "admin-icon" }),
        },
      ],
    },
  ],
}));

vi.mock("@/components/ui/ai-explain-tooltip", () => ({
  AiExplainTooltip: ({ label }: { label: string }) =>
    React.createElement("span", { "data-testid": "ai-tooltip" }, label),
}));

vi.mock("@/components/auth/authenticated-user-menu", () => ({
  AuthenticatedUserMenu: ({ variant }: { variant: "compact" | "marketing" }) =>
    React.createElement("div", { "data-testid": `authenticated-user-menu-${variant}` }, variant),
}));

import MarketingLayout from "@/app/(marketing)/layout";
import AdminDashboardLayout from "@/app/admin/(dashboard)/layout";
import { WidgetWrapper } from "@/components/dashboard/widget-wrapper";

describe("responsive shells", () => {
  it("uses the shared page shell utilities for marketing pages", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        MarketingLayout,
        {
          children: React.createElement("section", null, "Marketing content"),
        },
      ),
    );

    expect(html).toContain("responsive-page-shell");
    expect(html).toContain("responsive-page-gutters");
    expect(html).toContain("min-w-0");
  });

  it("stacks the admin shell safely on smaller screens", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        AdminDashboardLayout,
        {
          children: React.createElement("section", null, "Admin content"),
        },
      ),
    );

    expect(html).toContain("flex-col");
    expect(html).toContain("lg:flex-row");
    expect(html).toContain("w-full");
    expect(html).toContain("lg:sticky");
    expect(html).toContain("lg:top-0");
    expect(html).toContain("lg:h-screen");
    expect(html).toContain("lg:w-60");
    expect(html).toContain("min-w-0 flex-1");
    expect(html).toContain("responsive-page-gutters");
    expect(html).toContain('data-testid="authenticated-user-menu-compact"');
    expect(html).toContain('data-testid="authenticated-user-menu-marketing"');
  });

  it("wraps widget chrome before it can overlap the title", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        WidgetWrapper,
        {
          widgetId: "test-widget",
          children: React.createElement("div", null, "Content"),
          customWidget: {
            id: "test-widget",
            name: "Very Long Widget Name For Mobile Layout",
            description: "Helpful description",
            icon: ({ className }: { className?: string }) =>
              React.createElement("span", { className }, "I"),
            tooltipExplanation: "Explain widget",
          },
        },
      ),
    );

    expect(html).toContain("flex-wrap");
    expect(html).toContain("w-full");
    expect(html).toContain("justify-end");
    expect(html).toContain("sm:w-auto");
    expect(html).toContain("break-words");
  });
});
