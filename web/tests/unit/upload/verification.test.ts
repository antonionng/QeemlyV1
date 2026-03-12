import { afterEach, describe, expect, it, vi } from "vitest";

describe("fetchUploadVerificationSummary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("summarizes employee uploads using company overview coverage and trust data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            benchmarkCoverage: {
              activeEmployees: 10,
              benchmarkedEmployees: 8,
              unbenchmarkedEmployees: 2,
            },
            benchmarkTrust: {
              marketBacked: 7,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchUploadVerificationSummary } = await import("@/lib/upload/api");

    const summary = await fetchUploadVerificationSummary("employees");

    expect(summary?.headline).toContain("8 of 10 active employees currently have benchmark coverage.");
    expect(summary?.details).toContain("7 employee matches are currently backed by Qeemly market data.");
    expect(summary?.details).toContain(
      "2 still need role, level, or location mapping before they can influence company insights.",
    );
    expect(summary?.links).toEqual([
      { href: "/dashboard/overview", label: "Open Company Overview" },
      { href: "/dashboard/salary-review", label: "Open Salary Review" },
    ]);
  });

  it("summarizes benchmark uploads using market insights overlay data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            workspaceOverlay: { count: 12 },
            summary: { contributorQualifiedRows: 28 },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchUploadVerificationSummary } = await import("@/lib/upload/api");

    const summary = await fetchUploadVerificationSummary("benchmarks");

    expect(summary?.headline).toContain("12 company benchmark rows from this upload");
    expect(summary?.details).toContain(
      "Qeemly market data remains the primary benchmark source used across the product.",
    );
    expect(summary?.details).toContain(
      "28 contributor-qualified rows belong to the shared Qeemly market pool, not your uploaded company overlay.",
    );
    expect(summary?.links).toEqual([
      { href: "/dashboard/benchmarks", label: "Open Benchmarking" },
      { href: "/dashboard/salary-review", label: "Open Salary Review" },
    ]);
  });

  it("falls back to the uploaded batch count when aggregate overlay refresh has not caught up yet", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            workspaceOverlay: { count: 0 },
            summary: { contributorQualifiedRows: 0 },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchUploadVerificationSummary } = await import("@/lib/upload/api");

    const summary = await fetchUploadVerificationSummary("benchmarks", { uploadedCount: 10 });

    expect(summary?.headline).toContain(
      "10 company benchmark rows from this upload are now available to review as your workspace overlay.",
    );
    expect(summary?.details).toContain(
      "0 contributor-qualified rows belong to the shared Qeemly market pool, not your uploaded company overlay.",
    );
    expect(summary?.links).toEqual([
      { href: "/dashboard/benchmarks", label: "Open Benchmarking" },
      { href: "/dashboard/salary-review", label: "Open Salary Review" },
    ]);
  });
});
