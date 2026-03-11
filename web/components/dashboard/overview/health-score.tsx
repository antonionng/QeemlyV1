"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import clsx from "clsx";
import type { OverviewMetrics } from "@/lib/dashboard/company-overview";
import { getHealthScorePresentation } from "@/lib/dashboard/overview-card-helpers";

interface HealthScoreProps {
  metrics: OverviewMetrics;
}

function getStrokeColor(score: number): string {
  if (score >= 60) return "var(--success)";
  if (score >= 40) return "var(--warning)";
  return "var(--danger)";
}

export function HealthScore({ metrics }: HealthScoreProps) {
  const presentation = getHealthScorePresentation(metrics);
  const strokeColor = getStrokeColor(metrics.healthScore);
  const riskDenominator = Math.max(metrics.benchmarkedEmployees, 1);
  const StatusIcon =
    presentation.icon === "check-circle"
      ? CheckCircle
      : presentation.icon === "alert-circle"
        ? AlertCircle
        : XCircle;

  const factors = [
    {
      label: "Band Alignment",
      value: metrics.inBandPercentage,
      target: 75,
      description: `${metrics.inBandPercentage}% of employees in band`,
    },
    {
      label: "Market Position",
      value: Math.max(0, 100 - Math.abs(metrics.avgMarketPosition - 2.5) * 8),
      target: 85,
      description: `${metrics.avgMarketPosition >= 0 ? "+" : ""}${metrics.avgMarketPosition}% vs market`,
    },
    {
      label: "Risk Management",
      value: Math.max(0, 100 - (metrics.payrollRiskFlags / riskDenominator) * 500),
      target: 90,
      description: `${metrics.payrollRiskFlags} risk flags`,
    },
  ];

  const radius = 58;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = (metrics.healthScore / 100) * circumference;

  return (
    <Card className="dash-card p-6 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-accent-900">Compensation Health Score</h3>
        <p className="text-xs text-accent-500 mt-0.5">Overall assessment of your compensation strategy</p>
      </div>

      <div className="flex flex-col items-center flex-1 justify-center">
        {/* Gauge */}
        <div className="relative mb-5">
          <svg width={144} height={144} viewBox="0 0 144 144">
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke="var(--color-accent-200)"
              strokeWidth={stroke}
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={stroke}
              strokeDasharray={`${progress} ${circumference - progress}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx("text-3xl font-bold", presentation.accentClass)}>
              {presentation.primaryValue}
            </span>
            <span className="mt-0.5 flex items-center gap-1">
              <StatusIcon className={clsx("h-3.5 w-3.5", presentation.accentClass)} />
              <span className={clsx("text-xs font-semibold", presentation.accentClass)}>
                {presentation.secondaryValue}
              </span>
            </span>
          </div>
        </div>

        <div
          className={clsx(
            "mb-5 w-full rounded-xl border px-3 py-2 text-center text-xs font-medium",
            presentation.tone === "critical"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : presentation.tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {presentation.summary}
        </div>

        {/* Contributing factors */}
        <div className="w-full space-y-3">
          {factors.map((factor) => (
            <div key={factor.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-accent-800">{factor.label}</span>
                <span className="text-accent-500">{factor.description}</span>
              </div>
              <div className="h-1.5 bg-accent-100 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-500",
                    factor.value >= factor.target
                      ? "bg-emerald-400"
                      : factor.value >= factor.target * 0.7
                      ? "bg-amber-400"
                      : "bg-rose-400"
                  )}
                  style={{ width: `${Math.min(100, factor.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {metrics.benchmarkedEmployees < metrics.activeEmployees && (
          <p className="mt-4 text-center text-[11px] text-accent-500">
            Score factors are based on {metrics.benchmarkedEmployees} benchmarked employees.
          </p>
        )}
      </div>
    </Card>
  );
}
