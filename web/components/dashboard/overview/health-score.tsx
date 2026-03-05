"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import clsx from "clsx";
import { type CompanyMetrics } from "@/lib/employees";

interface HealthScoreProps {
  metrics: CompanyMetrics;
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Excellent", color: "text-emerald-500" };
  if (score >= 60) return { label: "Good", color: "text-emerald-500" };
  if (score >= 40) return { label: "Fair", color: "text-amber-500" };
  return { label: "Needs Attention", color: "text-rose-500" };
}

function getStrokeColor(score: number): string {
  if (score >= 60) return "var(--success)";
  if (score >= 40) return "var(--warning)";
  return "var(--danger)";
}

export function HealthScore({ metrics }: HealthScoreProps) {
  const { label, color } = getScoreLabel(metrics.healthScore);
  const strokeColor = getStrokeColor(metrics.healthScore);

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
      value: Math.max(0, 100 - (metrics.payrollRiskFlags / metrics.activeEmployees) * 500),
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
            <span className={clsx("text-3xl font-bold", color)}>
              {metrics.healthScore}%
            </span>
            <span className="flex items-center gap-1 mt-0.5">
              <CheckCircle className={clsx("h-3.5 w-3.5", color)} />
              <span className={clsx("text-xs font-semibold", color)}>{label}</span>
            </span>
          </div>
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
      </div>
    </Card>
  );
}
