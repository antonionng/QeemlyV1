"use client";

import { Card } from "@/components/ui/card";
import type {
  OverviewInteractionMap,
  OverviewInteractionTarget,
} from "@/lib/dashboard/overview-interactions";
import { formatAEDCompact, type CompanyMetrics, type TrendDataPoint } from "@/lib/employees";
import { OverviewInteractiveSurface } from "./interactive-surface";

interface StatCardsProps {
  metrics: CompanyMetrics;
  benchmarkCoverage?: {
    activeEmployees: number;
    benchmarkedEmployees: number;
  };
  interactions?: OverviewInteractionMap;
  onInteract?: (target: OverviewInteractionTarget) => void;
}

function buildChartPoints(values: number[], width: number, height: number) {
  const safeValues = values.length > 1 ? values : [0, ...values];
  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const range = Math.max(max - min, 1);
  const stepX = safeValues.length > 1 ? width / (safeValues.length - 1) : width;

  return safeValues.map((value, index) => {
    const x = Number((index * stepX).toFixed(2));
    const y = Number((height - ((value - min) / range) * height).toFixed(2));

    return { x, y };
  });
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function buildAreaPath(points: Array<{ x: number; y: number }>, width: number, height: number) {
  const linePath = buildLinePath(points);
  const lastPoint = points[points.length - 1];

  return `${linePath} L ${lastPoint?.x ?? width} ${height} L 0 ${height} Z`;
}

function getTrendValues(trend: TrendDataPoint[], fallback: number) {
  if (trend.length > 0) {
    return trend.map((point) => point.value);
  }

  return [fallback * 0.72, fallback * 0.7, fallback * 0.74, fallback * 0.82, fallback * 0.86, fallback];
}

function buildPayrollBarSeries(trend: TrendDataPoint[], fallback: number) {
  const labels = ["2023", "2024", "2025", "2026"];
  const trendValues =
    trend.length >= 4
      ? trend.slice(-4).map((point) => point.value)
      : [fallback * 0.64, fallback * 0.76, fallback * 0.72, fallback];

  return labels.map((label, index) => ({
    label,
    value: trendValues[index] ?? fallback,
    active: index === labels.length - 1,
  }));
}

function MetricDelta({ value }: { value: number }) {
  const isPositive = value >= 0;

  return (
    <div
      className="text-left text-sm font-medium leading-tight sm:text-right"
      style={{ color: isPositive ? "#05DA5A" : "#FF2056" }}
    >
      {isPositive ? "+" : ""}
      {value}% <span className="font-normal text-[#969799]">vs last year</span>
    </div>
  );
}

function PayrollMetricValue({ value }: { value: string }) {
  const match = value.match(/^([A-Z]{3})\s+(.+)$/);

  if (!match) {
    return <span className="overview-metric-card-value shrink-0 whitespace-nowrap">{value}</span>;
  }

  const [, currency, amount] = match;

  return (
    <span
      className="overview-metric-card-value-group"
      data-testid="total-payroll-card-value"
    >
      <span
        className="overview-metric-card-value-currency"
        data-testid="total-payroll-card-value-currency"
      >
        {currency}
      </span>
      <span
        className="overview-metric-card-value-amount"
        data-testid="total-payroll-card-value-amount"
      >
        {amount}
      </span>
    </span>
  );
}

function ActiveEmployeesSparkline({ trend }: { trend: TrendDataPoint[] }) {
  const width = 220;
  const height = 96;
  const points = buildChartPoints(getTrendValues(trend, 1), width, height - 4);
  const linePath = buildLinePath(points);
  const areaPath = buildAreaPath(points, width, height);

  return (
    <div className="w-full" data-testid="active-employees-card-chart">
      <div data-testid="active-employees-sparkline">
      <svg className="h-[96px] w-full" viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="activeEmployeesSparklineFill" x1="0" y1="0" x2="0" y2={height}>
            <stop offset="0%" stopColor="rgba(168,155,255,0.25)" />
            <stop offset="100%" stopColor="rgba(168,155,255,0)" />
          </linearGradient>
        </defs>
        <path d={areaPath} style={{ fill: "url(#activeEmployeesSparklineFill)" }} />
        <path
          d={linePath}
          style={{ stroke: "#A89BFF" }}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      </div>
    </div>
  );
}

function TotalPayrollBars({ trend }: { trend: TrendDataPoint[] }) {
  const series = buildPayrollBarSeries(trend, 1);
  const max = Math.max(...series.map((item) => item.value), 1);

  return (
    <div className="w-full" data-testid="total-payroll-card-chart">
      <div
        className="grid min-w-0 grid-cols-4 items-end gap-2 overflow-hidden sm:gap-3"
        data-testid="total-payroll-bars-grid"
      >
      {series.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-col items-center gap-2">
          <div
            className="w-full min-w-0 max-w-8 rounded-[10px]"
            style={{
              height: `${Math.max(56, (item.value / max) * 120)}px`,
              background: item.active ? "#A89BFF" : "rgba(150,151,153,0.2)",
            }}
          />
          <span className="text-[10px] font-medium text-[#969799] sm:text-[11px]">{item.label}</span>
        </div>
      ))}
      </div>
    </div>
  );
}

function InBandDistribution({
  segments,
}: {
  segments: { inBand: number; above: number; below: number };
}) {
  return (
    <>
      <div
        className="flex h-14 w-full overflow-hidden rounded-[12px]"
        data-testid="in-band-card-chart"
      >
        <div
          className="flex h-full w-full overflow-hidden rounded-[12px]"
        data-testid="in-band-distribution"
      >
          <div style={{ width: `${segments.inBand}%`, background: "#00BC7D" }} />
          <div style={{ width: `${segments.above}%`, background: "#FE9A00" }} />
          <div style={{ width: `${segments.below}%`, background: "#FF2056" }} />
        </div>
      </div>
    </>
  );
}

function RiskFlagsIndicator({
  riskFlags,
  benchmarkedEmployees,
}: {
  riskFlags: number;
  benchmarkedEmployees: number;
}) {
  const width = Math.min(100, Math.max(0, (riskFlags / Math.max(benchmarkedEmployees, 1)) * 100));

  return (
    <>
      <div className="w-full" data-testid="risk-flags-card-chart">
        <div className="h-14 rounded-[12px] bg-[rgba(150,151,153,0.2)] p-2">
        <div
          className="h-full rounded-[10px]"
          data-testid="risk-flags-indicator"
          style={{
            width: `${width}%`,
            minWidth: riskFlags > 0 ? "18px" : "0px",
            background: "#FF2056",
          }}
        />
        </div>
      </div>
    </>
  );
}

export function StatCards({ metrics, interactions, onInteract }: StatCardsProps) {
  const metricHeaderClassName =
    "overview-metric-card-header min-h-[5.25rem] sm:min-h-[5rem]";
  const metricVisualSlotClassName =
    "overview-metric-card-visual-slot mt-4 flex min-h-[7.5rem] items-start sm:mt-6 sm:min-h-[8.25rem]";
  const metricFooterClassName =
    "overview-metric-card-footer mt-auto flex min-h-[4.5rem] flex-col items-start gap-2 pt-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3 sm:pt-6";
  const metricValueClassName = "overview-metric-card-value shrink-0 whitespace-nowrap";

  return (
    <div className="grid h-full min-w-0 auto-rows-fr gap-6 xl:grid-cols-1 2xl:grid-cols-2" data-testid="overview-stat-card-grid">
      {interactions?.statCards.activeEmployees ? (
        <OverviewInteractiveSurface
          target={interactions.statCards.activeEmployees}
          onInteract={onInteract}
          testId="active-employees-card-action"
          tooltipTestId="active-employees-card-tooltip"
        >
          <Card
            className="overview-metric-card flex h-full min-h-[250px] min-w-0 flex-col justify-between p-5 sm:p-6"
            data-testid="active-employees-card"
          >
            <div className="flex h-full flex-col">
              <div className={metricHeaderClassName} data-testid="active-employees-card-header">
                <h3 className="overview-metric-card-title">Active Employees</h3>
                <p className="overview-metric-card-description block min-h-[3rem]">{metrics.totalEmployees} total</p>
              </div>
              <div className={metricVisualSlotClassName} data-testid="active-employees-card-visual-slot">
                <ActiveEmployeesSparkline trend={metrics.headcountTrend} />
              </div>
              <div className={metricFooterClassName}>
                <span className={metricValueClassName}>{metrics.activeEmployees}</span>
                <MetricDelta value={metrics.headcountChange} />
              </div>
            </div>
          </Card>
        </OverviewInteractiveSurface>
      ) : (
        <Card
          className="overview-metric-card flex h-full min-h-[250px] min-w-0 flex-col justify-between p-5 sm:p-6"
          data-testid="active-employees-card"
        >
          <div className="flex h-full flex-col">
            <div className={metricHeaderClassName} data-testid="active-employees-card-header">
              <h3 className="overview-metric-card-title">Active Employees</h3>
              <p className="overview-metric-card-description block min-h-[3rem]">{metrics.totalEmployees} total</p>
            </div>
            <div className={metricVisualSlotClassName} data-testid="active-employees-card-visual-slot">
              <ActiveEmployeesSparkline trend={metrics.headcountTrend} />
            </div>
            <div className={metricFooterClassName}>
              <span className={metricValueClassName}>{metrics.activeEmployees}</span>
              <MetricDelta value={metrics.headcountChange} />
            </div>
          </div>
        </Card>
      )}

      {interactions?.statCards.totalPayroll ? (
        <OverviewInteractiveSurface
          target={interactions.statCards.totalPayroll}
          onInteract={onInteract}
          testId="total-payroll-card-action"
          tooltipTestId="total-payroll-card-tooltip"
        >
          <Card
            className="overview-metric-card flex h-full min-h-[250px] min-w-0 flex-col justify-between p-5 sm:p-6"
            data-testid="total-payroll-card"
          >
            <div className="flex h-full flex-col">
              <div className={metricHeaderClassName} data-testid="total-payroll-card-header">
                <h3 className="overview-metric-card-title">Total Payroll</h3>
                <p className="overview-metric-card-description block min-h-[3rem]">Annual compensation</p>
              </div>
              <div className={metricVisualSlotClassName} data-testid="total-payroll-card-visual-slot">
                <TotalPayrollBars trend={metrics.payrollTrend} />
              </div>
              <div className={metricFooterClassName}>
                <PayrollMetricValue value={formatAEDCompact(metrics.totalPayroll)} />
                <MetricDelta value={metrics.payrollChange} />
              </div>
            </div>
          </Card>
        </OverviewInteractiveSurface>
      ) : (
        <Card
          className="overview-metric-card flex h-full min-h-[250px] min-w-0 flex-col justify-between p-5 sm:p-6"
          data-testid="total-payroll-card"
        >
          <div className="flex h-full flex-col">
            <div className={metricHeaderClassName} data-testid="total-payroll-card-header">
              <h3 className="overview-metric-card-title">Total Payroll</h3>
              <p className="overview-metric-card-description block min-h-[3rem]">Annual compensation</p>
            </div>
            <div className={metricVisualSlotClassName} data-testid="total-payroll-card-visual-slot">
              <TotalPayrollBars trend={metrics.payrollTrend} />
            </div>
            <div className={metricFooterClassName}>
              <PayrollMetricValue value={formatAEDCompact(metrics.totalPayroll)} />
              <MetricDelta value={metrics.payrollChange} />
            </div>
          </div>
        </Card>
      )}

      {interactions?.statCards.inBand ? (
        <OverviewInteractiveSurface
          target={interactions.statCards.inBand}
          onInteract={onInteract}
          testId="in-band-card-action"
          tooltipTestId="in-band-card-tooltip"
        >
          <Card
            className="overview-metric-card flex h-full min-h-[250px] min-w-0 flex-col justify-between p-5 sm:p-6"
            data-testid="in-band-card"
          >
            <div className="flex h-full flex-col">
              <div className={metricHeaderClassName} data-testid="in-band-card-header">
                <h3 className="overview-metric-card-title">In Band</h3>
                <p className="overview-metric-card-description block min-h-[3rem]">{metrics.outOfBandPercentage}% outside band</p>
              </div>
              <div className={metricVisualSlotClassName} data-testid="in-band-card-visual-slot">
                <InBandDistribution
                  segments={metrics.bandDistribution}
                />
              </div>
              <div className={metricFooterClassName}>
                <span className={metricValueClassName}>{metrics.inBandPercentage}%</span>
                <MetricDelta value={metrics.inBandChange} />
              </div>
            </div>
          </Card>
        </OverviewInteractiveSurface>
      ) : (
        <Card
          className="overview-metric-card flex h-full min-h-[250px] min-w-0 flex-col justify-between p-5 sm:p-6"
          data-testid="in-band-card"
        >
          <div className="flex h-full flex-col">
            <div className={metricHeaderClassName} data-testid="in-band-card-header">
              <h3 className="overview-metric-card-title">In Band</h3>
              <p className="overview-metric-card-description block min-h-[3rem]">{metrics.outOfBandPercentage}% outside band</p>
            </div>
            <div className={metricVisualSlotClassName} data-testid="in-band-card-visual-slot">
              <InBandDistribution
                segments={metrics.bandDistribution}
              />
            </div>
            <div className={metricFooterClassName}>
              <span className={metricValueClassName}>{metrics.inBandPercentage}%</span>
              <MetricDelta value={metrics.inBandChange} />
            </div>
          </div>
        </Card>
      )}

      {interactions?.statCards.riskFlags ? (
        <OverviewInteractiveSurface
          target={interactions.statCards.riskFlags}
          onInteract={onInteract}
          testId="risk-flags-card-action"
          tooltipTestId="risk-flags-card-tooltip"
        >
          <Card
            className="overview-metric-card flex h-full min-h-[250px] min-w-0 flex-col justify-between p-5 sm:p-6"
            data-testid="risk-flags-card"
          >
            <div className="flex h-full flex-col">
              <div className={metricHeaderClassName} data-testid="risk-flags-card-header">
                <h3 className="overview-metric-card-title">Risk Flags</h3>
                <p className="overview-metric-card-description block min-h-[3rem]">Above market employees</p>
              </div>
              <div className={metricVisualSlotClassName} data-testid="risk-flags-card-visual-slot">
                <RiskFlagsIndicator
                  riskFlags={metrics.payrollRiskFlags}
                  benchmarkedEmployees={Number(
                    ("benchmarkedEmployees" in metrics ? metrics.benchmarkedEmployees : metrics.activeEmployees) ?? 0,
                  )}
                />
              </div>
              <div className={metricFooterClassName}>
                <span className={metricValueClassName}>{metrics.payrollRiskFlags}</span>
              </div>
            </div>
          </Card>
        </OverviewInteractiveSurface>
      ) : (
        <Card
          className="overview-metric-card flex h-full min-h-[250px] min-w-0 flex-col justify-between p-5 sm:p-6"
          data-testid="risk-flags-card"
        >
          <div className="flex h-full flex-col">
            <div className={metricHeaderClassName} data-testid="risk-flags-card-header">
              <h3 className="overview-metric-card-title">Risk Flags</h3>
              <p className="overview-metric-card-description block min-h-[3rem]">Above market employees</p>
            </div>
            <div className={metricVisualSlotClassName} data-testid="risk-flags-card-visual-slot">
              <RiskFlagsIndicator
                riskFlags={metrics.payrollRiskFlags}
                benchmarkedEmployees={Number(
                  ("benchmarkedEmployees" in metrics ? metrics.benchmarkedEmployees : metrics.activeEmployees) ?? 0,
                )}
              />
            </div>
            <div className={metricFooterClassName}>
              <span className={metricValueClassName}>{metrics.payrollRiskFlags}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
