"use client";

import { AreaChart } from "@tremor/react";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { CompensationHistoryEntry } from "@/lib/employee";

interface GrowthChartProps {
  history: CompensationHistoryEntry[];
  currentSalary: number;
  currency: string;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function GrowthChart({ history, currentSalary, currency }: GrowthChartProps) {
  if (history.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-brand-700 mb-2">Salary Growth</h3>
        <p className="text-sm text-brand-500">
          No compensation history available yet. Your growth will appear here after your first review.
        </p>
      </Card>
    );
  }

  const chartData = history.map((entry) => ({
    date: new Date(entry.effectiveDate).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    "Base Salary": entry.baseSalary,
  }));

  // Add current as the latest point if it differs from last history entry
  const lastHistorySalary = history[history.length - 1]?.baseSalary;
  if (lastHistorySalary !== currentSalary) {
    chartData.push({
      date: "Now",
      "Base Salary": currentSalary,
    });
  }

  const firstSalary = history[0].baseSalary;
  const growthPct = firstSalary > 0 ? ((currentSalary - firstSalary) / firstSalary) * 100 : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-700">Salary Growth</h3>
        {growthPct > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">
              +{growthPct.toFixed(1)}% total growth
            </span>
          </div>
        )}
      </div>

      <AreaChart
        className="h-48"
        data={chartData}
        index="date"
        categories={["Base Salary"]}
        colors={["indigo"]}
        valueFormatter={(v) => formatCurrency(v, currency)}
        showLegend={false}
        showGridLines={false}
        curveType="monotone"
      />
    </Card>
  );
}
