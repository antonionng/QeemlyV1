"use client";

import { useState } from "react";
import { Users, Target, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  type Department, 
  type DepartmentSummary, 
  type Employee,
  formatAEDCompact,
  getEmployeesByDepartment,
} from "@/lib/employees";

interface DepartmentTabsProps {
  summaries: DepartmentSummary[];
}

export function DepartmentTabs({ summaries }: DepartmentTabsProps) {
  const [selectedDept, setSelectedDept] = useState<Department>(summaries[0]?.department || "Engineering");
  
  const selectedSummary = summaries.find(s => s.department === selectedDept);
  const employees = getEmployeesByDepartment(selectedDept);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-brand-900 mb-4">Department Breakdown</h3>
      
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
        {summaries.map((summary) => (
          <button
            key={summary.department}
            onClick={() => setSelectedDept(summary.department)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedDept === summary.department
                ? "bg-brand-500 text-white"
                : "bg-brand-50 text-brand-700 hover:bg-brand-100"
            }`}
          >
            {summary.department}
            <span className="ml-2 opacity-70">({summary.activeCount})</span>
          </button>
        ))}
      </div>

      {/* Selected department stats */}
      {selectedSummary && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

          {/* Payroll */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
            <span className="text-sm font-medium text-brand-700">Department Payroll</span>
            <span className="text-lg font-bold text-brand-900">
              {formatAEDCompact(selectedSummary.totalPayroll)}
            </span>
          </div>

          {/* Top employees preview - no individual salary exposure */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-3">
              Band Distribution
            </h4>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg bg-emerald-100 p-3">
                <div className="text-2xl font-bold text-emerald-700">
                  {Math.round((selectedSummary.inBandCount / selectedSummary.activeCount) * 100)}%
                </div>
                <div className="text-xs text-emerald-600">In Band</div>
              </div>
              <div className="flex-1 rounded-lg bg-amber-100 p-3">
                <div className="text-2xl font-bold text-amber-700">
                  {Math.round((selectedSummary.belowBandCount / selectedSummary.activeCount) * 100)}%
                </div>
                <div className="text-xs text-amber-600">Below</div>
              </div>
              <div className="flex-1 rounded-lg bg-red-100 p-3">
                <div className="text-2xl font-bold text-red-700">
                  {Math.round((selectedSummary.aboveBandCount / selectedSummary.activeCount) * 100)}%
                </div>
                <div className="text-xs text-red-600">Above</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
