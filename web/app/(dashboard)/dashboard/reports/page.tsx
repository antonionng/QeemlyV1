"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportStatusBar } from "@/components/dashboard/reports/report-status-bar";
import { ReportKpiCards } from "@/components/dashboard/reports/report-kpi-cards";
import { ReportGrid } from "@/components/dashboard/reports/report-grid";
import { NewReportModal } from "@/components/dashboard/reports/new-report-modal";
import { TemplateLibraryModal } from "@/components/dashboard/reports/template-library-modal";
import { ReportDetailPanel } from "@/components/dashboard/reports/report-detail-panel";
import { useReportsStore } from "@/lib/reports/store";
import type { Report, ReportTemplate } from "@/lib/reports/types";
import { exportReportsWorkbook } from "@/lib/reports/export";

export default function ReportsPage() {
  const [showNewReport, setShowNewReport] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const {
    loadReports,
    loadTemplates,
    createReport,
    createReportFromTemplate,
    generateReport,
    reports,
    templates,
    isLoadingTemplates,
  } = useReportsStore();

  useEffect(() => {
    loadReports();
    loadTemplates();
  }, [loadReports, loadTemplates]);

  const handleSelectTemplate = () => {
    setShowNewReport(false);
    setShowTemplateLibrary(true);
  };

  const handleBackToNewReport = () => {
    setShowTemplateLibrary(false);
    setShowNewReport(true);
  };

  const handleExportAll = () => {
    exportReportsWorkbook(reports);
  };

  const handleCreateCustom = async () => {
    const report = await createReport({
      title: `Custom Report ${new Date().toLocaleDateString("en-GB")}`,
      type_id: "custom",
      tags: ["Custom"],
    });
    setShowNewReport(false);
    if (!report) return;
    setSelectedReport(report);
    const generated = await generateReport(report.id, { trigger_source: "manual" });
    if (generated) setSelectedReport(generated);
  };

  const handleCreateFromTemplate = async (template: ReportTemplate) => {
    if (isCreatingFromTemplate) return;
    setIsCreatingFromTemplate(true);
    try {
      const report = await createReportFromTemplate(template.id, {
        title: template.title,
        tags: template.tags,
      });

      if (!report) return;

      setSelectedReport(report);
      const generated = await generateReport(report.id, { trigger_source: "template" });
      if (generated) setSelectedReport(generated);
      await loadReports();
      setShowTemplateLibrary(false);
      setShowNewReport(false);
    } finally {
      setIsCreatingFromTemplate(false);
    }
  };

  return (
    <div className="bench-results space-y-6 relative z-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">
          Reports &amp; Analytics
        </h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            className="h-10 gap-2 rounded-full border-border bg-white px-5 text-sm font-semibold text-brand-900"
          >
            <ExternalLink className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const scheduledReport = reports.find(r => r.status === "Scheduled");
              if (scheduledReport) setSelectedReport(scheduledReport);
            }}
            className="h-10 gap-2 rounded-full border-border bg-white px-5 text-sm font-semibold text-brand-900"
          >
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
          <Button
            size="sm"
            className="h-10 gap-2 rounded-full bg-brand-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
            onClick={() => setShowNewReport(true)}
          >
            <Plus className="h-4 w-4" />
            New Report
          </Button>
        </div>
      </div>

      {/* Status strip */}
      <ReportStatusBar />

      {/* KPI cards */}
      <ReportKpiCards />

      {/* Reports list */}
      <ReportGrid onOpenReport={setSelectedReport} />

      {/* Report Detail Panel */}
      {selectedReport && (
        <ReportDetailPanel
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Modals */}
      <NewReportModal
        open={showNewReport}
        onClose={() => setShowNewReport(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateCustom={handleCreateCustom}
      />
      <TemplateLibraryModal
        open={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onBack={handleBackToNewReport}
        templates={templates}
        isLoadingTemplates={isLoadingTemplates || isCreatingFromTemplate}
        onSelectTemplate={handleCreateFromTemplate}
      />
    </div>
  );
}
