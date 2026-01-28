"use client";

import { REPORT_KPIS } from "@/lib/reports/data";
import { TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";

export function ReportStatsWidget() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {REPORT_KPIS.map((kpi) => (
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
              {kpi.delta.split(" ")[0]}
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
