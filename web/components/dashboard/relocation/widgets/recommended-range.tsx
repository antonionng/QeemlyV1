"use client";

import clsx from "clsx";
import { RelocationResult, formatCurrency, CompApproach, getApproachExplanation } from "@/lib/relocation/calculator";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";

interface RecommendedRangeWidgetProps {
  result: RelocationResult | null;
  compApproach: CompApproach;
  hybridCap?: number;
}

const APPROACH_LABELS: Record<CompApproach, string> = {
  local: "Local Market Pay",
  "purchasing-power": "Purchasing Power",
  hybrid: "Hybrid Approach",
};

export function RecommendedRangeWidget({
  result,
  compApproach,
  hybridCap,
}: RecommendedRangeWidgetProps) {
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-accent-400">Configure inputs to see recommendation</p>
      </div>
    );
  }

  const { salaryView } = useSalaryView();
  const { min, max } = result.recommendedRange;
  const midpoint = result.recommendedSalary;

  return (
    <div className="flex flex-col p-2">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700 shadow-sm">
          {APPROACH_LABELS[compApproach]}
        </span>
        {compApproach === "hybrid" && hybridCap && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
            Capped at {hybridCap}%
          </span>
        )}
      </div>

      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-accent-500">
          Recommended {salaryView === "monthly" ? "Monthly" : "Annual"} Salary
        </p>
        <p className="mt-2 text-3xl font-extrabold text-brand-900">
          {formatCurrency(applyViewMode(min, salaryView))} – {formatCurrency(applyViewMode(max, salaryView))}
        </p>
        <p className="mt-2 text-sm font-bold text-brand-600">
          Target Midpoint: {formatCurrency(applyViewMode(midpoint, salaryView))}
        </p>
      </div>

      {/* Visual range indicator */}
      <div className="mt-6 rounded-2xl bg-brand-50/50 p-4 ring-1 ring-brand-100 shadow-sm">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter text-accent-400">
          <span>Min</span>
          <span>Target</span>
          <span>Max</span>
        </div>
        <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-brand-100">
          <div
            className="absolute left-0 top-0 h-full bg-brand-500"
            style={{ width: "100%" }}
          />
          <div
            className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-brand-900 shadow-md"
            style={{ left: "50%" }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-bold text-brand-900">
          <span>{formatCurrency(applyViewMode(min, salaryView), true)}</span>
          <span>{formatCurrency(applyViewMode(midpoint, salaryView), true)}</span>
          <span>{formatCurrency(applyViewMode(max, salaryView), true)}</span>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-accent-600 italic">
        {getApproachExplanation(compApproach, hybridCap)}
      </p>
    </div>
  );
}
