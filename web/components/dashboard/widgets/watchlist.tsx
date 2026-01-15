"use client";

import { SparkAreaChart } from "@tremor/react";
import clsx from "clsx";
import { Bell, BellOff, Eye, TrendingDown, TrendingUp } from "lucide-react";
import {
  formatCurrency,
  formatPercentage,
  formatTimeAgo,
  generateBenchmark,
  getLevel,
  getLocation,
  getRole,
  SAMPLE_WATCHLIST,
} from "@/lib/dashboard/dummy-data";

export function WatchlistWidget() {
  const watchlistWithData = SAMPLE_WATCHLIST.map(item => {
    const role = getRole(item.roleId);
    const location = getLocation(item.locationId);
    const level = getLevel(item.levelId);
    const benchmark = generateBenchmark(item.roleId, item.locationId, item.levelId);

    // Sparkline data from trend
    const sparkData = benchmark.trend.slice(-6).map(t => ({ value: t.p50 }));

    return {
      ...item,
      role,
      location,
      level,
      benchmark,
      sparkData,
    };
  });

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-600">
          <strong>{watchlistWithData.length}</strong> saved searches
        </p>
        <button
          type="button"
          className="rounded-lg bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-200"
        >
          + New alert
        </button>
      </div>

      {/* Watchlist items */}
      <div className="flex-1 space-y-2 overflow-auto">
        {watchlistWithData.map(item => {
          const isUp = item.benchmark.momChange > 0;
          const hasAlert = item.alertThreshold !== undefined;

          return (
            <div
              key={item.id}
              className="group flex items-center gap-3 rounded-xl border border-border/40 bg-white p-3 transition-all hover:border-brand-300 hover:shadow-sm"
            >
              {/* Role icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-xs font-bold text-white">
                {item.role?.icon}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-sm font-semibold text-brand-900">
                    {item.role?.title}
                  </h4>
                  {hasAlert && (
                    <Bell className="h-3 w-3 text-amber-500" />
                  )}
                </div>
                <p className="truncate text-xs text-brand-600">
                  {item.location?.city} · {item.level?.name}
                </p>
              </div>

              {/* Sparkline */}
              <div className="w-16 shrink-0">
                <SparkAreaChart
                  data={item.sparkData}
                  categories={["value"]}
                  index="value"
                  colors={[isUp ? "emerald" : "rose"]}
                  className="h-8"
                />
              </div>

              {/* Current value */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-brand-900">
                  {formatCurrency(item.benchmark.currency, item.benchmark.percentiles.p50)}
                </p>
                <div className="flex items-center justify-end gap-1">
                  {isUp ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-rose-500" />
                  )}
                  <span
                    className={clsx(
                      "text-xs font-semibold",
                      isUp ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {formatPercentage(item.benchmark.momChange)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border/30 pt-2 text-center">
        <button
          type="button"
          className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-800"
        >
          View all saved searches →
        </button>
      </div>
    </div>
  );
}

