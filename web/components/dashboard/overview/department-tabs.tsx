"use client";

import { useState } from "react";
import { Users, Target, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { BarList, DonutChart } from "@tremor/react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import clsx from "clsx";
import { 
  type Department, 
  type DepartmentSummary, 
  formatAEDCompact,
} from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";

interface DepartmentTabsProps {
  summaries: DepartmentSummary[];
}

type ViewMode = "overview" | "payroll" | "band";

export function DepartmentTabs({ summaries }: DepartmentTabsProps) {
  const { salaryView } = useSalaryView();
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  
  const selectedSummary = selectedDept ? summaries.find(s => s.department === selectedDept) : null;
  
  // Prepare data for bar list visualization
  const headcountData = summaries.map(s => ({
    name: s.department,
    value: s.activeCount,
    icon: () => (
      <div className={clsx(
        "w-2 h-2 rounded-full mr-2",
        s.avgVsMarket > 5 ? "bg-rose-400" : s.avgVsMarket < -5 ? "bg-amber-400" : "bg-emerald-400"
      )} />
    ),
  }));

  const payrollData = summaries.map(s => ({
    name: s.department,
    value: s.totalPayroll,
    icon: () => (
      <div className={clsx(
        "w-2 h-2 rounded-full mr-2",
        s.avgVsMarket > 5 ? "bg-rose-400" : s.avgVsMarket < -5 ? "bg-amber-400" : "bg-emerald-400"
      )} />
    ),
  }));

  const bandHealthData = summaries.map(s => ({
    name: s.department,
    value: Math.round((s.inBandCount / s.activeCount) * 100),
    icon: () => {
      const inBandPct = Math.round((s.inBandCount / s.activeCount) * 100);
      return (
        <div className={clsx(
          "w-2 h-2 rounded-full mr-2",
          inBandPct >= 70 ? "bg-emerald-400" : inBandPct >= 50 ? "bg-amber-400" : "bg-rose-400"
        )} />
      );
    },
  }));

  // Get current view data
  const getCurrentData = () => {
    switch (viewMode) {
      case "payroll": return payrollData;
      case "band": return bandHealthData;
      default: return headcountData;
    }
  };

  const getValueFormatter = () => {
    switch (viewMode) {
      case "payroll": return (v: number) => formatAEDCompact(applyViewMode(v, salaryView));
      case "band": return (v: number) => `${v}%`;
      default: return (v: number) => v.toString();
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">Department Breakdown</h3>
          <p className="text-xs text-brand-500 mt-0.5">Click a department for details</p>
        </div>
        
        {/* View mode selector */}
        <div className="flex gap-1 rounded-lg bg-brand-100/50 p-1">
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
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                viewMode === mode.id
                  ? "bg-white text-brand-900 shadow-sm"
                  : "text-brand-600 hover:text-brand-800"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Department pills for quick selection */}
      <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-border">
        {summaries.map((summary) => {
          const inBandPct = Math.round((summary.inBandCount / summary.activeCount) * 100);
          return (
            <button
              key={summary.department}
              onClick={() => setSelectedDept(
                selectedDept === summary.department ? null : summary.department
              )}
              className={clsx(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                selectedDept === summary.department
                  ? "bg-brand-500 text-white ring-2 ring-brand-500 ring-offset-2"
                  : "bg-brand-50 text-brand-700 hover:bg-brand-100"
              )}
            >
              <span className="flex items-center gap-2">
                <span className={clsx(
                  "w-1.5 h-1.5 rounded-full",
                  inBandPct >= 70 ? "bg-emerald-400" : inBandPct >= 50 ? "bg-amber-400" : "bg-rose-400"
                )} />
                {summary.department}
                <span className="opacity-60">({summary.activeCount})</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Bar chart visualization */}
      {!selectedDept && (
        <div className="space-y-4">
          <BarList
            data={getCurrentData()}
            valueFormatter={getValueFormatter()}
            color="violet"
            showAnimation={true}
            onValueChange={(item) => setSelectedDept(item.name as Department)}
            className="cursor-pointer"
          />
          
          {/* Legend */}
          <div className="flex items-center gap-4 pt-3 border-t border-border text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-brand-600">On target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-brand-600">Below market</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-brand-600">Above market</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected department detail view */}
      {selectedSummary && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50">
              <Users className="h-4 w-4 text-brand-600" />
              <div>
                <div className="text-lg font-bold text-brand-900">{selectedSummary.activeCount}</div>
                <div className="text-xs text-brand-600">Headcount</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50">
              <Target className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="text-lg font-bold text-emerald-900">{selectedSummary.inBandCount}</div>
                <div className="text-xs text-emerald-600">In Band</div>
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

          {/* Payroll and Donut chart row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payroll */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
              <span className="text-sm font-medium text-brand-700">Department Payroll</span>
              <span className="text-lg font-bold text-brand-900">
                {formatAEDCompact(applyViewMode(selectedSummary.totalPayroll, salaryView))}
              </span>
            </div>

            {/* Band distribution donut */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted">
              <DonutChart
                data={[
                  { name: "In Band", value: selectedSummary.inBandCount },
                  { name: "Below", value: selectedSummary.belowBandCount },
                  { name: "Above", value: selectedSummary.aboveBandCount },
                ]}
                category="value"
                index="name"
                colors={["emerald", "amber", "rose"]}
                className="h-16 w-16"
                showLabel={false}
                showAnimation={true}
              />
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-brand-600">In Band: {Math.round((selectedSummary.inBandCount / selectedSummary.activeCount) * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-brand-600">Below: {Math.round((selectedSummary.belowBandCount / selectedSummary.activeCount) * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-brand-600">Above: {Math.round((selectedSummary.aboveBandCount / selectedSummary.activeCount) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action link */}
          <Link 
            href={`/dashboard/salary-review?department=${selectedSummary.department}`}
            className="flex items-center justify-between p-3 rounded-xl bg-brand-50 hover:bg-brand-100 transition-colors group"
          >
            <span className="text-sm font-medium text-brand-700">
              View {selectedSummary.department} employees
            </span>
            <ArrowRight className="h-4 w-4 text-brand-500 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </Card>
  );
}
