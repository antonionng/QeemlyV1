"use client";

import clsx from "clsx";
import { Sparkles, Target } from "lucide-react";
import { useBenchmarksContext } from "@/lib/benchmarks/context";
import { formatCurrency, formatCurrencyK } from "@/lib/dashboard/dummy-data";

const PERCENTILE_LABELS: Record<number, string> = {
  25: "Entry-level",
  50: "Market median",
  75: "Competitive",
  90: "Premium",
};

const PERCENTILE_DESCRIPTIONS: Record<number, string> = {
  25: "Suitable for entry-level or budget-constrained hiring",
  50: "Matches market expectations for typical candidates",
  75: "Attracts experienced candidates and reduces time-to-fill",
  90: "Secures top talent in competitive markets",
};

export function OfferBuilderWidget() {
  const {
    selectedBenchmark,
    selectedRole,
    offerTarget,
    offerValue,
    offerRange,
    setOfferTarget,
    salaryView,
  } = useBenchmarksContext();
  const multiplier = salaryView === "annual" ? 12 : 1;

  if (!selectedBenchmark || !selectedRole) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Target className="mx-auto h-8 w-8 text-accent-300" />
          <p className="mt-2 text-sm font-medium text-brand-700">No role selected</p>
          <p className="text-xs text-accent-500">Select a role to build an offer</p>
        </div>
      </div>
    );
  }

  // Map slider value to nearest percentile
  const displayPercentile = offerTarget >= 90 ? 90 : offerTarget >= 75 ? 75 : offerTarget >= 50 ? 50 : 25;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">Offer Builder</h3>
          <p className="text-xs text-accent-500">{selectedRole.title}</p>
        </div>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">
          P{displayPercentile}
        </span>
      </div>

      {/* Slider */}
      <div className="rounded-xl bg-brand-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-accent-600">Target Percentile</span>
          <span className="text-xs font-semibold text-brand-700">
            {PERCENTILE_LABELS[displayPercentile]}
          </span>
        </div>
        <input
          type="range"
          min={25}
          max={90}
          step={1}
          value={offerTarget}
          onChange={(e) => setOfferTarget(Number(e.target.value))}
          className="mt-3 w-full accent-brand-500"
        />
        <div className="mt-1 flex justify-between text-[10px] text-accent-400">
          <span>P25</span>
          <span>P50</span>
          <span>P75</span>
          <span>P90</span>
        </div>
      </div>

      {/* Offer value */}
      <div className="rounded-xl bg-white p-4 ring-1 ring-brand-200">
        <p className="text-xs font-medium text-accent-600">Recommended Offer</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-brand-900">
            {formatCurrency(selectedBenchmark.currency, offerValue * multiplier)}
          </span>
          <span className="text-sm text-accent-500">/{salaryView === "annual" ? "year" : "month"}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-accent-500">Negotiation range:</span>
          <span className="text-xs font-semibold text-brand-700">
            {formatCurrencyK(selectedBenchmark.currency, offerRange.low * multiplier)} – {formatCurrencyK(selectedBenchmark.currency, offerRange.high * multiplier)}
          </span>
        </div>
      </div>

      {/* Guidance */}
      <div
        className={clsx(
          "flex items-start gap-3 rounded-xl p-3",
          displayPercentile >= 75 ? "bg-emerald-50" : displayPercentile >= 50 ? "bg-amber-50" : "bg-rose-50"
        )}
      >
        <Sparkles
          className={clsx(
            "mt-0.5 h-4 w-4 shrink-0",
            displayPercentile >= 75 ? "text-emerald-600" : displayPercentile >= 50 ? "text-amber-600" : "text-rose-600"
          )}
        />
        <div>
          <p
            className={clsx(
              "text-xs font-semibold",
              displayPercentile >= 75 ? "text-emerald-800" : displayPercentile >= 50 ? "text-amber-800" : "text-rose-800"
            )}
          >
            {PERCENTILE_LABELS[displayPercentile]}
          </p>
          <p
            className={clsx(
              "mt-0.5 text-xs",
              displayPercentile >= 75 ? "text-emerald-700" : displayPercentile >= 50 ? "text-amber-700" : "text-rose-700"
            )}
          >
            {PERCENTILE_DESCRIPTIONS[displayPercentile]}
          </p>
        </div>
      </div>

      {/* Percentile reference */}
      <div className="mt-auto grid grid-cols-4 gap-1 text-center">
        {[25, 50, 75, 90].map((p) => (
          <button
            key={p}
            onClick={() => setOfferTarget(p)}
            className={clsx(
              "rounded-lg py-2 text-xs font-semibold transition-colors",
              displayPercentile === p
                ? "bg-brand-500 text-white"
                : "bg-brand-50 text-brand-700 hover:bg-brand-100"
            )}
          >
            P{p}
          </button>
        ))}
      </div>
    </div>
  );
}
