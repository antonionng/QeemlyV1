import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePathnameMock, createClientMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
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

import { SiteNav } from "@/components/layout/site-nav";

describe("SiteNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/home");
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }),
      },
    });
  });

  it("renders the simplified shared public menu and anonymous actions", () => {
    const html = renderToStaticMarkup(React.createElement(SiteNav));

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

  it("renders the dark home variant with the white logo and active home pill", () => {
    const html = renderToStaticMarkup(React.createElement(SiteNav, { variant: "dark" }));

    expect(html).toContain("logo-white.svg");
    expect(html).toContain("bg-[#111233]");
    expect(html).toContain("bg-[rgba(92,69,253,0.2)]");
    expect(html).toContain("rounded-[32px]");
    expect(html).toContain("h-28");
  });
});
