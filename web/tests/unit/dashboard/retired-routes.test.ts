import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const redirectMock = vi.fn((href: string) => {
  throw new Error(`redirect:${href}`);
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/app/(dashboard)/dashboard/people/client", () => ({
  PeoplePageClient: () => React.createElement("div", { "data-testid": "people-page-client" }, "People"),
}));

describe("retired dashboard routes", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("redirects market overview to benchmarking", async () => {
    const { default: MarketOverviewPage } = await import("@/app/(dashboard)/dashboard/market/page");

    expect(() => MarketOverviewPage()).toThrowError("redirect:/dashboard/benchmarks");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/benchmarks");
  });

  it("renders the people list route again", async () => {
    const { default: PeoplePage } = await import("@/app/(dashboard)/dashboard/people/page");

    const html = renderToStaticMarkup(React.createElement(PeoplePage));

    expect(html).toContain('data-testid="people-page-client"');
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects people detail routes into the drawer-friendly people page", async () => {
    const { default: PersonDetailPage } = await import("@/app/(dashboard)/dashboard/people/[id]/page");

    await expect(() => PersonDetailPage({ params: Promise.resolve({ id: "emp-42" }) })).rejects.toThrowError(
      "redirect:/dashboard/people?employeeId=emp-42"
    );
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/people?employeeId=emp-42");
  });
});
