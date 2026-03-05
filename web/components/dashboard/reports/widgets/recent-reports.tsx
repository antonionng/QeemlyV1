"use client";

import { REPORT_TYPES } from "@/lib/reports/constants";
import { useReportsContext } from "@/lib/reports/context";
import { Download, FileText, MoreHorizontal } from "lucide-react";
import clsx from "clsx";

function formatTimeAgo(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  Ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Building: "bg-amber-100 text-amber-700 border-amber-200",
  Scheduled: "bg-brand-100 text-brand-600 border-brand-200",
};

export function RecentReportsWidget() {
  const { filteredRecentReports } = useReportsContext();

  return (
    <div className="space-y-3">
      {filteredRecentReports.map((report) => (
        <div 
          key={report.id} 
          className="group flex items-center justify-between rounded-xl border border-border bg-white p-3 transition-all hover:border-brand-300 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-900">{report.title}</p>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-accent-500">
                <span>{report.owner}</span>
                <span>•</span>
                <span>{formatTimeAgo(report.lastRun)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={clsx(
              "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              STATUS_STYLES[report.status]
            )}>
              {report.status}
            </span>
            <button className="rounded-lg p-1.5 text-accent-400 transition-colors hover:bg-brand-50 hover:text-brand-600">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {filteredRecentReports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6">
          <p className="text-xs font-medium italic text-accent-400">No reports found</p>
        </div>
      )}
      <button className="w-full rounded-xl border border-dashed border-border py-2 text-[11px] font-bold uppercase tracking-widest text-accent-400 transition-all hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600">
        View All Reports
      </button>
    </div>
  );
}
