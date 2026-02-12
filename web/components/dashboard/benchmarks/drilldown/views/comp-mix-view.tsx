"use client";

import { PieChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { getCompMix, LEVELS } from "@/lib/dashboard/dummy-data";
import { useSalaryView } from "@/lib/salary-view-store";

interface CompMixViewProps {
  result: BenchmarkResult;
}

export function CompMixView({ result }: CompMixViewProps) {
  const { role, level, location, benchmark } = result;
  const { salaryView } = useSalaryView();
  
  // Convert from monthly AED based on salary view mode
  const convertValue = (value: number) => salaryView === "annual" ? Math.round(value * 12 / 1000) * 1000 : Math.round(value / 100) * 100;
  
  const formatAED = (value: number) => {
    if (value >= 1000) {
      return `AED ${(value / 1000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get compensation mix
  const compMixData = getCompMix(role.id, location.id === "london" ? "dubai" : location.id, level.id)
    .map(item => ({
      ...item,
      value: convertValue(item.value),
    }));

  const totalComp = compMixData.reduce((sum, item) => sum + item.value, 0);

  const getColor = (name: string) => {
    switch (name) {
      case "Base": return "bg-brand-500";
      case "Bonus": return "bg-emerald-500";
      case "Equity": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getColorLight = (name: string) => {
    switch (name) {
      case "Base": return "bg-brand-100 text-brand-700";
      case "Bonus": return "bg-emerald-100 text-emerald-700";
      case "Equity": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Calculate level index for context
  const levelIndex = LEVELS.findIndex(l => l.id === level.id);
  const isEquityEligible = levelIndex >= 3; // IC4+

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-brand-900">Compensation Mix</h3>
      </div>
      
      <p className="text-xs text-brand-500 mb-4">
        Typical breakdown for {level.name} at P50
      </p>

      {/* Horizontal stacked bar */}
      <div className="h-8 rounded-full overflow-hidden flex mb-4">
        {compMixData.map((item) => {
          const percentage = (item.value / totalComp) * 100;
          return (
            <div
              key={item.name}
              className={`h-full ${getColor(item.name)} transition-all`}
              style={{ width: `${percentage}%` }}
              title={`${item.name}: ${formatAED(item.value)}`}
            />
          );
        })}
      </div>

      {/* Legend and values */}
      <div className="space-y-3">
        {compMixData.map((item) => {
          const percentage = (item.value / totalComp) * 100;
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getColor(item.name)}`} />
                <span className="text-sm font-medium text-brand-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getColorLight(item.name)}`}>
                  {percentage.toFixed(0)}%
                </span>
                <span className="text-sm font-bold text-brand-900 w-20 text-right">
                  {formatAED(item.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-900">Total Compensation</span>
        <span className="text-lg font-bold text-brand-900">{formatAED(totalComp)}</span>
      </div>

      {/* Equity note */}
      {!isEquityEligible && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 text-xs text-amber-700">
          Equity is typically offered at IC4+ levels. Junior roles focus on base salary and bonus.
        </div>
      )}

      {isEquityEligible && (
        <div className="mt-4 p-3 rounded-xl bg-purple-50 text-xs text-purple-700">
          At {level.name} level, equity becomes a significant part of total compensation. Consider 4-year vesting schedules.
        </div>
      )}
    </Card>
  );
}
