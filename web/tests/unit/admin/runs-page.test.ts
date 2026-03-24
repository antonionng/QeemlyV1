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

vi.mock("lucide-react", () => ({
  AlertTriangle: () => React.createElement("svg"),
  CheckCircle: () => React.createElement("svg"),
  Clock3: () => React.createElement("svg"),
  Loader2: () => React.createElement("svg"),
  Play: () => React.createElement("svg"),
  RefreshCw: () => React.createElement("svg"),
  XCircle: () => React.createElement("svg"),
}));

vi.mock("@/components/admin/admin-page-error", () => ({
  AdminPageError: ({ error }: { error: { title: string } | null }) =>
    error ? React.createElement("div", null, error.title) : null,
}));

vi.mock("@/lib/admin/api-client", () => ({
  fetchAdminJson: fetchAdminJsonMock,
  normalizeAdminApiError: normalizeAdminApiErrorMock,
}));

import AdminRunsPage from "@/app/admin/(dashboard)/runs/page";

const jobsPayload: Array<Record<string, unknown>> = [];
const statsPayload = {
  jobs_24h: { total: 0, success: 0, failed: 0, running: 0, partial: 0 },
};

const sourcesPayload = [
  {
    id: "source-allowed",
    slug: "qatar_wages",
    name: "Qatar Wages",
    enabled: true,
    approved_for_commercial: true,
    needs_review: false,
    config: { health: "live" },
  },
  {
    id: "source-blocked",
    slug: "ilostat_gcc",
    name: "ILOSTAT GCC",
    enabled: true,
    approved_for_commercial: false,
    needs_review: true,
    config: { health: "degraded" },
  },
];

describe("AdminRunsPage", () => {
  let container: HTMLDivElement;
  const fetchMock = vi.fn();

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    fetchAdminJsonMock
      .mockResolvedValueOnce(jobsPayload)
      .mockResolvedValueOnce(sourcesPayload)
      .mockResolvedValueOnce(statsPayload);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        job_id: "job-1",
        status: "success",
        records_created: 3,
        records_updated: 0,
        records_failed: 0,
      }),
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    container.remove();
  });

  it("only shows runnable sources and excludes blocked sources from run-all", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AdminRunsPage));
    });

    const select = container.querySelector("select");
    expect(select).not.toBeNull();

    const optionLabels = Array.from(select?.querySelectorAll("option") ?? []).map((option) =>
      option.textContent?.trim(),
    );

    expect(optionLabels).toContain("Qatar Wages");
    expect(optionLabels).not.toContain("ILOSTAT GCC");

    const runAllButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Run All"),
    );
    expect(runAllButton).toBeDefined();

    await act(async () => {
      runAllButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_id: "source-allowed" }),
    });

    await act(async () => {
      root.unmount();
    });
  });
});
