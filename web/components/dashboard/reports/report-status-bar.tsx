"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useReportsStore } from "@/lib/reports/store";

export function ReportStatusBar() {
  const { reports, loadReports, generateReport } = useReportsStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const nextScheduled = reports
    .filter((r) => r.schedule_next_run)
    .sort((a, b) => {
      const left = new Date(a.schedule_next_run || 0).getTime();
      const right = new Date(b.schedule_next_run || 0).getTime();
      return left - right;
    })[0];

  const nextLabel = nextScheduled?.schedule_next_run
    ? new Date(nextScheduled.schedule_next_run).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not scheduled";

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      if (reports.length === 0) {
        await loadReports();
        return;
      }
      await Promise.all(
        reports.map((report) =>
          generateReport(report.id, { trigger_source: "manual" })
        )
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
            System Healthy
          </span>
        </div>
        <div className="hidden items-center gap-2 text-sm text-accent-500 sm:flex">
          <span className="font-medium text-accent-400">
            Next Scheduled Sync
          </span>
          <span className="font-semibold text-brand-900">
                  {nextLabel}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          void handleSyncNow();
        }}
        disabled={isSyncing}
        className="flex items-center gap-2 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-accent-400"
      >
        {isSyncing ? "Syncing..." : "Sync Now"}
        <RefreshCw className={isSyncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      </button>
    </div>
  );
}
