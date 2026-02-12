"use client";

import { useState } from "react";
import { BarChart } from "@tremor/react";
import { Users } from "lucide-react";
import clsx from "clsx";
import { useBenchmarksContext } from "@/lib/benchmarks/context";
import { formatCurrency } from "@/lib/dashboard/dummy-data";
import { MOCK_EMPLOYEES } from "@/lib/employees";

export function PercentileDistributionWidget() {
  const { selectedBenchmark, selectedRole, salaryView } = useBenchmarksContext();
  const [showEmployees, setShowEmployees] = useState(false);
  const multiplier = salaryView === "annual" ? 12 : 1;

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
    { percentile: "P10", value: selectedBenchmark.percentiles.p10 * multiplier },
    { percentile: "P25", value: selectedBenchmark.percentiles.p25 * multiplier },
    { percentile: "P50", value: selectedBenchmark.percentiles.p50 * multiplier },
    { percentile: "P75", value: selectedBenchmark.percentiles.p75 * multiplier },
    { percentile: "P90", value: selectedBenchmark.percentiles.p90 * multiplier },
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmployees(!showEmployees)}
            className={clsx(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              showEmployees
                ? "bg-brand-500 text-white"
                : "bg-brand-50 text-brand-600 hover:bg-brand-100"
            )}
          >
            <Users className="h-3 w-3" />
            My Employees
          </button>
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

      {/* Employee overlay */}
      {showEmployees && (() => {
        // Find employees with matching role
        const matchingEmployees = MOCK_EMPLOYEES.filter(
          (e) => e.status === "active" && e.role.title === selectedRole.title
        );
        const p10 = selectedBenchmark.percentiles.p10;
        const p90 = selectedBenchmark.percentiles.p90;
        const range = p90 - p10;

        if (matchingEmployees.length === 0) {
          return (
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs text-blue-700">
                No employees with the role &quot;{selectedRole.title}&quot; found in your data.
              </p>
            </div>
          );
        }

        return (
          <div className="rounded-xl bg-blue-50 p-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Your Employees ({matchingEmployees.length})
            </p>
            {/* Position scale */}
            <div className="relative h-6 bg-blue-100 rounded-full overflow-visible">
              {/* Scale markers */}
              <div className="absolute inset-0 flex items-center justify-between px-1 text-[8px] text-blue-400">
                <span>P10</span>
                <span>P50</span>
                <span>P90</span>
              </div>
              {/* Employee dots */}
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
                      {formatCurrency(selectedBenchmark.currency, emp.baseSalary * multiplier)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Interpretation */}
      <div className="rounded-lg bg-brand-50 p-3">
        <p className="text-xs text-brand-700">
          <strong className="text-brand-900">Interpretation:</strong> 50% of professionals earn between{" "}
          {formatCurrency(selectedBenchmark.currency, selectedBenchmark.percentiles.p25 * multiplier)} and{" "}
          {formatCurrency(selectedBenchmark.currency, selectedBenchmark.percentiles.p75 * multiplier)} (IQR).
        </p>
      </div>
    </div>
  );
}
