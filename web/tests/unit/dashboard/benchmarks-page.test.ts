// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("lucide-react", () => ({
  Upload: () => React.createElement("svg"),
  ArrowRight: () => React.createElement("svg"),
  Bookmark: () => React.createElement("svg"),
  ChevronLeft: () => React.createElement("svg"),
  ChevronRight: () => React.createElement("svg"),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) =>
    React.createElement("button", props, children),
}));

vi.mock("@/components/dashboard/benchmarks/benchmark-form", () => ({
  BenchmarkForm: () => React.createElement("div", null, "BenchmarkForm"),
}));

vi.mock("@/components/dashboard/benchmarks/benchmark-results", () => ({
  BenchmarkResults: () => React.createElement("div", null, "BenchmarkResults"),
}));

vi.mock("@/components/dashboard/benchmarks/benchmark-detail", () => ({
  BenchmarkDetail: () => React.createElement("div", null, "BenchmarkDetail"),
}));

vi.mock("@/components/dashboard/upload", () => ({
  UploadModal: () => React.createElement("div", null, "UploadModal"),
}));

const { reconcileWorkspaceMock, resetFormMock, loadFilterMock } = vi.hoisted(() => ({
  reconcileWorkspaceMock: vi.fn(),
  resetFormMock: vi.fn(),
  loadFilterMock: vi.fn(),
}));

const { companySettingsState } = vi.hoisted(() => ({
  companySettingsState: {
    updateSettings: vi.fn(),
    markAsConfigured: vi.fn(),
  },
}));

vi.mock("@/lib/benchmarks/benchmark-state", () => ({
  useBenchmarkState: () => ({
    step: "form",
    currentResult: null,
    recentResults: [],
    savedFilters: [],
    reconcileWorkspace: reconcileWorkspaceMock,
    resetForm: resetFormMock,
    loadFilter: loadFilterMock,
  }),
}));

const { hasDbEmployeesMock } = vi.hoisted(() => ({
  hasDbEmployeesMock: vi.fn(),
}));

vi.mock("@/lib/employees/data-service", () => ({
  hasDbEmployees: hasDbEmployeesMock,
}));

vi.mock("@/lib/benchmarks/results-presentation", () => ({
  getBenchmarkPageTitle: () => "Benchmarking",
}));

vi.mock("@/lib/company", () => ({
  useCompanySettings: (selector?: (state: typeof companySettingsState) => unknown) =>
    selector ? selector(companySettingsState) : companySettingsState,
}));

import BenchmarksPage from "@/app/(dashboard)/dashboard/benchmarks/page";

describe("BenchmarksPage", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    hasDbEmployeesMock.mockResolvedValue(false);
    companySettingsState.updateSettings.mockReset();
    companySettingsState.markAsConfigured.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    container.remove();
  });

  it("does not show the diagnostics banner for an empty market warning", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url.includes("/api/benchmarks/stats")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                total: 0,
                uniqueRoles: 0,
                uniqueLocations: 0,
                sources: ["market"],
                lastUpdated: null,
                hasRealData: false,
                diagnostics: {
                  market: {
                    readMode: "session",
                    clientWarning: null,
                    error: null,
                    warning:
                      "No published shared-market benchmark rows were returned from the market pool.",
                    hasServiceRoleKey: false,
                    hasPlatformWorkspaceId: false,
                  },
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }

        if (url.includes("/api/settings")) {
          return Promise.resolve(
            new Response(JSON.stringify({ workspace_id: "workspace-1" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(BenchmarksPage));
    });

    await act(async () => {
      await vi.runAllTimersAsync();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Benchmarking");
    expect(container.textContent).not.toContain("Market dataset diagnostics:");
    expect(container.textContent).toContain("Source: Qeemly Market Data");
    expect(container.textContent).toContain("Published: Not published yet");
  });

  it("still shows the diagnostics banner for a technical market error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url.includes("/api/benchmarks/stats")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                total: 0,
                uniqueRoles: 0,
                uniqueLocations: 0,
                sources: ["market"],
                lastUpdated: null,
                hasRealData: false,
                diagnostics: {
                  market: {
                    readMode: "session",
                    clientWarning: null,
                    error: "Failed to fetch rows from platform_market_benchmarks",
                    warning: null,
                    hasServiceRoleKey: false,
                    hasPlatformWorkspaceId: false,
                  },
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }

        if (url.includes("/api/settings")) {
          return Promise.resolve(
            new Response(JSON.stringify({ workspace_id: "workspace-1" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(BenchmarksPage));
    });

    await act(async () => {
      await vi.runAllTimersAsync();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Market dataset diagnostics:");
    expect(container.textContent).toContain("Failed to fetch rows from platform_market_benchmarks");
  });

  it("shows a clearer market freshness badge when a publish date exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url.includes("/api/benchmarks/stats")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                total: 212,
                uniqueRoles: 8,
                uniqueLocations: 4,
                sources: ["market"],
                lastUpdated: "2026-03-17T10:00:00.000Z",
                hasRealData: true,
                diagnostics: {
                  market: {
                    readMode: "session",
                    clientWarning: null,
                    error: null,
                    warning: null,
                    hasServiceRoleKey: true,
                    hasPlatformWorkspaceId: true,
                  },
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }

        if (url.includes("/api/settings")) {
          return Promise.resolve(
            new Response(JSON.stringify({ workspace_id: "workspace-1" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(BenchmarksPage));
    });

    await act(async () => {
      await vi.runAllTimersAsync();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Source: Qeemly Market Data");
    expect(container.textContent).toContain("Published: 17 Mar 2026");
  });

  it("syncs benchmark branding to the active workspace while viewing as admin", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url.includes("/api/benchmarks/stats")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                total: 12,
                uniqueRoles: 2,
                uniqueLocations: 2,
                sources: ["market"],
                lastUpdated: "2026-03-17T10:00:00.000Z",
                hasRealData: true,
                diagnostics: {
                  market: {
                    readMode: "session",
                    clientWarning: null,
                    error: null,
                    warning: null,
                    hasServiceRoleKey: true,
                    hasPlatformWorkspaceId: true,
                  },
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }

        if (url.includes("/api/settings")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                workspace_id: "workspace-2",
                workspace_name: "Qeemly Test",
                is_viewing_as_admin: true,
                settings: {
                  company_name: "Experrt",
                  company_logo: "https://example.com/expert-logo.png",
                  is_configured: true,
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }

        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(BenchmarksPage));
    });

    await act(async () => {
      await vi.runAllTimersAsync();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(companySettingsState.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: "Qeemly Test",
        companyLogo: null,
      }),
    );

    await act(async () => {
      root.unmount();
    });
  });
});
