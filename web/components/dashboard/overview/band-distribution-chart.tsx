"use client";

import { Card } from "@/components/ui/card";
import type { OverviewBenchmarkCoverage, OverviewMetrics } from "@/lib/dashboard/company-overview";
import { getBandDistributionPresentation } from "@/lib/dashboard/overview-card-helpers";

interface BandDistributionChartProps {
  metrics: OverviewMetrics;
  benchmarkCoverage?: OverviewBenchmarkCoverage;
}

export function BandDistributionChart({ metrics, benchmarkCoverage }: BandDistributionChartProps) {
  const { inBand, below, above } = metrics.bandDistribution;
  const total = Math.max(metrics.benchmarkedEmployees, 1);
  const presentation = getBandDistributionPresentation(metrics);

  const inBandCount = metrics.bandDistributionCounts.inBand;
  const aboveCount = metrics.bandDistributionCounts.above;
  const belowCount = metrics.bandDistributionCounts.below;

  const targetInBand = 75;
  const progressPct = Math.min(100, (inBand / targetInBand) * 100);

  const donutTotal = total;
  const donutGradient = [
    `var(--success) 0deg ${(inBandCount / donutTotal) * 360}deg`,
    `var(--warning) ${(inBandCount / donutTotal) * 360}deg ${((inBandCount + aboveCount) / donutTotal) * 360}deg`,
    `#fb7185 ${((inBandCount + aboveCount) / donutTotal) * 360}deg 360deg`,
  ].join(", ");

  const rows = [
    {
      label: "In Band",
      pct: inBand,
      count: inBandCount,
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgColor: "bg-white",
      borderColor: "border-emerald-200",
    },
    {
      label: "Above Band",
      pct: above,
      count: aboveCount,
      color: "bg-amber-400",
      textColor: "text-amber-700",
      bgColor: "bg-white",
      borderColor: "border-amber-200",
    },
    {
      label: "Below Band",
      pct: below,
      count: belowCount,
      color: "bg-orange-400",
      textColor: "text-orange-700",
      bgColor: "bg-white",
      borderColor: "border-orange-200",
    },
  ];

  return (
    <Card className="dash-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-accent-900">{presentation.title}</h3>
        <p className="text-xs text-accent-500 mt-0.5">
          {presentation.subtitle}
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-500">
          Primary Focus
        </p>
        <p className="mt-2 text-lg font-semibold text-accent-900">
          {presentation.primaryFocusTitle}
        </p>
        <p className="mt-1 text-sm text-accent-600">
          {presentation.primaryFocusDescription}
        </p>
      </div>

      {/* Donut + Rows */}
      <div className="flex items-start gap-6 mb-5">
        {/* Donut */}
        <div className="relative shrink-0">
          <div
            className="h-32 w-32 rounded-full"
            style={{ background: `conic-gradient(${donutGradient})` }}
          />
          <div className="pointer-events-none absolute inset-4 rounded-full bg-white" />
        </div>

        {/* Rows */}
        <div className="flex-1 space-y-3 pt-1">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`flex items-center gap-3 rounded-xl border ${row.borderColor} ${row.bgColor} px-4 py-2.5`}
            >
              <div className={`h-3 w-3 rounded-full ${row.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`text-lg font-bold ${row.textColor}`}>{row.pct}%</span>
                  <span className="text-xs text-accent-500">{row.label}</span>
                </div>
                <p className="text-[11px] text-accent-400">{row.count} employees</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target progress bar */}
      <div className="border-t border-border/40 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-accent-800">{presentation.targetLabel}</span>
          <span className="text-xs text-accent-500">
            {presentation.targetProgressLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-accent-700 whitespace-nowrap">
            {targetInBand}% In Band
          </span>
          <div className="flex-1 h-3 rounded-full overflow-hidden bg-accent-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                inBand >= targetInBand ? "bg-emerald-500" : "bg-emerald-400"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        {benchmarkCoverage && benchmarkCoverage.benchmarkedEmployees < benchmarkCoverage.activeEmployees && (
          <p className="mt-3 text-xs text-accent-500">
            Distribution is based on {benchmarkCoverage.benchmarkedEmployees} of {benchmarkCoverage.activeEmployees} active employees with benchmark matches.
          </p>
        )}
      </div>
    </Card>
  );
}
