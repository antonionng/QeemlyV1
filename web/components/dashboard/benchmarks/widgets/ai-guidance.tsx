"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { Brain, Lightbulb, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useBenchmarksContext } from "@/lib/benchmarks/context";
import { formatCurrencyK } from "@/lib/dashboard/dummy-data";

type Insight = {
  type: "recommendation" | "warning" | "opportunity" | "trend";
  title: string;
  description: string;
  icon: typeof Sparkles;
  color: "brand" | "emerald" | "amber" | "rose";
};

export function AIGuidanceWidget() {
  const {
    selectedBenchmark,
    selectedRole,
    selectedLocation,
    offerTarget,
    salaryView,
  } = useBenchmarksContext();
  const multiplier = salaryView === "annual" ? 12 : 1;

  // Generate dynamic insights based on benchmark data
  const insights = useMemo<Insight[]>(() => {
    if (!selectedBenchmark || !selectedRole || !selectedLocation) {
      return [];
    }

    const result: Insight[] = [];

    // Offer positioning insight
    if (offerTarget >= 75) {
      result.push({
        type: "recommendation",
        title: "Competitive Positioning",
        description: `At P${offerTarget}, you're offering above-market compensation. This should attract strong candidates quickly.`,
        icon: Sparkles,
        color: "emerald",
      });
    } else if (offerTarget <= 50) {
      result.push({
        type: "warning",
        title: "Below Market Risk",
        description: `P${offerTarget} may limit your candidate pool. Consider P75+ for faster hiring.`,
        icon: Lightbulb,
        color: "amber",
      });
    }

    // Market trend insight
    if (selectedBenchmark.yoyChange > 5) {
      result.push({
        type: "trend",
        title: "Rising Market",
        description: `Salaries for ${selectedRole.title} increased ${selectedBenchmark.yoyChange.toFixed(1)}% YoY. Act fast to lock in rates.`,
        icon: TrendingUp,
        color: "brand",
      });
    } else if (selectedBenchmark.yoyChange < -2) {
      result.push({
        type: "opportunity",
        title: "Buyer's Market",
        description: `Salaries declined ${Math.abs(selectedBenchmark.yoyChange).toFixed(1)}% YoY. Good time for hiring.`,
        icon: Zap,
        color: "emerald",
      });
    }

    // Confidence insight
    if (selectedBenchmark.confidence === "Low") {
      result.push({
        type: "warning",
        title: "Limited Data",
        description: `Only ${selectedBenchmark.sampleSize} data points for this role in ${selectedLocation.city}. Consider broader market research.`,
        icon: Brain,
        color: "rose",
      });
    } else if (selectedBenchmark.confidence === "High") {
      result.push({
        type: "recommendation",
        title: "High Confidence Data",
        description: `Strong sample size of ${selectedBenchmark.sampleSize} data points. These benchmarks are reliable.`,
        icon: Brain,
        color: "emerald",
      });
    }

    // Range insight
    const range = selectedBenchmark.percentiles.p75 - selectedBenchmark.percentiles.p25;
    const rangePercent = (range / selectedBenchmark.percentiles.p50) * 100;
    if (rangePercent > 40) {
      result.push({
        type: "opportunity",
        title: "Wide Salary Band",
        description: `${rangePercent.toFixed(0)}% spread between P25-P75. Experience and skills heavily impact compensation.`,
        icon: Lightbulb,
        color: "brand",
      });
    }

    return result.slice(0, 3); // Max 3 insights
  }, [selectedBenchmark, selectedRole, selectedLocation, offerTarget]);

  if (!selectedBenchmark || !selectedRole) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Sparkles className="mx-auto h-8 w-8 text-accent-300" />
          <p className="mt-2 text-sm font-medium text-brand-700">No role selected</p>
          <p className="text-xs text-accent-500">Select a role for AI insights</p>
        </div>
      </div>
    );
  }

  const colorClasses = {
    brand: {
      bg: "bg-brand-50",
      icon: "text-brand-600",
      title: "text-brand-800",
      text: "text-brand-700",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      title: "text-emerald-800",
      text: "text-emerald-700",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      title: "text-amber-800",
      text: "text-amber-700",
    },
    rose: {
      bg: "bg-rose-50",
      icon: "text-rose-600",
      title: "text-rose-800",
      text: "text-rose-700",
    },
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-brand-900">AI Guidance</p>
          <p className="text-[10px] text-accent-500">Powered by Qeemly AI</p>
        </div>
      </div>

      {/* Insights */}
      <div className="flex flex-1 flex-col gap-2 overflow-auto">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const colors = colorClasses[insight.color];

          return (
            <div
              key={index}
              className={clsx("rounded-xl p-3", colors.bg)}
            >
              <div className="flex items-start gap-2">
                <Icon className={clsx("mt-0.5 h-4 w-4 shrink-0", colors.icon)} />
                <div>
                  <p className={clsx("text-xs font-semibold", colors.title)}>
                    {insight.title}
                  </p>
                  <p className={clsx("mt-0.5 text-xs leading-relaxed", colors.text)}>
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {insights.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl bg-brand-50 p-4">
            <p className="text-center text-xs text-brand-600">
              Analyzing market data for {selectedRole.title}...
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 p-3 text-white">
        <p className="text-xs font-medium opacity-90">Quick Summary</p>
        <p className="mt-1 text-xs">
          Target <strong>{formatCurrencyK(selectedBenchmark.currency, selectedBenchmark.percentiles.p75 * multiplier)}</strong> (P75) for competitive offers in {selectedLocation?.city || "this market"}.
        </p>
      </div>
    </div>
  );
}
