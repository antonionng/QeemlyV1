"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";
import type { OverviewMetrics } from "@/lib/dashboard/company-overview";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";
import { useMemo, useState } from "react";
import { buildPayrollTrendViewModel, type PayrollTrendRange } from "@/lib/dashboard/payroll-trend";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatPayrollTrendTooltipValue,
  getPayrollTrendChangePresentation,
  PAYROLL_TREND_CHART_STYLE,
} from "@/lib/dashboard/payroll-trend-presentation";

interface PayrollTrendProps {
  metrics: OverviewMetrics;
}

type PayrollTrendTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { previousPayroll?: number } }>;
  label?: string | number;
};

function PayrollTrendTooltip({ active, payload, label }: PayrollTrendTooltipProps) {
  if (!active || !payload?.length || typeof payload[0]?.value !== "number") {
    return null;
  }

  const tooltip = formatPayrollTrendTooltipValue(
    String(label ?? ""),
    payload[0].value,
    payload[0].payload?.previousPayroll,
  );

  return (
    <div className="rounded-lg bg-[#111827] px-3 py-2.5 text-white shadow-[0_8px_24px_rgba(17,24,39,0.16)]">
      <p className="text-[13px] font-medium">{tooltip.month}</p>
      <p className="mt-2 text-[13px] text-white/70">{tooltip.seriesLabel}</p>
      <p className="mt-1 text-[13px] font-semibold">{tooltip.value}</p>
      {tooltip.changeLabel && tooltip.comparisonLabel && (
        <p
          className={clsx(
            "mt-1 text-[12px] font-medium",
            tooltip.changeTone === "positive" ? "text-[#86EFAC]" : "text-[#FDA4AF]",
          )}
        >
          {tooltip.changeLabel} {tooltip.comparisonLabel}
        </p>
      )}
    </div>
  );
}

export function PayrollTrend({ metrics }: PayrollTrendProps) {
  const { salaryView } = useSalaryView();
  const [timeRange, setTimeRange] = useState<PayrollTrendRange>("12m");
  const viewModel = buildPayrollTrendViewModel({ metrics, salaryView, timeRange });
  const changePresentation = getPayrollTrendChangePresentation(viewModel.periodChange);

  const chartData = useMemo(
    () => {
      const normalizedPoints = viewModel.chartData.map((point) => ({
        ...point,
        Payroll: applyViewMode(point.Payroll, salaryView),
      }));

      return normalizedPoints.map((point, index) => ({
        ...point,
        previousPayroll: index > 0 ? normalizedPoints[index - 1]?.Payroll : undefined,
      }));
    },
    [salaryView, viewModel.chartData],
  );

  const yAxisStep = salaryView === "monthly" ? 1_000_000 : 10_000_000;
  const yAxisMax = useMemo(() => {
    const highestValue = Math.max(...chartData.map((point) => point.Payroll), 0);
    return Math.max(yAxisStep, Math.ceil(highestValue / yAxisStep) * yAxisStep);
  }, [chartData, yAxisStep]);

  const yAxisTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let value = 0; value <= yAxisMax; value += yAxisStep) {
      ticks.push(value);
    }
    return ticks;
  }, [yAxisMax, yAxisStep]);

  const formatAxisValue = (value: number) => {
    if (!Number.isFinite(value)) return "AED 0";
    if (Math.abs(value) < 1_000_000) return `AED ${Math.round(value).toLocaleString("en-AE")}`;
    return `AED ${(value / 1_000_000).toFixed(1)}M`;
  };

  return (
    <Card className="p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[#111827]">Payroll Trend</h3>
          <p className="mt-1 text-sm text-[#6B7280]">How payroll is moving across the selected period</p>
          {viewModel.trustLabel && (
            <p className="mt-1 text-[13px] text-[#9CA3AF]">
              {viewModel.trustLabel}
            </p>
          )}
        </div>

        {/* Time range selector */}
        <div className="flex gap-1 rounded-full bg-[#F3F4F6] p-1">
          {(["3m", "6m", "12m"] as PayrollTrendRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={clsx(
                "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all",
                timeRange === range
                  ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                  : "bg-transparent text-[#6B7280] hover:text-[#111827]"
              )}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Period summary */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="text-[13px] text-[#6B7280]">Period start</p>
          <p className="mt-1 text-[36px] font-semibold leading-none text-[#111827]">
            {viewModel.startDisplay}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] text-[#6B7280]">{viewModel.changeLabel}</p>
          <p className="mt-1 text-[36px] font-semibold leading-none text-[#111827]">
            {viewModel.currentDisplay}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-[13px] text-[#6B7280]">{viewModel.currentLabel}</p>
            <span className={clsx(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium",
              changePresentation.tone === "positive"
                ? "bg-[#E8F8F1] text-[#059669]"
                : "bg-[#FFE9EF] text-[#FF4D78]"
            )}>
              {changePresentation.tone === "positive" ? (
                <TrendingUp className="h-3 w-3" strokeWidth={1.5} />
              ) : (
                <TrendingDown className="h-3 w-3" strokeWidth={1.5} />
              )}
              {changePresentation.label}
            </span>
          </div>
        </div>
      </div>

      <p className="mb-4 mt-4 text-[13px] text-[#6B7280]">{viewModel.driverSummary}</p>

      {/* Area Chart */}
      <div className="overview-payroll-chart mt-4" style={{ height: PAYROLL_TREND_CHART_STYLE.height }}>
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
              domain={[0, yAxisMax]}
              ticks={yAxisTicks}
              tick={{ fill: PAYROLL_TREND_CHART_STYLE.axisColor, fontSize: 12 }}
              tickFormatter={formatAxisValue}
            />
            <Tooltip
              cursor={{ stroke: "#D1D5DB", strokeDasharray: "4 4", strokeWidth: 1 }}
              content={<PayrollTrendTooltip />}
            />
            <Area
              type="monotone"
              dataKey="Payroll"
              stroke={PAYROLL_TREND_CHART_STYLE.lineColor}
              strokeWidth={PAYROLL_TREND_CHART_STYLE.lineWidth}
              fill={PAYROLL_TREND_CHART_STYLE.lineColor}
              fillOpacity={PAYROLL_TREND_CHART_STYLE.fillOpacity}
              dot={{
                r: PAYROLL_TREND_CHART_STYLE.dotRadius,
                fill: PAYROLL_TREND_CHART_STYLE.lineColor,
                stroke: PAYROLL_TREND_CHART_STYLE.lineColor,
                strokeWidth: 0,
              }}
              activeDot={{
                r: PAYROLL_TREND_CHART_STYLE.activeDotRadius,
                fill: PAYROLL_TREND_CHART_STYLE.lineColor,
                stroke: PAYROLL_TREND_CHART_STYLE.activeDotStroke,
                strokeWidth: PAYROLL_TREND_CHART_STYLE.activeDotStrokeWidth,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
