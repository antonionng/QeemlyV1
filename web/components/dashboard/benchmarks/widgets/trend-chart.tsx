"use client";

import { useState } from "react";
import { AreaChart } from "@tremor/react";
import clsx from "clsx";
import { useBenchmarksContext } from "@/lib/benchmarks/context";
import { formatCurrency, formatPercentage } from "@/lib/dashboard/dummy-data";

type TimeRange = "3m" | "6m" | "12m";

export function TrendChartWidget() {
  const { selectedBenchmark, selectedRole } = useBenchmarksContext();
  const [timeRange, setTimeRange] = useState<TimeRange>("12m");

  if (!selectedBenchmark || !selectedRole) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-brand-700">No role selected</p>
          <p className="text-xs text-accent-500">Select a role to view trends</p>
        </div>
      </div>
    );
  }

  // Filter trend data based on time range
  const getFilteredTrend = () => {
    const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12;
    return selectedBenchmark.trend.slice(-months);
  };

  const trendData = getFilteredTrend();

  // Calculate period change
  const startValue = trendData[0]?.p50 || 0;
  const endValue = trendData[trendData.length - 1]?.p50 || 0;
  const periodChange = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  // Prepare chart data
  const chartData = trendData.map((d) => ({
    month: d.month,
    P25: d.p25,
    Median: d.p50,
    P75: d.p75,
  }));

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">{selectedRole.title}</h3>
          <p className="text-xs text-accent-500">Salary trend over time</p>
        </div>

        <div className="flex gap-1 rounded-lg bg-brand-100/50 p-1">
          {(["3m", "6m", "12m"] as TimeRange[]).map((range) => (
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
      <div className="flex items-center gap-4 rounded-xl bg-brand-50 px-4 py-3">
        <div>
          <p className="text-xs font-medium text-accent-600">Period Change</p>
          <p
            className={clsx(
              "text-xl font-bold",
              periodChange > 0 ? "text-emerald-600" : periodChange < 0 ? "text-rose-600" : "text-brand-900"
            )}
          >
            {periodChange > 0 ? "+" : ""}
            {formatPercentage(periodChange)}
          </p>
        </div>
        <div className="h-8 w-px bg-brand-200" />
        <div>
          <p className="text-xs font-medium text-accent-600">Current</p>
          <p className="text-lg font-bold text-brand-900">
            {formatCurrency(selectedBenchmark.currency, endValue)}
          </p>
        </div>
        <div className="h-8 w-px bg-brand-200" />
        <div>
          <p className="text-xs font-medium text-accent-600">Start</p>
          <p className="text-sm font-semibold text-brand-700">
            {formatCurrency(selectedBenchmark.currency, startValue)}
          </p>
        </div>
      </div>

      {/* Area Chart */}
      <div className="min-h-[200px] flex-1">
        <AreaChart
          className="h-full"
          data={chartData}
          index="month"
          categories={["P25", "Median", "P75"]}
          colors={["slate", "violet", "slate"]}
          valueFormatter={(v) => formatCurrency(selectedBenchmark.currency, v)}
          showLegend={true}
          showGridLines={false}
          curveType="monotone"
          yAxisWidth={80}
        />
      </div>

      {/* Trend insights */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          <span className="text-xs font-medium text-brand-700">
            Avg monthly: {formatPercentage(selectedBenchmark.momChange)}
          </span>
        </div>
        <div
          className={clsx(
            "flex items-center gap-2 rounded-full px-3 py-1.5",
            selectedBenchmark.yoyChange >= 0 ? "bg-emerald-100" : "bg-rose-100"
          )}
        >
          <span
            className={clsx(
              "h-2 w-2 rounded-full",
              selectedBenchmark.yoyChange >= 0 ? "bg-emerald-500" : "bg-rose-500"
            )}
          />
          <span
            className={clsx(
              "text-xs font-medium",
              selectedBenchmark.yoyChange >= 0 ? "text-emerald-700" : "text-rose-700"
            )}
          >
            YoY: {formatPercentage(selectedBenchmark.yoyChange)}
          </span>
        </div>
      </div>
    </div>
  );
}
