"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import {
  type OverviewBenchmarkCoverage,
  type OverviewMetrics,
} from "@/lib/dashboard/company-overview";
import type {
  OverviewInteractionMap,
  OverviewInteractionTarget,
} from "@/lib/dashboard/overview-interactions";
import { OVERVIEW_BAND_COLORS } from "@/lib/dashboard/overview-card-helpers";
import { ArrowRight } from "lucide-react";
import { OverviewInteractiveSurface } from "./interactive-surface";

interface BandDistributionChartProps {
  metrics: OverviewMetrics;
  benchmarkCoverage?: OverviewBenchmarkCoverage;
  interactions?: OverviewInteractionMap;
  onInteract?: (target: OverviewInteractionTarget) => void;
}

type BandRowKey = "inBand" | "aboveBand" | "belowBand";

type SegmentTooltipState = {
  target: OverviewInteractionTarget;
  rect: DOMRect;
} | null;

const useSafeLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function BandDistributionChart({
  metrics,
  benchmarkCoverage,
  interactions,
  onInteract,
}: BandDistributionChartProps) {
  const inBandCount = metrics.bandDistributionCounts.inBand;
  const aboveCount = metrics.bandDistributionCounts.above;
  const belowCount = metrics.bandDistributionCounts.below;
  const { inBand, above, below } = metrics.bandDistribution;

  const targetInBand = 75;
  const progressPct = Math.min(100, (inBand / targetInBand) * 100);
  const remainingToTarget = Math.max(0, targetInBand - inBand);
  const donutSize = 160;
  const donutStroke = 22;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutCenter = donutSize / 2;
  const tooltipId = useId();
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [segmentTooltip, setSegmentTooltip] = useState<SegmentTooltipState>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number } | null>(null);
  const canPortal = typeof document !== "undefined";

  const rows = [
    {
      key: "inBand" as const,
      label: "In Band",
      pct: inBand,
      count: inBandCount,
      color: OVERVIEW_BAND_COLORS.inBand,
      textColor: "text-[#00BC7D]",
      bgColor: OVERVIEW_BAND_COLORS.inBandBg,
      borderColor: "border-[rgba(0,188,125,0.2)]",
      target: interactions?.bandDistribution.inBand,
    },
    {
      key: "aboveBand" as const,
      label: "Above Band",
      pct: above,
      count: aboveCount,
      color: OVERVIEW_BAND_COLORS.aboveBand,
      textColor: "text-[#FE9A00]",
      bgColor: OVERVIEW_BAND_COLORS.aboveBandBg,
      borderColor: "border-[rgba(254,154,0,0.2)]",
      target: interactions?.bandDistribution.aboveBand,
    },
    {
      key: "belowBand" as const,
      label: "Below Band",
      pct: below,
      count: belowCount,
      color: OVERVIEW_BAND_COLORS.belowBand,
      textColor: "text-[#FF2056]",
      bgColor: OVERVIEW_BAND_COLORS.belowBandBg,
      borderColor: "border-[rgba(255,32,86,0.2)]",
      target: interactions?.bandDistribution.belowBand,
    },
  ];
  const donutSegments = buildDonutSegments([
    { key: "inBand", value: inBand, color: OVERVIEW_BAND_COLORS.inBand },
    { key: "aboveBand", value: above, color: OVERVIEW_BAND_COLORS.aboveBand },
    { key: "belowBand", value: below, color: OVERVIEW_BAND_COLORS.belowBand },
  ]);
  const segmentTargets = rowTargetMap(rows);

  useSafeLayoutEffect(() => {
    if (!segmentTooltip) {
      setTooltipPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = segmentTooltip.rect;
      const margin = 12;
      const tooltipWidth = tooltipRef.current?.offsetWidth ?? 280;
      const left = Math.min(
        Math.max(margin, rect.left),
        window.innerWidth - tooltipWidth - margin,
      );
      const top = rect.bottom + 10;
      setTooltipPosition({ left, top });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [segmentTooltip]);

  return (
    <Card className="rounded-[16px] border-[#EEF1F6] bg-white p-7 shadow-[0px_2px_8px_rgba(16,24,40,0.04)]">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[#111233]">Band Distribution</h3>
        <p className="text-[13px] leading-5 text-[#969799]">
          Employees by compensation band position
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[180px_1fr]">
        <div className="flex justify-center lg:justify-start">
          <svg
            width={donutSize}
            height={donutSize}
            viewBox={`0 0 ${donutSize} ${donutSize}`}
            className="block shrink-0"
            aria-labelledby={tooltipId}
          >
            <g transform={`rotate(-90 ${donutCenter} ${donutCenter})`}>
              <circle
                cx={donutCenter}
                cy={donutCenter}
                r={donutRadius}
                fill="none"
                stroke="#EEF1F6"
                strokeWidth={donutStroke}
              />
              {donutSegments.map((segment) => {
                const target = segmentTargets[segment.key];
                const isInteractive = Boolean(target) && segment.value > 0;
                const isTooltipOpen = segmentTooltip?.target.id === target?.id;

                return (
                  <g key={segment.key}>
                    <title>
                      {target
                        ? `${target.tooltip.title}: ${target.tooltip.value}. ${target.tooltip.description}`
                        : segment.key}
                    </title>
                    <circle
                    key={segment.key}
                    cx={donutCenter}
                    cy={donutCenter}
                    r={donutRadius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={donutStroke}
                    strokeDasharray={`${segment.length} ${donutCircumference}`}
                    strokeDashoffset={-segment.offset}
                    className={
                      isInteractive
                        ? "cursor-pointer transition-opacity hover:opacity-85 focus-visible:opacity-85"
                        : undefined
                    }
                    role={target ? "link" : undefined}
                    tabIndex={isInteractive ? 0 : -1}
                    aria-label={
                      target
                        ? `${target.tooltip.title}. ${target.tooltip.value}. ${target.tooltip.description}`
                        : undefined
                    }
                    aria-describedby={isTooltipOpen ? tooltipId : undefined}
                    data-testid={`band-distribution-${toTestIdKey(segment.key)}-segment-action`}
                    data-overview-action={target?.action ?? ""}
                    data-overview-target={target?.id ?? ""}
                    data-overview-href={target?.action === "link" ? target.href : ""}
                    style={isTooltipOpen ? { filter: "drop-shadow(0 0 6px rgba(92,69,253,0.35))" } : undefined}
                    onMouseEnter={(event) => {
                      if (!target) return;
                      setSegmentTooltip({
                        target,
                        rect: event.currentTarget.getBoundingClientRect(),
                      });
                    }}
                    onMouseLeave={() => setSegmentTooltip(null)}
                    onFocus={(event) => {
                      if (!target) return;
                      setSegmentTooltip({
                        target,
                        rect: event.currentTarget.getBoundingClientRect(),
                      });
                    }}
                    onBlur={() => setSegmentTooltip(null)}
                    onClick={() => {
                      if (target) {
                        onInteract?.(target);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (!target) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onInteract?.(target);
                      }
                    }}
                  />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          {rows.map((row) =>
            row.target ? (
              <OverviewInteractiveSurface
                key={row.label}
                target={row.target}
                onInteract={onInteract}
                testId={`band-distribution-${toTestIdKey(row.key)}-action`}
                tooltipTestId={`band-distribution-${toTestIdKey(row.key)}-tooltip`}
                className="cursor-pointer"
              >
                <BandDistributionRow row={row} />
              </OverviewInteractiveSurface>
            ) : (
              <BandDistributionRow key={row.label} row={row} />
            ),
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] leading-5 text-[#969799]">Target</p>
            <p className="text-[28px] font-bold leading-none text-[#111233]">{targetInBand}% In Band</p>
          </div>
          <p className="text-[13px] font-semibold leading-5 text-[#5C45FD]">
            {remainingToTarget === 0 ? "Target met" : `${remainingToTarget}% to go`}
          </p>
        </div>
        <div className="h-[10px] overflow-hidden rounded-full bg-[#E9E9F2]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #5C45FD, #5C45FD)",
            }}
          />
        </div>
        {benchmarkCoverage && benchmarkCoverage.benchmarkedEmployees < benchmarkCoverage.activeEmployees && (
          <p className="text-[12px] leading-5 text-[#969799]">
            Distribution is based on {benchmarkCoverage.benchmarkedEmployees} of {benchmarkCoverage.activeEmployees} active employees with benchmark matches.
          </p>
        )}
      </div>
      {canPortal && segmentTooltip && tooltipPosition
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className="fixed z-[85] w-[min(320px,calc(100vw-1.5rem))] rounded-2xl border border-border bg-white/95 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm"
              style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-500">
                {segmentTooltip.target.tooltip.title}
              </p>
              <p className="mt-2 text-xl font-bold leading-none text-brand-900">
                {segmentTooltip.target.tooltip.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-accent-600">
                {segmentTooltip.target.tooltip.description}
              </p>
            </div>,
            document.body,
          )
        : null}
    </Card>
  );
}

function BandDistributionRow({
  row,
}: {
  row: {
    label: string;
    pct: number;
    count: number;
    color: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
  };
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-[12px] border ${row.borderColor} px-4 py-4`}
      style={{ backgroundColor: row.bgColor }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
        <div className="min-w-0">
          <div className={`text-[28px] font-bold leading-none ${row.textColor}`}>{row.pct}%</div>
          <div className={`mt-1 text-sm font-semibold ${row.textColor}`}>{row.label}</div>
          <p className="mt-1 text-[13px] leading-5 text-[#969799]">{row.count} employees</p>
        </div>
      </div>
      <ArrowRight className={`h-4 w-4 shrink-0 ${row.textColor}`} strokeWidth={1.8} />
    </div>
  );
}

function rowTargetMap(
  rows: Array<{
    key: BandRowKey;
    target?: OverviewInteractionTarget;
  }>,
) {
  return rows.reduce(
    (map, row) => {
      map[row.key] = row.target;
      return map;
    },
    {} as Record<BandRowKey, OverviewInteractionTarget | undefined>,
  );
}

function toTestIdKey(key: BandRowKey) {
  switch (key) {
    case "inBand":
      return "in-band";
    case "aboveBand":
      return "above-band";
    case "belowBand":
      return "below-band";
  }
}

function buildDonutSegments(segments: Array<{ key: BandRowKey; value: number; color: string }>) {
  const donutSize = 160;
  const donutStroke = 22;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;

  let offset = 0;
  return segments.map((segment) => {
    const length = (segment.value / 100) * donutCircumference;
    const current = {
      ...segment,
      length,
      offset,
    };
    offset += length;
    return current;
  });
}
