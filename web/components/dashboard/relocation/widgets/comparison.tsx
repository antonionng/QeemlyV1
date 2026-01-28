"use client";

import clsx from "clsx";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
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
    <div className="flex items-center justify-center gap-6 p-2">
      {/* Home City */}
      <div className="flex-1 rounded-2xl bg-brand-50/50 p-5 text-center ring-1 ring-brand-100 shadow-sm">
        <span className="text-5xl">{result.homeCity.flag}</span>
        <p className="mt-3 text-lg font-bold text-brand-900">{result.homeCity.name}</p>
        <p className="text-sm text-accent-500 font-medium">{result.homeCity.country}</p>
        <div className="mt-4 border-t border-brand-100 pt-4">
          <p className="text-xs text-accent-500 uppercase font-bold tracking-wider">Monthly Cost</p>
          <p className="text-xl font-bold text-brand-900">
            {formatCurrency(homeMonthlyCost)}
          </p>
        </div>
        <div className="mt-3">
          <p className="text-xs text-accent-500 uppercase font-bold tracking-wider">CoL Index</p>
          <p className="text-lg font-semibold text-brand-900">{result.homeCity.colIndex}</p>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500 shadow-sm ring-1 ring-brand-100">
          <ArrowRight className="h-6 w-6" />
        </div>
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-sm font-bold shadow-sm",
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
      <div className="flex-1 rounded-2xl bg-brand-500 p-5 text-center text-white shadow-lg ring-1 ring-brand-400">
        <span className="text-5xl">{result.targetCity.flag}</span>
        <p className="mt-3 text-lg font-bold">{result.targetCity.name}</p>
        <p className="text-sm text-brand-100 font-medium">{result.targetCity.country}</p>
        <div className="mt-4 border-t border-white/20 pt-4">
          <p className="text-xs text-white/70 uppercase font-bold tracking-wider">Monthly Cost</p>
          <p className="text-xl font-bold">{formatCurrency(targetMonthlyCost)}</p>
        </div>
        <div className="mt-3">
          <p className="text-xs text-white/70 uppercase font-bold tracking-wider">CoL Index</p>
          <p className="text-lg font-semibold">{result.targetCity.colIndex}</p>
        </div>
      </div>
    </div>
  );
}
