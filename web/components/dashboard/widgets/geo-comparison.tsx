"use client";

import { BarChart } from "@tremor/react";
import clsx from "clsx";
import { useState } from "react";
import {
  formatCurrency,
  formatPercentage,
  GEO_COMPARISON,
  ROLES,
  generateBenchmark,
  LOCATIONS,
} from "@/lib/dashboard/dummy-data";

export function GeoComparisonWidget() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].id);

  // Generate comparison data for selected role
  const comparisonData = LOCATIONS.map(loc => {
    const benchmark = generateBenchmark(selectedRole, loc.id, "ic3");
    return {
      location: loc,
      medianSalary: benchmark.percentiles.p50,
      yoyChange: benchmark.yoyChange,
      sampleSize: benchmark.sampleSize,
      confidence: benchmark.confidence,
      currency: benchmark.currency,
    };
  }).sort((a, b) => b.medianSalary - a.medianSalary);

  const chartData = comparisonData.map(d => ({
    city: d.location.city,
    "Median Salary": d.medianSalary,
  }));

  const topMarket = comparisonData[0];
  const bottomMarket = comparisonData[comparisonData.length - 1];
  const avgSalary = Math.round(
    comparisonData.reduce((sum, d) => sum + d.medianSalary, 0) / comparisonData.length
  );

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Role selector */}
      <div className="flex items-center justify-between gap-3">
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
        <span className="text-xs font-medium text-brand-500">Senior Level (IC3)</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-emerald-50 p-3 text-center">
          <p className="text-xs font-medium text-emerald-600">Highest</p>
          <p className="text-lg font-bold text-emerald-700">
            {topMarket.location.city}
          </p>
          <p className="text-sm font-semibold text-emerald-600">
            {formatCurrency(topMarket.currency, topMarket.medianSalary)}
          </p>
        </div>
        <div className="rounded-xl bg-brand-50 p-3 text-center">
          <p className="text-xs font-medium text-brand-600">GCC Average</p>
          <p className="text-lg font-bold text-brand-700">8 Markets</p>
          <p className="text-sm font-semibold text-brand-600">
            ~{formatCurrency("AED", avgSalary)}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-center">
          <p className="text-xs font-medium text-amber-600">Lowest</p>
          <p className="text-lg font-bold text-amber-700">
            {bottomMarket.location.city}
          </p>
          <p className="text-sm font-semibold text-amber-600">
            {formatCurrency(bottomMarket.currency, bottomMarket.medianSalary)}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex-1 min-h-[180px]">
        <BarChart
          className="h-full"
          data={chartData}
          index="city"
          categories={["Median Salary"]}
          colors={["violet"]}
          valueFormatter={v => `${v.toLocaleString()}`}
          showLegend={false}
          showGridLines={false}
          layout="vertical"
          yAxisWidth={100}
        />
      </div>

      {/* YoY changes */}
      <div className="flex flex-wrap gap-2">
        {comparisonData.slice(0, 4).map(d => (
          <div
            key={d.location.id}
            className="flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1"
          >
            <span className="text-xs font-medium text-brand-700">{d.location.city}</span>
            <span
              className={clsx(
                "text-xs font-semibold",
                d.yoyChange > 0 ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {formatPercentage(d.yoyChange)} YoY
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

