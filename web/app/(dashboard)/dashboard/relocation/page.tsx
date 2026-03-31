"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import {
  InputPanel,
  RelocationFormData,
} from "@/components/dashboard/relocation/input-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  calculateRelocation,
  formatCurrency,
  getApproachExplanation,
} from "@/lib/relocation/calculator";
import type { RelocationResult } from "@/lib/relocation/calculator";
import {
  setRelocationCities,
  getTotalMonthlyCost,
  type City,
  type CostBreakdown,
} from "@/lib/relocation/col-data";
import type { RelocationAiAdvisory } from "@/lib/relocation/ai-advisory";

const DEFAULT_FORM_DATA: RelocationFormData = {
  homeCityId: "london",
  targetCityId: "dubai",
  baseSalary: 450000,
  compApproach: "hybrid",
  hybridCap: 110,
  rentOverride: undefined,
  roleId: "swe",
  levelId: "ic3",
};

type RelocationAdvisoryState = {
  deterministicResult: {
    recommendedSalary: number;
    recommendedRange: RelocationResult["recommendedRange"];
  };
  aiAdvisory: RelocationAiAdvisory | null;
  recommendedResult: {
    recommendedSalary: number;
    recommendedRange: RelocationResult["recommendedRange"];
  };
};

const COST_CATEGORIES: {
  key: keyof CostBreakdown;
  label: string;
  dotClass: string;
  barClass: string;
}[] = [
  {
    key: "rent",
    label: "Rent",
    dotClass: "bg-[#a89bff]",
    barClass: "bg-[#a89bff]",
  },
  {
    key: "transport",
    label: "Transport",
    dotClass: "bg-[#28e7c5]",
    barClass: "bg-[rgba(40,231,197,0.9)]",
  },
  {
    key: "food",
    label: "Food",
    dotClass: "bg-[#111233]",
    barClass: "bg-[#111233]",
  },
  {
    key: "utilities",
    label: "Utilities",
    dotClass: "bg-[#111233]",
    barClass: "bg-[#111233]",
  },
  {
    key: "other",
    label: "Other",
    dotClass: "bg-[#111233]",
    barClass: "bg-[#111233]",
  },
];

function formatCompact(val: number): string {
  if (val >= 1000) return `${Math.round(val / 1000)}k`;
  return val.toLocaleString();
}

function CostBar({ breakdown }: { breakdown: CostBreakdown }) {
  const total = getTotalMonthlyCost(breakdown);
  const segments = COST_CATEGORIES.map(({ key, barClass }) => ({
    key,
    barClass,
    width: (breakdown[key] / total) * 100,
  }));

  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-accent-100">
      {segments.map(({ key, barClass, width }) => (
        <div
          key={key}
          className={`${barClass} transition-all`}
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  );
}

function CostDetails({ breakdown }: { breakdown: CostBreakdown }) {
  return (
    <div className="space-y-3">
      {COST_CATEGORIES.map(({ key, label, dotClass }) => (
        <div key={key} className="flex items-center gap-3">
          <div className={`h-3 w-3 shrink-0 rounded-full ${dotClass}`} />
          <span className="flex-1 text-sm font-medium text-accent-700">
            {label}
          </span>
          <span className="w-16 text-right text-sm font-semibold text-accent-900">
            {formatCompact(breakdown[key])}
          </span>
        </div>
      ))}
    </div>
  );
}

function ComparisonCard({ result }: { result: RelocationResult }) {
  const targetBreakdown =
    result.costBreakdown.targetWithOverride ?? result.costBreakdown.target;

  return (
    <Card className="panel p-6 sm:p-8">
      <div className="space-y-6">
        <div>
          <h2 className="overview-section-title">Cost of living comparison</h2>
          <p className="overview-supporting-text mt-1">
            Compare current and destination monthly living costs side by side.
          </p>
        </div>

        <div className="grid gap-4 rounded-2xl border border-border bg-accent-50/70 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <span className="text-[32px] leading-none">
                {result.homeCity.flag}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-accent-900">
                {result.homeCity.name}
              </p>
              <p className="text-sm text-accent-500">
                {result.homeCity.country}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-500">
              COL Index
            </p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-accent-900 sm:text-5xl">
              {result.colRatio.toFixed(2)}x
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-3 sm:justify-end">
            <div className="min-w-0 text-left sm:text-right">
              <p className="truncate text-base font-semibold text-accent-900">
                {result.targetCity.name}
              </p>
              <p className="text-sm text-accent-500">
                {result.targetCity.country}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <span className="text-[32px] leading-none">
                {result.targetCity.flag}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5 rounded-2xl border border-border bg-white p-5">
            <div className="space-y-1">
              <p className="overview-card-heading">Monthly estimated cost of living</p>
              <p className="text-3xl font-semibold tracking-tight text-accent-900 sm:text-4xl">
                {getTotalMonthlyCost(result.costBreakdown.home).toLocaleString()}
              </p>
            </div>
            <CostBar breakdown={result.costBreakdown.home} />
            <CostDetails breakdown={result.costBreakdown.home} />
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-white p-5">
            <div className="space-y-1">
              <p className="overview-card-heading">Monthly estimated cost of living</p>
              <p className="text-3xl font-semibold tracking-tight text-accent-900 sm:text-4xl">
                {getTotalMonthlyCost(targetBreakdown).toLocaleString()}
              </p>
            </div>
            <CostBar breakdown={targetBreakdown} />
            <CostDetails breakdown={targetBreakdown} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RecommendationCard({
  result,
  deterministicResult,
  compApproach,
  hybridCap,
  aiAdvisory,
  advisoryStatus,
}: {
  result: RelocationResult;
  deterministicResult: RelocationResult;
  compApproach: RelocationFormData["compApproach"];
  hybridCap: number;
  aiAdvisory: RelocationAiAdvisory | null;
  advisoryStatus: "idle" | "loading" | "ready" | "unavailable";
}) {
  const { min, max } = result.recommendedRange;
  const target = result.recommendedSalary;
  const isAiPrimary = Boolean(aiAdvisory);
  const risks = aiAdvisory?.risks ?? [];
  const policyNotes = aiAdvisory?.policyNotes ?? [];
  const supportSuggestions = aiAdvisory?.supportSuggestions ?? [];

  return (
    <Card className="panel p-6 sm:p-8">
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="overview-section-title">Recommended compensation</h2>
          <p className="overview-supporting-text mt-1">
            Use the current cost gap and pay approach to guide relocation offers.
          </p>
          {advisoryStatus === "loading" ? (
            <p className="text-sm font-medium text-brand-600">
              Loading Qeemly AI relocation advisory...
            </p>
          ) : null}
          {aiAdvisory ? (
            <div className="rounded-2xl border border-brand-200 bg-brand-50/80 p-4">
              <p className="text-sm font-semibold text-brand-700">
                {aiAdvisory.recommendationHeadline}
              </p>
              <p className="mt-2 text-sm text-accent-700">{aiAdvisory.summary}</p>
              <p className="mt-3 text-sm font-medium text-accent-800">
                {aiAdvisory.rationale}
              </p>
              {risks.length > 0 ? (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-500">
                    Risks
                  </p>
                  {risks.map((risk) => (
                    <p key={risk} className="text-sm text-accent-700">
                      {risk}
                    </p>
                  ))}
                </div>
              ) : null}
              {policyNotes.length > 0 ? (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-500">
                    Policy notes
                  </p>
                  {policyNotes.map((note) => (
                    <p key={note} className="text-sm text-accent-700">
                      {note}
                    </p>
                  ))}
                </div>
              ) : null}
              {supportSuggestions.length > 0 ? (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-500">
                    Support suggestions
                  </p>
                  {supportSuggestions.map((suggestion) => (
                    <p key={suggestion} className="text-sm text-accent-700">
                      {suggestion}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : advisoryStatus === "unavailable" ? (
            <div className="rounded-2xl border border-border bg-accent-50/70 p-4">
              <p className="text-sm font-medium text-accent-700">
                Qeemly AI advisory is unavailable right now. Showing the deterministic relocation recommendation instead.
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-2xl border border-border bg-white p-5">
            <div>
              <h3 className="text-base font-semibold text-accent-900">
                {isAiPrimary ? "AI Recommended Salary" : "Recommended Salary Needed"}
              </h3>
              <p className="mt-1 text-sm text-accent-500">
                {isAiPrimary
                  ? `AI-adjusted relocation recommendation for ${result.targetCity.name}, grounded in market and policy context.`
                  : `Salary required in ${result.targetCity.name} to maintain current lifestyle.`}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-start gap-4">
              <p className="text-3xl font-semibold tracking-tight text-accent-900 sm:text-5xl">
                {formatCurrency(target)}
              </p>
              <div className="rounded-xl bg-danger-soft px-3 py-2">
                <p className="text-sm font-semibold text-danger">
                  {result.colRatio.toFixed(2)}x
                </p>
                <p className="text-xs text-accent-600">current salary</p>
              </div>
            </div>
            {isAiPrimary ? (
              <p className="mt-4 text-sm text-accent-600">
                Deterministic baseline: {formatCurrency(deterministicResult.recommendedSalary)}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <div>
              <h3 className="text-base font-semibold text-accent-900">
                Recommended Range
              </h3>
              <p className="mt-1 text-sm text-accent-500">
                {getApproachExplanation(compApproach, hybridCap)}
              </p>
            </div>

            <div className="relative mx-auto mt-8 h-[112px] w-full max-w-[calc(100%-32px)]">
              <div className="absolute inset-x-0 top-9 h-3 rounded-full bg-accent-100" />
              <div className="absolute left-[7%] right-[7%] top-9 h-3 rounded-full bg-[#a89bff]" />

              <div className="absolute left-[7%] flex w-20 -translate-x-1/2 flex-col items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-500">
                  -5%
                </span>
                <div className="h-8 w-px bg-accent-300" />
                <span className="text-sm font-semibold text-accent-900">
                  {formatCurrency(min, true)}
                </span>
              </div>

              <div className="absolute left-1/2 flex w-24 -translate-x-1/2 flex-col items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">
                  Target
                </span>
                <div className="h-8 w-0.5 bg-brand-500" />
                <span className="text-sm font-semibold text-brand-700">
                  {formatCurrency(target, true)}
                </span>
              </div>

              <div className="absolute right-[7%] flex w-20 translate-x-1/2 flex-col items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-500">
                  +5%
                </span>
                <div className="h-8 w-px bg-accent-300" />
                <span className="text-sm font-semibold text-accent-900">
                  {formatCurrency(max, true)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RelocationPageContent() {
  const searchParams = useSearchParams();
  const [citiesVersion, setCitiesVersion] = useState(0);
  const [advisoryStatus, setAdvisoryStatus] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >("idle");
  const [advisory, setAdvisory] = useState<RelocationAdvisoryState | null>(null);

  useEffect(() => {
    let isMounted = true;
    void fetch("/api/relocation/cities")
      .then(async (res) => {
        if (!res.ok) return;
        const payload = await res.json();
        const cities: City[] = (payload.cities || []).map((row: any) => ({
          id: row.city_id,
          name: row.name,
          country: row.country,
          region: row.region,
          flag: row.flag,
          colIndex: Number(row.col_index),
          breakdown: {
            rent: Number(row.rent),
            transport: Number(row.transport),
            food: Number(row.food),
            utilities: Number(row.utilities),
            other: Number(row.other),
          },
          currency: row.currency,
          currencySymbol: row.currency_symbol,
        }));
        if (!isMounted || cities.length === 0) return;
        setRelocationCities(cities);
        setCitiesVersion((v) => v + 1);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const [formData, setFormData] = useState<RelocationFormData>(() => {
    const home = searchParams.get("home");
    const target = searchParams.get("target");
    const salary = searchParams.get("salary");
    const approach = searchParams.get("approach");
    const cap = searchParams.get("cap");

    return {
      homeCityId: home || DEFAULT_FORM_DATA.homeCityId,
      targetCityId: target || DEFAULT_FORM_DATA.targetCityId,
      baseSalary: salary ? Number(salary) : DEFAULT_FORM_DATA.baseSalary,
      compApproach:
        (approach as RelocationFormData["compApproach"]) ||
        DEFAULT_FORM_DATA.compApproach,
      hybridCap: cap ? Number(cap) : DEFAULT_FORM_DATA.hybridCap,
      rentOverride: undefined,
      roleId: searchParams.get("role") || DEFAULT_FORM_DATA.roleId,
      levelId: searchParams.get("level") || DEFAULT_FORM_DATA.levelId,
    };
  });

  const [analysisFormData, setAnalysisFormData] = useState<RelocationFormData>(() => {
    const home = searchParams.get("home");
    const target = searchParams.get("target");
    const salary = searchParams.get("salary");
    const approach = searchParams.get("approach");
    const cap = searchParams.get("cap");

    return {
      homeCityId: home || DEFAULT_FORM_DATA.homeCityId,
      targetCityId: target || DEFAULT_FORM_DATA.targetCityId,
      baseSalary: salary ? Number(salary) : DEFAULT_FORM_DATA.baseSalary,
      compApproach:
        (approach as RelocationFormData["compApproach"]) ||
        DEFAULT_FORM_DATA.compApproach,
      hybridCap: cap ? Number(cap) : DEFAULT_FORM_DATA.hybridCap,
      rentOverride: undefined,
      roleId: searchParams.get("role") || DEFAULT_FORM_DATA.roleId,
      levelId: searchParams.get("level") || DEFAULT_FORM_DATA.levelId,
    };
  });

  const result = useMemo(() => {
    if (
      !analysisFormData.homeCityId ||
      !analysisFormData.targetCityId ||
      !analysisFormData.baseSalary
    ) {
      return null;
    }
    void citiesVersion;
    return calculateRelocation({
      homeCityId: analysisFormData.homeCityId,
      targetCityId: analysisFormData.targetCityId,
      baseSalary: analysisFormData.baseSalary,
      compApproach: analysisFormData.compApproach,
      hybridCap: analysisFormData.hybridCap,
      rentOverride: analysisFormData.rentOverride,
    });
  }, [analysisFormData, citiesVersion]);

  const isAnalysisPending = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(analysisFormData),
    [analysisFormData, formData],
  );

  useEffect(() => {
    if (!result || !analysisFormData.roleId || !analysisFormData.levelId) {
      setAdvisory(null);
      setAdvisoryStatus("idle");
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    async function loadAdvisory() {
      setAdvisoryStatus("loading");

      try {
        const response = await fetch("/api/relocation/advisory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homeCityId: analysisFormData.homeCityId,
            targetCityId: analysisFormData.targetCityId,
            baseSalary: analysisFormData.baseSalary,
            compApproach: analysisFormData.compApproach,
            hybridCap: analysisFormData.hybridCap,
            rentOverride: analysisFormData.rentOverride,
            roleId: analysisFormData.roleId,
            levelId: analysisFormData.levelId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Relocation advisory failed with ${response.status}`);
        }

        const payload = (await response.json()) as RelocationAdvisoryState;
        if (isCancelled) return;

        setAdvisory(payload);
        setAdvisoryStatus(payload.aiAdvisory ? "ready" : "unavailable");
      } catch {
        if (isCancelled) return;
        setAdvisory(null);
        setAdvisoryStatus("unavailable");
      }
    }

    void loadAdvisory();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [analysisFormData, result]);

  const displayResult = advisory?.recommendedResult
    ? {
        ...result,
        recommendedSalary: advisory.recommendedResult.recommendedSalary,
        recommendedRange: advisory.recommendedResult.recommendedRange,
      }
    : result;

  return (
    <div className="bench-results relative z-10 space-y-8">
      <div className="space-y-1">
        <h1 className="page-title">Relocation Calculator</h1>
        <p className="page-subtitle">
          Compare cost of living, salary impact, and recommended compensation
          for relocation decisions.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <div className="xl:sticky xl:top-24">
          <InputPanel
            data={formData}
            onChange={setFormData}
            onRunAnalysis={() => {
              setAnalysisFormData(formData);
            }}
            isAnalysisPending={isAnalysisPending}
            isAnalyzing={advisoryStatus === "loading"}
          />
        </div>

        <div className="space-y-6">
          {displayResult ? (
            <>
              <ComparisonCard result={displayResult} />
              <RecommendationCard
                result={displayResult}
                deterministicResult={result}
                compApproach={formData.compApproach}
                hybridCap={formData.hybridCap}
                aiAdvisory={advisory?.aiAdvisory ?? null}
                advisoryStatus={advisoryStatus}
              />
            </>
          ) : (
            <Card className="panel flex items-center justify-center px-8 py-16">
              <p className="text-sm text-accent-500">
                Select locations and enter a salary to see results.
              </p>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-center py-4 sm:justify-end">
        <Button
          type="button"
          className="h-11 rounded-full px-5 text-[13px] font-semibold"
        >
          <span>Export as PDF</span>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function RelocationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface-2">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-brand-900">
              Loading Calculator...
            </p>
          </div>
        </div>
      }
    >
      <RelocationPageContent />
    </Suspense>
  );
}
