"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBenchmarksContext } from "@/lib/benchmarks/context";
import {
  ROLES,
  generateBenchmark,
  formatCurrencyK,
  formatPercentage,
} from "@/lib/dashboard/dummy-data";

export function RoleSearchWidget() {
  const {
    searchQuery,
    setSearchQuery,
    selectedRoleId,
    selectedLocationId,
    selectedLevelId,
    selectRole,
  } = useBenchmarksContext();

  // Generate role previews with benchmark data
  const rolePreviews = useMemo(() => {
    return ROLES.map((role) => {
      const benchmark = generateBenchmark(role.id, selectedLocationId, selectedLevelId);
      return { role, benchmark };
    });
  }, [selectedLocationId, selectedLevelId]);

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return rolePreviews;
    const q = searchQuery.toLowerCase();
    return rolePreviews.filter(
      ({ role }) =>
        role.title.toLowerCase().includes(q) || role.family.toLowerCase().includes(q)
    );
  }, [rolePreviews, searchQuery]);

  // Show first 9 roles if no search, otherwise show filtered
  const displayRoles = searchQuery.trim() ? filteredRoles : rolePreviews.slice(0, 9);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Search input */}
      <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-white px-4 py-2.5 shadow-sm">
        <Search className="h-4 w-4 text-accent-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search roles..."
          className="flex-1 bg-transparent text-sm text-brand-900 placeholder:text-accent-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="rounded-full p-1 text-accent-400 hover:bg-brand-50 hover:text-brand-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-accent-500">
          {filteredRoles.length} roles available
        </span>
        {searchQuery && (
          <span className="text-xs text-brand-600">
            Showing matches for "{searchQuery}"
          </span>
        )}
      </div>

      {/* Role grid */}
      <div className="grid flex-1 gap-3 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
        {displayRoles.map(({ role, benchmark }) => {
          const isSelected = role.id === selectedRoleId;
          return (
            <button
              key={role.id}
              onClick={() => selectRole(role.id)}
              className={clsx(
                "rounded-xl border p-4 text-left transition-all hover:shadow-md",
                isSelected
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                  : "border-brand-100 bg-white hover:border-brand-300"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-lg bg-brand-100 px-2 py-1.5 text-xs font-bold text-brand-700">
                  {role.icon}
                </span>
                <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-600">
                  {role.family}
                </span>
              </div>
              <h3 className="mt-2 truncate text-sm font-semibold text-brand-900">
                {role.title}
              </h3>
              <p className="mt-0.5 text-xs text-accent-500">
                {benchmark.sampleSize} data points
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-brand-50 pt-2">
                <div>
                  <p className="text-[10px] text-accent-500">Median</p>
                  <p className="text-sm font-bold text-brand-900">
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
            </button>
          );
        })}
      </div>

      {/* No results */}
      {displayRoles.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Search className="mx-auto h-8 w-8 text-accent-300" />
            <p className="mt-2 text-sm font-medium text-brand-800">No roles found</p>
            <p className="text-xs text-accent-500">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
}
