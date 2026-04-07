/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  loadReportsMock,
  loadTemplatesMock,
  createReportMock,
  createReportFromTemplateMock,
  generateReportMock,
} = vi.hoisted(() => ({
  loadReportsMock: vi.fn(),
  loadTemplatesMock: vi.fn(),
  createReportMock: vi.fn(),
  createReportFromTemplateMock: vi.fn(),
  generateReportMock: vi.fn(),
}));

vi.mock("@/lib/reports/store", () => ({
  useReportsStore: () => ({
    loadReports: loadReportsMock,
    loadTemplates: loadTemplatesMock,
    createReport: createReportMock,
    createReportFromTemplate: createReportFromTemplateMock,
    generateReport: generateReportMock,
    reports: [],
    templates: [],
    isLoadingTemplates: false,
  }),
}));

vi.mock("@/components/dashboard/reports/report-status-bar", () => ({
  ReportStatusBar: () => React.createElement("div", null, "status"),
}));

vi.mock("@/components/dashboard/reports/report-kpi-cards", () => ({
  ReportKpiCards: () => React.createElement("div", null, "kpis"),
}));

vi.mock("@/components/dashboard/reports/report-grid", () => ({
  ReportGrid: () => React.createElement("div", null, "grid"),
}));

vi.mock("@/components/dashboard/reports/new-report-modal", () => ({
  NewReportModal: () => null,
}));

vi.mock("@/components/dashboard/reports/template-library-modal", () => ({
  TemplateLibraryModal: () => null,
}));

vi.mock("@/components/dashboard/reports/report-detail-panel", () => ({
  ReportDetailPanel: () => null,
}));

vi.mock("@/lib/reports/export", () => ({
  exportReportsWorkbook: vi.fn(),
}));

import ReportsPage from "@/app/(dashboard)/dashboard/reports/page";

describe("ReportsPage workspace refresh", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    container.remove();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
  });

  it("reloads reports and templates when the workspace changes", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(ReportsPage));
      await Promise.resolve();
    });

    expect(loadReportsMock).toHaveBeenCalledTimes(1);
    expect(loadTemplatesMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("qeemly:workspace-changed", {
          detail: { workspaceId: "workspace-2", source: "override" },
        }),
      );
      await Promise.resolve();
    });

    expect(loadReportsMock).toHaveBeenCalledTimes(2);
    expect(loadTemplatesMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      root.unmount();
    });
  });
});
