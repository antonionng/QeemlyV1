import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ClientSupportPage, { metadata } from "@/app/(marketing)/client-support/page";

describe("client support page", () => {
  it("is marked as unlisted for search engines", () => {
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("renders the premium support tiers for private client sharing", () => {
    const html = renderToStaticMarkup(createElement(ClientSupportPage));

    expect(html).toContain("Qeemly Post-Launch Support");
    expect(html).toContain("Platform Care");
    expect(html).toContain("Platform Support");
    expect(html).toContain("Growth Retainer");
    expect(html).toContain("Founding Partner Retainer");
    expect(html).toContain("£5,200 / month");
    expect(html).toContain("Standard partnership value");
    expect(html).toContain("Anytime client support for your clients");
    expect(html).toContain("Onboarding your clients onto Qeemly");
    expect(html).toContain("A whole engineering and customer experience team behind you");
    expect(html).toContain("Support your client growth with confidence");
    expect(html).not.toContain("Pricing");
    expect(html).not.toContain("Discuss the right fit");
    expect(html).not.toContain("Discuss a retained partnership");
    expect(html).not.toContain("Turn new clients into product leverage");
  });
});
