"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart } from "@tremor/react";
import clsx from "clsx";
import { Card } from "@/components/ui/card";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useSalaryView } from "@/lib/salary-view-store";

type TimeRange = "3m" | "6m" | "12m";

interface TrendViewProps {
  result: BenchmarkResult;
}

export function TrendView({ result }: TrendViewProps) {
  const { benchmark, role } = result;
  const [timeRange, setTimeRange] = useState<TimeRange>("12m");
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

  // Filter trend data based on time range
  const getFilteredTrend = () => {
    const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12;
    return benchmark.trend.slice(-months);
  };

  const trendData = getFilteredTrend();

  // Calculate period change
  const startValue = convertValue(trendData[0]?.p50 || 0);
  const endValue = convertValue(trendData[trendData.length - 1]?.p50 || 0);
  const periodChange = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">{role.title} Trend</h3>
          <p className="text-xs text-brand-500">Salary trend over time</p>
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
      <div className="flex items-center gap-4 rounded-xl bg-brand-50 px-4 py-3 mb-4">
        <div className="flex items-center gap-2">
          {periodChange >= 0 ? (
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600" />
          )}
          <div>
            <p className="text-xs font-medium text-brand-600">Period Change</p>
            <p
              className={clsx(
                "text-xl font-bold",
                periodChange > 0 ? "text-emerald-600" : periodChange < 0 ? "text-red-600" : "text-brand-900"
              )}
            >
              {periodChange > 0 ? "+" : ""}{periodChange.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="h-10 w-px bg-brand-200" />
        <div>
          <p className="text-xs font-medium text-brand-600">Current</p>
          <p className="text-lg font-bold text-brand-900">
            {formatAED(endValue)}
          </p>
        </div>
        <div className="h-10 w-px bg-brand-200" />
        <div>
          <p className="text-xs font-medium text-brand-600">Start</p>
          <p className="text-sm font-semibold text-brand-700">
            {formatAED(startValue)}
          </p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="min-h-[220px] [&_.recharts-area-area]:!opacity-0">
        <AreaChart
          className="h-56"
          data={trendData.map((point) => ({
            month: point.month,
            P25: convertValue(point.p25),
            Median: convertValue(point.p50),
            P75: convertValue(point.p75),
          }))}
          index="month"
          categories={["P25", "Median", "P75"]}
          colors={["slate", "violet", "slate"]}
          valueFormatter={(v) => formatAED(v)}
          showLegend={true}
          showGridLines={false}
          showGradient={false}
          curveType="monotone"
          yAxisWidth={72}
        />
      </div>

      {/* Trend insights */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          <span className="text-xs font-medium text-brand-700">
            Monthly avg: {benchmark.momChange > 0 ? "+" : ""}{benchmark.momChange.toFixed(1)}%
          </span>
        </div>
        <div
          className={clsx(
            "flex items-center gap-2 rounded-full px-3 py-1.5",
            benchmark.yoyChange >= 0 ? "bg-emerald-100" : "bg-red-100"
          )}
        >
          <span
            className={clsx(
              "h-2 w-2 rounded-full",
              benchmark.yoyChange >= 0 ? "bg-emerald-500" : "bg-red-500"
            )}
          />
          <span
            className={clsx(
              "text-xs font-medium",
              benchmark.yoyChange >= 0 ? "text-emerald-700" : "text-red-700"
            )}
          >
            YoY: {benchmark.yoyChange > 0 ? "+" : ""}{benchmark.yoyChange.toFixed(1)}%
          </span>
        </div>
      </div>
    </Card>
  );
}
