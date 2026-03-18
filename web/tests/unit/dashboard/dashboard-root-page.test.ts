import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/app/(dashboard)/dashboard/overview/page", () => ({
  default: () => React.createElement("div", { "data-testid": "overview-page" }, "Overview"),
}));

describe("dashboard root page", () => {
  it("renders the overview page directly", async () => {
    const { default: DashboardPage } = await import("@/app/(dashboard)/dashboard/page");
    const html = renderToStaticMarkup(React.createElement(DashboardPage));

    expect(html).toContain('data-testid="overview-page"');
  });
});
