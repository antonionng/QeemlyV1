import type { SalaryViewMode } from "@/components/ui/salary-view-toggle";
import type { OverviewMetrics } from "@/lib/dashboard/company-overview";
import { formatAEDCompact } from "@/lib/employees";
import { applyViewMode } from "@/lib/salary-view-store";

export type PayrollTrendRange = "3m" | "6m" | "12m";

type PayrollTrendPoint = {
  month: string;
  value: number;
};

export type PayrollTrendViewModel = {
  trendData: PayrollTrendPoint[];
  chartData: Array<{ month: string; Payroll: number }>;
  startValue: number;
  endValue: number;
  periodChange: number;
  startDisplay: string;
  currentDisplay: string;
  currentLabel: string;
  changeLabel: string;
  driverSummary: string;
  trustLabel: string | null;
};

type BuildPayrollTrendViewModelArgs = {
  metrics: OverviewMetrics;
  salaryView: SalaryViewMode;
  timeRange: PayrollTrendRange;
};

function sliceTrendData(
  trend: PayrollTrendPoint[],
  timeRange: PayrollTrendRange
): PayrollTrendPoint[] {
  const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12;
  const sliced = trend.slice(-months);

  if (timeRange === "12m" && sliced.length > 6) {
    return sliced.filter((_, idx) => idx % 2 === 0);
  }

  return sliced;
}

function formatHeaderValue(value: number, salaryView: SalaryViewMode): string {
  return formatAEDCompact(applyViewMode(value, salaryView));
}

function getCurrentLabel(salaryView: SalaryViewMode): string {
  return salaryView === "monthly" ? "Current monthly payroll" : "Current annual payroll";
}

function buildDriverSummary(metrics: OverviewMetrics): string {
  const headcountChange = metrics.headcountChange;
  const payrollChange = metrics.payrollChange;
  const delta = payrollChange - headcountChange;

  if (Math.abs(delta) <= 0.5) {
    return `Driver: payroll and headcount are moving in step (+${headcountChange.toFixed(1)}% headcount vs +${payrollChange.toFixed(1)}% payroll).`;
  }

  if (delta > 0) {
    return `Driver: payroll is rising faster than headcount (+${headcountChange.toFixed(1)}% headcount vs +${payrollChange.toFixed(1)}% payroll).`;
  }

  return `Driver: growth is mostly headcount-led (+${headcountChange.toFixed(1)}% headcount vs +${payrollChange.toFixed(1)}% payroll).`;
}

function getTrustLabel(metrics: OverviewMetrics): string | null {
  if (metrics.trendMode === "inferred_from_current_roster") {
    return "Estimated from active employee records and hire dates.";
  }

  return null;
}

export function buildPayrollTrendViewModel({
  metrics,
  salaryView,
  timeRange,
}: BuildPayrollTrendViewModelArgs): PayrollTrendViewModel {
  const trendData = sliceTrendData(metrics.payrollTrend, timeRange);
  const startValue = trendData[0]?.value ?? 0;
  const endValue = trendData[trendData.length - 1]?.value ?? 0;
  const periodChange =
    startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  return {
    trendData,
    chartData: trendData.map((point) => ({
      month: point.month,
      Payroll: point.value,
    })),
    startValue,
    endValue,
    periodChange,
    startDisplay: formatHeaderValue(startValue, salaryView),
    currentDisplay: formatHeaderValue(endValue, salaryView),
    currentLabel: getCurrentLabel(salaryView),
    changeLabel: `${timeRange.toUpperCase()} payroll change`,
    driverSummary: buildDriverSummary(metrics),
    trustLabel: getTrustLabel(metrics),
  };
}
