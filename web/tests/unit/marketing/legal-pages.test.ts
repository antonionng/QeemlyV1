import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("marketing legal pages", () => {
  it("renders a UAE and GCC-oriented privacy policy", async () => {
    const { default: PrivacyPage } = await import("@/app/(marketing)/privacy/page");
    const html = renderToStaticMarkup(React.createElement(PrivacyPage));

    expect(html).toContain("Privacy Policy");
    expect(html).toContain("UAE");
    expect(html).toContain("GCC");
    expect(html).toContain("personal data");
    expect(html).toContain("customer is the controller");
    expect(html).toContain("cross-border");
    expect(html).toContain("hello@qeemly.com");
  });

  it("renders UAE-oriented terms for the Qeemly service", async () => {
    const { default: TermsPage } = await import("@/app/(marketing)/terms/page");
    const html = renderToStaticMarkup(React.createElement(TermsPage));

    expect(html).toContain("Terms of Service");
    expect(html).toContain("UAE");
    expect(html).toContain("Dubai");
    expect(html).toContain("subscriptions");
    expect(html).toContain("Customer Data");
    expect(html).toContain("confidential");
    expect(html).toContain("liability");
  });
});
