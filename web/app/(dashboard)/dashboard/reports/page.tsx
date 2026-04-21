"use client";

import { useEffect } from "react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { ReportStatusBar } from "@/components/dashboard/reports/report-status-bar";
import { AnalyticsKpiCards } from "@/components/dashboard/reports/analytics-kpi-cards";
import { AnalyticsCharts } from "@/components/dashboard/reports/analytics-charts";
import { AnalyticsInsightsPanel } from "@/components/dashboard/reports/analytics-insights-panel";
import { useReportsStore } from "@/lib/reports/store";

export default function ReportsPage() {
  const { loadReports, loadTemplates } = useReportsStore();

  useEffect(() => {
    void loadReports();
    void loadTemplates();
  }, [loadReports, loadTemplates]);

  useEffect(() => {
    const handler = () => {
      void loadReports();
      void loadTemplates();
    };
    window.addEventListener("qeemly:workspace-changed", handler);
    return () => window.removeEventListener("qeemly:workspace-changed", handler);
  }, [loadReports, loadTemplates]);

  return (
    <div className="bench-results space-y-6 relative z-10">
      <DashboardPageHeader title="Analytics" />

      <ReportStatusBar />

      <AnalyticsKpiCards />

      <AnalyticsCharts />

      <AnalyticsInsightsPanel />
    </div>
  );
}
