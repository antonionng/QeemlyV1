"use client";

import { Card } from "@/components/ui/card";
import { formatAEDCompact, type CompanyMetrics, type TrendDataPoint } from "@/lib/employees";

interface StatCardsProps {
  metrics: CompanyMetrics;
  benchmarkCoverage?: {
    activeEmployees: number;
    benchmarkedEmployees: number;
  };
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
      className="mt-2 text-sm font-medium"
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
    <div className="mt-5" data-testid="active-employees-sparkline">
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
  );
}

function TotalPayrollBars({ trend }: { trend: TrendDataPoint[] }) {
  const series = buildPayrollBarSeries(trend, 1);
  const max = Math.max(...series.map((item) => item.value), 1);

  return (
    <div className="mt-5 flex items-end gap-[14px]">
      {series.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-2">
          <div
            className="w-7 rounded-[8px]"
            style={{
              height: `${Math.max(56, (item.value / max) * 120)}px`,
              background: item.active ? "#7C7FF0" : "#E5E7EB",
            }}
          />
          <span className="text-[11px] font-medium text-[#6B7280]">{item.label}</span>
        </div>
      ))}
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
        className="mt-5 flex h-7 overflow-hidden rounded-[10px]"
        data-testid="in-band-distribution"
      >
        <div style={{ width: `${segments.inBand}%`, background: "#7BC8AE" }} />
        <div style={{ width: `${segments.above}%`, background: "#F2C98A" }} />
        <div style={{ width: `${segments.below}%`, background: "#E88FA1" }} />
      </div>
      <div className="mt-4">
        <span className="overview-metric-card-value">{inBandPercentage}%</span>
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
      <div className="mt-5 h-7 rounded-[10px] bg-[#E5E7EB]">
        <div
          className="h-7 rounded-[10px]"
          data-testid="risk-flags-indicator"
          style={{ width: `${width}%`, background: "#FF3B5C" }}
        />
      </div>
      <div className="mt-4">
        <span className="overview-metric-card-value">{riskFlags}</span>
      </div>
    </>
  );
}

export function StatCards({ metrics }: StatCardsProps) {
  return (
    <>
      <Card className="overview-metric-card h-full" data-testid="active-employees-card">
        <div>
          <h3 className="overview-metric-card-title">Active Employees</h3>
          <p className="overview-metric-card-description">{metrics.totalEmployees} total</p>
          <ActiveEmployeesSparkline trend={metrics.headcountTrend} />
        </div>
        <div className="mt-4">
          <span className="overview-metric-card-value">{metrics.activeEmployees}</span>
          <MetricDelta value={metrics.headcountChange} />
        </div>
      </Card>

      <Card className="overview-metric-card h-full" data-testid="total-payroll-card">
        <div>
          <h3 className="overview-metric-card-title">Total Payroll</h3>
          <p className="overview-metric-card-description">Annual compensation</p>
          <TotalPayrollBars trend={metrics.payrollTrend} />
        </div>
        <div className="mt-4">
          <span className="overview-metric-card-value">{formatAEDCompact(metrics.totalPayroll)}</span>
          <MetricDelta value={metrics.payrollChange} />
        </div>
      </Card>

      <Card className="overview-metric-card h-full" data-testid="in-band-card">
        <div>
          <h3 className="overview-metric-card-title">In Band</h3>
          <p className="overview-metric-card-description">{metrics.outOfBandPercentage}% outside band</p>
          <InBandDistribution
            inBandPercentage={metrics.inBandPercentage}
            segments={metrics.bandDistribution}
          />
        </div>
        <MetricDelta value={metrics.inBandChange} />
      </Card>

      <Card className="overview-metric-card h-full" data-testid="risk-flags-card">
        <div>
          <h3 className="overview-metric-card-title">Risk Flags</h3>
          <p className="overview-metric-card-description">Above market employees</p>
          <RiskFlagsIndicator
            riskFlags={metrics.payrollRiskFlags}
            benchmarkedEmployees={Number(
              ("benchmarkedEmployees" in metrics ? metrics.benchmarkedEmployees : metrics.activeEmployees) ?? 0,
            )}
          />
        </div>
      </Card>
    </>
  );
}
