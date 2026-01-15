"use client";

import { ProgressBar } from "@tremor/react";
import clsx from "clsx";
import { Activity, BarChart3, Building2, Globe2, TrendingUp, Zap } from "lucide-react";
import { MARKET_PULSE } from "@/lib/dashboard/dummy-data";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: typeof Activity;
  trend?: number;
  color?: "brand" | "emerald" | "amber" | "rose";
};

function MetricCard({ label, value, icon: Icon, trend, color = "brand" }: MetricCardProps) {
  const colorClasses = {
    brand: "bg-brand-100 text-brand-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-brand-50/50 p-3 transition-colors hover:bg-brand-50">
      <div className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", colorClasses[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-brand-600">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-lg font-bold text-brand-900">{value}</p>
          {trend !== undefined && (
            <span
              className={clsx(
                "text-xs font-semibold",
                trend > 0 ? "text-emerald-600" : trend < 0 ? "text-rose-600" : "text-brand-500"
              )}
            >
              {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function MarketPulseWidget() {
  return (
    <div className="flex h-full flex-col gap-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-medium text-emerald-600">Live data stream</span>
      </div>

      {/* Key metrics grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          label="Data Points"
          value={MARKET_PULSE.totalDataPoints.toLocaleString()}
          icon={BarChart3}
          color="brand"
        />
        <MetricCard
          label="Weekly Submissions"
          value={MARKET_PULSE.weeklySubmissions.toLocaleString()}
          icon={Zap}
          trend={12.5}
          color="emerald"
        />
        <MetricCard
          label="Active Companies"
          value={MARKET_PULSE.activeCompanies}
          icon={Building2}
          color="amber"
        />
        <MetricCard
          label="Markets Tracked"
          value={MARKET_PULSE.marketsTracked}
          icon={Globe2}
          color="brand"
        />
      </div>

      {/* Confidence gauges */}
      <div className="space-y-3 rounded-xl bg-brand-50/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-brand-800">Data Confidence</span>
          <span className="text-sm font-bold text-brand-900">
            {Math.round(MARKET_PULSE.averageConfidence * 100)}%
          </span>
        </div>
        <ProgressBar
          value={MARKET_PULSE.averageConfidence * 100}
          color="violet"
          className="h-2"
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium text-brand-800">Data Freshness</span>
          <span className="text-sm font-bold text-brand-900">
            {Math.round(MARKET_PULSE.dataFreshness * 100)}%
          </span>
        </div>
        <ProgressBar
          value={MARKET_PULSE.dataFreshness * 100}
          color="emerald"
          className="h-2"
        />
      </div>

      {/* Market trend indicator */}
      <div className="mt-auto flex items-center justify-between rounded-xl bg-brand-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <span className="text-sm font-medium">Market Trend</span>
        </div>
        <span className="text-lg font-bold">+{MARKET_PULSE.marketTrend}%</span>
      </div>
    </div>
  );
}

