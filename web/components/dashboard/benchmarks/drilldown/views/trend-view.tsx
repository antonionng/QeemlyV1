"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { applyBenchmarkViewMode } from "@/lib/benchmarks/pay-period";
import { useSalaryView } from "@/lib/salary-view-store";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PAYROLL_TREND_CHART_STYLE } from "@/lib/dashboard/payroll-trend-presentation";
import { SharedAiCallout } from "../shared-ai-callout";

type TimeRange = "3m" | "6m" | "12m";

interface TrendViewProps {
  result: BenchmarkResult;
}

type TrendTooltipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string | number;
};

export function TrendView({ result }: TrendViewProps) {
  const { benchmark, role } = result;
  const [timeRange, setTimeRange] = useState<TimeRange>("12m");
  const { salaryView } = useSalaryView();
  const aiTrendPoints = result.aiDetailBriefing?.views.trend.trendPoints ?? null;
  const fallbackTrendPoints = useMemo(() => buildFallbackTrendPoints(benchmark), [benchmark]);
  const fullTrendSeries = aiTrendPoints ?? (benchmark.trend.length > 0 ? benchmark.trend : fallbackTrendPoints);
  
  const convertValue = (annualValue: number) => {
    const viewValue = applyBenchmarkViewMode(annualValue, salaryView);
    return salaryView === "annual"
      ? Math.round(viewValue / 1000) * 1000
      : Math.round(viewValue / 100) * 100;
  };
  
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
    return fullTrendSeries.slice(-months);
  };

  const trendData = getFilteredTrend();
  const hasTrendData = trendData.length > 1;
  const chartData = trendData.map((point) => ({
    month: point.month,
    P25: convertValue(point.p25),
    Median: convertValue(point.p50),
    P75: convertValue(point.p75),
  }));

  // Calculate period change
  const startValue = convertValue(trendData[0]?.p50 || 0);
  const endValue = convertValue(trendData[trendData.length - 1]?.p50 || 0);
  const periodChange = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
  const maxValue = Math.max(...chartData.flatMap((point) => [point.P25, point.Median, point.P75]), 0);
  const derivedMonthlyAverageChange = useMemo(() => {
    if (fullTrendSeries.length < 2) return benchmark.momChange;

    const changes = fullTrendSeries
      .slice(1)
      .map((point, index) => {
        const previous = fullTrendSeries[index]?.p50 ?? 0;
        if (!previous) return null;
        return ((point.p50 - previous) / previous) * 100;
      })
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

    if (changes.length === 0) return benchmark.momChange;

    return changes.reduce((sum, value) => sum + value, 0) / changes.length;
  }, [benchmark.momChange, fullTrendSeries]);
  const derivedYoyChange = useMemo(() => {
    if (fullTrendSeries.length < 2) return benchmark.yoyChange;

    const first = fullTrendSeries[0]?.p50 ?? 0;
    const last = fullTrendSeries[fullTrendSeries.length - 1]?.p50 ?? 0;
    if (!first) return benchmark.yoyChange;

    return ((last - first) / first) * 100;
  }, [benchmark.yoyChange, fullTrendSeries]);

  return (
    <div className="bench-section">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <h3 className="bench-section-header pb-0">Trend Chart</h3>
          <p className="text-xs text-brand-500">{role.title} salary trend over time</p>
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

      {!hasTrendData && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
          Historical trend points are not available for this benchmark row yet.
        </div>
      )}

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
      {hasTrendData ? (
        <div className="mt-2 h-[280px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid
                stroke={PAYROLL_TREND_CHART_STYLE.gridColor}
                strokeWidth={1}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tickMargin={12}
                tick={{ fill: PAYROLL_TREND_CHART_STYLE.axisColor, fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={12}
                width={72}
                domain={[0, Math.ceil(maxValue / 60000) * 60000 || 60000]}
                tick={{ fill: PAYROLL_TREND_CHART_STYLE.axisColor, fontSize: 12 }}
                tickFormatter={formatAED}
              />
              <Tooltip
                cursor={{ stroke: "#D1D5DB", strokeDasharray: "4 4", strokeWidth: 1 }}
                content={<TrendTooltip formatValue={formatAED} />}
              />
              <Area
                type="monotone"
                dataKey="P25"
                stroke="#9CA3AF"
                strokeWidth={2}
                fillOpacity={0}
                dot={buildDot("#9CA3AF")}
                activeDot={buildActiveDot("#9CA3AF")}
              />
              <Area
                type="monotone"
                dataKey="Median"
                stroke={PAYROLL_TREND_CHART_STYLE.lineColor}
                strokeWidth={PAYROLL_TREND_CHART_STYLE.lineWidth}
                fillOpacity={0}
                dot={buildDot(PAYROLL_TREND_CHART_STYLE.lineColor)}
                activeDot={buildActiveDot(PAYROLL_TREND_CHART_STYLE.lineColor)}
              />
              <Area
                type="monotone"
                dataKey="P75"
                stroke="#4B5563"
                strokeWidth={2}
                fillOpacity={0}
                dot={buildDot("#4B5563")}
                activeDot={buildActiveDot("#4B5563")}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-end gap-4 text-xs text-brand-700">
            {[
              { label: "P25", color: "#9CA3AF" },
              { label: "Median", color: PAYROLL_TREND_CHART_STYLE.lineColor },
              { label: "P75", color: "#4B5563" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Trend insights */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          <span className="text-xs font-medium text-brand-700">
            Monthly avg: {derivedMonthlyAverageChange > 0 ? "+" : ""}{derivedMonthlyAverageChange.toFixed(1)}%
          </span>
        </div>
        <div
          className={clsx(
            "flex items-center gap-2 rounded-full px-3 py-1.5",
            derivedYoyChange >= 0 ? "bg-emerald-100" : "bg-red-100"
          )}
        >
          <span
            className={clsx(
              "h-2 w-2 rounded-full",
              derivedYoyChange >= 0 ? "bg-emerald-500" : "bg-red-500"
            )}
          />
          <span
            className={clsx(
              "text-xs font-medium",
              derivedYoyChange >= 0 ? "text-emerald-700" : "text-red-700"
            )}
          >
            YoY: {derivedYoyChange > 0 ? "+" : ""}{derivedYoyChange.toFixed(1)}%
          </span>
        </div>
      </div>

      <SharedAiCallout section={result.aiDetailBriefing?.views.trend} />
    </div>
  );
}

function buildDot(color: string) {
  return {
    r: PAYROLL_TREND_CHART_STYLE.dotRadius,
    fill: color,
    stroke: color,
    strokeWidth: 0,
  };
}

function buildActiveDot(color: string) {
  return {
    r: PAYROLL_TREND_CHART_STYLE.activeDotRadius,
    fill: color,
    stroke: PAYROLL_TREND_CHART_STYLE.activeDotStroke,
    strokeWidth: PAYROLL_TREND_CHART_STYLE.activeDotStrokeWidth,
  };
}

function TrendTooltip({ active, payload, label, formatValue }: TrendTooltipProps & { formatValue: (value: number) => string }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-brand-900 shadow-[0_8px_24px_rgba(17,24,39,0.12)]">
      <p className="text-[13px] font-medium">{String(label ?? "")}</p>
      <div className="mt-2 space-y-1.5 text-[13px]">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="text-brand-600">{entry.name}</span>
            <span className="font-semibold">{typeof entry.value === "number" ? formatValue(entry.value) : "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildFallbackTrendPoints(benchmark: BenchmarkResult["benchmark"]) {
  const currentP25 = benchmark.percentiles.p25;
  const currentP50 = benchmark.percentiles.p50;
  const currentP75 = benchmark.percentiles.p75;

  if (currentP50 <= 0) return [];

  const yoyFactor = benchmark.yoyChange ? 1 + benchmark.yoyChange / 100 : null;
  const momFactor = benchmark.momChange ? Math.pow(1 + benchmark.momChange / 100, 11) : null;
  const trailingFactor =
    yoyFactor && Number.isFinite(yoyFactor) && yoyFactor > 0
      ? yoyFactor
      : momFactor && Number.isFinite(momFactor) && momFactor > 0
        ? momFactor
        : 1;

  const startP50 = currentP50 / trailingFactor;
  const p25Ratio = currentP25 / currentP50;
  const p75Ratio = currentP75 / currentP50;
  const formatter = new Intl.DateTimeFormat("en", { month: "short" });

  return Array.from({ length: 12 }, (_, index) => {
    const progress = index / 11;
    const p50 = Math.round(startP50 + (currentP50 - startP50) * progress);
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - index));

    return {
      month: formatter.format(date),
      p25: Math.round(p50 * p25Ratio),
      p50,
      p75: Math.round(p50 * p75Ratio),
    };
  });
}
