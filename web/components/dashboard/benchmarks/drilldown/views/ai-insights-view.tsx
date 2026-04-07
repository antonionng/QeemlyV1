"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { Brain, Lightbulb, Sparkles, TrendingUp, Zap, AlertTriangle, Target } from "lucide-react";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings, getCompanyInitials } from "@/lib/company";
import { formatCurrency, toBenchmarkDisplayValue } from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";
import { ModuleStateBanner } from "../module-state-banner";
import { SharedAiCallout } from "../shared-ai-callout";

interface AIInsightsViewProps {
  result: BenchmarkResult;
}

type Insight = {
  type: "recommendation" | "warning" | "opportunity" | "trend";
  title: string;
  description: string;
  icon: typeof Sparkles;
  color: "brand" | "emerald" | "amber" | "rose";
};

export function AIInsightsView({ result }: AIInsightsViewProps) {
  const { benchmark, role, location, formData } = result;
  const companySettings = useCompanySettings();
  const { salaryView } = useSalaryView();
  const targetPercentile = formData.targetPercentile || companySettings.targetPercentile;
  const targetCurrency = location.currency;

  const mod = result.detailSurface?.modules.aiInsights;
  const isLoading = !mod || result.detailSurfaceStatus === "loading";
  const insightsData = mod?.data;

  const hasCompanyLogo = !!companySettings.companyLogo;
  const companyInitials = getCompanyInitials(companySettings.companyName);

  const convertToMarket = (value: number) =>
    toBenchmarkDisplayValue(value, {
      salaryView,
      sourceCurrency: benchmark.currency,
      targetCurrency,
      payPeriod: benchmark.payPeriod,
    });
  const formatValue = (value: number) => formatCurrency(value, targetCurrency);

  const insights = useMemo<Insight[]>(() => {
    const cards: Insight[] = [];

    if (targetPercentile >= 75) {
      cards.push({
        type: "recommendation",
        title: "Competitive Positioning",
        description: `At P${targetPercentile}, you're offering above-market compensation. This should attract strong candidates quickly.`,
        icon: Target,
        color: "emerald",
      });
    } else if (targetPercentile <= 50) {
      cards.push({
        type: "warning",
        title: "Below Market Risk",
        description: `P${targetPercentile} may limit your candidate pool. Consider P75+ for faster hiring in competitive markets.`,
        icon: AlertTriangle,
        color: "amber",
      });
    }

    if (benchmark.yoyChange > 5) {
      cards.push({
        type: "trend",
        title: "Rising Market",
        description: `Salaries for ${role.title} increased ${benchmark.yoyChange.toFixed(1)}% YoY. Act fast to lock in rates.`,
        icon: TrendingUp,
        color: "brand",
      });
    } else if (benchmark.yoyChange < -2) {
      cards.push({
        type: "opportunity",
        title: "Buyer's Market",
        description: `Salaries declined ${Math.abs(benchmark.yoyChange).toFixed(1)}% YoY. Good time for hiring.`,
        icon: Zap,
        color: "emerald",
      });
    }

    if (benchmark.confidence === "Low") {
      cards.push({
        type: "warning",
        title: "Limited Data",
        description: `Only ${benchmark.sampleSize} data points for ${role.title} in ${location.city}. Consider broader market research.`,
        icon: Brain,
        color: "rose",
      });
    } else if (benchmark.confidence === "High") {
      cards.push({
        type: "recommendation",
        title: "High Confidence Data",
        description: `Strong sample size of ${benchmark.sampleSize} data points. These benchmarks are reliable.`,
        icon: Brain,
        color: "emerald",
      });
    }

    const range = benchmark.percentiles.p75 - benchmark.percentiles.p25;
    const rangePercent = (range / benchmark.percentiles.p50) * 100;
    if (rangePercent > 40) {
      cards.push({
        type: "opportunity",
        title: "Wide Salary Band",
        description: `${rangePercent.toFixed(0)}% spread between P25-P75. Experience and skills heavily impact compensation.`,
        icon: Lightbulb,
        color: "brand",
      });
    }

    if (formData.context === "new-hire") {
      cards.push({
        type: "recommendation",
        title: "New Hire Strategy",
        description: `For new hires, aim for P${targetPercentile} to remain competitive. Include sign-on bonus for senior roles.`,
        icon: Sparkles,
        color: "brand",
      });
    } else if (formData.context === "existing") {
      cards.push({
        type: "recommendation",
        title: "Retention Focus",
        description: `For existing employees, ensure compensation keeps pace with market to prevent attrition.`,
        icon: Sparkles,
        color: "brand",
      });
    }

    return cards.slice(0, 4);
  }, [benchmark, role, location, targetPercentile, formData.context]);

  const colorClasses = {
    brand: { bg: "bg-brand-50", icon: "text-brand-600", title: "text-brand-800", text: "text-brand-700" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", title: "text-emerald-800", text: "text-emerald-700" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", title: "text-amber-800", text: "text-amber-700" },
    rose: { bg: "bg-rose-50", icon: "text-rose-600", title: "text-rose-800", text: "text-rose-700" },
  };

  const targetValue =
    benchmark.percentiles[`p${targetPercentile}` as keyof typeof benchmark.percentiles] || benchmark.percentiles.p50;

  return (
    <div className="bench-section">
      <h3 className="bench-section-header">AI Insights</h3>
      {isLoading ? (
        <ModuleStateBanner
          variant="loading"
          message="Qeemly AI is preparing detailed insight cards for this module."
          className="mb-4 text-xs"
        />
      ) : null}
      {mod?.status === "empty" && !isLoading ? (
        <ModuleStateBanner
          variant="info"
          message={mod.message ?? "AI insight narrative is unavailable. Showing benchmark-driven guidance."}
          className="mb-4 text-xs"
        />
      ) : null}

      <div className="space-y-3 mb-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const colors = colorClasses[insight.color];
          return (
            <div key={index} className={clsx("rounded-xl p-3", colors.bg)}>
              <div className="flex items-start gap-2">
                <Icon className={clsx("mt-0.5 h-4 w-4 shrink-0", colors.icon)} />
                <div>
                  <p className={clsx("text-xs font-semibold", colors.title)}>{insight.title}</p>
                  <p className={clsx("mt-0.5 text-xs leading-relaxed", colors.text)}>{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          {companySettings.isConfigured &&
            (hasCompanyLogo ? (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-white/20 overflow-hidden">
                <img src={companySettings.companyLogo!} alt={companySettings.companyName} className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[8px] font-bold">
                {companyInitials}
              </div>
            ))}
          <p className="text-xs font-medium opacity-90">Quick Summary for {companySettings.companyName}</p>
        </div>
        <p className="text-sm">
          Target <strong>{formatValue(convertToMarket(targetValue))}</strong> (P{targetPercentile}) for {role.title} in{" "}
          {location.city}.
        </p>
      </div>

      {insightsData && mod?.status === "ready" ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Executive Briefing</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-800">{insightsData.executiveBriefing}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Hiring Signal</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-800">{insightsData.hiringSignal}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Negotiation Posture</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-800">{insightsData.negotiationPosture}</p>
          </div>
        </div>
      ) : null}

      <SharedAiCallout section={mod?.narrative} />
    </div>
  );
}
