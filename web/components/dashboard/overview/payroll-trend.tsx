"use client";

import { AreaChart } from "@tremor/react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";
import type { OverviewMetrics } from "@/lib/dashboard/company-overview";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";
import { useState } from "react";
import { buildPayrollTrendViewModel, type PayrollTrendRange } from "@/lib/dashboard/payroll-trend";

interface PayrollTrendProps {
  metrics: OverviewMetrics;
}

export function PayrollTrend({ metrics }: PayrollTrendProps) {
  const { salaryView } = useSalaryView();
  const [timeRange, setTimeRange] = useState<PayrollTrendRange>("12m");
  const viewModel = buildPayrollTrendViewModel({ metrics, salaryView, timeRange });

  const formatAxisValue = (value: number) => {
    const v = applyViewMode(value, salaryView);
    if (!Number.isFinite(v)) return "AED 0";
    if (Math.abs(v) < 1_000_000) return `AED ${Math.round(v).toLocaleString("en-AE")}`;
    return `AED ${(v / 1_000_000).toFixed(1)}M`;
  };

  return (
    <Card className="dash-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-accent-900">Payroll Trend</h3>
          <p className="text-xs text-accent-500 mt-0.5">How payroll is moving across the selected period</p>
          {viewModel.trustLabel && (
            <p className="mt-1 text-[11px] text-accent-400">
              {viewModel.trustLabel}
            </p>
          )}
        </div>
        
        {/* Time range selector */}
        <div className="flex gap-1 rounded-full bg-accent-100 p-1">
          {(["3m", "6m", "12m"] as PayrollTrendRange[]).map(range => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                timeRange === range
                  ? "bg-white text-accent-900 shadow-sm"
                  : "text-accent-600 hover:text-accent-800"
              )}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Period summary */}
      <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="text-xs font-medium text-accent-500">Period start</p>
          <p className="text-[28px] leading-none font-extrabold text-accent-900">
            {viewModel.startDisplay}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-accent-500">{viewModel.changeLabel}</p>
            <span className={clsx(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              viewModel.periodChange >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}>
              {viewModel.periodChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {viewModel.periodChange >= 0 ? "+" : ""}{viewModel.periodChange.toFixed(1)}%
            </span>
          </div>
          <p className="text-[28px] leading-none font-extrabold text-accent-900">
            {viewModel.currentDisplay}
          </p>
          <p className="mt-1 text-xs text-accent-500">{viewModel.currentLabel}</p>
        </div>
      </div>

      <p className="mb-4 text-xs text-accent-500">{viewModel.driverSummary}</p>

      {/* Area Chart */}
      <div
        className={clsx(
          "h-[180px]",
          // Figma: neutral grey gradient area, no visible line, no tooltip.
          "[&_.recharts-area-curve]:!opacity-0",
          "[&_.recharts-dot]:!opacity-0",
          "[&_.recharts-tooltip-wrapper]:!hidden",
          "[&_.recharts-area-area]:!opacity-100"
        )}
      >
        <AreaChart
          className="h-full"
          data={viewModel.chartData}
          index="month"
          categories={["Payroll"]}
          colors={["gray"]}
          valueFormatter={(v) => formatAxisValue(v)}
          showLegend={false}
          showGridLines={false}
          showGradient={true}
          curveType="monotone"
          yAxisWidth={80}
          showAnimation={false}
        />
      </div>

    </Card>
  );
}
