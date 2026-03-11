"use client";

import { useState } from "react";
import { Users, Target, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import clsx from "clsx";
import { 
  type Department, 
  formatAEDCompact,
} from "@/lib/employees";
import type { OverviewDepartmentSummary } from "@/lib/dashboard/company-overview";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";

interface DepartmentTabsProps {
  summaries: OverviewDepartmentSummary[];
}

type ViewMode = "overview" | "payroll" | "band";

export function DepartmentTabs({ summaries }: DepartmentTabsProps) {
  const { salaryView } = useSalaryView();
  const [selectedDept, setSelectedDept] = useState<Department | null>(summaries[0]?.department ?? null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  
  const selectedSummary = selectedDept ? summaries.find(s => s.department === selectedDept) : null;

  return (
    <Card className="dash-card p-6 lg:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-accent-900">Department Breakdown</h3>
          <p className="mt-1 text-xs text-accent-500">Click a department for details</p>
        </div>
        
        {/* View mode selector */}
        <div className="flex w-full flex-wrap gap-1 rounded-xl bg-accent-100 p-1 sm:w-auto sm:flex-nowrap">
          {([
            { id: "overview", label: "Headcount" },
            { id: "payroll", label: "Payroll" },
            { id: "band", label: "In Band %" },
          ] as { id: ViewMode; label: string }[]).map(mode => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setViewMode(mode.id)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                viewMode === mode.id
                  ? "bg-white text-accent-900 shadow-sm"
                  : "text-accent-500 hover:text-accent-700"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Department pills for quick selection */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-xl bg-surface-2 p-3">
        {summaries.map((summary) => {
          const inBandPct = summary.inBandPct;
          const statusDot =
            summary.benchmarkedCount === 0
              ? "bg-accent-300"
              : inBandPct >= 70
                ? "bg-emerald-400"
                : inBandPct >= 50
                  ? "bg-amber-400"
                  : "bg-rose-400";
          return (
            <button
              key={summary.department}
              onClick={() => setSelectedDept(
                selectedDept === summary.department ? null : summary.department
              )}
              className={clsx(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                selectedDept === summary.department
                  ? "bg-accent-800 text-white ring-2 ring-accent-800 ring-offset-2"
                  : "bg-accent-100 text-accent-700 hover:bg-accent-200"
              )}
            >
              <span className="flex items-center gap-2">
                <span className={clsx("w-1.5 h-1.5 rounded-full", statusDot)} />
                {summary.department}
                <span className="opacity-60">({summary.activeCount})</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Department list visualization */}
      <div className="space-y-5">
        <div className="grid gap-2.5 xl:grid-cols-2">
          {summaries.map((summary) => {
            const inBandPct = summary.inBandPct;
            const statusColor =
              summary.benchmarkedCount === 0
                ? "bg-accent-300"
                : inBandPct >= 70
                  ? "bg-emerald-500"
                  : inBandPct >= 50
                    ? "bg-amber-400"
                    : "bg-rose-400";
            const value =
              viewMode === "payroll"
                ? formatAEDCompact(applyViewMode(summary.totalPayroll, salaryView))
                : viewMode === "band"
                  ? `${inBandPct}%`
                  : `${summary.activeCount}`;
            const label =
              viewMode === "payroll"
                ? "payroll"
                : viewMode === "band"
                  ? "in band"
                  : "headcount";
            return (
              <button
                key={summary.department}
                type="button"
                onClick={() => setSelectedDept(summary.department)}
                className={clsx(
                  "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors",
                  selectedDept === summary.department
                    ? "bg-brand-50 ring-1 ring-brand-200"
                    : "bg-surface-3 hover:bg-accent-100",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className={clsx("h-2 w-2 rounded-full", statusColor)} />
                  <span className="text-sm font-medium text-text-primary">{summary.department}</span>
                  <span className="text-xs text-text-tertiary">({summary.activeCount})</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-text-secondary">
                  {value} <span className="text-text-tertiary">{label}</span>
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-accent-500">High in-band</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-accent-500">Mixed alignment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="text-accent-500">Low in-band</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-accent-300" />
            <span className="text-accent-500">No benchmark coverage</span>
          </div>
        </div>
      </div>

      {/* Selected department detail view */}
      {selectedSummary && (
        <div className="mt-6 space-y-4 border-t border-border pt-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-50">
              <Users className="h-4 w-4 text-accent-600" />
              <div>
                <div className="text-lg font-bold text-accent-900">{selectedSummary.activeCount}</div>
                <div className="text-xs text-accent-500">Headcount</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50">
              <Target className="h-4 w-4 text-brand-600" />
              <div>
                <div className="text-lg font-bold text-brand-900">{selectedSummary.benchmarkedCount}</div>
                <div className="text-xs text-brand-600">Benchmarked</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50">
              <div className="h-4 w-4 rounded-full bg-amber-400" />
              <div>
                <div className="text-lg font-bold text-amber-900">
                  {selectedSummary.belowBandCount + selectedSummary.aboveBandCount}
                </div>
                <div className="text-xs text-amber-600">Out of Band</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50">
              {selectedSummary.avgVsMarket >= 0 ? (
                <TrendingUp className="h-4 w-4 text-blue-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-blue-600" />
              )}
              <div>
                <div className="text-lg font-bold text-blue-900">
                  {selectedSummary.avgVsMarket >= 0 ? "+" : ""}{selectedSummary.avgVsMarket}%
                </div>
                <div className="text-xs text-blue-600">vs Market</div>
              </div>
            </div>
          </div>

          {/* Payroll + band split row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payroll */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-accent-50">
              <span className="text-sm font-medium text-accent-700">Department Payroll</span>
              <span className="text-lg font-bold text-accent-900">
                {formatAEDCompact(applyViewMode(selectedSummary.totalPayroll, salaryView))}
              </span>
            </div>

            {/* Band distribution ring */}
            <div className="flex items-center gap-4 rounded-xl bg-accent-50 p-4">
              <div className="relative h-16 w-16 shrink-0">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background:
                      selectedSummary.benchmarkedCount > 0
                        ? `conic-gradient(var(--success) 0deg ${(
                            (selectedSummary.inBandCount / selectedSummary.benchmarkedCount) * 360
                          ).toFixed(2)}deg, var(--warning) ${(
                            (selectedSummary.inBandCount / selectedSummary.benchmarkedCount) * 360
                          ).toFixed(2)}deg ${(
                            ((selectedSummary.inBandCount + selectedSummary.belowBandCount) /
                              selectedSummary.benchmarkedCount) *
                            360
                          ).toFixed(2)}deg, #fb7185 ${(
                            ((selectedSummary.inBandCount + selectedSummary.belowBandCount) /
                              selectedSummary.benchmarkedCount) *
                            360
                          ).toFixed(2)}deg 360deg)`
                        : "conic-gradient(var(--color-accent-300) 0deg 360deg)",
                  }}
                />
                <div className="pointer-events-none absolute inset-2 rounded-full bg-white" />
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-accent-600">In Band: {selectedSummary.inBandPct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-accent-600">Below: {selectedSummary.belowBandPct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-accent-600">Above: {selectedSummary.aboveBandPct}%</span>
                </div>
                <p className="pt-1 text-[11px] text-accent-500">
                  Coverage {selectedSummary.coveragePct}% of department headcount
                </p>
              </div>
            </div>
          </div>

          {/* Action link */}
          <Link 
            href={`/dashboard/salary-review?department=${selectedSummary.department}`}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-brand-500 hover:bg-brand-600 transition-colors group text-white"
          >
            <span className="text-sm font-medium">
              View {selectedSummary.department} employees
            </span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </Card>
  );
}
