import { formatAEDCompact } from "@/lib/employees";

export const PAYROLL_TREND_CHART_STYLE = {
  height: 280,
  lineColor: "#6C5CE7",
  lineWidth: 3,
  dotRadius: 4,
  activeDotRadius: 6,
  activeDotStroke: "#FFFFFF",
  activeDotStrokeWidth: 3,
  gridColor: "#F3F4F6",
  axisColor: "#9CA3AF",
  tooltipBackground: "#111827",
  fillOpacity: 0,
} as const;

export function getPayrollTrendChangePresentation(periodChange: number) {
  return {
    label: `${periodChange >= 0 ? "+" : ""}${periodChange.toFixed(1)}%`,
    tone: (periodChange >= 0 ? "positive" : "negative") as "positive" | "negative",
  };
}

export function formatPayrollTrendTooltipValue(
  month: string,
  value: number,
  previousValue?: number,
) {
  const change =
    typeof previousValue === "number" && previousValue > 0
      ? ((value - previousValue) / previousValue) * 100
      : null;

  return {
    month,
    seriesLabel: "Payroll",
    value: formatAEDCompact(value),
    changeLabel:
      typeof change === "number" ? `${change >= 0 ? "+" : ""}${change.toFixed(1)}%` : null,
    changeTone:
      typeof change === "number"
        ? ((change >= 0 ? "positive" : "negative") as "positive" | "negative")
        : null,
    comparisonLabel: typeof change === "number" ? "vs previous period" : null,
  };
}
