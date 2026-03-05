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
    const sliced = metrics.payrollTrend.slice(-months);

    // Figma shows fewer x-axis labels (e.g., Mar/May/Jul/Sep/Nov/Jan on 12m).
    // We downsample the 12m view to encourage the same tick density.
    if (timeRange === "12m" && sliced.length > 6) {
      return sliced.filter((_, idx) => idx % 2 === 0);
    }

    return sliced;
  };

  const trendData = getFilteredData();
  
  // Calculate period change
  const startValue = trendData[0]?.value || 0;
  const endValue = trendData[trendData.length - 1]?.value || 0;
  const periodChange = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  const formatHeaderValue = (value: number) => `AED ${formatAEDCompact(applyViewMode(value, salaryView))}`;
  const formatAxisValue = (value: number) => {
    const v = applyViewMode(value, salaryView);
    if (!Number.isFinite(v)) return "AED 0";
    if (Math.abs(v) < 1_000_000) return `AED ${Math.round(v).toLocaleString("en-AE")}`;
    return `AED ${(v / 1_000_000).toFixed(1)}M`;
  };

  // Prepare chart data
  const chartData = trendData.map(d => ({
    month: d.month,
    Payroll: d.value,
  }));

  return (
    <Card className="dash-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-accent-900">Payroll Trend</h3>
          <p className="text-xs text-accent-500 mt-0.5">Total compensation over time</p>
        </div>
        
        {/* Time range selector */}
        <div className="flex gap-1 rounded-full bg-accent-100 p-1">
          {(["3m", "6m", "12m"] as TimeRange[]).map(range => (
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
      <div className="flex items-baseline gap-10 mb-4">
        <div>
          <p className="text-xs font-medium text-accent-500">Period Start</p>
          <p className="text-[28px] leading-none font-extrabold text-accent-900">
            {formatHeaderValue(startValue)}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-accent-500">Current</p>
            <span className={clsx(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              periodChange >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}>
              {periodChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {periodChange >= 0 ? "+" : ""}{periodChange.toFixed(1)}%
            </span>
          </div>
          <p className="text-[28px] leading-none font-extrabold text-accent-900">
            {formatHeaderValue(endValue)}
          </p>
        </div>
      </div>

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
          data={chartData}
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
