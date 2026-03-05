"use client";

import { TrendingUp, ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import { useReportsStore } from "@/lib/reports/store";

export function ReportKpiCards() {
  const { reports } = useReportsStore();
  const readyReports = reports.filter((r) => r.status === "Ready").length;
  const generatedReports = reports.length;
  const coverage = reports.length > 0
    ? `${Math.round((reports.filter((r) => r.tags.length > 0).length / reports.length) * 100)}%`
    : "0%";
  const confidence = reports.length > 0 ? "High" : "N/A";

  const reportKpis = [
    {
      id: "generated",
      label: "Reports Generated",
      value: String(generatedReports),
      delta: generatedReports > 0 ? "Live" : "0",
      deltaLabel: generatedReports > 0 ? "workspace total" : "until reports are created",
      trend: generatedReports > 0 ? "up" : "stable",
      valueColor: undefined,
    },
    {
      id: "ready",
      label: "Ready to Share",
      value: String(readyReports),
      delta: readyReports > 0 ? "Live" : "0",
      deltaLabel: readyReports > 0 ? "currently ready" : "until reports are created",
      trend: readyReports > 0 ? "up" : "stable",
      valueColor: readyReports > 0 ? "emerald" : undefined,
    },
    {
      id: "coverage",
      label: "Coverage",
      value: coverage,
      delta: reports.length > 0 ? "Live" : "0",
      deltaLabel: reports.length > 0 ? "tagged report coverage" : "until reports are created",
      trend: reports.length > 0 ? "up" : "stable",
      valueColor: undefined,
    },
    {
      id: "confidence",
      label: "Average Confidence",
      value: confidence,
      delta: reports.length > 0 ? "Live" : "Stable",
      deltaLabel: reports.length > 0 ? "report pipeline status" : "until reports are created",
      trend: reports.length > 0 ? "up" : "stable",
      valueColor: undefined,
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {reportKpis.map((kpi) => (
        <div
          key={kpi.id}
          className="rounded-2xl border border-border bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-semibold text-accent-500">{kpi.label}</p>
          <div className="mt-3 flex items-end justify-between">
            <p
              className={clsx(
                "text-3xl font-bold tracking-tight",
                kpi.valueColor === "emerald"
                  ? "text-emerald-500"
                  : "text-brand-900"
              )}
            >
              {kpi.value}
            </p>
            <div className="flex flex-col items-end gap-0.5">
              <div
                className={clsx(
                  "flex items-center gap-1 text-xs font-semibold",
                  kpi.trend === "stable"
                    ? "text-accent-500"
                    : "text-emerald-600"
                )}
              >
                {kpi.trend === "stable" ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                )}
                <span>{kpi.delta}</span>
              </div>
              <span className="text-[11px] text-accent-400">
                {kpi.deltaLabel}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
