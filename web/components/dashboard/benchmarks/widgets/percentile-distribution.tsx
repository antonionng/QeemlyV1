"use client";

import { BarChart } from "@tremor/react";
import clsx from "clsx";
import { useBenchmarksContext } from "@/lib/benchmarks/context";
import { formatCurrency } from "@/lib/dashboard/dummy-data";

export function PercentileDistributionWidget() {
  const { selectedBenchmark, selectedRole } = useBenchmarksContext();

  if (!selectedBenchmark || !selectedRole) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-brand-700">No role selected</p>
          <p className="text-xs text-accent-500">Select a role to view distribution</p>
        </div>
      </div>
    );
  }

  const distributionData = [
    { percentile: "P10", value: selectedBenchmark.percentiles.p10 },
    { percentile: "P25", value: selectedBenchmark.percentiles.p25 },
    { percentile: "P50", value: selectedBenchmark.percentiles.p50 },
    { percentile: "P75", value: selectedBenchmark.percentiles.p75 },
    { percentile: "P90", value: selectedBenchmark.percentiles.p90 },
  ];

  const chartData = distributionData.map((d) => ({
    percentile: d.percentile,
    Salary: d.value,
  }));

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">{selectedRole.title}</h3>
          <p className="text-xs text-accent-500">Salary percentile distribution</p>
        </div>
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            selectedBenchmark.confidence === "High"
              ? "bg-emerald-100 text-emerald-700"
              : selectedBenchmark.confidence === "Medium"
              ? "bg-amber-100 text-amber-700"
              : "bg-rose-100 text-rose-700"
          )}
        >
          {selectedBenchmark.confidence} Confidence
        </span>
      </div>

      {/* Chart */}
      <div className="min-h-[200px] flex-1">
        <BarChart
          className="h-full"
          data={chartData}
          index="percentile"
          categories={["Salary"]}
          colors={["violet"]}
          valueFormatter={(v) => formatCurrency(selectedBenchmark.currency, v)}
          showLegend={false}
          showGridLines={false}
          yAxisWidth={80}
        />
      </div>

      {/* Percentile legend */}
      <div className="grid grid-cols-5 gap-2 rounded-xl bg-brand-50/50 p-3">
        {distributionData.map((d, i) => (
          <div key={d.percentile} className="text-center">
            <p
              className={clsx(
                "text-xs font-semibold",
                i === 2 ? "text-brand-600" : "text-accent-500"
              )}
            >
              {d.percentile}
            </p>
            <p
              className={clsx(
                "text-xs font-bold",
                i === 2 ? "text-brand-900" : "text-brand-700"
              )}
            >
              {formatCurrency(selectedBenchmark.currency, d.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Interpretation */}
      <div className="rounded-lg bg-brand-50 p-3">
        <p className="text-xs text-brand-700">
          <strong className="text-brand-900">Interpretation:</strong> 50% of professionals earn between{" "}
          {formatCurrency(selectedBenchmark.currency, selectedBenchmark.percentiles.p25)} and{" "}
          {formatCurrency(selectedBenchmark.currency, selectedBenchmark.percentiles.p75)} (IQR).
        </p>
      </div>
    </div>
  );
}
