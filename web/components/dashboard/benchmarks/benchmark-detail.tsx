"use client";

import { ArrowLeft, ArrowRight, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBenchmarkState, type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import {
  BENCHMARK_DETAIL_TABS,
  getBenchmarkDetailTab,
  getBenchmarkDetailTabViews,
  getPrimaryBenchmarkDetailTab,
} from "@/lib/benchmarks/detail-tabs";
import { useCompanySettings } from "@/lib/company";
import {
  LevelTableView,
  IndustryView,
  CompanySizeView,
  TrendView,
  GeoView,
  CompMixView,
  SalaryBreakdownView,
  AIInsightsView,
  OfferBuilderView,
} from "./drilldown/views";

interface BenchmarkDetailProps {
  result: BenchmarkResult;
}

type DetailViewId = ReturnType<typeof getBenchmarkDetailTabViews>[number];

const VIEW_COMPONENTS: Record<
  DetailViewId,
  React.ComponentType<{ result: BenchmarkResult }>
> = {
  "level-table": LevelTableView,
  industry: IndustryView,
  "company-size": CompanySizeView,
  "trend-chart": TrendView,
  "geo-comparison": GeoView,
  "comp-mix": CompMixView,
  "salary-breakdown": SalaryBreakdownView,
  "ai-insights": AIInsightsView,
  "offer-builder": OfferBuilderView,
};

export function BenchmarkDetail({ result }: BenchmarkDetailProps) {
  const { goToStep, detailTab, openDetailTab, setDetailTab } = useBenchmarkState();
  const companySettings = useCompanySettings();

  const { role, level, location } = result;
  const activeTab = getBenchmarkDetailTab(detailTab);
  const activeViews = getBenchmarkDetailTabViews(activeTab.id);
  const targetPercentile = result.formData.targetPercentile || companySettings.targetPercentile;
  const segmentation = result.benchmark.benchmarkSegmentation;
  const matchedCohortLabel =
    [segmentation?.matchedIndustry, segmentation?.matchedCompanySize].filter(Boolean).join(" • ") ||
    "General market";
  const targetValue =
    result.benchmark.percentiles[
      `p${targetPercentile}` as keyof typeof result.benchmark.percentiles
    ] || result.benchmark.percentiles.p50;

  return (
    <div className="space-y-6">
      <div className="bench-section space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-brand-900">{role.title}</span>
              <span className="text-brand-400">·</span>
              <span className="text-brand-700">{level.name}</span>
              <span className="text-brand-400">·</span>
              <span className="text-brand-700">
                {location.city}, {location.country}
              </span>
              <span className="text-brand-400">·</span>
              <span className="text-brand-700">
                {result.formData.employmentType === "expat" ? "Expat" : "National"}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-brand-900">
              {activeTab.label}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-600">
              {activeTab.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                Cohort used: {matchedCohortLabel}
              </span>
              {segmentation?.isFallback && (
                <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                  Fallback to broader market
                </span>
              )}
            </div>
          </div>

          {activeTab.id !== "offer" && (
            <button
              type="button"
              onClick={() => openDetailTab(getPrimaryBenchmarkDetailTab())}
              className="bench-cta"
            >
              Create Offer <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_280px]">
          <div className="rounded-2xl border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
              <Target className="h-4 w-4 text-brand-500" />
              Recommended benchmark point
            </div>
            <p className="mt-2 text-2xl font-bold text-brand-900">
              {new Intl.NumberFormat("en-AE", {
                style: "currency",
                currency: result.benchmark.currency || "AED",
                maximumFractionDigits: 0,
              }).format(targetValue)}
            </p>
            <p className="mt-2 text-sm text-brand-600">
              Based on P{targetPercentile} for this market match.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
              <Sparkles className="h-4 w-4 text-brand-500" />
              Use the tabs intentionally
            </div>
            <p className="mt-2 text-sm leading-relaxed text-brand-600">
              `Summary` keeps the quick recommendation visible. `Offer` is the main next step.
              `Internal Pay` and `Market Analysis` stay secondary until you need them.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {BENCHMARK_DETAIL_TABS.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDetailTab(tab.id)}
                className={`rounded-xl px-4 py-3 text-left transition-colors ${
                  isActive
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-brand-700 hover:bg-brand-50"
                }`}
              >
                <div className="text-sm font-semibold">{tab.label}</div>
                <div className={`mt-1 text-xs ${isActive ? "text-white/80" : "text-brand-500"}`}>
                  {tab.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {activeViews.map((viewId) => {
          const ViewComponent = VIEW_COMPONENTS[viewId];
          return <ViewComponent key={viewId} result={result} />;
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Button variant="ghost" onClick={() => goToStep("results")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to results
        </Button>
        {activeTab.id !== "market-analysis" ? (
          <Button variant="outline" className="rounded-full" onClick={() => setDetailTab("market-analysis")}>
            Market Analysis
          </Button>
        ) : (
          <Button variant="outline" className="rounded-full" onClick={() => setDetailTab("internal-pay")}>
            Internal Pay
          </Button>
        )}
      </div>
    </div>
  );
}
