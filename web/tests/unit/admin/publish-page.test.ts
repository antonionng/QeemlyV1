/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchAdminJsonMock, normalizeAdminApiErrorMock } = vi.hoisted(() => ({
  fetchAdminJsonMock: vi.fn(),
  normalizeAdminApiErrorMock: vi.fn((error: unknown) => ({
    title: error instanceof Error ? error.message : "Admin request failed",
    detail: null,
    status: null,
  })),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    ArrowDownToLine: () => React.createElement("svg"),
    ArrowRight: () => React.createElement("svg"),
    BarChart3: () => React.createElement("svg"),
    CheckCircle2: () => React.createElement("svg"),
    Database: () => React.createElement("svg"),
    FileJson: () => React.createElement("svg"),
    Filter: () => React.createElement("svg"),
    RefreshCw: () => React.createElement("svg"),
    ShieldCheck: () => React.createElement("svg"),
    TableProperties: () => React.createElement("svg"),
  };
});

vi.mock("@/components/admin/admin-page-error", () => ({
  AdminPageError: ({ error }: { error: { title: string } | null }) =>
    error ? React.createElement("div", null, error.title) : null,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("div", { className }, children),
}));

vi.mock("@/lib/admin/api-client", () => ({
  fetchAdminJson: fetchAdminJsonMock,
  normalizeAdminApiError: normalizeAdminApiErrorMock,
}));

import AdminMarketPage from "@/app/admin/(dashboard)/market/page";

const statsPayload = {
  sources: { total: 4, enabled: 3 },
  jobs_24h: { total: 4, success: 2, failed: 0, running: 0, partial: 1 },
  benchmarks: { total: 144 },
  freshness: { score: "good", last_updated_at: "2026-03-17T00:00:00.000Z", staleness_hours: 4 },
};

const partialCoveragePayload = {
  supportedExactTriples: 1200,
  coveredExactTriples: 188,
  officialCoveredExactTriples: 120,
  proxyBackedExactTriples: 68,
  missingExactTriples: 1012,
  coveragePercent: 15.67,
  missingExamples: ["swe::ic1::dubai", "pm::ic3::riyadh"],
};

const sourceCoveragePayload = [
  {
    sourceSlug: "uae_fcsc_workforce_comp",
    exactTriples: 90,
    coveragePercent: 7.5,
    sampleTriples: ["swe::ic1::dubai", "swe::ic2::dubai"],
  },
  {
    sourceSlug: "qatar_wages",
    exactTriples: 54,
    coveragePercent: 4.5,
    sampleTriples: ["pm::ic3::riyadh"],
  },
];

const sourceDiagnosticsPayload = [
  {
    sourceSlug: "uae_fcsc_workforce_comp",
    rawExactTriples: 90,
    coveragePercent: 7.5,
    outcome: "success",
    fetchedRows: 12,
    normalizedRows: 12,
    normalizeFailedRows: 0,
    dqPassedRows: 12,
    dqFailedRows: 0,
    upsertedRows: 12,
    upsertFailedRows: 0,
  },
  {
    sourceSlug: "qatar_wages",
    rawExactTriples: 54,
    coveragePercent: 4.5,
    outcome: "partial_success",
    fetchedRows: 8,
    normalizedRows: 6,
    normalizeFailedRows: 1,
    dqPassedRows: 5,
    dqFailedRows: 1,
    upsertedRows: 4,
    upsertFailedRows: 1,
  },
];

const contributionMixPayload = {
  rowsWithEmployeeSupport: 18,
  rowsWithUploadedSupport: 9,
  rowsWithAdminSupport: 144,
};

const missingCoverageGroupsPayload = {
  byRoleFamily: [
    { label: "Engineering", missingExactTriples: 558 },
    { label: "Product", missingExactTriples: 79 },
  ],
  byCountry: [
    { label: "UAE", missingExactTriples: 299 },
    { label: "Saudi Arabia", missingExactTriples: 299 },
  ],
};

const topMissingExactTriplesPayload = [
  {
    key: "tpm::ic5::riyadh",
    roleTitle: "Technical PM",
    levelName: "Principal (IC5)",
    locationLabel: "Riyadh, Saudi Arabia",
  },
  {
    key: "pm::ic3::doha",
    roleTitle: "Product Manager",
    levelName: "Senior (IC3)",
    locationLabel: "Doha, Qatar",
  },
];

const latestPublishPayload = {
  event: {
    id: "publish-0",
    title: "Qeemly Market Data Updated",
    summary: "Fresh GCC benchmark coverage is now live across the platform.",
    rowCount: 144,
    publishedAt: "2026-03-17T09:00:00.000Z",
  },
};

const freshnessPayload = [
  {
    id: "fresh-1",
    source_id: "source-1",
    metric_type: "benchmarks",
    last_updated_at: "2026-03-17T08:00:00.000Z",
    record_count: 188,
    confidence: "high",
    ingestion_sources: { slug: "uae_fcsc_workforce_comp", name: "UAE FCSC" },
  },
];

const benchmarkMetaPayload = {
  roles: ["swe"],
  locations: ["dubai"],
  levels: ["ic3"],
  sources: ["market"],
};

const benchmarksPayload = {
  data: [
    {
      id: "bench-1",
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      currency: "AED",
      p50: 40000,
      p10: 30000,
      p25: 35000,
      p75: 45000,
      p90: 50000,
      sample_size: 12,
      source: "market",
      confidence: "medium",
    },
  ],
  total: 1,
};

const snapshotsPayload = [
  {
    id: "snap-1",
    fetched_at: "2026-03-17T08:00:00.000Z",
    schema_version: "v1",
    row_count: 100,
    ingestion_sources: { slug: "uae_fcsc_workforce_comp", name: "UAE FCSC" },
  },
];

describe("AdminMarketPage", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    fetchAdminJsonMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/admin/stats") return statsPayload;
      if (url === "/api/market-publish/latest") return latestPublishPayload;
      if (url === "/api/admin/freshness") return freshnessPayload;
      if (url === "/api/admin/benchmarks/meta") return benchmarkMetaPayload;
      if (url.startsWith("/api/admin/benchmarks?")) return benchmarksPayload;
      if (url === "/api/admin/snapshots?limit=10") return snapshotsPayload;
      throw new Error(`Unexpected fetchAdminJson call: ${url}`);
    });
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.clearAllMocks();
    container.remove();
  });

  it("runs the shared-market seed action and refreshes publish stats", async () => {
    fetchAdminJsonMock
      .mockResolvedValueOnce(statsPayload)
      .mockResolvedValueOnce({
        ok: true,
        poolRows: 188,
        selectedSourceSlugs: ["uae_fcsc_workforce_comp"],
        coverage: partialCoveragePayload,
        sourceCoverage: sourceCoveragePayload,
        sourceDiagnostics: sourceDiagnosticsPayload,
        contributionMix: contributionMixPayload,
        missingCoverageGroups: missingCoverageGroupsPayload,
        topMissingExactTriples: topMissingExactTriplesPayload,
      })
      .mockResolvedValueOnce({
        ...statsPayload,
        benchmarks: { total: 188 },
      });

    fetchAdminJsonMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/admin/stats") return url === "/api/admin/stats" && init ? { ...statsPayload, benchmarks: { total: 188 } } : statsPayload;
      if (url === "/api/market-publish/latest") return latestPublishPayload;
      if (url === "/api/admin/freshness") return freshnessPayload;
      if (url === "/api/admin/benchmarks/meta") return benchmarkMetaPayload;
      if (url.startsWith("/api/admin/benchmarks?")) return benchmarksPayload;
      if (url === "/api/admin/market-seed") {
        return {
          ok: true,
          poolRows: 188,
          selectedSourceSlugs: ["uae_fcsc_workforce_comp"],
          coverage: partialCoveragePayload,
          sourceCoverage: sourceCoveragePayload,
          sourceDiagnostics: sourceDiagnosticsPayload,
          contributionMix: contributionMixPayload,
          missingCoverageGroups: missingCoverageGroupsPayload,
          topMissingExactTriples: topMissingExactTriplesPayload,
        };
      }
      if (url === "/api/admin/snapshots?limit=10") return snapshotsPayload;
      throw new Error(`Unexpected fetchAdminJson call: ${url}`);
    });

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AdminMarketPage));
    });

    const advancedButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Show"),
    );
    expect(advancedButton).toBeDefined();

    await act(async () => {
      advancedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const seedButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Run Shared Market Seed"),
    );
    expect(seedButton).toBeDefined();

    await act(async () => {
      seedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(fetchAdminJsonMock).toHaveBeenCalledWith("/api/admin/market-seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(container.textContent).toContain("Market Overview");
    expect(container.textContent).toContain("Seeded shared market data. 188 pooled rows are now available.");
    expect(container.textContent).toContain("188 of 1200 exact benchmark rows are live");
    expect(container.textContent).toContain("Official exact coverage: 120");
    expect(container.textContent).toContain("Proxy-backed exact coverage: 68");
    expect(container.textContent).toContain("1012 exact rows are still missing");
    expect(container.textContent).toContain("Raw source coverage");
    expect(container.textContent).toContain("Contribution mix");
    expect(container.textContent).toContain("Employee-supported rows: 18");
    expect(container.textContent).toContain("Uploaded-band rows: 9");
    expect(container.textContent).toContain("Admin-market rows: 144");
    expect(container.textContent).toContain("Source funnel diagnostics");
    expect(container.textContent).toContain("Fetched 12");
    expect(container.textContent).toContain("Upserted 12");
    expect(container.textContent).toContain("Fetched 8");
    expect(container.textContent).toContain("Normalized 6");
    expect(container.textContent).toContain("uae_fcsc_workforce_comp");
    expect(container.textContent).toContain("90 exact rows");
    expect(container.textContent).toContain("qatar_wages");
    expect(container.textContent).toContain("54 exact rows");
    expect(container.textContent).toContain("Biggest exact coverage gaps");
    expect(container.textContent).toContain("Engineering");
    expect(container.textContent).toContain("558 missing");
    expect(container.textContent).toContain("UAE");
    expect(container.textContent).toContain("299 missing");
    expect(container.textContent).toContain("Top missing exact triples");
    expect(container.textContent).toContain("Technical PM");
    expect(container.textContent).toContain("Principal (IC5)");
    expect(container.textContent).toContain("Riyadh, Saudi Arabia");

    await act(async () => {
      root.unmount();
    });
  });

  it("rebuilds the published pool and refreshes publish stats", async () => {
    fetchAdminJsonMock
      .mockResolvedValueOnce(statsPayload)
      .mockResolvedValueOnce({
        ok: true,
        rows: 212,
      })
      .mockResolvedValueOnce({
        ...statsPayload,
        benchmarks: { total: 212 },
      });

    fetchAdminJsonMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/admin/stats") return url === "/api/admin/stats" && init ? { ...statsPayload, benchmarks: { total: 212 } } : statsPayload;
      if (url === "/api/market-publish/latest") return latestPublishPayload;
      if (url === "/api/admin/freshness") return freshnessPayload;
      if (url === "/api/admin/benchmarks/meta") return benchmarkMetaPayload;
      if (url.startsWith("/api/admin/benchmarks?")) return benchmarksPayload;
      if (url === "/api/benchmarks/market-pool/refresh") return { ok: true, rows: 212 };
      if (url === "/api/admin/snapshots?limit=10") return snapshotsPayload;
      throw new Error(`Unexpected fetchAdminJson call: ${url}`);
    });

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AdminMarketPage));
    });

    const advancedButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Show"),
    );
    expect(advancedButton).toBeDefined();

    await act(async () => {
      advancedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const refreshButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Refresh Published Market Pool"),
    );
    expect(refreshButton).toBeDefined();

    await act(async () => {
      refreshButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(fetchAdminJsonMock).toHaveBeenCalledWith("/api/benchmarks/market-pool/refresh", {
      method: "POST",
    });
    expect(container.textContent).toContain("Rebuilt the published market pool. 212 shared rows are live.");
    expect(container.textContent).not.toContain("Raw source coverage");

    await act(async () => {
      root.unmount();
    });
  });

  it("shows exact gap details inline when publish is blocked by incomplete coverage", async () => {
    const blockedPublishError = Object.assign(
      new Error("Cannot publish market dataset until exact benchmark coverage is complete."),
      {
        detail: "956 of 1200 exact benchmark rows are still missing.",
        status: 409,
        coverage: {
          supportedExactTriples: 1200,
          coveredExactTriples: 244,
          officialCoveredExactTriples: 180,
          proxyBackedExactTriples: 64,
          missingExactTriples: 956,
          coveragePercent: 20.33,
          missingExamples: ["swe::ic1::abu-dhabi", "tpm::ic5::riyadh"],
        },
      },
    );

    fetchAdminJsonMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/admin/stats") return statsPayload;
      if (url === "/api/market-publish/latest") return latestPublishPayload;
      if (url === "/api/admin/freshness") return freshnessPayload;
      if (url === "/api/admin/benchmarks/meta") return benchmarkMetaPayload;
      if (url.startsWith("/api/admin/benchmarks?")) return benchmarksPayload;
      if (url === "/api/admin/market-publish") throw blockedPublishError;
      if (url === "/api/admin/snapshots?limit=10") return snapshotsPayload;
      throw new Error(`Unexpected fetchAdminJson call: ${url}`);
    });

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AdminMarketPage));
    });

    const advancedButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Show"),
    );
    expect(advancedButton).toBeDefined();

    await act(async () => {
      advancedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const publishButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Publish Dataset"),
    );
    expect(publishButton).toBeDefined();

    await act(async () => {
      publishButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("244 of 1200 exact benchmark rows are live");
    expect(container.textContent).toContain("956 exact rows are still missing");
    expect(container.textContent).toContain("Example gaps");
    expect(container.textContent).toContain("swe::ic1::abu-dhabi");
    expect(container.textContent).toContain("tpm::ic5::riyadh");

    await act(async () => {
      root.unmount();
    });
  });

  it("publishes the dataset and refreshes publish stats", async () => {
    fetchAdminJsonMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/admin/stats") return url === "/api/admin/stats" && init ? { ...statsPayload, benchmarks: { total: 212 } } : statsPayload;
      if (url === "/api/market-publish/latest") return latestPublishPayload;
      if (url === "/api/admin/freshness") return freshnessPayload;
      if (url === "/api/admin/benchmarks/meta") return benchmarkMetaPayload;
      if (url.startsWith("/api/admin/benchmarks?")) return benchmarksPayload;
      if (url === "/api/admin/market-publish") {
        return {
          ok: true,
          event: {
            id: "publish-1",
            title: "Qeemly Market Data Updated",
            summary: "Fresh GCC benchmark coverage is now live across the platform.",
            rowCount: 212,
            publishedAt: "2026-03-17T10:00:00.000Z",
          },
          coverage: {
            supportedExactTriples: 1200,
            coveredExactTriples: 1200,
            officialCoveredExactTriples: 1000,
            proxyBackedExactTriples: 200,
            missingExactTriples: 0,
            coveragePercent: 100,
            missingExamples: [],
          },
        };
      }
      if (url === "/api/admin/snapshots?limit=10") return snapshotsPayload;
      throw new Error(`Unexpected fetchAdminJson call: ${url}`);
    });

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AdminMarketPage));
    });

    const advancedButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Show"),
    );
    expect(advancedButton).toBeDefined();

    await act(async () => {
      advancedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const publishButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Publish Dataset"),
    );
    expect(publishButton).toBeDefined();

    await act(async () => {
      publishButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(fetchAdminJsonMock).toHaveBeenCalledWith("/api/admin/market-publish", {
      method: "POST",
    });
    expect(container.textContent).toContain("Published the latest Qeemly market dataset for tenants.");
    expect(container.textContent).toContain("1200 of 1200 exact benchmark rows are live");
    expect(container.textContent).toContain("Exact coverage is complete");

    await act(async () => {
      root.unmount();
    });
  });
});
