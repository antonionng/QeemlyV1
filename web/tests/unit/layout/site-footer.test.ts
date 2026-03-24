import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/image", () => ({
  default: (props: React.ComponentProps<"img"> & { priority?: boolean; unoptimized?: boolean }) => {
    const { priority, unoptimized, ...imgProps } = props;
    void priority;
    void unoptimized;
    return React.createElement("img", imgProps);
  },
}));

import { SiteFooter } from "@/components/layout/site-footer";

describe("SiteFooter", () => {
  it("renders the premium marketing CTA and real navigation groups", () => {
    const html = renderToStaticMarkup(React.createElement(SiteFooter));
    const registerHrefMatches = html.match(/href="\/register"/g) ?? [];

    expect(html).toContain("Join pilot scheme");
    expect(html).toContain("Book a demo");
    expect(html).not.toContain('href="/search"');
    expect(html).not.toContain('href="/analytics"');
    expect(html).not.toContain('href="/pricing"');
    expect(html).not.toContain('href="/preview"');
    expect(html).not.toContain(">Solutions<");
    expect(html).not.toContain('href="/solutions/hr-teams"');
    expect(html).not.toContain('href="/solutions/founders"');
    expect(html).not.toContain('href="/solutions/finance"');
    expect(registerHrefMatches).toHaveLength(1);
    expect(html).toContain(">Get Started<");
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/contact"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain(">Privacy<");
    expect(html).toContain(">Terms<");
    expect(html).toContain("hello@qeemly.com");
    expect(html).toContain("logo-white.svg");
    expect(html).toContain("bg-[#111233]");
    expect(html).toContain("max-w-[90rem]");
  });
});
