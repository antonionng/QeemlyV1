import { create } from "zustand";
import type {
  Report,
  CreateReportPayload,
  GenerateReportPayload,
  ReportRun,
  ReportTemplate,
  UpdateReportPayload,
} from "./types";

interface ReportsStore {
  reports: Report[];
  templates: ReportTemplate[];
  reportRunsByReportId: Record<string, ReportRun[]>;
  isLoading: boolean;
  isLoadingTemplates: boolean;
  selectedReport: Report | null;

  loadReports: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  createReport: (payload: CreateReportPayload) => Promise<Report | null>;
  createReportFromTemplate: (
    templateId: string,
    overrides?: Partial<Omit<CreateReportPayload, "template_id">>
  ) => Promise<Report | null>;
  generateReport: (id: string, payload?: GenerateReportPayload) => Promise<Report | null>;
  loadReportRuns: (reportId: string) => Promise<ReportRun[]>;
  updateReport: (id: string, payload: UpdateReportPayload) => Promise<Report | null>;
  deleteReport: (id: string) => Promise<boolean>;
  selectReport: (report: Report | null) => void;
}

export const useReportsStore = create<ReportsStore>((set) => ({
  reports: [],
  templates: [],
  reportRunsByReportId: {},
  isLoading: false,
  isLoadingTemplates: false,
  selectedReport: null,

  loadReports: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      set({ reports: data.reports || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadTemplates: async () => {
    set({ isLoadingTemplates: true });
    try {
      const res = await fetch("/api/report-templates");
      if (!res.ok) throw new Error("Failed to load templates");
      const data = await res.json();
      set({ templates: data.templates || [], isLoadingTemplates: false });
    } catch {
      set({ isLoadingTemplates: false });
    }
  },

  createReport: async (payload) => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const data = await res.json();
      set((state) => ({ reports: [data.report, ...state.reports] }));
      return data.report;
    } catch {
      return null;
    }
  },

  createReportFromTemplate: async (templateId, overrides = {}) => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...overrides,
          template_id: templateId,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      set((state) => ({ reports: [data.report, ...state.reports] }));
      return data.report;
    } catch {
      return null;
    }
  },

  generateReport: async (id, payload = {}) => {
    try {
      const res = await fetch(`/api/reports/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const report: Report = data.report;
      set((state) => ({
        reports: state.reports.map((r) => (r.id === id ? report : r)),
        selectedReport: state.selectedReport?.id === id ? report : state.selectedReport,
        reportRunsByReportId: {
          ...state.reportRunsByReportId,
          [id]: [
            ...(state.reportRunsByReportId[id] || []).filter((run) => run.id !== data.run.id),
            data.run,
          ].sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
        },
      }));
      return report;
    } catch {
      return null;
    }
  },

  loadReportRuns: async (reportId) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) return [];
      const data = await res.json();
      const report = data.report as Report;
      if (!report.last_run_id) {
        set((state) => ({
          reportRunsByReportId: {
            ...state.reportRunsByReportId,
            [reportId]: [],
          },
        }));
        return [];
      }

      const runsRes = await fetch(`/api/report-runs?report_id=${encodeURIComponent(reportId)}`);
      if (!runsRes.ok) return [];
      const runsData = await runsRes.json();
      const runs = (runsData.runs || []) as ReportRun[];
      set((state) => ({
        reportRunsByReportId: {
          ...state.reportRunsByReportId,
          [reportId]: runs,
        },
      }));
      return runs;
    } catch {
      return [];
    }
  },

  updateReport: async (id, payload) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      set((state) => ({
        reports: state.reports.map((r) => (r.id === id ? data.report : r)),
        selectedReport: state.selectedReport?.id === id ? data.report : state.selectedReport,
      }));
      return data.report;
    } catch {
      return null;
    }
  },

  deleteReport: async (id) => {
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
        selectedReport: state.selectedReport?.id === id ? null : state.selectedReport,
      }));
      return true;
    } catch {
      return false;
    }
  },

  selectReport: (report) => set({ selectedReport: report }),
}));
