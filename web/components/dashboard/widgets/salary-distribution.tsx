"use client";

import { BarChart, Card } from "@tremor/react";
import clsx from "clsx";
import { useState } from "react";
import {
  FEATURED_BENCHMARKS,
  formatCurrency,
  formatPercentage,
  getLevel,
  getLocation,
  getRole,
  LEVELS,
  LOCATIONS,
  ROLES,
} from "@/lib/dashboard/dummy-data";

export function SalaryDistributionWidget() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0].id);
  const [selectedLevel, setSelectedLevel] = useState("ic3");

  // Find or generate benchmark
  const benchmark =
    FEATURED_BENCHMARKS.find(
      b => b.roleId === selectedRole && b.locationId === selectedLocation && b.levelId === selectedLevel
    ) || FEATURED_BENCHMARKS[0];

  const role = getRole(benchmark.roleId);
  const location = getLocation(benchmark.locationId);
  const level = getLevel(benchmark.levelId);

  // Data for bar visualization
  const distributionData = [
    { percentile: "P10", value: benchmark.percentiles.p10, fill: "bg-brand-200" },
    { percentile: "P25", value: benchmark.percentiles.p25, fill: "bg-brand-300" },
    { percentile: "P50", value: benchmark.percentiles.p50, fill: "bg-brand-500" },
    { percentile: "P75", value: benchmark.percentiles.p75, fill: "bg-brand-400" },
    { percentile: "P90", value: benchmark.percentiles.p90, fill: "bg-brand-300" },
  ];

  const chartData = distributionData.map(d => ({
    percentile: d.percentile,
    Salary: d.value,
  }));

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          className="rounded-lg border border-border/50 bg-white px-3 py-1.5 text-sm font-medium text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {ROLES.slice(0, 8).map(r => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        <select
          value={selectedLocation}
          onChange={e => setSelectedLocation(e.target.value)}
          className="rounded-lg border border-border/50 bg-white px-3 py-1.5 text-sm font-medium text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {LOCATIONS.map(l => (
            <option key={l.id} value={l.id}>
              {l.city}
            </option>
          ))}
        </select>
        <select
          value={selectedLevel}
          onChange={e => setSelectedLevel(e.target.value)}
          className="rounded-lg border border-border/50 bg-white px-3 py-1.5 text-sm font-medium text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {LEVELS.slice(0, 6).map(l => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Median highlight */}
      <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-brand-600">Median Salary</p>
          <p className="text-2xl font-bold text-brand-900">
            {formatCurrency(benchmark.currency, benchmark.percentiles.p50)}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                benchmark.momChange > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              )}
            >
              {formatPercentage(benchmark.momChange)} MoM
            </span>
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                benchmark.yoyChange > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              )}
            >
              {formatPercentage(benchmark.yoyChange)} YoY
            </span>
          </div>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="flex-1 min-h-[180px]">
        <BarChart
          className="h-full"
          data={chartData}
          index="percentile"
          categories={["Salary"]}
          colors={["violet"]}
          valueFormatter={v => formatCurrency(benchmark.currency, v)}
          showLegend={false}
          showGridLines={false}
          yAxisWidth={80}
        />
      </div>

      {/* Range summary */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-brand-50/50 p-3">
        <div className="text-center">
          <p className="text-xs font-medium text-brand-600">P25</p>
          <p className="text-sm font-bold text-brand-900">
            {formatCurrency(benchmark.currency, benchmark.percentiles.p25)}
          </p>
        </div>
        <div className="border-x border-brand-200 text-center">
          <p className="text-xs font-medium text-brand-600">Median</p>
          <p className="text-sm font-bold text-brand-900">
            {formatCurrency(benchmark.currency, benchmark.percentiles.p50)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-brand-600">P75</p>
          <p className="text-sm font-bold text-brand-900">
            {formatCurrency(benchmark.currency, benchmark.percentiles.p75)}
          </p>
        </div>
      </div>

      {/* Confidence badge */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-brand-600">
          Sample size: <strong>{benchmark.sampleSize}</strong> data points
        </span>
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            benchmark.confidence === "High"
              ? "bg-emerald-100 text-emerald-700"
              : benchmark.confidence === "Medium"
              ? "bg-amber-100 text-amber-700"
              : "bg-rose-100 text-rose-700"
          )}
        >
          {benchmark.confidence} Confidence
        </span>
      </div>
    </div>
  );
}

