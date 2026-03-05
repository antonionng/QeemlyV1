"use client";

import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { type CompanyMetrics, type DepartmentSummary } from "@/lib/employees";

interface BandDistributionChartProps {
  metrics: CompanyMetrics;
  departmentSummaries: DepartmentSummary[];
}

export function BandDistributionChart({ metrics }: BandDistributionChartProps) {
  const { inBand, below, above } = metrics.bandDistribution;
  const total = metrics.activeEmployees;

  const inBandCount = Math.round(total * inBand / 100);
  const aboveCount = Math.round(total * above / 100);
  const belowCount = Math.round(total * below / 100);

  const targetInBand = 75;
  const gap = targetInBand - inBand;
  const progressPct = Math.min(100, (inBand / targetInBand) * 100);

  const donutTotal = Math.max(total, 1);
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
      bgColor: "bg-emerald-50",
    },
    {
      label: "Above Band",
      pct: above,
      count: aboveCount,
      color: "bg-amber-400",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
    },
    {
      label: "Below Band",
      pct: below,
      count: belowCount,
      color: "bg-orange-400",
      textColor: "text-orange-700",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <Card className="dash-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-accent-900">Band Distribution</h3>
        <p className="text-xs text-accent-500 mt-0.5">Employees by compensation band position</p>
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
            <div key={row.label} className={`flex items-center gap-3 rounded-xl ${row.bgColor} px-4 py-2.5`}>
              <div className={`h-3 w-3 rounded-full ${row.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`text-lg font-bold ${row.textColor}`}>{row.pct}%</span>
                  <span className="text-xs text-accent-500">{row.label}</span>
                </div>
                <p className="text-[11px] text-accent-400">{row.count} employees</p>
              </div>
              <ArrowRight className="h-4 w-4 text-accent-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Target progress bar */}
      <div className="border-t border-border/40 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-accent-800">Target</span>
          <span className="text-xs text-accent-500">
            {gap <= 0 ? "Target met!" : `${gap}% to go`}
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
      </div>
    </Card>
  );
}
