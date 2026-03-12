"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Bookmark,
  CheckCircle,
  ChevronDown,
  Download,
  Info,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BenchmarkSourceBadge } from "@/components/ui/benchmark-source-badge";
import type { OrgPeerSummary } from "@/lib/benchmarks/org-peer-summary";
import { useBenchmarkState, type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { getBenchmark } from "@/lib/benchmarks/data-service";
import { getRoleDescription } from "@/lib/benchmarks/role-descriptions";
import {
  getBenchmarkMarkerLabel,
  getBenchmarkConfidenceLabel,
  getOrgPeerHoverMessage,
  getBenchmarkResultsInsights,
  shouldEnableOrgPeerHover,
} from "@/lib/benchmarks/results-presentation";
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
  hasCompanyData?: boolean;
}

type LevelRow = {
  id: string;
  name: string;
  p10: number;
  p25: number;
  p40: number;
  p50: number;
  p60: number;
  p75: number;
  p90: number;
  sampleSize: number;
  confidence: string;
};

function PeerHoverTooltip({
  message,
  align = "center",
}: {
  message: string;
  align?: "center" | "right";
}) {
  const positionClass =
    align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <div
      role="tooltip"
      className={`absolute bottom-full z-20 mb-2 hidden w-max max-w-[220px] rounded-md bg-brand-900 px-2.5 py-2 text-center text-[11px] font-medium leading-relaxed text-white shadow-lg group-hover:block group-focus-within:block ${positionClass}`}
    >
      {message}
    </div>
  );
}

export function BenchmarkResults({ result, hasCompanyData = true }: BenchmarkResultsProps) {
  const { clearResult, goToStep, saveCurrentFilter } = useBenchmarkState();
  const companySettings = useCompanySettings();
  const currency = useCurrencyFormatter();
  const { salaryView, setSalaryView } = useSalaryView();

  const { benchmark, role, level, location, formData } = result;
  const [levelBenchmarks, setLevelBenchmarks] = useState<Record<string, SalaryBenchmark>>({
    [level.id]: benchmark,
  });
  const [showLevelOverrides, setShowLevelOverrides] = useState<Record<string, boolean>>({});
  const [orgPeerSummariesByLevel, setOrgPeerSummariesByLevel] = useState<Record<string, OrgPeerSummary>>({});
  const [orgPeerSummaryLoadingByLevel, setOrgPeerSummaryLoadingByLevel] = useState<Record<string, boolean>>({});
  const [orgPeerSummaryErrorsByLevel, setOrgPeerSummaryErrorsByLevel] = useState<Record<string, string | null>>({});
  const targetPercentile = formData.targetPercentile || companySettings.targetPercentile;
  const roleDescription = getRoleDescription(role.id);

  const sourceCurrency = benchmark.currency || "AED";
  const convertAndRound = useCallback((monthlyValue: number) => {
    const value = salaryView === "annual" ? monthlyToAnnual(monthlyValue) : monthlyValue;
    return roundToThousand(convertCurrency(value, sourceCurrency, currency.defaultCurrency));
  }, [currency.defaultCurrency, salaryView, sourceCurrency]);

  const formatValue = (value: number) => currency.format(value);
  const formatShort = (value: number) => {
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return String(value);
  };

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
      const p10 = convertAndRound(nextBenchmark.percentiles.p10);
      const p25 = convertAndRound(nextBenchmark.percentiles.p25);
      const p50 = convertAndRound(nextBenchmark.percentiles.p50);
      const p75 = convertAndRound(nextBenchmark.percentiles.p75);
      const p90 = convertAndRound(nextBenchmark.percentiles.p90);
      return [
        {
          id: nextLevel.id,
          name: nextLevel.name,
          p10,
          p25,
          p40: Math.round(p25 + (p50 - p25) * 0.6),
          p50,
          p60: Math.round(p50 + (p75 - p50) * 0.4),
          p75,
          p90,
          sampleSize: nextBenchmark.sampleSize,
          confidence: nextBenchmark.confidence,
        },
      ];
    });
  }, [convertAndRound, levelBenchmarks]);

  const toggleLevel = (id: string) =>
    setShowLevelOverrides((prev) => ({
      ...prev,
      [id]: !(id in prev ? prev[id] : defaultShownLevels[id]),
    }));

  const defaultShownLevels = useMemo(() => {
    const next: Record<string, boolean> = {};
    levelRows.forEach((row) => {
      next[row.id] = row.id === level.id;
    });

    const selectedLevelIndex = levelRows.findIndex((row) => row.id === level.id);
    if (selectedLevelIndex > 0) next[levelRows[selectedLevelIndex - 1].id] = true;
    if (selectedLevelIndex >= 0 && selectedLevelIndex < levelRows.length - 1) {
      next[levelRows[selectedLevelIndex + 1].id] = true;
    }

    return next;
  }, [level.id, levelRows]);

  const shownRows = useMemo(
    () =>
      levelRows.filter((row) => {
        const isShown =
          row.id in showLevelOverrides ? showLevelOverrides[row.id] : defaultShownLevels[row.id];
        return !!isShown;
      }),
    [defaultShownLevels, levelRows, showLevelOverrides],
  );
  const shownRowIdsKey = shownRows.map((row) => row.id).join("|");

  useEffect(() => {
    if (!hasCompanyData) {
      setOrgPeerSummariesByLevel({});
      setOrgPeerSummaryLoadingByLevel({});
      setOrgPeerSummaryErrorsByLevel({});
      return;
    }

    if (shownRows.length === 0) return;

    let isCancelled = false;
    const loadingState = Object.fromEntries(shownRows.map((row) => [row.id, true]));
    const clearedErrorState = Object.fromEntries(shownRows.map((row) => [row.id, null]));

    setOrgPeerSummaryLoadingByLevel((prev) => ({ ...prev, ...loadingState }));
    setOrgPeerSummaryErrorsByLevel((prev) => ({ ...prev, ...clearedErrorState }));

    const loadOrgPeerSummaries = async () => {
      const results = await Promise.all(
        shownRows.map(async (row) => {
          const params = new URLSearchParams({
            roleId: role.id,
            locationId: location.id,
            levelId: row.id,
          });
          if (formData.industry) params.set("industry", formData.industry);
          if (formData.companySize) params.set("companySize", formData.companySize);

          try {
            const response = await fetch(`/api/benchmarks/org-peer-summary?${params.toString()}`);
            if (!response.ok) {
              const payload = (await response.json().catch(() => null)) as { error?: string } | null;
              throw new Error(payload?.error || "Failed to load org peer summary");
            }

            const payload = (await response.json()) as OrgPeerSummary;
            return { levelId: row.id, summary: payload, error: null };
          } catch (error) {
            return {
              levelId: row.id,
              summary: null,
              error: error instanceof Error ? error.message : "Failed to load org peer summary",
            };
          }
        }),
      );

      if (isCancelled) return;

      const nextSummaries: Record<string, OrgPeerSummary> = {};
      const nextErrors: Record<string, string | null> = {};
      const nextLoading: Record<string, boolean> = {};
      for (const result of results) {
        if (result.summary) nextSummaries[result.levelId] = result.summary;
        nextErrors[result.levelId] = result.error;
        nextLoading[result.levelId] = false;
      }

      setOrgPeerSummariesByLevel((prev) => ({ ...prev, ...nextSummaries }));
      setOrgPeerSummaryErrorsByLevel((prev) => ({ ...prev, ...nextErrors }));
      setOrgPeerSummaryLoadingByLevel((prev) => ({ ...prev, ...nextLoading }));
    };

    void loadOrgPeerSummaries();

    return () => {
      isCancelled = true;
    };
  }, [formData.companySize, formData.industry, hasCompanyData, location.id, role.id, shownRowIdsKey]);

  const percentiles = {
    p10: convertAndRound(benchmark.percentiles.p10),
    p25: convertAndRound(benchmark.percentiles.p25),
    p50: convertAndRound(benchmark.percentiles.p50),
    p75: convertAndRound(benchmark.percentiles.p75),
    p90: convertAndRound(benchmark.percentiles.p90),
  };
  const targetValue = percentiles[`p${targetPercentile}` as keyof typeof percentiles] || percentiles.p50;
  const insights = getBenchmarkResultsInsights({
    targetPercentile,
    confidence: benchmark.confidence,
    sampleSize: benchmark.sampleSize,
  });

  const confColor = (confidence: string) => {
    if (confidence === "High") return "text-emerald-600";
    if (confidence === "Medium") return "text-amber-600";
    return "text-brand-500";
  };
  return (
    <div className="space-y-6 bench-results">
      <div className="bench-section flex flex-wrap items-center gap-3">
        <div className="flex h-10 min-w-[140px] items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-brand-900">
          <Search className="h-3.5 w-3.5 text-brand-400" />
          {role.title}
        </div>
        <div className="flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm text-brand-700">
          {location.city}, {location.country}
          <ChevronDown className="h-3.5 w-3.5 text-brand-400" />
        </div>
        <div className="flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm text-brand-700">
          {level.name}
          <ChevronDown className="h-3.5 w-3.5 text-brand-400" />
        </div>
        <div className="flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm text-brand-700">
          {formData.employmentType === "expat" ? "Expat" : "National"}
          <ChevronDown className="h-3.5 w-3.5 text-brand-400" />
        </div>
        <div className="ml-auto bench-toggle">
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
        <Button size="sm" onClick={clearResult}>
          <Search className="mr-1.5 h-3.5 w-3.5" />
          Search
        </Button>
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

      <div className="flex items-center justify-between">
        <button
          onClick={clearResult}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="bench-section">
        <h3 className="bench-section-header">Summary</h3>
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div
              key={`${insight.type}-${index}`}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm ${
                insight.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : insight.type === "warning"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-700"
              }`}
            >
              {insight.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : insight.type === "warning" ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <Info className="h-4 w-4 shrink-0" />
              )}
              <span className="font-medium">{insight.message}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-brand-500">
          <BenchmarkSourceBadge source={benchmark.benchmarkSource} />
          <span className="text-brand-300">·</span>
          <span>{benchmark.sampleSize} data points</span>
          <span className="text-brand-300">·</span>
          <span>{benchmark.confidence} confidence</span>
        </div>
      </div>

      {benchmark.nationalsCostBreakdown && (
        <div className="bench-section">
          <h3 className="bench-section-header">Nationals Total Employer Cost</h3>
          <p className="mb-4 text-xs text-brand-500">
            For national employees, total employer cost includes mandatory contributions beyond base salary.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-brand-50 p-4 text-center">
              <div className="mb-1 text-xs text-brand-500">Base Salary (P50)</div>
              <div className="text-lg font-bold text-brand-900">{formatValue(percentiles.p50)}</div>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 text-center">
              <div className="mb-1 text-xs text-amber-600">
                GPSSA ({benchmark.nationalsCostBreakdown.gpssaPct}%)
              </div>
              <div className="text-lg font-bold text-amber-700">
                {formatValue(convertAndRound(benchmark.nationalsCostBreakdown.gpssaAmount / 12))}
              </div>
            </div>
            {benchmark.nationalsCostBreakdown.nafisPct > 0 && (
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <div className="mb-1 text-xs text-emerald-600">
                  Nafis ({benchmark.nationalsCostBreakdown.nafisPct}%)
                </div>
                <div className="text-lg font-bold text-emerald-700">
                  {formatValue(convertAndRound(benchmark.nationalsCostBreakdown.nafisAmount / 12))}
                </div>
              </div>
            )}
            <div className="rounded-xl bg-brand-100 p-4 text-center">
              <div className="mb-1 text-xs text-brand-600">Total Employer Cost</div>
              <div className="text-lg font-bold text-brand-900">
                {formatValue(convertAndRound(benchmark.nationalsCostBreakdown.totalEmployerCost / 12))}
              </div>
              <div className="mt-0.5 text-[10px] text-brand-500">
                {benchmark.nationalsCostBreakdown.totalCostMultiplier.toFixed(2)}x base
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bench-section overflow-x-auto p-0">
        <table className="bench-table">
          <thead>
            <tr>
              <th>Level</th>
              <th className="text-center">P40</th>
              <th className="text-center font-bold text-brand-500">P50</th>
              <th className="text-center">P60</th>
              <th className="w-16 text-center">Show</th>
            </tr>
          </thead>
          <tbody>
            {levelRows.map((row) => {
              const isSelected = row.id === level.id;
              return (
                <tr key={row.id} className={isSelected ? "bench-row-highlight" : ""}>
                  <td className="font-medium">{row.name}</td>
                  <td className={`text-center ${isSelected ? "font-bold" : ""}`}>
                    {formatShort(row.p40)}
                  </td>
                  <td
                    className={`text-center ${
                      isSelected ? "font-bold text-brand-500 underline underline-offset-2" : ""
                    }`}
                  >
                    {formatShort(row.p50)}
                  </td>
                  <td className={`text-center ${isSelected ? "font-bold" : ""}`}>
                    {formatShort(row.p60)}
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={
                        row.id in showLevelOverrides
                          ? !!showLevelOverrides[row.id]
                          : !!defaultShownLevels[row.id]
                      }
                      onChange={() => toggleLevel(row.id)}
                      className="h-4 w-4 rounded border-brand-300 text-brand-500 accent-brand-500 focus:ring-brand-400"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {shownRows.length > 0 && (
        <div className="bench-section overflow-x-auto">
          <div className="mb-6 flex min-w-[640px] items-center gap-6">
            <div className="w-40 shrink-0 text-sm font-semibold text-brand-900">Level</div>
            <div className="w-40 shrink-0 text-sm font-semibold text-brand-900">Data Quality</div>
            <div className="flex-1" />
            <div className="w-32 shrink-0 text-right text-sm font-semibold text-brand-900">
              {hasCompanyData ? `Your Target (P${targetPercentile})` : `Target (P${targetPercentile})`}
            </div>
          </div>

          <div className="min-w-[640px] space-y-6">
            {shownRows.map((row) => {
              const isSelectedRow =
                hasCompanyData && shouldEnableOrgPeerHover(row.id, level.id);
              const targetForRow =
                row.id === level.id
                  ? targetValue
                  : (percentiles as Record<string, number>)[`p${targetPercentile}`] || row.p50;
              const rowPeerSummary = orgPeerSummariesByLevel[row.id] || null;
              const rowHoverMessage = orgPeerSummaryErrorsByLevel[row.id]
                ? "Unable to read your org data right now"
                : getOrgPeerHoverMessage({
                    isLoading: !!orgPeerSummaryLoadingByLevel[row.id],
                    summary: rowPeerSummary,
                  });
              const markerLabel = getBenchmarkMarkerLabel(targetForRow, row);

              const globalMin = row.p10 * 0.85;
              const globalMax = row.p90 * 1.15;
              const pct = (value: number) =>
                Math.max(0, Math.min(100, ((value - globalMin) / (globalMax - globalMin)) * 100));

              return (
                <div key={row.id} className="flex items-center gap-6">
                  <div className="w-40 shrink-0 text-sm font-medium text-brand-900">{row.name}</div>
                  <div className={`w-40 shrink-0 text-xs font-medium ${confColor(row.confidence)}`}>
                    {getBenchmarkConfidenceLabel(row.confidence as "High" | "Medium" | "Low")}
                  </div>

                  <div className="relative h-10 flex-1">
                    <div
                      className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-brand-300"
                      style={{
                        left: `${pct(row.p10)}%`,
                        width: `${pct(row.p90) - pct(row.p10)}%`,
                      }}
                    />
                    <div className="bench-boxplot-whisker" style={{ left: `${pct(row.p10)}%` }} />
                    <div className="bench-boxplot-whisker" style={{ left: `${pct(row.p90)}%` }} />
                    <div
                      className="bench-boxplot-box"
                      style={{
                        left: `${pct(row.p25)}%`,
                        width: `${pct(row.p75) - pct(row.p25)}%`,
                      }}
                    />
                    <div className="bench-boxplot-median" style={{ left: `${pct(row.p50)}%` }} />
                    {[0.15, 0.35, 0.55, 0.72, 0.88].map((fraction, index) => (
                      <div
                        key={index}
                        className="bench-boxplot-dot"
                        style={{ left: `${pct(row.p10 + (row.p90 - row.p10) * fraction)}%` }}
                      />
                    ))}
                    {isSelectedRow ? (
                      <button
                        type="button"
                        aria-label="Show peer count in this band"
                        className="bench-boxplot-target group cursor-default border-0"
                        style={{ left: `${pct(targetForRow)}%` }}
                      >
                        <PeerHoverTooltip message={rowHoverMessage} />
                        <span>{markerLabel}</span>
                      </button>
                    ) : (
                      <div
                        className="bench-boxplot-target"
                        style={{ left: `${pct(targetForRow)}%` }}
                      >
                        {targetPercentile}
                      </div>
                    )}
                  </div>

                  <div className="w-32 shrink-0 text-right text-sm font-bold text-brand-900">
                    {isSelectedRow ? (
                      <div className="group relative inline-flex justify-end">
                        <PeerHoverTooltip message={rowHoverMessage} align="right" />
                        <button
                          type="button"
                          aria-label="Show peer count in this band"
                          className="cursor-default text-right"
                        >
                          {formatValue(targetForRow)}
                        </button>
                      </div>
                    ) : (
                      formatValue(targetForRow)
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex justify-between pl-[calc(10rem+10rem+1.5rem)] text-[10px] text-brand-400">
            {(() => {
              const allValues = shownRows.flatMap((row) => [row.p10, row.p90]);
              const minValue = Math.min(...allValues) * 0.85;
              const maxValue = Math.max(...allValues) * 1.15;
              const step = (maxValue - minValue) / 5;

              return Array.from({ length: 6 }, (_, index) => (
                <span key={index}>{formatShort(Math.round((minValue + step * index) / 1000) * 1000)}</span>
              ));
            })()}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button variant="ghost" onClick={() => saveCurrentFilter()}>
          <Bookmark className="mr-2 h-4 w-4" />
          Save Benchmark
        </Button>
        <Button variant="ghost">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <div className="flex-1" />
        <button onClick={() => goToStep("detail")} className="bench-cta max-w-xs">
          View Detailed Breakdown <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
