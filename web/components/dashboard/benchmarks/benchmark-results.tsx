"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Download,
  Bookmark,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Search,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BenchmarkSourceBadge } from "@/components/ui/benchmark-source-badge";
import {
  useBenchmarkState,
  EXTENDED_LOCATIONS,
  type BenchmarkResult,
} from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings } from "@/lib/company";
import {
  useCurrencyFormatter,
  convertCurrency,
  monthlyToAnnual,
  roundToThousand,
} from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";
import {
  LEVELS,
} from "@/lib/dashboard/dummy-data";
import { getRoleDescription } from "@/lib/benchmarks/role-descriptions";

interface BenchmarkResultsProps {
  result: BenchmarkResult;
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

export function BenchmarkResults({ result }: BenchmarkResultsProps) {
  const { goToStep, clearResult, saveCurrentFilter } = useBenchmarkState();
  const companySettings = useCompanySettings();
  const currency = useCurrencyFormatter();
  const { salaryView, setSalaryView } = useSalaryView();

  const { benchmark, role, level, location, formData, isOverridden } = result;
  const targetPercentile =
    formData.targetPercentile || companySettings.targetPercentile;

  const sourceCurrency = benchmark.currency || "AED";
  const convertAndRound = (monthlyValue: number) => {
    const value =
      salaryView === "annual" ? monthlyToAnnual(monthlyValue) : monthlyValue;
    return roundToThousand(convertCurrency(value, sourceCurrency, currency.defaultCurrency));
  };

  const formatValue = (value: number) => currency.format(value);
  const formatShort = (v: number) => {
    if (v >= 1000) return `${Math.round(v / 1000)}k`;
    return String(v);
  };

  /* ── Build level rows ── */
  const levelRows: LevelRow[] = useMemo(() => {
    const subset = LEVELS.slice(0, 6);
    return subset.map((lvl) => {
      const p10 = convertAndRound(benchmark.percentiles.p10);
      const p25 = convertAndRound(benchmark.percentiles.p25);
      const p50 = convertAndRound(benchmark.percentiles.p50);
      const p75 = convertAndRound(benchmark.percentiles.p75);
      const p90 = convertAndRound(benchmark.percentiles.p90);
      const p40 = Math.round(p25 + (p50 - p25) * 0.6);
      const p60 = Math.round(p50 + (p75 - p50) * 0.4);
      return {
        id: lvl.id,
        name: lvl.name,
        p10,
        p25,
        p40,
        p50,
        p60,
        p75,
        p90,
        sampleSize: benchmark.sampleSize,
        confidence: benchmark.confidence,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benchmark, salaryView]);

  const [showLevels, setShowLevels] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    levelRows.forEach((r) => {
      defaults[r.id] = r.id === level.id;
    });
    const adj = LEVELS.findIndex((l) => l.id === level.id);
    if (adj > 0) defaults[LEVELS[adj - 1].id] = true;
    if (adj < LEVELS.length - 1 && adj >= 0) defaults[LEVELS[adj + 1].id] = true;
    return defaults;
  });

  const toggleLevel = (id: string) =>
    setShowLevels((prev) => ({ ...prev, [id]: !prev[id] }));

  const shownRows = levelRows.filter((r) => showLevels[r.id]);

  /* ── Insights ── */
  const percentiles = {
    p10: convertAndRound(benchmark.percentiles.p10),
    p25: convertAndRound(benchmark.percentiles.p25),
    p50: convertAndRound(benchmark.percentiles.p50),
    p75: convertAndRound(benchmark.percentiles.p75),
    p90: convertAndRound(benchmark.percentiles.p90),
  };
  const targetValue =
    percentiles[`p${targetPercentile}` as keyof typeof percentiles];

  const getInsights = () => {
    const insights: { type: "success" | "warning" | "info"; message: string }[] = [];
    if (targetPercentile === 75)
      insights.push({
        type: "success",
        message: "Targeting above market to attract top talent",
      });
    else if (targetPercentile === 50)
      insights.push({
        type: "info",
        message: "Targeting market median for competitive positioning",
      });
    if (benchmark.confidence === "High")
      insights.push({
        type: "success",
        message: `High confidence data (${benchmark.sampleSize} data points)`,
      });
    else if (benchmark.confidence === "Low")
      insights.push({
        type: "warning",
        message: "Limited data available - use with caution",
      });
    return insights;
  };
  const insights = getInsights();

  /* ── confidence label mapping ── */
  const confLabel = (c: string) => {
    if (c === "High") return "Very High Confidence";
    if (c === "Medium") return "Medium Confidence";
    return "AI Estimated";
  };
  const confColor = (c: string) => {
    if (c === "High") return "text-emerald-600";
    if (c === "Medium") return "text-amber-600";
    return "text-brand-500";
  };

  return (
    <div className="space-y-6 bench-results">
      {/* ── Inline filter bar ── */}
      <div className="bench-section flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 h-10 text-sm text-brand-900 font-medium min-w-[140px]">
          <Search className="h-3.5 w-3.5 text-brand-400" />
          {role.title}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 h-10 text-sm text-brand-700">
          {location.city}, {location.country}
          <ChevronDown className="h-3.5 w-3.5 text-brand-400" />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 h-10 text-sm text-brand-700">
          {level.name}
          <ChevronDown className="h-3.5 w-3.5 text-brand-400" />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 h-10 text-sm text-brand-700">
          {formData.employmentType === "expat" ? "Expat" : "National"}
          <ChevronDown className="h-3.5 w-3.5 text-brand-400" />
        </div>

        <div className="bench-toggle ml-auto">
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

      {/* Role Summary */}
      {(() => {
        const roleDesc = getRoleDescription(role.id);
        if (!roleDesc) return null;
        return (
          <div className="bench-section">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 font-bold text-sm shrink-0">
                {role.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-brand-900">{roleDesc.title}</h3>
                <p className="text-sm text-brand-600 mt-1 leading-relaxed">{roleDesc.summary}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {roleDesc.responsibilities.slice(0, 3).map((r, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Back button ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={clearResult}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* ── Summary ── */}
      <div className="bench-section">
        <h3 className="bench-section-header">Summary</h3>
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm ${
                insight.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : insight.type === "warning"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-700"
              }`}
            >
              {insight.type === "success" ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : insight.type === "warning" ? (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Info className="h-4 w-4 flex-shrink-0" />
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

      {/* Nationals Total Cost Breakdown */}
      {benchmark.nationalsCostBreakdown && (
        <div className="bench-section">
          <h3 className="bench-section-header">Nationals Total Employer Cost</h3>
          <p className="text-xs text-brand-500 mb-4">
            For national employees, total employer cost includes mandatory contributions beyond base salary.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-brand-50 p-4 text-center">
              <div className="text-xs text-brand-500 mb-1">Base Salary (P50)</div>
              <div className="text-lg font-bold text-brand-900">{formatValue(percentiles.p50)}</div>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 text-center">
              <div className="text-xs text-amber-600 mb-1">GPSSA ({benchmark.nationalsCostBreakdown.gpssaPct}%)</div>
              <div className="text-lg font-bold text-amber-700">
                {formatValue(convertAndRound(benchmark.nationalsCostBreakdown.gpssaAmount / 12))}
              </div>
            </div>
            {benchmark.nationalsCostBreakdown.nafisPct > 0 && (
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <div className="text-xs text-emerald-600 mb-1">Nafis ({benchmark.nationalsCostBreakdown.nafisPct}%)</div>
                <div className="text-lg font-bold text-emerald-700">
                  {formatValue(convertAndRound(benchmark.nationalsCostBreakdown.nafisAmount / 12))}
                </div>
              </div>
            )}
            <div className="rounded-xl bg-brand-100 p-4 text-center">
              <div className="text-xs text-brand-600 mb-1">Total Employer Cost</div>
              <div className="text-lg font-bold text-brand-900">
                {formatValue(convertAndRound(benchmark.nationalsCostBreakdown.totalEmployerCost / 12))}
              </div>
              <div className="text-[10px] text-brand-500 mt-0.5">
                {benchmark.nationalsCostBreakdown.totalCostMultiplier.toFixed(2)}x base
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Level Comparison Table ── */}
      <div className="bench-section p-0 overflow-x-auto">
        <table className="bench-table">
          <thead>
            <tr>
              <th>Level</th>
              <th className="text-center">P40</th>
              <th className="text-center text-brand-500 font-bold">P50</th>
              <th className="text-center">P60</th>
              <th className="text-center w-16">Show</th>
            </tr>
          </thead>
          <tbody>
            {levelRows.map((row) => {
              const isSelected = row.id === level.id;
              return (
                <tr
                  key={row.id}
                  className={isSelected ? "bench-row-highlight" : ""}
                >
                  <td className="font-medium">{row.name}</td>
                  <td className={`text-center ${isSelected ? "font-bold" : ""}`}>
                    {formatShort(row.p40)}
                  </td>
                  <td
                    className={`text-center ${
                      isSelected
                        ? "font-bold text-brand-500 underline underline-offset-2"
                        : ""
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
                      checked={!!showLevels[row.id]}
                      onChange={() => toggleLevel(row.id)}
                      className="h-4 w-4 rounded border-brand-300 text-brand-500 focus:ring-brand-400 accent-brand-500"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Box Plot Section ── */}
      {shownRows.length > 0 && (
        <div className="bench-section overflow-x-auto">
          <div className="flex items-center gap-6 mb-6 min-w-[640px]">
            <div className="text-sm font-semibold text-brand-900 w-40 shrink-0">Level</div>
            <div className="text-sm font-semibold text-brand-900 w-40 shrink-0">Data Quality</div>
            <div className="flex-1" />
            <div className="text-sm font-semibold text-brand-900 text-right w-32 shrink-0">
              Your Target (P{targetPercentile})
            </div>
          </div>

          <div className="space-y-6 min-w-[640px]">
            {shownRows.map((row) => {
              const p10 = row.p10;
              const p25 = row.p25;
              const p50 = row.p50;
              const p75 = row.p75;
              const p90 = row.p90;

              const tgt =
                row.id === level.id
                  ? targetValue
                  : (percentiles as Record<string, number>)[
                      `p${targetPercentile}`
                    ] || p50;

              const globalMin = p10 * 0.85;
              const globalMax = p90 * 1.15;
              const pct = (v: number) =>
                Math.max(
                  0,
                  Math.min(100, ((v - globalMin) / (globalMax - globalMin)) * 100),
                );

              return (
                <div key={row.id} className="flex items-center gap-6">
                  <div className="w-40 text-sm font-medium text-brand-900 shrink-0">
                    {row.name}
                  </div>
                  <div className={`w-40 text-xs font-medium shrink-0 ${confColor(row.confidence)}`}>
                    {confLabel(row.confidence)}
                  </div>

                  {/* Box plot */}
                  <div className="flex-1 relative h-10">
                    {/* whisker line */}
                    <div
                      className="absolute top-1/2 h-[2px] bg-brand-300 -translate-y-1/2"
                      style={{
                        left: `${pct(p10)}%`,
                        width: `${pct(p90) - pct(p10)}%`,
                      }}
                    />
                    {/* whisker caps */}
                    <div
                      className="bench-boxplot-whisker"
                      style={{ left: `${pct(p10)}%` }}
                    />
                    <div
                      className="bench-boxplot-whisker"
                      style={{ left: `${pct(p90)}%` }}
                    />
                    {/* box */}
                    <div
                      className="bench-boxplot-box"
                      style={{
                        left: `${pct(p25)}%`,
                        width: `${pct(p75) - pct(p25)}%`,
                      }}
                    />
                    {/* median */}
                    <div
                      className="bench-boxplot-median"
                      style={{ left: `${pct(p50)}%` }}
                    />
                    {/* scatter dots */}
                    {[0.15, 0.35, 0.55, 0.72, 0.88].map((f, i) => (
                      <div
                        key={i}
                        className="bench-boxplot-dot"
                        style={{
                          left: `${pct(p10 + (p90 - p10) * f)}%`,
                        }}
                      />
                    ))}
                    {/* target marker */}
                    <div
                      className="bench-boxplot-target"
                      style={{ left: `${pct(tgt)}%` }}
                    >
                      {targetPercentile}
                    </div>
                  </div>

                  <div className="w-32 text-right text-sm font-bold text-brand-900 shrink-0">
                    {formatValue(tgt)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Axis labels */}
          <div className="flex justify-between mt-3 text-[10px] text-brand-400 pl-[calc(10rem+10rem+1.5rem)]">
            {(() => {
              const allVals = shownRows.flatMap((r) => {
                return [r.p10, r.p90];
              });
              const mn = Math.min(...allVals) * 0.85;
              const mx = Math.max(...allVals) * 1.15;
              const step = (mx - mn) / 5;
              return Array.from({ length: 6 }, (_, i) => (
                <span key={i}>{formatShort(Math.round((mn + step * i) / 1000) * 1000)}</span>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
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
        <button
          onClick={() => goToStep("detail")}
          className="bench-cta max-w-xs"
        >
          View Detailed Breakdown <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
