"use client";

import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, Layers, MapPin, TrendingUp } from "lucide-react";
import { useBenchmarksContext } from "@/lib/benchmarks/context";
import {
  formatCurrency,
  formatCurrencyK,
  formatPercentage,
  LOCATIONS,
  LEVELS,
} from "@/lib/dashboard/dummy-data";

export function SalaryOverviewWidget() {
  const {
    selectedBenchmark,
    selectedRole,
    selectedLocation,
    selectedLevel,
    selectedLocationId,
    selectedLevelId,
    setSelectedLocationId,
    setSelectedLevelId,
  } = useBenchmarksContext();

  if (!selectedBenchmark || !selectedRole) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-brand-700">No role selected</p>
          <p className="text-xs text-accent-500">Select a role from the search widget</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Role header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-brand-900">{selectedRole.title}</h3>
          <p className="text-xs text-accent-500">{selectedRole.family}</p>
        </div>
        <span
          className={clsx(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            selectedBenchmark.confidence === "High"
              ? "bg-emerald-100 text-emerald-700"
              : selectedBenchmark.confidence === "Medium"
              ? "bg-amber-100 text-amber-700"
              : "bg-rose-100 text-rose-700"
          )}
        >
          {selectedBenchmark.confidence}
        </span>
      </div>

      {/* Filter dropdowns */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="h-9 w-full appearance-none rounded-lg border border-brand-200 bg-white pl-8 pr-3 text-xs font-medium text-brand-800"
          >
            {LOCATIONS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.city}
              </option>
            ))}
          </select>
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-accent-400" />
        </div>
        <div className="relative flex-1">
          <select
            value={selectedLevelId}
            onChange={(e) => setSelectedLevelId(e.target.value)}
            className="h-9 w-full appearance-none rounded-lg border border-brand-200 bg-white pl-8 pr-3 text-xs font-medium text-brand-800"
          >
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <Layers className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-accent-400" />
        </div>
      </div>

      {/* Main salary display */}
      <div className="rounded-xl bg-brand-50 p-4">
        <p className="text-xs font-medium text-accent-600">Monthly Cash Compensation</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand-900">
            {formatCurrency(selectedBenchmark.currency, selectedBenchmark.percentiles.p50)}
          </span>
          <span className="text-sm font-medium text-accent-600">P50</span>
        </div>
        <p className="mt-1 text-xs text-accent-500">
          Range {formatCurrencyK(selectedBenchmark.currency, selectedBenchmark.percentiles.p25)} – {formatCurrencyK(selectedBenchmark.currency, selectedBenchmark.percentiles.p75)}
        </p>
      </div>

      {/* Change indicators */}
      <div className="flex gap-2">
        <div
          className={clsx(
            "flex flex-1 items-center gap-2 rounded-lg px-3 py-2",
            selectedBenchmark.momChange >= 0 ? "bg-emerald-50" : "bg-rose-50"
          )}
        >
          {selectedBenchmark.momChange >= 0 ? (
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-rose-600" />
          )}
          <div>
            <p className="text-[10px] text-accent-600">MoM</p>
            <p
              className={clsx(
                "text-sm font-bold",
                selectedBenchmark.momChange >= 0 ? "text-emerald-700" : "text-rose-700"
              )}
            >
              {formatPercentage(selectedBenchmark.momChange)}
            </p>
          </div>
        </div>
        <div
          className={clsx(
            "flex flex-1 items-center gap-2 rounded-lg px-3 py-2",
            selectedBenchmark.yoyChange >= 0 ? "bg-emerald-50" : "bg-rose-50"
          )}
        >
          {selectedBenchmark.yoyChange >= 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-rose-600" />
          )}
          <div>
            <p className="text-[10px] text-accent-600">YoY</p>
            <p
              className={clsx(
                "text-sm font-bold",
                selectedBenchmark.yoyChange >= 0 ? "text-emerald-700" : "text-rose-700"
              )}
            >
              {formatPercentage(selectedBenchmark.yoyChange)}
            </p>
          </div>
        </div>
      </div>

      {/* Sample size */}
      <div className="mt-auto flex items-center justify-between text-xs">
        <span className="text-accent-500">
          Based on <strong className="text-brand-700">{selectedBenchmark.sampleSize}</strong> data points
        </span>
        <span className="text-accent-400">
          Updated {new Date(selectedBenchmark.lastUpdated).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
