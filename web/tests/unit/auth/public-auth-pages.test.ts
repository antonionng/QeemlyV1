import React from "react";
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useSearchParamsMock } = vi.hoisted(() => ({
  useSearchParamsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: useSearchParamsMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/image", () => ({
  default: (props: React.ComponentProps<"img"> & { priority?: boolean; unoptimized?: boolean; fill?: boolean }) => {
    const { priority, unoptimized, fill, ...imgProps } = props;
    void priority;
    void unoptimized;
    void fill;
    return React.createElement("img", imgProps);
  },
}));

describe("public auth pages", () => {
  beforeEach(() => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("renders the login page inside the shared Figma-style auth shell", async () => {
    const { default: LoginPage } = await import("@/app/login/page");
    const html = renderToStaticMarkup(React.createElement(LoginPage));

    expect(html).toContain('data-testid="auth-shell"');
    expect(html).toContain('data-testid="auth-top-nav"');
    expect(html).toContain('data-testid="auth-form-panel"');
    expect(html).toContain('data-testid="auth-visual-panel"');
    expect(html).toContain(">Early access<");
    expect(html).toContain('href="/register"');
    expect(html).toContain(">Log in<");
    expect(html).toContain('href="/login"');
    expect(html).toContain(">Log In<");
    expect(html).toContain('placeholder="Example@eg.com"');
    expect(html).toContain("rounded-[32px]");
    expect(html).toContain("rounded-tl-[40px]");
    expect(html).toContain("rounded-bl-[40px]");
    expect(html).not.toContain("Enter your work credentials to access your dashboard.");
    expect(html).not.toContain("Request access");
    expect(html).not.toContain("Compensation intelligence, localized for the Gulf.");
    expect(html).not.toContain("© 2026 Qeemly. All rights reserved.");
    expect(html).not.toContain("Hero prompt archived for reference.");
  });

  it("renders a visible invite error message when login is opened from a failed invite flow", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("error=invite_expired"));

    const { default: LoginPage } = await import("@/app/login/page");
    const html = renderToStaticMarkup(React.createElement(LoginPage));

    expect(html).toContain("This invite link has expired or has already been used.");
  });

  it("keeps the register page on the same shared auth shell", async () => {
    const { default: RegisterPage } = await import("@/app/register/page");
    const html = renderToStaticMarkup(React.createElement(RegisterPage));

    expect(html).toContain('data-testid="auth-shell"');
    expect(html).toContain('data-testid="auth-top-nav"');
    expect(html).toContain('data-testid="auth-visual-panel"');
    expect(html).toContain(">Early access<");
    expect(html).toContain('href="/register"');
    expect(html).toContain(">Log in<");
    expect(html).toContain('href="/login"');
    expect(html).toContain(">Create account<");
    expect(html).toContain('placeholder="name@company.com"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/privacy"');
  });

  it("does not mark more than one auth hero image as priority", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "components/auth/auth-split-shell.tsx"), "utf8");
    const priorityMatches = source.match(/\bpriority\b/g) ?? [];

    expect(priorityMatches.length).toBeLessThanOrEqual(1);
  });

  it("does not generate extra floating hero overlays in the shared shell", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "components/auth/auth-split-shell.tsx"), "utf8");

    expect(source).not.toContain("HeroFloatingCard");
  });
});
