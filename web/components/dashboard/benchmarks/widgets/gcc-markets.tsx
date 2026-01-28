"use client";

import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, Globe2 } from "lucide-react";
import { useBenchmarksContext } from "@/lib/benchmarks/context";
import {
  LOCATIONS,
  generateBenchmark,
  formatCurrencyK,
  formatPercentage,
} from "@/lib/dashboard/dummy-data";

export function GCCMarketsWidget() {
  const {
    selectedRoleId,
    selectedRole,
    selectedLocationId,
    selectedLevelId,
    setSelectedLocationId,
  } = useBenchmarksContext();

  if (!selectedRoleId || !selectedRole) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Globe2 className="mx-auto h-8 w-8 text-accent-300" />
          <p className="mt-2 text-sm font-medium text-brand-700">No role selected</p>
          <p className="text-xs text-accent-500">Select a role to compare markets</p>
        </div>
      </div>
    );
  }

  // Generate benchmarks for all locations
  const marketComparisons = LOCATIONS.map((location) => {
    const benchmark = generateBenchmark(selectedRoleId, location.id, selectedLevelId);
    return { location, benchmark };
  });

  // Sort by median salary descending
  const sortedMarkets = [...marketComparisons].sort(
    (a, b) => b.benchmark.percentiles.p50 - a.benchmark.percentiles.p50
  );

  // Get the highest salary for comparison
  const highestMedian = sortedMarkets[0]?.benchmark.percentiles.p50 || 1;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">{selectedRole.title}</h3>
          <p className="text-xs text-accent-500">Across GCC markets</p>
        </div>
        <span className="text-xs text-accent-400">Click to switch location</span>
      </div>

      {/* Market grid */}
      <div className="grid flex-1 gap-3 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
        {sortedMarkets.map(({ location, benchmark }, index) => {
          const isSelected = location.id === selectedLocationId;
          const relativeWidth = (benchmark.percentiles.p50 / highestMedian) * 100;

          return (
            <button
              key={location.id}
              onClick={() => setSelectedLocationId(location.id)}
              className={clsx(
                "relative overflow-hidden rounded-xl p-4 text-left ring-1 transition-all hover:ring-2",
                isSelected
                  ? "bg-brand-100 ring-brand-400 hover:ring-brand-500"
                  : "bg-white ring-brand-100 hover:ring-brand-300"
              )}
            >
              {/* Rank badge */}
              {index < 3 && (
                <span
                  className={clsx(
                    "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    index === 0
                      ? "bg-amber-100 text-amber-700"
                      : index === 1
                      ? "bg-slate-100 text-slate-600"
                      : "bg-orange-100 text-orange-700"
                  )}
                >
                  {index + 1}
                </span>
              )}

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-lg">
                  {location.flag}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-brand-900">{location.city}</p>
                  <p className="text-xs text-accent-500">{location.country}</p>
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xs text-accent-500">Median</p>
                  <p className="text-lg font-bold text-brand-900">
                    {formatCurrencyK(benchmark.currency, benchmark.percentiles.p50)}
                  </p>
                </div>
                <span
                  className={clsx(
                    "flex items-center gap-0.5 text-xs font-semibold",
                    benchmark.yoyChange >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {benchmark.yoyChange >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {formatPercentage(Math.abs(benchmark.yoyChange))}
                </span>
              </div>

              {/* Relative bar */}
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-brand-100">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all",
                    isSelected ? "bg-brand-500" : "bg-brand-300"
                  )}
                  style={{ width: `${relativeWidth}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-brand-50 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-accent-600">
            Highest:{" "}
            <strong className="text-brand-900">
              {sortedMarkets[0]?.location.city} ({formatCurrencyK(
                sortedMarkets[0]?.benchmark.currency || "AED",
                sortedMarkets[0]?.benchmark.percentiles.p50 || 0
              )})
            </strong>
          </span>
          <span className="text-accent-600">
            Lowest:{" "}
            <strong className="text-brand-900">
              {sortedMarkets[sortedMarkets.length - 1]?.location.city} ({formatCurrencyK(
                sortedMarkets[sortedMarkets.length - 1]?.benchmark.currency || "AED",
                sortedMarkets[sortedMarkets.length - 1]?.benchmark.percentiles.p50 || 0
              )})
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
