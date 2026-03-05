"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";
import { useReportsStore } from "@/lib/reports/store";

export function ReportStatsWidget() {
  const { reports } = useReportsStore();
  const reportKpis = [
    {
      id: "generated",
      label: "Reports Generated",
      value: String(reports.length),
      delta: reports.length > 0 ? "Live" : "0",
      trend: reports.length > 0 ? "up" : "down",
    },
    {
      id: "ready",
      label: "Ready to Share",
      value: String(reports.filter((r) => r.status === "Ready").length),
      delta: "Live",
      trend: reports.some((r) => r.status === "Ready") ? "up" : "down",
    },
    {
      id: "scheduled",
      label: "Scheduled",
      value: String(reports.filter((r) => r.status === "Scheduled").length),
      delta: "Live",
      trend: reports.some((r) => r.status === "Scheduled") ? "up" : "down",
    },
    {
      id: "building",
      label: "In Progress",
      value: String(reports.filter((r) => r.status === "Building").length),
      delta: "Live",
      trend: reports.some((r) => r.status === "Building") ? "up" : "down",
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {reportKpis.map((kpi) => (
        <div 
          key={kpi.id} 
          className="rounded-2xl border border-border bg-brand-50/30 p-4 transition-all hover:bg-brand-50/50"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-accent-500">{kpi.label}</p>
            <div className={clsx(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
              kpi.trend === "up" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            )}>
              {kpi.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {kpi.delta}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-black text-brand-900">{kpi.value}</p>
            <p className="text-[10px] font-medium text-accent-400">vs last month</p>
          </div>
        </div>
      ))}
    </div>
  );
}
