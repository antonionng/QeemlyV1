"use client";

import { DonutChart } from "@tremor/react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import clsx from "clsx";
import { type CompanyMetrics } from "@/lib/employees";

interface HealthScoreProps {
  metrics: CompanyMetrics;
}

function getScoreLabel(score: number): { label: string; color: string; icon: typeof CheckCircle } {
  if (score >= 80) return { label: "Excellent", color: "text-emerald-600", icon: CheckCircle };
  if (score >= 60) return { label: "Good", color: "text-blue-600", icon: CheckCircle };
  if (score >= 40) return { label: "Fair", color: "text-amber-600", icon: AlertCircle };
  return { label: "Needs Attention", color: "text-rose-600", icon: XCircle };
}

function getScoreColor(score: number): string {
  if (score >= 80) return "emerald";
  if (score >= 60) return "blue";
  if (score >= 40) return "amber";
  return "rose";
}

export function HealthScore({ metrics }: HealthScoreProps) {
  const { label, color, icon: StatusIcon } = getScoreLabel(metrics.healthScore);
  const scoreColor = getScoreColor(metrics.healthScore);
  
  // Create donut data for the gauge effect
  const gaugeData = [
    { name: "Score", value: metrics.healthScore },
    { name: "Remaining", value: 100 - metrics.healthScore },
  ];

  // Contributing factors breakdown
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

  // Previous period score (mock - would come from real data)
  const previousScore = metrics.healthScore - 4;
  const scoreChange = metrics.healthScore - previousScore;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">Compensation Health Score</h3>
          <p className="text-xs text-brand-500 mt-1">Overall assessment of your compensation strategy</p>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
          scoreChange >= 0 ? "bg-emerald-50" : "bg-rose-50"
        }`}>
          {scoreChange >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
          )}
          <span className={clsx(
            "text-xs font-semibold",
            scoreChange >= 0 ? "text-emerald-700" : "text-rose-700"
          )}>
            {scoreChange >= 0 ? "+" : ""}{scoreChange} pts
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Gauge chart */}
        <div className="relative flex-shrink-0">
          <DonutChart
            data={gaugeData}
            category="value"
            index="name"
            colors={[scoreColor, "slate"]}
            className="h-32 w-32"
            showLabel={false}
            showAnimation={true}
            showTooltip={false}
          />
          {/* Center score display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx("text-3xl font-bold", color)}>
              {metrics.healthScore}
            </span>
            <span className="text-xs text-brand-500">/ 100</span>
          </div>
        </div>

        {/* Score status and factors */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <StatusIcon className={clsx("h-5 w-5", color)} />
            <span className={clsx("text-lg font-semibold", color)}>{label}</span>
          </div>

          {/* Contributing factors */}
          <div className="space-y-3">
            {factors.map((factor) => (
              <div key={factor.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-brand-700">{factor.label}</span>
                  <span className="text-brand-500">{factor.description}</span>
                </div>
                <div className="h-1.5 bg-brand-100 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all duration-500",
                      factor.value >= factor.target
                        ? "bg-emerald-500"
                        : factor.value >= factor.target * 0.7
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    )}
                    style={{ width: `${Math.min(100, factor.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
