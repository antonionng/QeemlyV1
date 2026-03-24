import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeTicker } from "@/components/marketing/home/ticker";

describe("home ticker", () => {
  it("renders duplicated marquee tracks for a seamless loop", () => {
    const html = renderToStaticMarkup(createElement(HomeTicker));

    expect(html).toContain("home-ticker-marquee");
    expect(html).toContain("home-ticker-track");
    expect(html).toContain("home-ticker-seam");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain(">Founders<");
    expect(html).toContain(">HR<");
    expect(html).toContain(">Finance<");
    expect(html).toContain(">Managers<");
  });
});
