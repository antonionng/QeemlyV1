"use client";

import { Card } from "@/components/ui/card";
import type { OverviewMetrics } from "@/lib/dashboard/company-overview";
import { getHealthScoreFactors, getHealthScorePresentation } from "@/lib/dashboard/overview-card-helpers";

interface HealthScoreProps {
  metrics: OverviewMetrics;
}

const FACTOR_COLORS = ["#5A67FF", "#F59E0B", "#FF3B5C"] as const;

function getBadgeStyle(tone: "positive" | "warning" | "critical") {
  if (tone === "critical") {
    return {
      background: "#FFE4EA",
      color: "#D92D20",
    };
  }

  if (tone === "warning") {
    return {
      background: "#FEF3C7",
      color: "#B45309",
    };
  }

  return {
    background: "#DFF7F1",
    color: "#1C8C6C",
  };
}

export function HealthScore({ metrics }: HealthScoreProps) {
  const presentation = getHealthScorePresentation(metrics);
  const factors = getHealthScoreFactors(metrics);
  const gaugePath = "M 20 160 A 140 140 0 0 1 300 160";
  const badgeStyle = getBadgeStyle(presentation.tone);
  const needleAngle = Math.PI - (Math.max(0, Math.min(metrics.healthScore, 100)) / 100) * Math.PI;
  const needleStartX = 160;
  const needleStartY = 160;
  const needleLength = 112;
  const needleEndX = Number((needleStartX + needleLength * Math.cos(needleAngle)).toFixed(2));
  const needleEndY = Number((needleStartY - needleLength * Math.sin(needleAngle)).toFixed(2));

  return (
    <Card className="overview-metric-card h-full lg:row-span-2" data-testid="health-score-card">
      <div>
        <div className="space-y-1">
          <h3 className="overview-metric-card-title">Compensation Health Score</h3>
          <p className="overview-metric-card-description">
            Overall assessment of your compensation strategy
          </p>
        </div>

        <div className="mt-5">
          <div className="relative mx-auto w-full max-w-[320px]" data-testid="health-score-gauge">
            <svg className="w-full" viewBox="0 0 320 200" fill="none" aria-hidden="true">
              <path
                d={gaugePath}
                style={{ stroke: "#E6E7EB" }}
                strokeWidth={36}
                strokeLinecap="round"
                pathLength={100}
              />
              <path
                d={gaugePath}
                style={{ stroke: "#2EC4A7" }}
                strokeWidth={36}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${metrics.healthScore} 100`}
              />
              <line
                x1={needleStartX}
                y1={needleStartY}
                x2={needleEndX}
                y2={needleEndY}
                style={{ stroke: "#2EC4A7" }}
                strokeWidth={6}
                strokeLinecap="round"
              />
              <circle cx={needleStartX} cy={needleStartY} r={8} fill="#2EC4A7" />
            </svg>
            <div className="absolute inset-x-0 top-[92px] flex flex-col items-center text-center">
              <span className="text-[56px] font-bold leading-none text-[#0F172A]">
                {presentation.primaryValue}%
              </span>
              <span
                className="mt-5 inline-flex items-center rounded-full px-[14px] py-[6px] text-sm font-semibold"
                style={badgeStyle}
              >
                {presentation.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {factors.map((factor, index) => (
          <div key={factor.label} className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[16px] font-semibold text-[#0F172A]">{factor.label}</span>
              <span className="text-[13px] text-[#6B7280]">{factor.description}</span>
            </div>
            <div className="h-2 rounded-full bg-[#E5E7EB]">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${factor.width}%`,
                  background: FACTOR_COLORS[index] ?? FACTOR_COLORS[FACTOR_COLORS.length - 1],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
