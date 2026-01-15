"use client";

import { AreaChart } from "@tremor/react";
import clsx from "clsx";
import { useState } from "react";
import {
  FEATURED_BENCHMARKS,
  formatCurrency,
  formatPercentage,
  ROLES,
} from "@/lib/dashboard/dummy-data";

type TimeRange = "3m" | "6m" | "12m";

export function TrendAnalyticsWidget() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
  const [timeRange, setTimeRange] = useState<TimeRange>("12m");

  const benchmark = FEATURED_BENCHMARKS.find(b => b.roleId === selectedRole) || FEATURED_BENCHMARKS[0];

  // Filter trend data based on time range
  const getFilteredTrend = () => {
    const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12;
    return benchmark.trend.slice(-months);
  };

  const trendData = getFilteredTrend();
  
  // Calculate period change
  const startValue = trendData[0]?.p50 || 0;
  const endValue = trendData[trendData.length - 1]?.p50 || 0;
  const periodChange = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  // Prepare chart data
  const chartData = trendData.map(d => ({
    month: d.month,
    P25: d.p25,
    Median: d.p50,
    P75: d.p75,
  }));

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          className="rounded-lg border border-border/50 bg-white px-3 py-1.5 text-sm font-medium text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {ROLES.slice(0, 8).map(r => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>

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
      <div className="flex items-center gap-4 rounded-xl bg-brand-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-brand-600">Period Change</p>
          <p
            className={clsx(
              "text-2xl font-bold",
              periodChange > 0 ? "text-emerald-600" : periodChange < 0 ? "text-rose-600" : "text-brand-900"
            )}
          >
            {formatPercentage(periodChange)}
          </p>
        </div>
        <div className="h-8 w-px bg-brand-200" />
        <div>
          <p className="text-sm font-medium text-brand-600">Current Median</p>
          <p className="text-xl font-bold text-brand-900">
            {formatCurrency(benchmark.currency, endValue)}
          </p>
        </div>
        <div className="h-8 w-px bg-brand-200" />
        <div>
          <p className="text-sm font-medium text-brand-600">Period Start</p>
          <p className="text-lg font-semibold text-brand-700">
            {formatCurrency(benchmark.currency, startValue)}
          </p>
        </div>
      </div>

      {/* Area Chart */}
      <div className="flex-1 min-h-[200px]">
        <AreaChart
          className="h-full"
          data={chartData}
          index="month"
          categories={["P25", "Median", "P75"]}
          colors={["slate", "violet", "slate"]}
          valueFormatter={v => formatCurrency(benchmark.currency, v)}
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
            Avg monthly change: {formatPercentage(benchmark.momChange)}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-700">
            YoY growth: {formatPercentage(benchmark.yoyChange)}
          </span>
        </div>
      </div>
    </div>
  );
}

