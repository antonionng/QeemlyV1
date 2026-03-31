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

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    AlertTriangle: () => React.createElement("svg"),
    AlertCircle: () => React.createElement("svg"),
    CheckCircle: () => React.createElement("svg"),
    CheckCircle2: () => React.createElement("svg"),
    Clock3: () => React.createElement("svg"),
    FileSpreadsheet: () => React.createElement("svg"),
    FileText: () => React.createElement("svg"),
    FolderInput: () => React.createElement("svg"),
    Loader2: () => React.createElement("svg"),
    Play: () => React.createElement("svg"),
    RefreshCw: () => React.createElement("svg"),
    Upload: () => React.createElement("svg"),
    XCircle: () => React.createElement("svg"),
  };
});

vi.mock("@/components/admin/admin-page-error", () => ({
  AdminPageError: ({ error }: { error: { title: string } | null }) =>
    error ? React.createElement("div", null, error.title) : null,
}));

vi.mock("@/lib/admin/api-client", () => ({
  fetchAdminJson: fetchAdminJsonMock,
  normalizeAdminApiError: normalizeAdminApiErrorMock,
}));

import AdminIntakePage from "@/app/admin/(dashboard)/intake/page";

const uploadsPayload = [
  {
    id: "upload-1",
    file_name: "Robert Walters Tech Guide.pdf",
    file_path: "uploads/2026-03-24/robert-walters-tech.pdf",
    file_size: 128,
    mime_type: "application/pdf",
    file_kind: "pdf",
    ingest_queue: "Document review",
    ingestion_status: "reviewing",
    ingestion_notes: "Extracted 2 Robert Walters pilot rows.",
    uploaded_by: "admin-1",
    created_at: "2026-03-24T12:00:00.000Z",
    updated_at: "2026-03-24T12:00:00.000Z",
  },
];

const jobsPayload: Array<Record<string, unknown>> = [
  {
    id: "job-queued",
    status: "queued",
    source_id: "source-allowed",
    records_created: 0,
    records_updated: 0,
    records_failed: 0,
    created_at: "2026-03-24T12:10:00.000Z",
    completed_at: null,
    error_message: null,
  },
];
const statsPayload = {
  jobs_24h: { total: 1, success: 0, failed: 0, running: 1, partial: 0 },
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

describe("AdminIntakePage recent activity", () => {
  let container: HTMLDivElement;
  const fetchMock = vi.fn();

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    fetchAdminJsonMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/admin/inbox") return uploadsPayload;
      if (url === "/api/admin/jobs") return jobsPayload;
      if (url === "/api/admin/sources") return sourcesPayload;
      if (url === "/api/admin/stats") return statsPayload;
      throw new Error(`Unexpected fetchAdminJson call: ${url}`);
    });

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

  it("shows tabbed intake sections and keeps automated controls under the automated tab", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AdminIntakePage));
    });

    expect(container.textContent).toContain("Manual Uploads");
    expect(container.textContent).toContain("Automated Sources");
    expect(container.textContent).toContain("Recent Activity");
    expect(container.textContent).not.toContain("Run Selected Source");
    expect(container.textContent).toContain("Manual Uploads1");
    expect(container.textContent).toContain("Automated Sources2");
    expect(container.textContent).toContain("Recent Activity2");
    expect(container.querySelector('[data-testid="intake-tab-bar"]')?.className).toContain("sticky");

    const automatedTab = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Automated Sources"),
    );
    expect(automatedTab).toBeDefined();

    await act(async () => {
      automatedTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
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

  it("makes recent activity explicit about manual uploads versus automated ingestion jobs", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(AdminIntakePage));
    });

    const activityTab = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Recent Activity"),
    );
    expect(activityTab).toBeDefined();

    await act(async () => {
      activityTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Recent Manual Uploads");
    expect(container.textContent).toContain("Automated Ingestion Jobs");
    expect(container.textContent).toContain("Robert Walters Tech Guide.pdf");
    expect(container.textContent).toContain("Manual upload");
    expect(container.textContent).toContain("Qatar Wages");
    expect(container.textContent).toContain("Automated source");
    expect(container.textContent).toContain("queued");

    await act(async () => {
      root.unmount();
    });
  });
});
