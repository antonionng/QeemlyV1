"use client";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { ReportStatusBar } from "@/components/dashboard/reports/report-status-bar";
import { AnalyticsKpiCards } from "@/components/dashboard/reports/analytics-kpi-cards";
import { AnalyticsCharts } from "@/components/dashboard/reports/analytics-charts";
import { AnalyticsInsightsPanel } from "@/components/dashboard/reports/analytics-insights-panel";

export default function ReportsPage() {
  return (
    <div className="bench-results space-y-6 relative z-10">
      <DashboardPageHeader title="Analytics" />

      {/* Data status */}
      <ReportStatusBar />

      {/* Analytics overview */}
      <AnalyticsKpiCards />

      {/* Visual analytics */}
      <AnalyticsCharts />

      {/* AI Insights */}
      <AnalyticsInsightsPanel />
    </div>
  );
}
