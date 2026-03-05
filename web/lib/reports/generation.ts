import type { Report } from "./types";

type ReportMetric = {
  id: string;
  label: string;
  value: string | number;
};

export type GeneratedReportResult = {
  generated_at: string;
  template_id: string | null;
  summary: string;
  metrics: ReportMetric[];
  sections: Array<{ title: string; notes: string }>;
};

function pickMetrics(report: Report): ReportMetric[] {
  const tagCount = report.tags.length;
  const recipientCount = report.recipients.length;

  return [
    { id: "tag_coverage", label: "Tags Covered", value: tagCount },
    { id: "recipient_count", label: "Recipients", value: recipientCount },
    { id: "type", label: "Report Type", value: report.type_id },
  ];
}

export function generateReportResult(report: Report): GeneratedReportResult {
  const generatedAt = new Date().toISOString();
  const templateId = report.template_id || null;

  return {
    generated_at: generatedAt,
    template_id: templateId,
    summary: `Generated ${report.title} for ${report.owner} in ${report.format} format.`,
    metrics: pickMetrics(report),
    sections: [
      {
        title: "Highlights",
        notes: "Auto-generated from selected template settings and current report filters.",
      },
      {
        title: "Next Actions",
        notes: "Review findings, validate exceptions, and share with configured recipients.",
      },
    ],
  };
}
