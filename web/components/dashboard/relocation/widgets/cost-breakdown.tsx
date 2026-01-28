"use client";

import clsx from "clsx";
import { RelocationResult, formatCurrency } from "@/lib/relocation/calculator";
import { CostBreakdown as CostBreakdownType, getTotalMonthlyCost } from "@/lib/relocation/col-data";

interface CostBreakdownWidgetProps {
  result: RelocationResult | null;
}

const COST_CATEGORIES: { key: keyof CostBreakdownType; label: string; color: string }[] = [
  { key: "rent", label: "Rent", color: "bg-brand-500" },
  { key: "transport", label: "Transport", color: "bg-emerald-500" },
  { key: "food", label: "Food", color: "bg-amber-500" },
  { key: "utilities", label: "Utilities", color: "bg-violet-500" },
  { key: "other", label: "Other", color: "bg-rose-400" },
];

function BreakdownBar({
  breakdown,
  label,
  flag,
}: {
  breakdown: CostBreakdownType;
  label: string;
  flag: string;
}) {
  const total = getTotalMonthlyCost(breakdown);

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{flag}</span>
        <span className="text-sm font-bold text-brand-900">{label}</span>
        <span className="ml-auto text-sm font-bold text-brand-900">
          {formatCurrency(total)}/mo
        </span>
      </div>
      <div className="mt-2 flex h-8 overflow-hidden rounded-xl bg-brand-50 shadow-inner">
        {COST_CATEGORIES.map(({ key, color }) => {
          const value = breakdown[key];
          const width = (value / total) * 100;
          return (
            <div
              key={key}
              className={clsx(color, "transition-all hover:brightness-110")}
              style={{ width: `${width}%` }}
              title={`${key}: ${formatCurrency(value)}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function CostBreakdownWidget({ result }: CostBreakdownWidgetProps) {
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-accent-400">Select locations to compare costs</p>
      </div>
    );
  }

  const targetBreakdown = result.costBreakdown.targetWithOverride ?? result.costBreakdown.target;
  const homeTotal = getTotalMonthlyCost(result.costBreakdown.home);
  const targetTotal = getTotalMonthlyCost(targetBreakdown);
  const difference = targetTotal - homeTotal;

  return (
    <div className="flex flex-col p-2">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-8">
          <BreakdownBar
            breakdown={result.costBreakdown.home}
            label={result.homeCity.name}
            flag={result.homeCity.flag}
          />
          <BreakdownBar
            breakdown={targetBreakdown}
            label={result.targetCity.name}
            flag={result.targetCity.flag}
          />
        </div>

        <div className="flex flex-col justify-center">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-8">
            {COST_CATEGORIES.map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-2">
                <div className={clsx("h-4 w-4 rounded shadow-sm", color)} />
                <span className="text-xs font-bold uppercase tracking-wider text-accent-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-2xl bg-brand-900 p-6 text-white shadow-xl ring-1 ring-brand-800">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">Monthly difference</span>
              <span
                className={clsx(
                  "text-xl font-bold",
                  difference > 0 ? "text-rose-400" : difference < 0 ? "text-emerald-400" : "text-white"
                )}
              >
                {difference > 0 ? "+" : ""}
                {formatCurrency(difference)}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">Annual difference</span>
              <span
                className={clsx(
                  "text-2xl font-bold",
                  difference > 0 ? "text-rose-400" : difference < 0 ? "text-emerald-400" : "text-white"
                )}
              >
                {difference > 0 ? "+" : ""}
                {formatCurrency(result.annualDifference)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category details */}
      <div className="mt-10 grid grid-cols-2 gap-4 text-xs sm:grid-cols-5">
        {COST_CATEGORIES.map(({ key, label }) => {
          const homeVal = result.costBreakdown.home[key];
          const targetVal = targetBreakdown[key];
          const diff = targetVal - homeVal;
          return (
            <div key={key} className="rounded-xl bg-brand-50/50 p-4 ring-1 ring-brand-100 shadow-sm transition-all hover:bg-brand-50">
              <p className="font-bold uppercase tracking-widest text-accent-400 text-[10px] mb-2">{label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-accent-400">{formatCurrency(homeVal, true)}</span>
                <span className="text-[10px] text-accent-300">→</span>
                <span className="text-sm font-bold text-brand-900">{formatCurrency(targetVal, true)}</span>
              </div>
              <p
                className={clsx(
                  "mt-2 font-bold text-sm",
                  diff > 0 ? "text-rose-600" : diff < 0 ? "text-emerald-600" : "text-accent-500"
                )}
              >
                {diff > 0 ? "+" : ""}{formatCurrency(diff, true)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
