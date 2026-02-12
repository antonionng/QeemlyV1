"use client";

import { BarChart, Card } from "@tremor/react";
import { Users } from "lucide-react";
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
import { MOCK_EMPLOYEES } from "@/lib/employees";
import { useSalaryView } from "@/lib/salary-view-store";

export function SalaryDistributionWidget() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0].id);
  const [selectedLevel, setSelectedLevel] = useState("ic3");
  const [showEmployees, setShowEmployees] = useState(false);
  const { salaryView } = useSalaryView();
  const multiplier = salaryView === "annual" ? 12 : 1;

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
    { percentile: "P10", value: benchmark.percentiles.p10 * multiplier, fill: "bg-brand-200" },
    { percentile: "P25", value: benchmark.percentiles.p25 * multiplier, fill: "bg-brand-300" },
    { percentile: "P50", value: benchmark.percentiles.p50 * multiplier, fill: "bg-brand-500" },
    { percentile: "P75", value: benchmark.percentiles.p75 * multiplier, fill: "bg-brand-400" },
    { percentile: "P90", value: benchmark.percentiles.p90 * multiplier, fill: "bg-brand-300" },
  ];

  const chartData = distributionData.map(d => ({
    percentile: d.percentile,
    Salary: d.value,
  }));

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
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
        <button
          type="button"
          onClick={() => setShowEmployees(!showEmployees)}
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            showEmployees
              ? "bg-brand-500 text-white"
              : "bg-brand-50 text-brand-600 hover:bg-brand-100"
          )}
        >
          <Users className="h-3 w-3" />
          My Employees
        </button>
      </div>

      {/* Median highlight */}
      <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-brand-600">Median Salary</p>
          <p className="text-2xl font-bold text-brand-900">
            {formatCurrency(benchmark.currency, benchmark.percentiles.p50 * multiplier)}
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
            {formatCurrency(benchmark.currency, benchmark.percentiles.p25 * multiplier)}
          </p>
        </div>
        <div className="border-x border-brand-200 text-center">
          <p className="text-xs font-medium text-brand-600">Median</p>
          <p className="text-sm font-bold text-brand-900">
            {formatCurrency(benchmark.currency, benchmark.percentiles.p50 * multiplier)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-brand-600">P75</p>
          <p className="text-sm font-bold text-brand-900">
            {formatCurrency(benchmark.currency, benchmark.percentiles.p75 * multiplier)}
          </p>
        </div>
      </div>

      {/* Employee overlay */}
      {showEmployees && (() => {
        const matchingEmployees = MOCK_EMPLOYEES.filter(
          (e) => e.status === "active" && e.role.id === selectedRole
        );
        const p10 = benchmark.percentiles.p10;
        const p90 = benchmark.percentiles.p90;
        const range = p90 - p10;

        if (matchingEmployees.length === 0) {
          return (
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs text-blue-700">
                No employees with this role found in your data.
              </p>
            </div>
          );
        }

        return (
          <div className="rounded-xl bg-blue-50 p-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Your Employees ({matchingEmployees.length})
            </p>
            <div className="relative h-6 bg-blue-100 rounded-full overflow-visible">
              <div className="absolute inset-0 flex items-center justify-between px-1 text-[8px] text-blue-400">
                <span>P10</span>
                <span>P50</span>
                <span>P90</span>
              </div>
              {matchingEmployees.map((emp) => {
                const pos = range > 0 ? Math.max(0, Math.min(100, ((emp.baseSalary - p10) / range) * 100)) : 50;
                return (
                  <div
                    key={emp.id}
                    className="absolute top-1/2 -translate-y-1/2 group"
                    style={{ left: `${pos}%` }}
                  >
                    <div className="h-4 w-4 -ml-2 rounded-full bg-blue-500 border-2 border-white shadow-sm cursor-pointer" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-max max-w-[160px] px-2 py-1 bg-brand-900 text-white text-[10px] rounded-md shadow-lg z-20">
                      {emp.firstName} {emp.lastName[0]}.
                      <br />
                      {formatCurrency(benchmark.currency, emp.baseSalary * multiplier)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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

