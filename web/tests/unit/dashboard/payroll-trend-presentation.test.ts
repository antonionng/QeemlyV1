import { describe, expect, it } from "vitest";
import {
  PAYROLL_TREND_CHART_STYLE,
  formatPayrollTrendTooltipValue,
  getPayrollTrendChangePresentation,
} from "@/lib/dashboard/payroll-trend-presentation";

describe("payroll trend presentation", () => {
  it("exposes the Figma chart styling tokens", () => {
    expect(PAYROLL_TREND_CHART_STYLE).toEqual({
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
    });
  });

  it("formats positive payroll change for the green growth pill", () => {
    expect(getPayrollTrendChangePresentation(22.5)).toEqual({
      label: "+22.5%",
      tone: "positive",
    });
  });

  it("formats tooltip values with the Payroll label, AED amount, and real point-over-point delta", () => {
    expect(formatPayrollTrendTooltipValue("Aug", 32_500_000, 31_400_000)).toEqual({
      month: "Aug",
      seriesLabel: "Payroll",
      value: "AED 32.5M",
      changeLabel: "+3.5%",
      changeTone: "positive",
      comparisonLabel: "vs previous period",
    });
  });
});
