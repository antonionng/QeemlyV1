import * as XLSX from "xlsx";
import type { Report } from "./types";

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-z0-9-_]+/gi, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function toReportRows(report: Report) {
  const result = (report.result_data || {}) as Record<string, unknown>;
  const metrics = Array.isArray(result.metrics) ? (result.metrics as Array<Record<string, unknown>>) : [];
  const sections = Array.isArray(result.sections) ? (result.sections as Array<Record<string, unknown>>) : [];

  const summaryRow = {
    title: report.title,
    type: report.type_id,
    status: report.status,
    owner: report.owner,
    format: report.format,
    cadence: report.schedule_cadence || "none",
    generated_at: typeof result.generated_at === "string" ? result.generated_at : report.updated_at,
    summary: typeof result.summary === "string" ? result.summary : "",
    tags: report.tags.join(", "),
  };

  const metricRows = metrics.map((m) => ({
    metric_id: String(m.id ?? ""),
    metric_label: String(m.label ?? ""),
    metric_value: String(m.value ?? ""),
  }));

  const sectionRows = sections.map((s) => ({
    section_title: String(s.title ?? ""),
    section_notes: String(s.notes ?? ""),
  }));

  return { summaryRow, metricRows, sectionRows };
}

export function exportSingleReport(report: Report) {
  const safeName = sanitizeFilename(report.title || "report");
  const { summaryRow, metricRows, sectionRows } = toReportRows(report);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([summaryRow]), "Summary");
  if (metricRows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metricRows), "Metrics");
  }
  if (sectionRows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sectionRows), "Sections");
  }

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${safeName}.xlsx`);
}

export function exportReportsWorkbook(reports: Report[]) {
  const wb = XLSX.utils.book_new();
  const overviewRows = reports.map((report) => {
    const result = (report.result_data || {}) as Record<string, unknown>;
    return {
      title: report.title,
      type: report.type_id,
      status: report.status,
      owner: report.owner,
      format: report.format,
      updated_at: report.updated_at,
      summary: typeof result.summary === "string" ? result.summary : "",
      tags: report.tags.join(", "),
    };
  });

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(overviewRows.length > 0 ? overviewRows : [{ message: "No reports available" }]),
    "Reports"
  );

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, "qeemly_reports_export.xlsx");
}
