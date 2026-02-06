"use client";

import { BarChart } from "@tremor/react";
import { Card } from "@/components/ui/card";
import { Target, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { type CompanyMetrics, type DepartmentSummary } from "@/lib/employees";

interface BandDistributionChartProps {
  metrics: CompanyMetrics;
  departmentSummaries: DepartmentSummary[];
}

export function BandDistributionChart({ metrics, departmentSummaries }: BandDistributionChartProps) {
  // Prepare data for company-wide overview
  const companyData = [
    {
      category: "Company",
      "In Band": metrics.bandDistribution.inBand,
      "Below Band": metrics.bandDistribution.below,
      "Above Band": metrics.bandDistribution.above,
    },
  ];

  // Prepare data for department breakdown
  const departmentData = departmentSummaries.map(d => ({
    category: d.department,
    "In Band": Math.round((d.inBandCount / d.activeCount) * 100),
    "Below Band": Math.round((d.belowBandCount / d.activeCount) * 100),
    "Above Band": Math.round((d.aboveBandCount / d.activeCount) * 100),
  }));

  // Target distribution
  const targetInBand = 75;
  const gap = targetInBand - metrics.bandDistribution.inBand;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">Band Distribution</h3>
          <p className="text-xs text-brand-500 mt-0.5">Employees by compensation band position</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Target className="h-3.5 w-3.5 text-brand-500" />
          <span className="text-brand-600">Target: {targetInBand}% in band</span>
        </div>
      </div>

      {/* Company-wide summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-emerald-50 p-3 text-center">
          <div className="text-2xl font-bold text-emerald-700">
            {metrics.bandDistribution.inBand}%
          </div>
          <div className="text-xs text-emerald-600 font-medium">In Band</div>
          <div className="text-[10px] text-emerald-500 mt-0.5">
            {Math.round(metrics.activeEmployees * metrics.bandDistribution.inBand / 100)} employees
          </div>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">
            {metrics.bandDistribution.below}%
          </div>
          <div className="text-xs text-amber-600 font-medium">Below Band</div>
          <div className="text-[10px] text-amber-500 mt-0.5">
            {Math.round(metrics.activeEmployees * metrics.bandDistribution.below / 100)} employees
          </div>
        </div>
        <div className="rounded-xl bg-rose-50 p-3 text-center">
          <div className="text-2xl font-bold text-rose-700">
            {metrics.bandDistribution.above}%
          </div>
          <div className="text-xs text-rose-600 font-medium">Above Band</div>
          <div className="text-[10px] text-rose-500 mt-0.5">
            {Math.round(metrics.activeEmployees * metrics.bandDistribution.above / 100)} employees
          </div>
        </div>
      </div>

      {/* Progress toward target */}
      <div className="mb-5 p-3 rounded-xl bg-brand-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-brand-700">Progress to Target</span>
          <span className={clsx(
            "text-xs font-semibold",
            gap <= 0 ? "text-emerald-600" : "text-amber-600"
          )}>
            {gap <= 0 ? "Target met!" : `${gap}% to go`}
          </span>
        </div>
        <div className="h-2 bg-brand-200 rounded-full overflow-hidden">
          <div 
            className={clsx(
              "h-full rounded-full transition-all duration-500",
              metrics.bandDistribution.inBand >= targetInBand ? "bg-emerald-500" : "bg-brand-500"
            )}
            style={{ width: `${Math.min(100, (metrics.bandDistribution.inBand / targetInBand) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-brand-500">
          <span>0%</span>
          <span>Target: {targetInBand}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Department comparison chart */}
      <div>
        <h4 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-3">
          By Department
        </h4>
        <div className="h-[200px]">
          <BarChart
            className="h-full"
            data={departmentData}
            index="category"
            categories={["In Band", "Below Band", "Above Band"]}
            colors={["emerald", "amber", "rose"]}
            valueFormatter={(v) => `${v}%`}
            showLegend={true}
            showGridLines={false}
            stack={true}
            showAnimation={true}
            layout="vertical"
          />
        </div>
      </div>

      {/* Trend indicator */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
        <span className="text-xs text-brand-600">
          In-band rate improved by <span className="font-semibold text-emerald-600">+{metrics.inBandChange}%</span> vs last year
        </span>
      </div>
    </Card>
  );
}
