import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/layout/site-nav", () => ({
  SiteNav: ({ variant }: { variant?: string }) =>
    createElement(
      "nav",
      {
        "data-testid": "site-nav",
        "data-variant": variant,
        className: "h-28",
      },
      createElement("img", { src: "logo-white.svg", alt: "Qeemly" }),
      createElement("a", { href: "/home" }, "Home"),
      createElement("a", { href: "/contact" }, "Contact"),
      createElement("a", { href: "/register" }, "Early access"),
      createElement("a", { href: "/login" }, "Log in"),
    ),
}));

vi.mock("@/components/layout/site-footer", () => ({
  SiteFooter: () => createElement("footer", { "data-testid": "site-footer" }, "Footer"),
}));
import HomePage from "@/app/(home)/home/page";

describe("home page", () => {
  it("renders the Figma landing page sections and primary CTAs", () => {
    const html = renderToStaticMarkup(createElement(HomePage));
    const registerHrefMatches = html.match(/href="\/register"/g) ?? [];

    expect(html).toContain("Build a culture of trust with transparent UAE pay data");
    expect(html).toContain('data-testid="site-nav"');
    expect(html).toContain('data-variant="dark"');
    expect(html).toContain('href="/home"');
    expect(html).not.toContain('href="/search"');
    expect(html).not.toContain('href="/pricing"');
    expect(html).toContain("Early access");
    expect(html).toContain("Log in");
    expect(html).toContain("Join pilot scheme");
    expect(html).toContain("Book a demo");
    expect(registerHrefMatches).toHaveLength(1);
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/contact"');
    expect(html).toContain(">for<");
    expect(html).toContain(">Founders<");
    expect(html).toContain(">HR<");
    expect(html).toContain(">Finance<");
    expect(html).toContain(">Managers<");
    expect(html).toContain("lg:rotate-[1.75deg]");
    expect(html).toContain("xl:rotate-[2deg]");
    expect(html).toContain("lg:h-[9.75rem]");
    expect(html).toContain("xl:h-[10.5rem]");
    expect(html).toContain("lg:-mt-[4.125rem]");
    expect(html).toContain("xl:-mt-[4.5rem]");
    expect(html).toContain("lg:px-6 lg:pt-5 lg:pb-6");
    expect(html).toContain("xl:px-8 xl:pt-6 xl:pb-7");
    expect(html).toContain("lg:text-[1.625rem]");
    expect(html).toContain("xl:text-[1.875rem]");
    expect(html).toContain("home-ticker-track");
    expect(html).toContain("h-28");
    expect(html).toContain("lg:min-h-[53.125rem]");
    expect(html).toContain("xl:min-h-[57.25rem]");
    expect(html).toContain('<section class="relative overflow-hidden bg-[radial-gradient(');
    expect(html).toContain("leading-[1.2]");
    expect(html).toContain("lg:pt-[6.5rem]");
    expect(html).toContain("xl:pt-[7.5rem]");
    expect(html).toContain("lg:right-[-4.5rem]");
    expect(html).toContain("xl:right-[-9rem]");
    expect(html).toContain("2xl:right-[-10rem]");
    expect(html).toContain("lg:h-[46.125rem]");
    expect(html).toContain("xl:h-[50.5rem]");
    expect(html).toContain("lg:w-[46rem]");
    expect(html).toContain("xl:w-[53.125rem]");
    expect(html).toContain("max-w-none");
    expect(html).toContain("py-10");
    expect(html).toContain("sm:py-16");
    expect(html).toContain("lg:h-[14.375rem]");
    expect(html).toContain("text-[1.5rem]");
    expect(html).toContain("sm:text-[1.875rem]");
    expect(html).toContain("lg:text-[2.25rem]");
    expect(html).toContain("px-8 py-10");
    expect(html).toContain("sm:px-10 sm:py-12");
    expect(html).toContain("grid-cols-1");
    expect(html).toContain("lg:grid-cols-12");
    expect(html).toContain("lg:grid-cols-[minmax(0,39rem)_minmax(0,1fr)]");
    expect(html).toContain("xl:grid-cols-[44.5625rem_44.5625rem]");
    expect(html).toContain("lg:left-[-3rem]");
    expect(html).toContain("xl:left-[-4.625rem]");
    expect(html).toContain("lg:w-[calc(100vw+8rem)]");
    expect(html).toContain("xl:w-[calc(100vw+14rem)]");
    expect(html).toContain("lg:min-w-[92rem]");
    expect(html).toContain("xl:min-w-[108rem]");
    expect(html).toContain("items-center justify-center");
    expect(html).toContain("Real compensation data from companies in the UAE");
    expect(html).toContain("Starting in the UAE, expanding across the GCC.");
    expect(html).toContain("Identify pay gaps early");
    expect(html).toContain("Salary benchmarks in seconds");
    expect(html).toContain("Build scalable pay frameworks");
    expect(html).toContain("Seamless HRIS Integrations");
    expect(html).toContain('data-testid="integrations-marquee"');
    expect(html).toContain('data-testid="integrations-track"');
    expect(html).toContain('data-testid="integrations-track-clone"');
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("min-w-max");
    expect(html).toContain("whitespace-nowrap");
    expect(html).toContain("motion-reduce:animate-none");
    expect(html).toContain("See how Qeemly works");
    expect(html).toContain("Real-Time Salary Benchmarking");
    expect(html).toContain("Get Early Access");
    expect(html).toContain("Market-backed offer guidance");
    expect(html).toContain("Board-ready output");
    expect(html).toContain("See it with your own data");
    expect(html).toContain('data-testid="site-footer"');
    expect(html).toContain("logo-white.svg");
    expect(html).toContain("hero-female.png");
    expect(html).toContain("bento-gcc.png");
    expect(html).toContain("services-table.png");
    expect(html).toContain("workable-logo.svg");
    expect(html).toContain("Workable logo");
    expect(html).toContain('data-cta-intent="pilot"');
    expect(html).toContain('data-cta-intent="demo"');
    expect(html).toContain('data-testid="services-prev"');
    expect(html).toContain('data-testid="services-next"');
    expect(html).toContain('data-integration-name="Workable"');
    expect(html).toContain("h-7 w-auto max-w-none object-contain lg:h-8");
    expect(html).toContain("slack-logo.svg");
    expect(html).toContain("Slack logo");
    expect(html).toContain("microsoft-teams-logo.svg");
    expect(html).toContain("Microsoft Teams logo");
    expect(html).toContain("workday-logo.svg");
    expect(html).toContain("Workday logo");
    expect(html).toContain("deel-logo.svg");
    expect(html).toContain("Deel logo");
    expect(html).toContain("greenhouse-logo.svg");
    expect(html).toContain("Greenhouse logo");
    expect(html).toContain("bamboohr-logo.svg");
    expect(html).toContain("BambooHR logo");
    expect(html).toContain("h-11 w-auto max-w-none object-contain lg:h-12");
    expect(html).toContain("rippling-logo.svg");
    expect(html).toContain("Rippling logo");
    expect(html).toContain("h-[2.625rem] w-auto max-w-none object-contain lg:h-[3rem]");
    expect(html).toContain("personio-logo.svg");
    expect(html).toContain("Personio logo");
    expect(html).toContain("h-[2.625rem] w-auto max-w-none object-contain lg:h-[3rem]");
    expect(html).toContain("gusto-logo.svg");
    expect(html).toContain("Gusto logo");
    expect(html).toContain("lever-logo.svg");
    expect(html).toContain("Lever logo");
    expect(html).toContain("hibob-logo.svg");
    expect(html).toContain("HiBob logo");
    expect(html).toContain("sap-logo.svg");
    expect(html).toContain("SAP logo");
    expect(html).toContain("zanhr-logo.svg");
    expect(html).toContain("ZANHR logo");
    expect(html).not.toContain("Pay with confidence, powered by Gulf salary intelligence");
    expect(html).not.toContain("What do P25 / P50 / P75 mean?");
    expect(html).not.toContain("See sample output");
    expect(html).not.toContain("Start typing a role above to see suggestions");
    expect(html).not.toContain("Salary Explorer");
    expect(html).not.toContain("Live market signal");
  });
});
