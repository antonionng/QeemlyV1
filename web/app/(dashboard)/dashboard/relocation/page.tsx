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
import {
  buildRelocationDisplayMoney,
  convertRelocationCurrency,
  formatRelocationCurrency,
} from "@/lib/relocation/currency";
import type {
  RelocationResolvedMarketContext,
  RelocationSalaryComparisons,
} from "@/lib/relocation/market-context";

const DEFAULT_FORM_DATA: RelocationFormData = {
  homeCityId: "london",
  targetCityId: "dubai",
  baseSalary: 95000,
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
  homeMarketContext: RelocationResolvedMarketContext | null;
  targetMarketContext: RelocationResolvedMarketContext | null;
  salaryComparisons: RelocationSalaryComparisons | null;
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

function formatSignedPercent(value: number): string {
  if (Math.abs(value) < 0.1) return "0%";
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function MoneyStack({
  amount,
  currency,
  compact = false,
  className,
  secondaryClassName,
}: {
  amount: number;
  currency: string | null | undefined;
  compact?: boolean;
  className?: string;
  secondaryClassName?: string;
}) {
  const display = buildRelocationDisplayMoney(amount, currency, { compact });

  return (
    <div className="space-y-1">
      <p className={className}>{display.primary}</p>
      {display.secondaryAed ? (
        <p className={secondaryClassName}>AED reference: {display.secondaryAed}</p>
      ) : null}
    </div>
  );
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

function CostDetails({
  breakdown,
  currency,
}: {
  breakdown: CostBreakdown;
  currency: string | null | undefined;
}) {
  return (
    <div className="space-y-3">
      {COST_CATEGORIES.map(({ key, label, dotClass }) => (
        <div key={key} className="flex items-center gap-3">
          <div className={`h-3 w-3 shrink-0 rounded-full ${dotClass}`} />
          <span className="flex-1 text-sm font-medium text-accent-700">
            {label}
          </span>
          <span className="w-16 text-right text-sm font-semibold text-accent-900">
            {formatRelocationCurrency(
              convertRelocationCurrency(breakdown[key], "AED", currency),
              currency,
              { compact: true },
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function ComparisonCard({ result }: { result: RelocationResult }) {
  const targetBreakdown =
    result.costBreakdown.targetWithOverride ?? result.costBreakdown.target;
  const homeMonthlyCost = getTotalMonthlyCost(result.costBreakdown.home);
  const targetMonthlyCost = getTotalMonthlyCost(targetBreakdown);
  const homeMonthlyCostLocal = convertRelocationCurrency(
    homeMonthlyCost,
    "AED",
    result.homeCity.currency,
  );
  const targetMonthlyCostLocal = convertRelocationCurrency(
    targetMonthlyCost,
    "AED",
    result.targetCity.currency,
  );

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
              <MoneyStack
                amount={homeMonthlyCostLocal}
                currency={result.homeCity.currency}
                className="text-3xl font-semibold tracking-tight text-accent-900 sm:text-4xl"
                secondaryClassName="text-sm font-medium text-accent-500"
              />
            </div>
            <CostBar breakdown={result.costBreakdown.home} />
            <CostDetails
              breakdown={result.costBreakdown.home}
              currency={result.homeCity.currency}
            />
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-white p-5">
            <div className="space-y-1">
              <p className="overview-card-heading">Monthly estimated cost of living</p>
              <MoneyStack
                amount={targetMonthlyCostLocal}
                currency={result.targetCity.currency}
                className="text-3xl font-semibold tracking-tight text-accent-900 sm:text-4xl"
                secondaryClassName="text-sm font-medium text-accent-500"
              />
            </div>
            <CostBar breakdown={targetBreakdown} />
            <CostDetails
              breakdown={targetBreakdown}
              currency={result.targetCity.currency}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function SalaryComparisonSection({
  advisory,
}: {
  advisory: RelocationAdvisoryState | null;
}) {
  if (
    !advisory?.homeMarketContext ||
    !advisory.targetMarketContext ||
    !advisory.salaryComparisons
  ) {
    return null;
  }

  const { homeMarketContext, targetMarketContext, salaryComparisons } = advisory;

  return (
    <Card className="panel p-6 sm:p-8">
      <div className="space-y-6">
        <div>
          <h2 className="overview-section-title">Salary comparison</h2>
          <p className="overview-supporting-text mt-1">
            Compare local market medians alongside the employee&apos;s current
            salary, with AED references for cross-market review.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="overview-card-heading">Origin market salary</p>
            <MoneyStack
              amount={homeMarketContext.p50}
              currency={homeMarketContext.currency}
              className="mt-3 text-3xl font-semibold tracking-tight text-accent-900"
              secondaryClassName="text-sm font-medium text-accent-500"
            />
            <p className="mt-3 text-sm font-medium text-accent-700">
              {homeMarketContext.sourceLabel}
            </p>
            <p className="mt-1 text-sm text-accent-500">
              {homeMarketContext.matchLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="overview-card-heading">Destination market salary</p>
            <MoneyStack
              amount={targetMarketContext.p50}
              currency={targetMarketContext.currency}
              className="mt-3 text-3xl font-semibold tracking-tight text-accent-900"
              secondaryClassName="text-sm font-medium text-accent-500"
            />
            <p className="mt-3 text-sm font-medium text-accent-700">
              {targetMarketContext.sourceLabel}
            </p>
            <p className="mt-1 text-sm text-accent-500">
              {targetMarketContext.matchLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="overview-card-heading">Current salary vs destination market</p>
            <MoneyStack
              amount={salaryComparisons.currentToDestinationMarket.currentSalary}
              currency={salaryComparisons.currentToDestinationMarket.currentSalaryCurrency}
              className="mt-3 text-3xl font-semibold tracking-tight text-accent-900"
              secondaryClassName="text-sm font-medium text-accent-500"
            />
            <p className="mt-4 text-sm text-accent-600">
              Destination market median
            </p>
            <MoneyStack
              amount={salaryComparisons.currentToDestinationMarket.targetMarketP50}
              currency={salaryComparisons.currentToDestinationMarket.targetMarketCurrency}
              className="text-lg font-semibold text-accent-900"
              secondaryClassName="text-sm text-accent-500"
            />
            <div className="mt-4 rounded-2xl bg-accent-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-500">
                AED reference gap
              </p>
              <p className="mt-2 text-lg font-semibold text-accent-900">
                {formatRelocationCurrency(
                  salaryComparisons.currentToDestinationMarket.gapInAed,
                  "AED",
                )}
              </p>
              <p className="mt-1 text-sm text-accent-500">
                {formatSignedPercent(
                  salaryComparisons.currentToDestinationMarket.gapPercent,
                )}{" "}
                vs current salary.{" "}
                {formatSignedPercent(
                  salaryComparisons.benchmarkToBenchmark.percentChange,
                )}{" "}
                market-to-market shift.
              </p>
            </div>
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
  const targetCurrency = result.targetCity.currency;
  const targetLocal = convertRelocationCurrency(target, "AED", targetCurrency);
  const minLocal = convertRelocationCurrency(min, "AED", targetCurrency);
  const maxLocal = convertRelocationCurrency(max, "AED", targetCurrency);
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
              <MoneyStack
                amount={targetLocal}
                currency={targetCurrency}
                className="text-3xl font-semibold tracking-tight text-accent-900 sm:text-5xl"
                secondaryClassName="text-sm font-medium text-accent-500"
              />
              <div className="rounded-xl bg-danger-soft px-3 py-2">
                <p className="text-sm font-semibold text-danger">
                  {result.colRatio.toFixed(2)}x
                </p>
                <p className="text-xs text-accent-600">current salary</p>
              </div>
            </div>
            {isAiPrimary ? (
              <p className="mt-4 text-sm text-accent-600">
                Deterministic baseline:{" "}
                {formatRelocationCurrency(
                  convertRelocationCurrency(
                    deterministicResult.recommendedSalary,
                    "AED",
                    targetCurrency,
                  ),
                  targetCurrency,
                )}{" "}
                (AED reference:{" "}
                {formatRelocationCurrency(
                  deterministicResult.recommendedSalary,
                  "AED",
                )}
                )
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
                  {formatRelocationCurrency(minLocal, targetCurrency, {
                    compact: true,
                  })}
                </span>
              </div>

              <div className="absolute left-1/2 flex w-24 -translate-x-1/2 flex-col items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">
                  Target
                </span>
                <div className="h-8 w-0.5 bg-brand-500" />
                <span className="text-sm font-semibold text-brand-700">
                  {formatRelocationCurrency(targetLocal, targetCurrency, {
                    compact: true,
                  })}
                </span>
              </div>

              <div className="absolute right-[7%] flex w-20 translate-x-1/2 flex-col items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-500">
                  +5%
                </span>
                <div className="h-8 w-px bg-accent-300" />
                <span className="text-sm font-semibold text-accent-900">
                  {formatRelocationCurrency(maxLocal, targetCurrency, {
                    compact: true,
                  })}
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

  const displayResult: RelocationResult | null =
    result && advisory?.recommendedResult
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
              <SalaryComparisonSection advisory={advisory} />
              <RecommendationCard
                result={displayResult}
                deterministicResult={result ?? displayResult}
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
