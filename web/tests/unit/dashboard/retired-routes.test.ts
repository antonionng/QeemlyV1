import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((href: string) => {
  throw new Error(`redirect:${href}`);
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
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

  it("redirects the people list to upload data", async () => {
    const { default: PeoplePage } = await import("@/app/(dashboard)/dashboard/people/page");

    expect(() => PeoplePage()).toThrowError("redirect:/dashboard/upload");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/upload");
  });

  it("redirects retired people detail routes to upload data", async () => {
    const { default: PersonDetailPage } = await import("@/app/(dashboard)/dashboard/people/[id]/page");

    expect(() => PersonDetailPage()).toThrowError("redirect:/dashboard/upload");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/upload");
  });
});
