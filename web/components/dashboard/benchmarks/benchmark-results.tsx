"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Download,
  Info,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BenchmarkSourceBadge } from "@/components/ui/benchmark-source-badge";
import { getPrimaryBenchmarkDetailTab } from "@/lib/benchmarks/detail-tabs";
import { useBenchmarkState, type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { getBenchmark } from "@/lib/benchmarks/data-service";
import { getRoleDescription } from "@/lib/benchmarks/role-descriptions";
import { useCompanySettings } from "@/lib/company";
import { LEVELS, type SalaryBenchmark } from "@/lib/dashboard/dummy-data";
import { useSalaryView } from "@/lib/salary-view-store";
import {
  convertCurrency,
  monthlyToAnnual,
  roundToThousand,
  useCurrencyFormatter,
} from "@/lib/utils/currency";

interface BenchmarkResultsProps {
  result: BenchmarkResult;
}

type LevelRow = {
  id: string;
  name: string;
  p25: number;
  p50: number;
  p75: number;
  sampleSize: number;
  confidence: string;
};

export function BenchmarkResults({ result }: BenchmarkResultsProps) {
  const { clearResult, saveCurrentFilter, openDetailTab } = useBenchmarkState();
  const companySettings = useCompanySettings();
  const currency = useCurrencyFormatter();
  const { salaryView, setSalaryView } = useSalaryView();

  const { benchmark, role, level, location, formData, isOverridden } = result;
  const [levelBenchmarks, setLevelBenchmarks] = useState<Record<string, SalaryBenchmark>>({
    [level.id]: benchmark,
  });
  const targetPercentile = formData.targetPercentile || companySettings.targetPercentile;
  const roleDescription = getRoleDescription(role.id);
  const segmentation = benchmark.benchmarkSegmentation;
  const requestedCohortLabel =
    [segmentation?.requestedIndustry, segmentation?.requestedCompanySize].filter(Boolean).join(" • ") ||
    "General market";
  const matchedCohortLabel =
    [segmentation?.matchedIndustry, segmentation?.matchedCompanySize].filter(Boolean).join(" • ") ||
    "General market";

  const sourceCurrency = benchmark.currency || "AED";
  const convertAndRound = (monthlyValue: number) => {
    const value = salaryView === "annual" ? monthlyToAnnual(monthlyValue) : monthlyValue;
    return roundToThousand(convertCurrency(value, sourceCurrency, currency.defaultCurrency));
  };

  const formatValue = (value: number) => currency.format(value);

  useEffect(() => {
    const loadLevelBenchmarks = async () => {
      const entries = await Promise.all(
        LEVELS.slice(0, 6).map(async (nextLevel) => {
          const nextBenchmark = await getBenchmark(role.id, location.id, nextLevel.id, {
            industry: formData.industry,
            companySize: formData.companySize,
          });
          return nextBenchmark
            ? { levelId: nextLevel.id, benchmark: nextBenchmark }
            : null;
        }),
      );

      const next: Record<string, SalaryBenchmark> = { [level.id]: benchmark };
      for (const entry of entries) {
        if (!entry) continue;
        next[entry.levelId] = entry.benchmark;
      }
      setLevelBenchmarks(next);
    };

    void loadLevelBenchmarks();
  }, [benchmark, formData.companySize, formData.industry, level.id, location.id, role.id]);

  const levelRows: LevelRow[] = useMemo(() => {
    return LEVELS.slice(0, 6).flatMap((nextLevel) => {
      const nextBenchmark = levelBenchmarks[nextLevel.id];
      if (!nextBenchmark) return [];
      return [
        {
          id: nextLevel.id,
          name: nextLevel.name,
          p25: convertAndRound(nextBenchmark.percentiles.p25),
          p50: convertAndRound(nextBenchmark.percentiles.p50),
          p75: convertAndRound(nextBenchmark.percentiles.p75),
          sampleSize: nextBenchmark.sampleSize,
          confidence: nextBenchmark.confidence,
        },
      ];
    });
  }, [convertAndRound, levelBenchmarks]);

  const selectedLevelIndex = levelRows.findIndex((row) => row.id === level.id);
  const visibleLevelRows = levelRows.filter((_, index) => {
    if (selectedLevelIndex === -1) return index < 3;
    return Math.abs(index - selectedLevelIndex) <= 1;
  });

  const percentiles = {
    p25: convertAndRound(benchmark.percentiles.p25),
    p50: convertAndRound(benchmark.percentiles.p50),
    p75: convertAndRound(benchmark.percentiles.p75),
    p90: convertAndRound(benchmark.percentiles.p90),
  };
  const targetValue = percentiles[`p${targetPercentile}` as keyof typeof percentiles] || percentiles.p50;
  const negotiationLow = Math.round(targetValue * 0.96);
  const negotiationHigh = Math.round(targetValue * 1.04);
  const confidenceTone =
    benchmark.confidence === "High"
      ? "High confidence"
      : benchmark.confidence === "Medium"
        ? "Moderate confidence"
        : "Use caution";

  const insights = [
    targetPercentile >= 75
      ? "Positioned above market to improve close rate on strong candidates."
      : targetPercentile <= 25
        ? "Positioned below market. Expect more negotiation pressure."
        : "Positioned inside the core market band for balanced competitiveness.",
    benchmark.confidence === "Low"
      ? `Benchmark coverage is limited with ${benchmark.sampleSize} observations.`
      : `Dataset confidence is ${benchmark.confidence.toLowerCase()} with ${benchmark.sampleSize} observations.`,
    benchmark.nationalsCostBreakdown
      ? "Employer cost overlays are available for national packages."
      : "Package view is cash compensation only for this role and market.",
  ];

  return (
    <div className="space-y-6 bench-results">
      <div className="bench-section space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-brand-500">
              <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                {role.title}
              </span>
              <span className="rounded-full bg-white px-3 py-1">
                {level.name}
              </span>
              <span className="rounded-full bg-white px-3 py-1">
                {location.city}, {location.country}
              </span>
              <span className="rounded-full bg-white px-3 py-1">
                {formData.employmentType === "expat" ? "Expat" : "National"}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                Quick price for this role
              </p>
              <h2 className="mt-2 text-2xl font-bold text-brand-900">
                {formatValue(targetValue)}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-600">
                Recommended target for {role.title} in {location.city} at P{targetPercentile}.
                Use this as the default pricing point, then move into offer creation if you
                want a negotiation-ready package.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
                  Requested cohort: {requestedCohortLabel}
                </span>
                <span
                  className={`rounded-full px-3 py-1 font-medium ${
                    segmentation?.isFallback
                      ? "bg-amber-50 text-amber-700"
                      : segmentation?.isSegmented
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-surface-1 text-brand-700"
                  }`}
                >
                  {segmentation?.isFallback
                    ? `Fallback applied: ${matchedCohortLabel}`
                    : segmentation?.isSegmented
                      ? `Matched cohort: ${matchedCohortLabel}`
                      : "Matched cohort: General market"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-brand-500">
              <BenchmarkSourceBadge source={benchmark.benchmarkSource} />
              <span>{benchmark.sampleSize} data points</span>
              <span>{confidenceTone}</span>
              {benchmark.lastUpdated && (
                <span>
                  Refreshed {new Date(benchmark.lastUpdated).toLocaleDateString("en-GB")}
                </span>
              )}
            </div>
          </div>

          <div className="bench-toggle">
            <button
              type="button"
              data-active={salaryView === "annual"}
              onClick={() => setSalaryView("annual")}
            >
              Annual
            </button>
            <button
              type="button"
              data-active={salaryView === "monthly"}
              onClick={() => setSalaryView("monthly")}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                  Recommended offer point
                </p>
                <p className="mt-3 text-3xl font-bold">{formatValue(targetValue)}</p>
                <p className="mt-2 text-sm text-white/80">
                  Working range: {formatValue(negotiationLow)} to {formatValue(negotiationHigh)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
                <p className="text-white/70">Market median</p>
                <p className="mt-1 text-xl font-semibold">{formatValue(percentiles.p50)}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs text-white/70">Target percentile</p>
                <p className="mt-1 text-lg font-semibold">P{targetPercentile}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs text-white/70">Market range</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatValue(percentiles.p25)} to {formatValue(percentiles.p75)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs text-white/70">Data quality</p>
                <p className="mt-1 text-lg font-semibold">{confidenceTone}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
              <Sparkles className="h-4 w-4 text-brand-500" />
              Next best action
            </div>
            <p className="mt-2 text-sm leading-relaxed text-brand-600">
              The search is done. Move straight into a package, or open deeper market views only if
              you need more validation.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => openDetailTab(getPrimaryBenchmarkDetailTab())}
                className="bench-cta w-full justify-center"
              >
                Create Offer <ArrowRight className="h-4 w-4" />
              </button>
              <Button
                variant="outline"
                className="w-full justify-center rounded-full"
                onClick={() => openDetailTab("market-analysis")}
              >
                Open Market Analysis
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-center rounded-full"
                onClick={() => saveCurrentFilter()}
              >
                <Bookmark className="mr-2 h-4 w-4" />
                Save Benchmark
              </Button>
            </div>
          </div>
        </div>
      </div>

      {roleDescription && (
        <div className="bench-section">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-sm font-bold text-brand-600">
              {role.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-brand-900">{roleDescription.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-brand-600">
                {roleDescription.summary}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {roleDescription.responsibilities.slice(0, 3).map((responsibility) => (
                  <span
                    key={responsibility}
                    className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                  >
                    {responsibility}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="bench-section">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-500" />
            <h3 className="bench-section-header pb-0">Nearby internal pay context</h3>
          </div>
          <p className="mt-2 text-sm text-brand-600">
            Use this quick comparison to sanity-check the recommendation. Full level and market views
            sit behind the tabs in the next step.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {visibleLevelRows.map((row) => {
              const isSelected = row.id === level.id;
              return (
                <div
                  key={row.id}
                  className={`rounded-2xl border p-4 ${
                    isSelected
                      ? "border-brand-200 bg-brand-50 shadow-sm"
                      : "border-border bg-surface-1"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-brand-900">{row.name}</p>
                    {isSelected && (
                      <span className="rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-brand-500">P25</span>
                      <span className="font-medium text-brand-900">{formatValue(row.p25)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-brand-500">P50</span>
                      <span className="font-semibold text-brand-900">{formatValue(row.p50)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-brand-500">P75</span>
                      <span className="font-medium text-brand-900">{formatValue(row.p75)}</span>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-brand-500">
                    {row.sampleSize} observations • {row.confidence.toLowerCase()} confidence
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bench-section">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-brand-500" />
            <h3 className="bench-section-header pb-0">What this means</h3>
          </div>
          <div className="mt-4 space-y-3">
            {insights.map((insight) => (
              <div key={insight} className="rounded-2xl bg-surface-1 px-4 py-3 text-sm text-brand-700">
                {insight}
              </div>
            ))}
          </div>

          {benchmark.nationalsCostBreakdown && (
            <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4 text-sm text-brand-700">
              National employer cost multiplier:{" "}
              <span className="font-semibold text-brand-900">
                {benchmark.nationalsCostBreakdown.totalCostMultiplier.toFixed(2)}x
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          onClick={clearResult}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Edit search
        </button>
        <Button variant="ghost">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <div className="flex-1" />
        {isOverridden && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Custom percentile override applied
          </span>
        )}
        <Button variant="outline" className="rounded-full" onClick={clearResult}>
          <Search className="mr-2 h-4 w-4" />
          New Search
        </Button>
      </div>
    </div>
  );
}
