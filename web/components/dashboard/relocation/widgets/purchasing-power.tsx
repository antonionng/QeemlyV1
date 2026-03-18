"use client";

import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { RelocationResult, formatCurrency } from "@/lib/relocation/calculator";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";

interface PurchasingPowerWidgetProps {
  result: RelocationResult | null;
}

export function PurchasingPowerWidget({ result }: PurchasingPowerWidgetProps) {
  const { salaryView } = useSalaryView();

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
    <div className="flex flex-col p-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">
        Equivalent Salary Needed
      </p>
      <p className="mt-2 text-3xl font-bold text-brand-900">
        {formatCurrency(applyViewMode(result.purchasingPowerSalary, salaryView))}
      </p>

      <div className="mt-3 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
        Maintains the same purchasing power after the move
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-[24px] border border-accent-100 bg-[linear-gradient(180deg,rgba(249,250,251,0.95),rgba(255,255,255,1))] p-4">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">{result.homeCity.name}</p>
          <p className="text-base font-semibold text-brand-900">
            {formatCurrency(applyViewMode(result.baseSalary, salaryView), true)}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-border">
          <ArrowRight className="h-4 w-4 text-brand-500" />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">{result.targetCity.name}</p>
          <p className="text-base font-semibold text-brand-900">
            {formatCurrency(applyViewMode(result.purchasingPowerSalary, salaryView), true)}
          </p>
        </div>
        <div
          className={clsx(
            "ml-auto rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm",
            difference > 0
              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
              : difference < 0
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                : "bg-gray-50 text-gray-700 ring-1 ring-gray-200"
          )}
        >
          {difference > 0 ? "+" : ""}
          {percentChange}%
        </div>
      </div>

      <p className="mt-4 text-sm text-accent-600">
        Salary required in {result.targetCity.name} to maintain a comparable standard of living for the employee.
      </p>
    </div>
  );
}
