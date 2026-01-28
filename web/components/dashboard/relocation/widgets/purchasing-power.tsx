"use client";

import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { RelocationResult, formatCurrency } from "@/lib/relocation/calculator";

interface PurchasingPowerWidgetProps {
  result: RelocationResult | null;
}

export function PurchasingPowerWidget({ result }: PurchasingPowerWidgetProps) {
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-accent-400">Enter salary to calculate</p>
      </div>
    );
  }

  const difference = result.purchasingPowerSalary - result.baseSalary;
  const percentChange = ((difference / result.baseSalary) * 100).toFixed(0);

  return (
    <div className="flex flex-col p-2">
      <p className="text-xs font-bold uppercase tracking-widest text-accent-500">
        Equivalent Salary Needed
      </p>
      <p className="mt-2 text-4xl font-extrabold text-brand-900">
        {formatCurrency(result.purchasingPowerSalary)}
      </p>

      <div className="mt-6 flex items-center gap-4 rounded-2xl bg-brand-50/50 p-4 ring-1 ring-brand-100 shadow-sm">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-tighter text-accent-400">{result.homeCity.name}</p>
          <p className="text-lg font-bold text-brand-900">
            {formatCurrency(result.baseSalary, true)}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-brand-100">
          <ArrowRight className="h-4 w-4 text-brand-500" />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-tighter text-accent-400">{result.targetCity.name}</p>
          <p className="text-lg font-bold text-brand-900">
            {formatCurrency(result.purchasingPowerSalary, true)}
          </p>
        </div>
        <div
          className={clsx(
            "ml-auto rounded-full px-3 py-1 text-xs font-bold shadow-sm",
            difference > 0
              ? "bg-rose-50 text-rose-700"
              : difference < 0
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-50 text-gray-700"
          )}
        >
          {difference > 0 ? "+" : ""}
          {percentChange}%
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-accent-600 italic">
        Salary required in {result.targetCity.name} to maintain your current lifestyle.
      </p>
    </div>
  );
}
