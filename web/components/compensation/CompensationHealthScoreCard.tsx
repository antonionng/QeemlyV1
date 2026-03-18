"use client";

import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { OverviewInteractiveSurface } from "@/components/dashboard/overview/interactive-surface";
import type { OverviewInteractionTarget } from "@/lib/dashboard/overview-interactions";

const GAUGE_WIDTH = 435;
const GAUGE_HEIGHT = 218;
const GAUGE_RADIUS = 160;
const GAUGE_STROKE_WIDTH = 50;
const GAUGE_CENTER_X = GAUGE_WIDTH / 2;
const GAUGE_BASELINE_Y = 190;
const GAUGE_PATH = `M ${GAUGE_CENTER_X - GAUGE_RADIUS} ${GAUGE_BASELINE_Y} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${GAUGE_CENTER_X + GAUGE_RADIUS} ${GAUGE_BASELINE_Y}`;
const GAUGE_CIRCUMFERENCE = Math.PI * GAUGE_RADIUS;

const METRIC_CONFIG = {
  bandAlignment: {
    label: "Band Alignment",
    color: "#5C45FD",
    testId: "health-score-factor-band-alignment",
    actionTestId: "health-score-factor-band-alignment-action",
    tooltipTestId: "health-score-factor-band-alignment-tooltip",
  },
  marketPosition: {
    label: "Market Position",
    color: "#FE9A00",
    testId: "health-score-factor-market-position",
    actionTestId: "health-score-factor-market-position-action",
    tooltipTestId: "health-score-factor-market-position-tooltip",
  },
  riskManagement: {
    label: "Risk Management",
    color: "#FF2056",
    testId: "health-score-factor-risk-management",
    actionTestId: "health-score-factor-risk-management-action",
    tooltipTestId: "health-score-factor-risk-management-tooltip",
  },
} as const;

type StatusTone = "excellent" | "good" | "warning" | "risk";

type MetricRowProps = {
  label: string;
  value: number;
  description: string;
  color: string;
  testId: string;
  actionTestId: string;
  tooltipTestId: string;
  interaction?: OverviewInteractionTarget;
  onInteract?: (target: OverviewInteractionTarget) => void;
};

export type Props = {
  score: number;
  bandAlignment: number;
  marketPosition: number;
  riskScore: number;
  bandAlignmentDescription?: string;
  marketPositionDescription?: string;
  riskScoreDescription?: string;
  gaugeInteraction?: OverviewInteractionTarget;
  bandAlignmentInteraction?: OverviewInteractionTarget;
  marketPositionInteraction?: OverviewInteractionTarget;
  riskManagementInteraction?: OverviewInteractionTarget;
  onInteract?: (target: OverviewInteractionTarget) => void;
  cardTestId?: string;
  gaugeShellTestId?: string;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function getStatus(score: number): {
  label: string;
  tone: StatusTone;
  icon: typeof CheckCircle;
  className: string;
} {
  if (score >= 75) {
    return {
      label: "Excellent",
      tone: "excellent",
      icon: CheckCircle,
      className: "bg-teal-100 text-teal-700",
    };
  }

  if (score >= 60) {
    return {
      label: "Good",
      tone: "good",
      icon: CheckCircle,
      className: "bg-teal-100 text-teal-700",
    };
  }

  if (score >= 40) {
    return {
      label: "Warning",
      tone: "warning",
      icon: AlertTriangle,
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "Risk",
    tone: "risk",
    icon: AlertCircle,
    className: "bg-red-100 text-red-700",
  };
}

function MetricRow({
  label,
  value,
  description,
  color,
  testId,
  actionTestId,
  tooltipTestId,
  interaction,
  onInteract,
}: MetricRowProps) {
  const content = (
    <div className="flex flex-col gap-2" data-testid={testId}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[18px] font-semibold leading-[1.2] text-[#111233]">{label}</span>
        <span className="text-right text-[14px] leading-[1.2] text-[#969799]">{description}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[rgba(150,151,153,0.2)]">
        <div
          className="h-full rounded-full transition-[width] duration-[600ms] ease-out"
          style={{
            width: `${clampPercent(value)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );

  if (!interaction) {
    return content;
  }

  return (
    <OverviewInteractiveSurface
      target={interaction}
      onInteract={onInteract}
      className="rounded-xl"
      testId={actionTestId}
      tooltipTestId={tooltipTestId}
    >
      {content}
    </OverviewInteractiveSurface>
  );
}

export function CompensationHealthScoreCard({
  score,
  bandAlignment,
  marketPosition,
  riskScore,
  bandAlignmentDescription,
  marketPositionDescription,
  riskScoreDescription,
  gaugeInteraction,
  bandAlignmentInteraction,
  marketPositionInteraction,
  riskManagementInteraction,
  onInteract,
  cardTestId = "compensation-health-score-card",
  gaugeShellTestId = "health-score-gauge-shell",
}: Props) {
  const normalizedScore = clampPercent(score);
  const strokeDashoffset = GAUGE_CIRCUMFERENCE * (1 - normalizedScore / 100);
  const status = getStatus(normalizedScore);
  const StatusIcon = status.icon;
  const arcAngle = Math.PI * (1 - normalizedScore / 100);
  const arcTickInnerRadius = GAUGE_RADIUS - GAUGE_STROKE_WIDTH / 2 - 6;
  const arcTickOuterRadius = GAUGE_RADIUS + GAUGE_STROKE_WIDTH / 2 + 6;
  const arcTickX1 = GAUGE_CENTER_X + arcTickInnerRadius * Math.cos(arcAngle);
  const arcTickY1 = GAUGE_BASELINE_Y - arcTickInnerRadius * Math.sin(arcAngle);
  const arcTickX2 = GAUGE_CENTER_X + arcTickOuterRadius * Math.cos(arcAngle);
  const arcTickY2 = GAUGE_BASELINE_Y - arcTickOuterRadius * Math.sin(arcAngle);

  const gaugeContent = (
    <div
      className="relative mx-auto h-[260px] w-full max-w-[460px]"
      data-testid="health-score-gauge"
    >
      <svg
        className="h-[220px] w-full"
        viewBox={`0 0 ${GAUGE_WIDTH} ${GAUGE_HEIGHT}`}
        fill="none"
        aria-hidden="true"
      >
        <path
          d={GAUGE_PATH}
          stroke="#E5E7EB"
          strokeWidth={GAUGE_STROKE_WIDTH}
          fill="none"
          strokeLinecap="butt"
        />
        <path
          d={GAUGE_PATH}
          stroke="#2EC4A6"
          strokeWidth={GAUGE_STROKE_WIDTH}
          fill="none"
          strokeLinecap="butt"
          strokeDasharray={GAUGE_CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
        <line
          x1={arcTickX1}
          y1={arcTickY1}
          x2={arcTickX2}
          y2={arcTickY2}
          data-testid="health-score-needle"
          stroke="#2EC4A6"
          strokeWidth={3}
          strokeLinecap="butt"
        />
      </svg>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center pt-11 text-center"
        data-testid="health-score-center-stack"
      >
        <span className="text-[64px] font-semibold leading-none tracking-[-1px] text-[#111233]">
          {normalizedScore}%
        </span>
        <span
          className={`mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ${status.className}`}
          data-testid="health-score-status-pill"
          data-status-tone={status.tone}
        >
          <StatusIcon size={16} />
          {status.label}
        </span>
      </div>
    </div>
  );

  return (
    <Card
      className="flex h-full w-full min-h-[620px] flex-col justify-between rounded-[24px] border border-gray-200 bg-white px-8 py-10 shadow-sm"
      data-testid={cardTestId}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-[21px] font-semibold leading-[1.2] text-[#111233]">Compensation Health Score</h3>
        <p className="text-[15px] leading-[1.3] text-[#969799]">Overall assessment of your compensation strategy</p>
      </div>

      <div
        className="flex items-center justify-center py-2"
        data-testid={gaugeShellTestId}
      >
        {gaugeInteraction ? (
          <OverviewInteractiveSurface
            target={gaugeInteraction}
            onInteract={onInteract}
            className="mx-auto w-full max-w-[460px] rounded-2xl"
            testId="health-score-gauge-action"
            tooltipTestId="health-score-gauge-tooltip"
          >
            {gaugeContent}
          </OverviewInteractiveSurface>
        ) : (
          gaugeContent
        )}
      </div>

      <div className="flex flex-col gap-6">
        <MetricRow
          label={METRIC_CONFIG.bandAlignment.label}
          value={bandAlignment}
          description={bandAlignmentDescription ?? `${clampPercent(bandAlignment)}% aligned`}
          color={METRIC_CONFIG.bandAlignment.color}
          testId={METRIC_CONFIG.bandAlignment.testId}
          actionTestId={METRIC_CONFIG.bandAlignment.actionTestId}
          tooltipTestId={METRIC_CONFIG.bandAlignment.tooltipTestId}
          interaction={bandAlignmentInteraction}
          onInteract={onInteract}
        />
        <MetricRow
          label={METRIC_CONFIG.marketPosition.label}
          value={marketPosition}
          description={marketPositionDescription ?? `${clampPercent(marketPosition)}% positioned`}
          color={METRIC_CONFIG.marketPosition.color}
          testId={METRIC_CONFIG.marketPosition.testId}
          actionTestId={METRIC_CONFIG.marketPosition.actionTestId}
          tooltipTestId={METRIC_CONFIG.marketPosition.tooltipTestId}
          interaction={marketPositionInteraction}
          onInteract={onInteract}
        />
        <MetricRow
          label={METRIC_CONFIG.riskManagement.label}
          value={riskScore}
          description={riskScoreDescription ?? `${clampPercent(riskScore)}% risk managed`}
          color={METRIC_CONFIG.riskManagement.color}
          testId={METRIC_CONFIG.riskManagement.testId}
          actionTestId={METRIC_CONFIG.riskManagement.actionTestId}
          tooltipTestId={METRIC_CONFIG.riskManagement.tooltipTestId}
          interaction={riskManagementInteraction}
          onInteract={onInteract}
        />
      </div>
    </Card>
  );
}
