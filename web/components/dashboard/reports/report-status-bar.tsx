"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useReportsStore } from "@/lib/reports/store";

export function ReportStatusBar() {
  const { reports, loadReports, generateReport } = useReportsStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const lastGenerated = reports
    .filter((r) => r.last_run_at)
    .sort(
      (a, b) =>
        new Date(b.last_run_at || 0).getTime() -
        new Date(a.last_run_at || 0).getTime(),
    )[0];

  const lastLabel = lastGenerated?.last_run_at
    ? new Date(lastGenerated.last_run_at).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  const handleRefresh = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      if (reports.length === 0) {
        await loadReports();
        return;
      }
      await Promise.all(
        reports.map((report) =>
          generateReport(report.id, { trigger_source: "manual" }),
        ),
      );
      await loadReports();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-600">
            Data Current
          </span>
        </div>
        <div className="hidden items-center gap-2 text-sm text-accent-500 sm:flex">
          <span className="font-medium text-accent-400">Last Refreshed</span>
          <span className="font-semibold text-brand-900">{lastLabel}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          void handleRefresh();
        }}
        disabled={isSyncing}
        className="flex items-center gap-2 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-accent-400"
      >
        {isSyncing ? "Refreshing..." : "Refresh Data"}
        <RefreshCw
          className={isSyncing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
        />
      </button>
    </div>
  );
}
