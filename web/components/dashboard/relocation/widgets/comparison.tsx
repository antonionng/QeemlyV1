"use client";

import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { RelocationResult, formatCurrency } from "@/lib/relocation/calculator";
import { getTotalMonthlyCost } from "@/lib/relocation/col-data";

interface ComparisonWidgetProps {
  result: RelocationResult | null;
}

export function ComparisonWidget({ result }: ComparisonWidgetProps) {
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-accent-400">Select two locations to compare</p>
      </div>
    );
  }

  const homeMonthlyCost = getTotalMonthlyCost(result.costBreakdown.home);
  const targetMonthlyCost = getTotalMonthlyCost(
    result.costBreakdown.targetWithOverride ?? result.costBreakdown.target
  );

  return (
    <div className="flex items-center justify-center gap-5 p-1">
      {/* Home City */}
      <div className="flex-1 rounded-2xl border border-border bg-white p-5 text-center shadow-sm">
        <span className="text-4xl">{result.homeCity.flag}</span>
        <p className="mt-2 text-lg font-semibold text-brand-900">{result.homeCity.name}</p>
        <p className="text-xs text-accent-500">{result.homeCity.country}</p>
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">Monthly Cost</p>
          <p className="text-xl font-bold text-brand-900">
            {formatCurrency(homeMonthlyCost)}
          </p>
        </div>
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">CoL Index</p>
          <p className="text-base font-semibold text-brand-900">{result.homeCity.colIndex}</p>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 ring-1 ring-brand-100">
          <ArrowRight className="h-6 w-6" />
        </div>
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            result.colRatio > 1
              ? "bg-rose-50 text-rose-700"
              : result.colRatio < 1
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-50 text-gray-700"
          )}
        >
          {result.colRatio > 1 ? "+" : ""}
          {Math.round((result.colRatio - 1) * 100)}%
        </span>
      </div>

      {/* Target City */}
      <div className="flex-1 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-center text-brand-900 shadow-sm">
        <span className="text-4xl">{result.targetCity.flag}</span>
        <p className="mt-2 text-lg font-semibold">{result.targetCity.name}</p>
        <p className="text-xs text-brand-700/70">{result.targetCity.country}</p>
        <div className="mt-4 border-t border-brand-200/70 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700/80">Monthly Cost</p>
          <p className="text-xl font-bold">{formatCurrency(targetMonthlyCost)}</p>
        </div>
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700/80">CoL Index</p>
          <p className="text-base font-semibold">{result.targetCity.colIndex}</p>
        </div>
      </div>
    </div>
  );
}
