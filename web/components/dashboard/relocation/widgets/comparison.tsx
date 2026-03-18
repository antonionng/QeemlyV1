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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div className="rounded-[28px] border border-accent-100 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
          Current market
        </p>
        <div className="mt-4 flex items-start gap-3">
          <span className="text-4xl">{result.homeCity.flag}</span>
          <div>
            <p className="text-xl font-semibold text-brand-900">{result.homeCity.name}</p>
            <p className="text-sm text-accent-500">{result.homeCity.country}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-accent-100 bg-accent-50/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-500">Monthly cost</p>
            <p className="mt-2 text-xl font-bold text-brand-900">{formatCurrency(homeMonthlyCost)}</p>
          </div>
          <div className="rounded-2xl border border-accent-100 bg-accent-50/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-500">CoL index</p>
            <p className="mt-2 text-xl font-bold text-brand-900">{result.homeCity.colIndex}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-500 ring-1 ring-brand-100">
          <ArrowRight className="h-5 w-5" />
        </div>
        <span
          className={clsx(
            "rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm",
            result.colRatio > 1
              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
              : result.colRatio < 1
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                : "bg-gray-50 text-gray-700 ring-1 ring-gray-200"
          )}
        >
          {result.colRatio > 1 ? "+" : ""}
          {Math.round((result.colRatio - 1) * 100)}%
        </span>
        <p className="max-w-[8rem] text-center text-xs leading-5 text-accent-500">
          Relative change in living costs across the route
        </p>
      </div>

      <div className="rounded-[28px] border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 text-brand-900 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700/80">
          Target market
        </p>
        <div className="mt-4 flex items-start gap-3">
          <span className="text-4xl">{result.targetCity.flag}</span>
          <div>
            <p className="text-xl font-semibold">{result.targetCity.name}</p>
            <p className="text-sm text-brand-700/70">{result.targetCity.country}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-brand-200/70 bg-white/80 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700/80">Monthly cost</p>
            <p className="mt-2 text-xl font-bold">{formatCurrency(targetMonthlyCost)}</p>
          </div>
          <div className="rounded-2xl border border-brand-200/70 bg-white/80 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700/80">CoL index</p>
            <p className="mt-2 text-xl font-bold">{result.targetCity.colIndex}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
