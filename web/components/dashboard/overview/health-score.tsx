"use client";

import { CircleAlert, CircleCheckBig, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { OverviewMetrics } from "@/lib/dashboard/company-overview";
import type {
  OverviewInteractionMap,
  OverviewInteractionTarget,
} from "@/lib/dashboard/overview-interactions";
import { getHealthScoreFactors, getHealthScorePresentation } from "@/lib/dashboard/overview-card-helpers";
import { OverviewInteractiveSurface } from "./interactive-surface";

interface HealthScoreProps {
  metrics: OverviewMetrics;
  interactions?: OverviewInteractionMap;
  onInteract?: (target: OverviewInteractionTarget) => void;
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

function getStatusIcon(tone: "positive" | "warning" | "critical") {
  if (tone === "critical") {
    return CircleAlert;
  }

  if (tone === "warning") {
    return TriangleAlert;
  }

  return CircleCheckBig;
}

function getFactorInteractionKey(label: string): keyof OverviewInteractionMap["healthScoreFactors"] {
  if (label === "Band Alignment") {
    return "bandAlignment";
  }

  if (label === "Market Position") {
    return "marketPosition";
  }

  return "riskManagement";
}

export function HealthScore({ metrics, interactions, onInteract }: HealthScoreProps) {
  const presentation = getHealthScorePresentation(metrics);
  const factors = getHealthScoreFactors(metrics);
  const gaugePath = "M 30 182 A 150 150 0 0 1 330 182";
  const badgeStyle = getBadgeStyle(presentation.tone);
  const StatusIcon = getStatusIcon(presentation.tone);
  const normalizedScore = Math.max(0, Math.min(metrics.healthScore, 100));
  const needleAngle = Math.PI - (normalizedScore / 100) * Math.PI;
  const needleStartX = 180;
  const needleStartY = 182;
  const needleLength = 124;
  const needleEndX = Number((needleStartX + needleLength * Math.cos(needleAngle)).toFixed(2));
  const needleEndY = Number((needleStartY - needleLength * Math.sin(needleAngle)).toFixed(2));

  return (
    <Card
      className="overview-metric-card min-w-0 h-full p-6 lg:row-span-2 lg:min-h-[35rem] lg:p-8"
      data-testid="health-score-card"
    >
      <div className="flex h-full flex-col">
        <div className="space-y-1">
          <h3 className="overview-metric-card-title">Compensation Health Score</h3>
          <p className="overview-metric-card-description">
            Overall assessment of your compensation strategy
          </p>
        </div>

        <div className="mt-8" data-testid="health-score-gauge-shell">
          {interactions?.healthScoreGauge ? (
            <OverviewInteractiveSurface
              target={interactions.healthScoreGauge}
              onInteract={onInteract}
              testId="health-score-gauge-action"
              tooltipTestId="health-score-gauge-tooltip"
              className="mx-auto max-w-[440px]"
            >
              <div
                className="relative mx-auto w-full max-w-[440px] cursor-pointer"
                data-testid="health-score-gauge"
              >
                <svg className="w-full" viewBox="0 0 360 220" fill="none" aria-hidden="true">
                  <path
                    d={gaugePath}
                    style={{ stroke: "#E6E7EB" }}
                    strokeWidth={40}
                    strokeLinecap="round"
                    pathLength={100}
                  />
                  <path
                    d={gaugePath}
                    style={{ stroke: "#2EC4A7" }}
                    strokeWidth={40}
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
                  <circle cx={needleStartX} cy={needleStartY} r={9} fill="#2EC4A7" />
                </svg>
                <div
                  className="absolute inset-x-0 top-[104px] flex flex-col items-center text-center"
                  data-testid="health-score-center-stack"
                >
                  <span className="text-[58px] font-bold leading-none text-[#0F172A] lg:text-[64px]">
                    {presentation.primaryValue}%
                  </span>
                  <span
                    className="mt-5 inline-flex items-center gap-2 rounded-full px-[14px] py-[6px] text-sm font-semibold"
                    style={badgeStyle}
                    data-testid="health-score-status-pill"
                  >
                    <StatusIcon className="h-4 w-4" />
                    {presentation.label}
                  </span>
                </div>
              </div>
            </OverviewInteractiveSurface>
          ) : (
            <div
              className="relative mx-auto w-full max-w-[440px]"
              data-testid="health-score-gauge"
            >
              <svg className="w-full" viewBox="0 0 360 220" fill="none" aria-hidden="true">
                <path
                  d={gaugePath}
                  style={{ stroke: "#E6E7EB" }}
                  strokeWidth={40}
                  strokeLinecap="round"
                  pathLength={100}
                />
                <path
                  d={gaugePath}
                  style={{ stroke: "#2EC4A7" }}
                  strokeWidth={40}
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
                <circle cx={needleStartX} cy={needleStartY} r={9} fill="#2EC4A7" />
              </svg>
              <div
                className="absolute inset-x-0 top-[104px] flex flex-col items-center text-center"
                data-testid="health-score-center-stack"
              >
                <span className="text-[58px] font-bold leading-none text-[#0F172A] lg:text-[64px]">
                  {presentation.primaryValue}%
                </span>
                <span
                  className="mt-5 inline-flex items-center gap-2 rounded-full px-[14px] py-[6px] text-sm font-semibold"
                  style={badgeStyle}
                  data-testid="health-score-status-pill"
                >
                  <StatusIcon className="h-4 w-4" />
                  {presentation.label}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto space-y-6 pt-10">
          {factors.map((factor, index) => {
            const interactionKey = getFactorInteractionKey(factor.label);
            const target = interactions?.healthScoreFactors[interactionKey];

            const factorContent = (
              <div
                className="space-y-2.5"
                data-testid={`health-score-factor-${factor.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[16px] font-semibold text-[#0F172A] lg:text-[18px]">
                    {factor.label}
                  </span>
                  <span className="text-right text-[13px] text-[#6B7280] lg:text-[14px]">
                    {factor.description}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[#E5E7EB]">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${factor.width}%`,
                      background: FACTOR_COLORS[index] ?? FACTOR_COLORS[FACTOR_COLORS.length - 1],
                    }}
                  />
                </div>
              </div>
            );

            if (!target) {
              return <div key={factor.label}>{factorContent}</div>;
            }

            return (
              <OverviewInteractiveSurface
                key={factor.label}
                target={target}
                onInteract={onInteract}
                className="rounded-xl px-1 py-1"
                testId={`health-score-factor-${factor.label.toLowerCase().replace(/\s+/g, "-")}-action`}
                tooltipTestId={`health-score-factor-${factor.label.toLowerCase().replace(/\s+/g, "-")}-tooltip`}
              >
                {factorContent}
              </OverviewInteractiveSurface>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
