"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { Brain, Lightbulb, Sparkles, TrendingUp, Zap, AlertTriangle, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings, getCompanyInitials } from "@/lib/company";
import { useCurrencyFormatter, convertCurrency, monthlyToAnnual, roundToThousand } from "@/lib/utils/currency";

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
  const { benchmark, role, location, level, formData } = result;
  const companySettings = useCompanySettings();
  const currency = useCurrencyFormatter();
  const targetPercentile = formData.targetPercentile || companySettings.targetPercentile;

  // Company branding
  const hasCompanyLogo = !!companySettings.companyLogo;
  const companyInitials = getCompanyInitials(companySettings.companyName);

  // Convert from monthly AED to company's default currency (annual)
  const convertToDefault = (value: number) => {
    const annualValue = monthlyToAnnual(value);
    return roundToThousand(convertCurrency(annualValue, "AED", currency.defaultCurrency));
  };
  
  const formatValue = (value: number) => currency.format(value);

  // Generate dynamic insights
  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];

    // Target percentile insight
    if (targetPercentile >= 75) {
      result.push({
        type: "recommendation",
        title: "Competitive Positioning",
        description: `At P${targetPercentile}, you're offering above-market compensation. This should attract strong candidates quickly.`,
        icon: Target,
        color: "emerald",
      });
    } else if (targetPercentile <= 50) {
      result.push({
        type: "warning",
        title: "Below Market Risk",
        description: `P${targetPercentile} may limit your candidate pool. Consider P75+ for faster hiring in competitive markets.`,
        icon: AlertTriangle,
        color: "amber",
      });
    }

    // Market trend insight
    if (benchmark.yoyChange > 5) {
      result.push({
        type: "trend",
        title: "Rising Market",
        description: `Salaries for ${role.title} increased ${benchmark.yoyChange.toFixed(1)}% YoY. Act fast to lock in rates.`,
        icon: TrendingUp,
        color: "brand",
      });
    } else if (benchmark.yoyChange < -2) {
      result.push({
        type: "opportunity",
        title: "Buyer's Market",
        description: `Salaries declined ${Math.abs(benchmark.yoyChange).toFixed(1)}% YoY. Good time for hiring.`,
        icon: Zap,
        color: "emerald",
      });
    }

    // Confidence insight
    if (benchmark.confidence === "Low") {
      result.push({
        type: "warning",
        title: "Limited Data",
        description: `Only ${benchmark.sampleSize} data points for ${role.title} in ${location.city}. Consider broader market research.`,
        icon: Brain,
        color: "rose",
      });
    } else if (benchmark.confidence === "High") {
      result.push({
        type: "recommendation",
        title: "High Confidence Data",
        description: `Strong sample size of ${benchmark.sampleSize} data points. These benchmarks are reliable.`,
        icon: Brain,
        color: "emerald",
      });
    }

    // Range insight
    const range = benchmark.percentiles.p75 - benchmark.percentiles.p25;
    const rangePercent = (range / benchmark.percentiles.p50) * 100;
    if (rangePercent > 40) {
      result.push({
        type: "opportunity",
        title: "Wide Salary Band",
        description: `${rangePercent.toFixed(0)}% spread between P25-P75. Experience and skills heavily impact compensation.`,
        icon: Lightbulb,
        color: "brand",
      });
    }

    // Context-specific insights
    if (formData.context === "new-hire") {
      result.push({
        type: "recommendation",
        title: "New Hire Strategy",
        description: `For new hires, aim for P${targetPercentile} to remain competitive. Include sign-on bonus for senior roles.`,
        icon: Sparkles,
        color: "brand",
      });
    } else if (formData.context === "existing") {
      result.push({
        type: "recommendation",
        title: "Retention Focus",
        description: `For existing employees, ensure compensation keeps pace with market to prevent attrition.`,
        icon: Sparkles,
        color: "brand",
      });
    }

    return result.slice(0, 4); // Max 4 insights
  }, [benchmark, role, location, targetPercentile, formData.context]);

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

  const targetValue = benchmark.percentiles[`p${targetPercentile}` as keyof typeof benchmark.percentiles] || benchmark.percentiles.p50;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-brand-900">AI Insights</h3>
          <p className="text-[10px] text-brand-500">Powered by Qeemly AI</p>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3 mb-4">
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
      </div>

      {/* Summary with company branding */}
      <div className="rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          {companySettings.isConfigured && (
            hasCompanyLogo ? (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-white/20 overflow-hidden">
                <img 
                  src={companySettings.companyLogo!} 
                  alt={companySettings.companyName}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[8px] font-bold">
                {companyInitials}
              </div>
            )
          )}
          <p className="text-xs font-medium opacity-90">Quick Summary for {companySettings.companyName}</p>
        </div>
        <p className="text-sm">
          Target <strong>{formatValue(convertToDefault(targetValue))}</strong> (P{targetPercentile}) for {role.title} in {location.city}.
        </p>
      </div>
    </Card>
  );
}
