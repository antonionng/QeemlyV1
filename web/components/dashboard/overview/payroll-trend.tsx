"use client";

import { AreaChart } from "@tremor/react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";
import { formatAEDCompact, type CompanyMetrics } from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";
import { useState } from "react";

interface PayrollTrendProps {
  metrics: CompanyMetrics;
}

type TimeRange = "3m" | "6m" | "12m";

export function PayrollTrend({ metrics }: PayrollTrendProps) {
  const { salaryView } = useSalaryView();
  const [timeRange, setTimeRange] = useState<TimeRange>("12m");

  // Filter data based on time range
  const getFilteredData = () => {
    const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12;
    return metrics.payrollTrend.slice(-months);
  };

  const trendData = getFilteredData();
  
  // Calculate period change
  const startValue = trendData[0]?.value || 0;
  const endValue = trendData[trendData.length - 1]?.value || 0;
  const periodChange = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  // Prepare chart data
  const chartData = trendData.map(d => ({
    month: d.month,
    Payroll: d.value,
  }));

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">Payroll Trend</h3>
          <p className="text-xs text-brand-500 mt-0.5">Total compensation over time</p>
        </div>
        
        {/* Time range selector */}
        <div className="flex gap-1 rounded-lg bg-brand-100/50 p-1">
          {(["3m", "6m", "12m"] as TimeRange[]).map(range => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={clsx(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                timeRange === range
                  ? "bg-white text-brand-900 shadow-sm"
                  : "text-brand-600 hover:text-brand-800"
              )}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Period summary */}
      <div className="flex items-center gap-6 mb-4 rounded-xl bg-brand-50 px-4 py-3">
        <div>
          <p className="text-xs font-medium text-brand-600">Current</p>
          <p className="text-xl font-bold text-brand-900">
            {formatAEDCompact(applyViewMode(endValue, salaryView))}
          </p>
        </div>
        <div className="h-8 w-px bg-brand-200" />
        <div>
          <p className="text-xs font-medium text-brand-600">Period Start</p>
          <p className="text-lg font-semibold text-brand-700">
            {formatAEDCompact(applyViewMode(startValue, salaryView))}
          </p>
        </div>
        <div className="h-8 w-px bg-brand-200" />
        <div className="flex items-center gap-2">
          {periodChange >= 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-rose-600" />
          )}
          <div>
            <p className="text-xs font-medium text-brand-600">Change</p>
            <p
              className={clsx(
                "text-lg font-bold",
                periodChange >= 0 ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {periodChange >= 0 ? "+" : ""}{periodChange.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="h-[180px]">
        <AreaChart
          className="h-full"
          data={chartData}
          index="month"
          categories={["Payroll"]}
          colors={["violet"]}
          valueFormatter={v => formatAEDCompact(applyViewMode(v, salaryView))}
          showLegend={false}
          showGridLines={false}
          curveType="monotone"
          yAxisWidth={80}
          showAnimation={true}
        />
      </div>

      {/* Insights footer */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          <span className="text-xs font-medium text-brand-700">
            Avg monthly: {formatAEDCompact(endValue / 12)}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-700">
            YoY growth: +{metrics.payrollChange}%
          </span>
        </div>
      </div>
    </Card>
  );
}
