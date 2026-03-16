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
      className="text-right text-sm font-medium leading-tight"
      style={{ color: isPositive ? "#16A34A" : "#DC2626" }}
    >
      {isPositive ? "+" : ""}
      {value}% <span className="font-normal text-[#6B7280]">vs last year</span>
    </div>
  );
}

function ActiveEmployeesSparkline({ trend }: { trend: TrendDataPoint[] }) {
  const width = 220;
  const height = 96;
  const points = buildChartPoints(getTrendValues(trend, 1), width, height - 4);
  const linePath = buildLinePath(points);
  const areaPath = buildAreaPath(points, width, height);

  return (
    <div className="mt-6" data-testid="active-employees-card-chart">
      <div data-testid="active-employees-sparkline">
      <svg className="h-[96px] w-full" viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="activeEmployeesSparklineFill" x1="0" y1="0" x2="0" y2={height}>
            <stop offset="0%" stopColor="rgba(124,127,240,0.25)" />
            <stop offset="100%" stopColor="rgba(124,127,240,0)" />
          </linearGradient>
        </defs>
        <path d={areaPath} style={{ fill: "url(#activeEmployeesSparklineFill)" }} />
        <path
          d={linePath}
          style={{ stroke: "#7C7FF0" }}
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
    <div className="mt-6" data-testid="total-payroll-card-chart">
      <div className="flex items-end gap-[14px]">
      {series.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-2">
          <div
            className="w-9 rounded-[10px]"
            style={{
              height: `${Math.max(56, (item.value / max) * 120)}px`,
              background: item.active ? "#7C7FF0" : "#E5E7EB",
            }}
          />
          <span className="text-[11px] font-medium text-[#6B7280]">{item.label}</span>
        </div>
      ))}
      </div>
    </div>
  );
}

function InBandDistribution({
  inBandPercentage,
  segments,
}: {
  inBandPercentage: number;
  segments: { inBand: number; above: number; below: number };
}) {
  return (
    <>
      <div
        className="mt-6 flex h-14 overflow-hidden rounded-[12px]"
        data-testid="in-band-card-chart"
      >
        <div
          className="flex h-full w-full overflow-hidden rounded-[12px]"
        data-testid="in-band-distribution"
      >
          <div style={{ width: `${segments.inBand}%`, background: "#7BC8AE" }} />
          <div style={{ width: `${segments.above}%`, background: "#F2C98A" }} />
          <div style={{ width: `${segments.below}%`, background: "#E88FA1" }} />
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
      <div className="mt-6" data-testid="risk-flags-card-chart">
        <div className="h-14 rounded-[12px] bg-[#E5E7EB] p-2">
        <div
          className="h-full rounded-[10px]"
          data-testid="risk-flags-indicator"
          style={{
            width: `${width}%`,
            minWidth: riskFlags > 0 ? "18px" : "0px",
            background: "#FF3B5C",
          }}
        />
        </div>
      </div>
    </>
  );
}

export function StatCards({ metrics, interactions, onInteract }: StatCardsProps) {
  return (
    <div className="grid h-full min-w-0 auto-rows-fr gap-6 sm:grid-cols-2" data-testid="overview-stat-card-grid">
      {interactions?.statCards.activeEmployees ? (
        <OverviewInteractiveSurface
          target={interactions.statCards.activeEmployees}
          onInteract={onInteract}
          testId="active-employees-card-action"
          tooltipTestId="active-employees-card-tooltip"
        >
          <Card
            className="overview-metric-card flex h-full min-h-[250px] flex-col justify-between p-6"
            data-testid="active-employees-card"
          >
            <div className="flex h-full flex-col">
              <h3 className="overview-metric-card-title">Active Employees</h3>
              <p className="overview-metric-card-description">{metrics.totalEmployees} total</p>
              <ActiveEmployeesSparkline trend={metrics.headcountTrend} />
              <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                <span className="overview-metric-card-value">{metrics.activeEmployees}</span>
                <MetricDelta value={metrics.headcountChange} />
              </div>
            </div>
          </Card>
        </OverviewInteractiveSurface>
      ) : (
        <Card
          className="overview-metric-card flex h-full min-h-[250px] flex-col justify-between p-6"
          data-testid="active-employees-card"
        >
          <div className="flex h-full flex-col">
            <h3 className="overview-metric-card-title">Active Employees</h3>
            <p className="overview-metric-card-description">{metrics.totalEmployees} total</p>
            <ActiveEmployeesSparkline trend={metrics.headcountTrend} />
            <div className="mt-auto flex items-end justify-between gap-4 pt-6">
              <span className="overview-metric-card-value">{metrics.activeEmployees}</span>
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
            className="overview-metric-card flex h-full min-h-[250px] flex-col justify-between p-6"
            data-testid="total-payroll-card"
          >
            <div className="flex h-full flex-col">
              <h3 className="overview-metric-card-title">Total Payroll</h3>
              <p className="overview-metric-card-description">Annual compensation</p>
              <TotalPayrollBars trend={metrics.payrollTrend} />
              <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                <span className="overview-metric-card-value">{formatAEDCompact(metrics.totalPayroll)}</span>
                <MetricDelta value={metrics.payrollChange} />
              </div>
            </div>
          </Card>
        </OverviewInteractiveSurface>
      ) : (
        <Card
          className="overview-metric-card flex h-full min-h-[250px] flex-col justify-between p-6"
          data-testid="total-payroll-card"
        >
          <div className="flex h-full flex-col">
            <h3 className="overview-metric-card-title">Total Payroll</h3>
            <p className="overview-metric-card-description">Annual compensation</p>
            <TotalPayrollBars trend={metrics.payrollTrend} />
            <div className="mt-auto flex items-end justify-between gap-4 pt-6">
              <span className="overview-metric-card-value">{formatAEDCompact(metrics.totalPayroll)}</span>
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
            className="overview-metric-card flex h-full min-h-[250px] flex-col justify-between p-6"
            data-testid="in-band-card"
          >
            <div className="flex h-full flex-col">
              <h3 className="overview-metric-card-title">In Band</h3>
              <p className="overview-metric-card-description">{metrics.outOfBandPercentage}% outside band</p>
              <InBandDistribution
                inBandPercentage={metrics.inBandPercentage}
                segments={metrics.bandDistribution}
              />
              <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                <span className="overview-metric-card-value">{metrics.inBandPercentage}%</span>
                <MetricDelta value={metrics.inBandChange} />
              </div>
            </div>
          </Card>
        </OverviewInteractiveSurface>
      ) : (
        <Card
          className="overview-metric-card flex h-full min-h-[250px] flex-col justify-between p-6"
          data-testid="in-band-card"
        >
          <div className="flex h-full flex-col">
            <h3 className="overview-metric-card-title">In Band</h3>
            <p className="overview-metric-card-description">{metrics.outOfBandPercentage}% outside band</p>
            <InBandDistribution
              inBandPercentage={metrics.inBandPercentage}
              segments={metrics.bandDistribution}
            />
            <div className="mt-auto flex items-end justify-between gap-4 pt-6">
              <span className="overview-metric-card-value">{metrics.inBandPercentage}%</span>
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
            className="overview-metric-card flex h-full min-h-[250px] flex-col justify-between p-6"
            data-testid="risk-flags-card"
          >
            <div className="flex h-full flex-col">
              <h3 className="overview-metric-card-title">Risk Flags</h3>
              <p className="overview-metric-card-description">Above market employees</p>
              <RiskFlagsIndicator
                riskFlags={metrics.payrollRiskFlags}
                benchmarkedEmployees={Number(
                  ("benchmarkedEmployees" in metrics ? metrics.benchmarkedEmployees : metrics.activeEmployees) ?? 0,
                )}
              />
              <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                <span className="overview-metric-card-value">{metrics.payrollRiskFlags}</span>
              </div>
            </div>
          </Card>
        </OverviewInteractiveSurface>
      ) : (
        <Card
          className="overview-metric-card flex h-full min-h-[250px] flex-col justify-between p-6"
          data-testid="risk-flags-card"
        >
          <div className="flex h-full flex-col">
            <h3 className="overview-metric-card-title">Risk Flags</h3>
            <p className="overview-metric-card-description">Above market employees</p>
            <RiskFlagsIndicator
              riskFlags={metrics.payrollRiskFlags}
              benchmarkedEmployees={Number(
                ("benchmarkedEmployees" in metrics ? metrics.benchmarkedEmployees : metrics.activeEmployees) ?? 0,
              )}
            />
            <div className="mt-auto flex items-end justify-between gap-4 pt-6">
              <span className="overview-metric-card-value">{metrics.payrollRiskFlags}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
