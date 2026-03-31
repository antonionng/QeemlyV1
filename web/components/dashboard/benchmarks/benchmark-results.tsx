"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BenchmarkAdvisoryLoading } from "@/components/dashboard/benchmarks/benchmark-advisory-loading";
import { RolePickerModal } from "@/components/dashboard/benchmarks/role-picker-modal";
import { BenchmarkSourceBadge } from "@/components/ui/benchmark-source-badge";
import type { OrgPeerSummary } from "@/lib/benchmarks/org-peer-summary";
import {
  BENCHMARK_LOCATIONS,
  useBenchmarkState,
  type BenchmarkResult,
} from "@/lib/benchmarks/benchmark-state";
import type { BenchmarkDetailAiBriefing } from "@/lib/benchmarks/detail-ai";
import {
  getBenchmarksBatch,
  getBenchmarkEnriched,
  type AiAdvisoryPayload,
  type AiInsights,
} from "@/lib/benchmarks/data-service";
import { getRoleDescription } from "@/lib/benchmarks/role-descriptions";
import {
  getBenchmarkMarkerLabel,
  getBenchmarkConfidenceLabel,
  getOrgPeerHoverMessage,
  getBenchmarkResultsInsights,
  shouldEnableOrgPeerHover,
} from "@/lib/benchmarks/results-presentation";
import { FUNDING_STAGES, useCompanySettings, type TargetPercentile } from "@/lib/company";
import { COMPANY_SIZES, INDUSTRIES, LEVELS, ROLES, type SalaryBenchmark } from "@/lib/dashboard/dummy-data";
import { useSalaryView } from "@/lib/salary-view-store";
import {
  toBenchmarkDisplayValue,
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

function getBenchmarkResultIdentity(result: BenchmarkResult) {
  return `${result.role.id}::${result.level.id}::${result.location.id}::${new Date(result.createdAt).getTime()}`;
}

export function BenchmarkResults({ result, hasCompanyData = true }: BenchmarkResultsProps) {
  const {
    clearResult,
    goToStep,
    saveCurrentFilter,
    formData: stateFormData,
    updateFormField,
    runBenchmark,
    isSubmitting,
  } = useBenchmarkState();
  const companySettings = useCompanySettings();
  const currency = useCurrencyFormatter();
  const { salaryView, setSalaryView } = useSalaryView();

  const { benchmark, role, level, location, formData: resultFormData } = result;
  const [levelBenchmarks, setLevelBenchmarks] = useState<Record<string, SalaryBenchmark>>({
    [level.id]: benchmark,
  });
  const [showLevelOverrides, setShowLevelOverrides] = useState<Record<string, boolean>>({});
  const [aiAdvisory, setAiAdvisory] = useState<AiAdvisoryPayload | null>(null);
  const [aiInsights, setAiInsights] = useState<AiInsights | null>(null);
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);
  const [orgPeerSummariesByLevel, setOrgPeerSummariesByLevel] = useState<Record<string, OrgPeerSummary>>({});
  const [orgPeerSummaryLoadingByLevel, setOrgPeerSummaryLoadingByLevel] = useState<Record<string, boolean>>({});
  const [orgPeerSummaryErrorsByLevel, setOrgPeerSummaryErrorsByLevel] = useState<Record<string, string | null>>({});
  const lastOrgPeerRequestKey = useRef<string | null>(null);
  const targetPercentile = stateFormData.targetPercentile || companySettings.targetPercentile;
  const roleDescription = getRoleDescription(role.id);
  const selectedRole = ROLES.find((entry) => entry.id === (stateFormData.roleId || resultFormData.roleId)) ?? role;
  const resultIdentity = getBenchmarkResultIdentity(result);

  const convertAndRound = useCallback((
    sourceValue: number,
    sourcePayPeriod = benchmark.payPeriod,
    sourceCurrency = benchmark.currency || "AED",
  ) => {
    return toBenchmarkDisplayValue(sourceValue, {
      salaryView,
      sourceCurrency,
      targetCurrency: currency.defaultCurrency,
      payPeriod: sourcePayPeriod,
    });
  }, [benchmark.currency, benchmark.payPeriod, currency.defaultCurrency, salaryView]);

  const formatValue = (value: number) => currency.format(value);
  const formatShort = (value: number) => {
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return String(value);
  };

  const persistAiDetailBriefing = useCallback(
    (
      briefing: BenchmarkDetailAiBriefing | null,
      status: BenchmarkResult["aiDetailBriefingStatus"],
    ) => {
      useBenchmarkState.setState((state) => {
        if (!state.currentResult || getBenchmarkResultIdentity(state.currentResult) !== resultIdentity) {
          return state;
        }

        return {
          currentResult: {
            ...state.currentResult,
            aiDetailBriefing: briefing,
            aiDetailBriefingStatus: status,
          },
          recentResults: state.recentResults.map((entry) =>
            getBenchmarkResultIdentity(entry) === resultIdentity
              ? {
                  ...entry,
                  aiDetailBriefing: briefing,
                  aiDetailBriefingStatus: status,
                }
              : entry,
          ),
        };
      });
    },
    [resultIdentity],
  );

  useEffect(() => {
    const filters = {
      industry: stateFormData.industry || resultFormData.industry,
      companySize: stateFormData.companySize || resultFormData.companySize,
    };

    const loadLevelBenchmarks = async () => {
      const [enriched, batchBenchmarks] = await Promise.all([
        getBenchmarkEnriched(role.id, location.id, level.id, filters),
        getBenchmarksBatch(
          LEVELS.filter((nextLevel) => nextLevel.id !== level.id).map((nextLevel) => ({
            roleId: role.id,
            locationId: location.id,
            levelId: nextLevel.id,
            industry: filters.industry ?? null,
            companySize: filters.companySize ?? null,
          })),
        ),
      ]);

      if (enriched.aiAdvisory) setAiAdvisory(enriched.aiAdvisory);
      if (enriched.aiInsights) setAiInsights(enriched.aiInsights);
      persistAiDetailBriefing(
        enriched.aiDetailBriefing,
        enriched.aiDetailBriefing ? "ready" : "unavailable",
      );

      const next: Record<string, SalaryBenchmark> = { [level.id]: benchmark };
      if (enriched.benchmark) {
        next[level.id] = enriched.benchmark;
      }
      for (const nextLevel of LEVELS) {
        if (nextLevel.id === level.id) continue;
        const batchKey = [
          role.id,
          location.id,
          nextLevel.id,
          filters.industry ?? "",
          filters.companySize ?? "",
        ].join("::");
        const nextBenchmark = batchBenchmarks[batchKey];
        if (nextBenchmark) {
          next[nextLevel.id] = nextBenchmark;
        }
      }
      setLevelBenchmarks(next);
    };

    persistAiDetailBriefing(null, "loading");
    void loadLevelBenchmarks();
  }, [
    benchmark,
    level.id,
    location.id,
    resultFormData.companySize,
    resultFormData.industry,
    role.id,
    stateFormData.companySize,
    stateFormData.industry,
    persistAiDetailBriefing,
  ]);

  const levelRows: LevelRow[] = useMemo(() => {
    return LEVELS.flatMap((nextLevel) => {
      const nextBenchmark = levelBenchmarks[nextLevel.id];
      if (!nextBenchmark) return [];
      const p10 = convertAndRound(nextBenchmark.percentiles.p10, nextBenchmark.payPeriod, nextBenchmark.currency);
      const p25 = convertAndRound(nextBenchmark.percentiles.p25, nextBenchmark.payPeriod, nextBenchmark.currency);
      const p50 = convertAndRound(nextBenchmark.percentiles.p50, nextBenchmark.payPeriod, nextBenchmark.currency);
      const p75 = convertAndRound(nextBenchmark.percentiles.p75, nextBenchmark.payPeriod, nextBenchmark.currency);
      const p90 = convertAndRound(nextBenchmark.percentiles.p90, nextBenchmark.payPeriod, nextBenchmark.currency);
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
      lastOrgPeerRequestKey.current = null;
      setOrgPeerSummariesByLevel({});
      setOrgPeerSummaryLoadingByLevel({});
      setOrgPeerSummaryErrorsByLevel({});
      return;
    }

    if (shownRows.length === 0) return;

    const orgPeerRequestKey = [
      role.id,
      location.id,
      shownRowIdsKey,
      stateFormData.industry || resultFormData.industry || "",
      stateFormData.companySize || resultFormData.companySize || "",
    ].join("::");

    if (lastOrgPeerRequestKey.current === orgPeerRequestKey) {
      return;
    }
    lastOrgPeerRequestKey.current = orgPeerRequestKey;

    let isCancelled = false;
    const loadingState = Object.fromEntries(shownRows.map((row) => [row.id, true]));
    const clearedErrorState = Object.fromEntries(shownRows.map((row) => [row.id, null]));

    setOrgPeerSummaryLoadingByLevel((prev) => ({ ...prev, ...loadingState }));
    setOrgPeerSummaryErrorsByLevel((prev) => ({ ...prev, ...clearedErrorState }));

    const loadOrgPeerSummaries = async () => {
      const entries = shownRows.map((row) => ({
        roleId: role.id,
        locationId: location.id,
        levelId: row.id,
        industry: stateFormData.industry || resultFormData.industry || "",
        companySize: stateFormData.companySize || resultFormData.companySize || "",
      }));

      let results: Array<{ levelId: string; summary: OrgPeerSummary | null; error: string | null }>;
      try {
        const response = await fetch("/api/benchmarks/org-peer-summary-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || "Failed to load org peer summaries");
        }

        const payload = (await response.json()) as {
          summaries?: Record<string, OrgPeerSummary>;
        };
        results = shownRows.map((row) => {
          const key = [
            role.id,
            location.id,
            row.id,
            stateFormData.industry || resultFormData.industry || "",
            stateFormData.companySize || resultFormData.companySize || "",
          ].join("::");
          return {
            levelId: row.id,
            summary: payload.summaries?.[key] ?? null,
            error: null,
          };
        });
      } catch (error) {
        results = shownRows.map((row) => ({
          levelId: row.id,
          summary: null,
          error: error instanceof Error ? error.message : "Failed to load org peer summary",
        }));
      }

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
  }, [
    hasCompanyData,
    location.id,
    resultFormData.companySize,
    resultFormData.industry,
    role.id,
    shownRows,
    shownRowIdsKey,
    stateFormData.companySize,
    stateFormData.industry,
  ]);

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
      <div className="flex items-center justify-between">
        <button
          onClick={clearResult}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {isSubmitting ? <BenchmarkAdvisoryLoading variant="refresh" /> : null}

      <div className="bench-section space-y-4" data-testid="benchmark-results-editable-filters">
        <div className="space-y-1">
          <h3 className="bench-section-header">Edit Search</h3>
          <p className="text-xs text-brand-400">
            Update the search criteria here and rerun without leaving the results page.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.9fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
            <button
              type="button"
              onClick={() => setIsRolePickerOpen(true)}
              aria-haspopup="dialog"
              data-testid="benchmark-results-role-picker-trigger"
              className="bench-results-role-trigger h-11 w-full pl-10 text-left"
            >
              <span className="truncate">
                {selectedRole.title}
              </span>
              <span className="ml-3 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">
                {selectedRole.family}
              </span>
            </button>
          </div>

          <div className="relative">
            <select
              value={stateFormData.locationId || resultFormData.locationId || location.id}
              onChange={(event) => updateFormField("locationId", event.target.value || null)}
              className="h-11 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-10 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
            >
              {BENCHMARK_LOCATIONS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.city}, {entry.country}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="relative">
            <select
              value={stateFormData.levelId || resultFormData.levelId || level.id}
              onChange={(event) => updateFormField("levelId", event.target.value || null)}
              className="h-11 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-10 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
            >
              {LEVELS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="relative" data-testid="benchmark-employment-pill">
            <select
              value={stateFormData.employmentType || resultFormData.employmentType}
              onChange={(event) =>
                updateFormField("employmentType", event.target.value as "national" | "expat")
              }
              className="h-11 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-10 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
            >
              <option value="national">National</option>
              <option value="expat">Expat</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]">
          <div className="relative">
            <select
              value={stateFormData.industry || resultFormData.industry || companySettings.industry}
              onChange={(event) => updateFormField("industry", event.target.value || null)}
              className="h-11 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-10 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
            >
              {INDUSTRIES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="relative">
            <select
              value={
                stateFormData.companySize || resultFormData.companySize || companySettings.companySize
              }
              onChange={(event) => updateFormField("companySize", event.target.value || null)}
              className="h-11 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-10 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
            >
              {COMPANY_SIZES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry} Employees
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="relative">
            <select
              value={
                stateFormData.fundingStage || resultFormData.fundingStage || companySettings.fundingStage
              }
              onChange={(event) => updateFormField("fundingStage", event.target.value || null)}
              className="h-11 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-10 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
            >
              {FUNDING_STAGES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="relative">
            <select
              value={String(
                stateFormData.targetPercentile ||
                  resultFormData.targetPercentile ||
                  companySettings.targetPercentile
              )}
              onChange={(event) =>
                updateFormField(
                  "targetPercentile",
                  Number(event.target.value) as TargetPercentile,
                )
              }
              className="h-11 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-10 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
            >
              <option value="25">25th Percentile</option>
              <option value="50">50th Percentile</option>
              <option value="75">75th Percentile</option>
              <option value="90">90th Percentile</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="bench-toggle md:w-auto">
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

          <Button
            size="sm"
            onClick={() => void runBenchmark()}
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            <Search className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? "Refreshing..." : "Refresh Search"}
          </Button>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-xs text-brand-700 break-words">
          {selectedRole.title} · {location.city}, {location.country} · {level.name}
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
                {formatValue(
                  convertAndRound(
                    benchmark.nationalsCostBreakdown.gpssaAmount,
                    "annual",
                    benchmark.currency,
                  ),
                )}
              </div>
            </div>
            {benchmark.nationalsCostBreakdown.nafisPct > 0 && (
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <div className="mb-1 text-xs text-emerald-600">
                  Nafis ({benchmark.nationalsCostBreakdown.nafisPct}%)
                </div>
                <div className="text-lg font-bold text-emerald-700">
                  {formatValue(
                    convertAndRound(
                      benchmark.nationalsCostBreakdown.nafisAmount,
                      "annual",
                      benchmark.currency,
                    ),
                  )}
                </div>
              </div>
            )}
            <div className="rounded-xl bg-brand-100 p-4 text-center">
              <div className="mb-1 text-xs text-brand-600">Total Employer Cost</div>
              <div className="text-lg font-bold text-brand-900">
                {formatValue(
                  convertAndRound(
                    benchmark.nationalsCostBreakdown.totalEmployerCost,
                    "annual",
                    benchmark.currency,
                  ),
                )}
              </div>
              <div className="mt-0.5 text-[10px] text-brand-500">
                {benchmark.nationalsCostBreakdown.totalCostMultiplier.toFixed(2)}x base
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bench-section p-0" data-testid="benchmark-results-level-table">
        <div className="responsive-scroll-x">
          <table className="bench-table min-w-[480px]">
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
      </div>

      {shownRows.length > 0 && (
        <div className="bench-section" data-testid="benchmark-results-boxplot-section">
          <div
            className="responsive-scroll-x"
            data-testid="benchmark-results-boxplot-scroller"
          >
            <div className="min-w-[720px]">
              <div className="mb-6 flex items-center gap-6">
                <div className="w-40 shrink-0 text-sm font-semibold text-brand-900">Level</div>
                <div className="w-40 shrink-0 text-sm font-semibold text-brand-900">Data Quality</div>
                <div className="flex-1" />
                <div className="w-32 shrink-0 text-right text-sm font-semibold text-brand-900">
                  {hasCompanyData ? `Your Target (P${targetPercentile})` : `Target (P${targetPercentile})`}
                </div>
              </div>

              <div className="space-y-6">
                {shownRows.map((row) => {
                  const isSelectedRow =
                    hasCompanyData && shouldEnableOrgPeerHover(row.id, level.id);
                  const rowTargetPercentiles: Record<TargetPercentile, number> = {
                    25: row.p25,
                    50: row.p50,
                    75: row.p75,
                    90: row.p90,
                  };
                  const targetForRow =
                    row.id === level.id
                      ? targetValue
                      : rowTargetPercentiles[targetPercentile] || row.p50;
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
          </div>
        </div>
      )}

      <div className="bench-section" data-testid="benchmark-results-summary">
        <h3 className="bench-section-header">Summary</h3>

        {aiInsights ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-brand-50 p-5 text-sm leading-relaxed text-brand-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <span className="font-semibold text-brand-900">Market Analysis</span>
              </div>
              <p>{aiInsights.reasoning}</p>
            </div>

            <div className="rounded-xl bg-brand-50/60 p-5 text-sm leading-relaxed text-brand-800">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-brand-500" />
                <span className="font-semibold text-brand-900">Market Context</span>
              </div>
              <p>{aiInsights.marketContext}</p>
            </div>

            {(aiInsights.industryInsight || aiInsights.companySizeInsight) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {aiInsights.industryInsight && (
                  <div className="rounded-xl bg-amber-50/60 p-4 text-sm leading-relaxed text-brand-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold text-amber-900">Industry Insight</span>
                    </div>
                    <p>{aiInsights.industryInsight}</p>
                  </div>
                )}
                {aiInsights.companySizeInsight && (
                  <div className="rounded-xl bg-emerald-50/60 p-4 text-sm leading-relaxed text-brand-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-900">Company Size Insight</span>
                    </div>
                    <p>{aiInsights.companySizeInsight}</p>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-brand-400 italic">{aiInsights.confidenceNote}</p>
          </div>
        ) : (
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
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-brand-500">
          <BenchmarkSourceBadge source={benchmark.benchmarkSource} />
          {benchmark.benchmarkSource !== "ai-estimated" && (
            <>
              <span className="text-brand-300">·</span>
              <span>{benchmark.sampleSize} data points</span>
              <span className="text-brand-300">·</span>
              <span>{benchmark.confidence} confidence</span>
            </>
          )}
        </div>
      </div>

      {/* Supplementary AI Advisory - only when market data is strong and AI runs alongside */}
      {aiAdvisory && (
        <div className="bench-section" data-testid="benchmark-ai-advisory">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <h3 className="bench-section-header pb-0">Qeemly AI Advisory</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {(["p10", "p25", "p50", "p75", "p90"] as const).map((key) => {
                const aiValue = aiAdvisory.levelEstimate[key];
                return (
                  <div
                    key={key}
                    className={`rounded-xl p-3 text-center ${
                      key === "p50"
                        ? "bg-violet-50 ring-1 ring-violet-200"
                        : "bg-brand-50/50"
                    }`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                      {key.toUpperCase()}
                    </div>
                    <div
                      className={`mt-1 text-sm font-bold ${
                        key === "p50" ? "text-violet-700" : "text-brand-900"
                      }`}
                    >
                      {formatShort(aiValue)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl bg-violet-50/50 p-4 text-sm leading-relaxed text-brand-700">
              <p className="font-semibold text-brand-900 mb-1">Market Analysis</p>
              <p>{aiAdvisory.reasoning}</p>
            </div>

            <div className="rounded-xl bg-brand-50/50 p-4 text-sm leading-relaxed text-brand-700">
              <p className="font-semibold text-brand-900 mb-1">Market Context</p>
              <p>{aiAdvisory.marketContext}</p>
            </div>

            {(aiAdvisory.industryInsight || aiAdvisory.companySizeInsight) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {aiAdvisory.industryInsight && (
                  <div className="rounded-xl bg-amber-50/50 p-4 text-sm leading-relaxed text-brand-700">
                    <p className="font-semibold text-amber-800 mb-1">Industry Insight</p>
                    <p>{aiAdvisory.industryInsight}</p>
                  </div>
                )}
                {aiAdvisory.companySizeInsight && (
                  <div className="rounded-xl bg-emerald-50/50 p-4 text-sm leading-relaxed text-brand-700">
                    <p className="font-semibold text-emerald-800 mb-1">Company Size Insight</p>
                    <p>{aiAdvisory.companySizeInsight}</p>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-brand-400 italic">{aiAdvisory.confidenceNote}</p>
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
      <RolePickerModal
        open={isRolePickerOpen}
        selectedRoleId={selectedRole.id}
        onClose={() => setIsRolePickerOpen(false)}
        onSelect={(roleId) => updateFormField("roleId", roleId)}
      />
    </div>
  );
}
