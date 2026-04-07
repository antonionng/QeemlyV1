import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

describe("DashboardPageHeader", () => {
  it("renders the title with the page-title class", () => {
    const html = renderToStaticMarkup(
      React.createElement(DashboardPageHeader, { title: "Company Overview" }),
    );

    expect(html).toContain("Company Overview");
    expect(html).toContain("page-title");
  });

  it("renders the subtitle with the page-subtitle class when provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(DashboardPageHeader, {
        title: "People",
        subtitle: "Browse every employee record.",
      }),
    );

    expect(html).toContain("People");
    expect(html).toContain("Browse every employee record.");
    expect(html).toContain("page-subtitle");
  });

  it("does not render the subtitle element when subtitle is omitted", () => {
    const html = renderToStaticMarkup(
      React.createElement(DashboardPageHeader, { title: "Reports" }),
    );

    expect(html).not.toContain("page-subtitle");
  });

  it("renders the actions slot when provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(DashboardPageHeader, {
        title: "Benchmarking",
        actions: React.createElement(
          "button",
          { "data-testid": "action-btn" },
          "Upload",
        ),
      }),
    );

    expect(html).toContain("Benchmarking");
    expect(html).toContain("data-testid");
    expect(html).toContain("Upload");
  });

  it("does not render the actions wrapper when actions is omitted", () => {
    const html = renderToStaticMarkup(
      React.createElement(DashboardPageHeader, { title: "Settings" }),
    );

    const h1Match = html.match(/<h1[^>]*>Settings<\/h1>/);
    expect(h1Match).toBeTruthy();
    expect(html).not.toContain("shrink-0");
  });
});
