"use client";

import { Card } from "@/components/ui/card";
import {
  roundDistributionPercentages,
  type OverviewBenchmarkCoverage,
  type OverviewMetrics,
} from "@/lib/dashboard/company-overview";
import { OVERVIEW_BAND_COLORS } from "@/lib/dashboard/overview-card-helpers";
import { ArrowRight } from "lucide-react";

interface BandDistributionChartProps {
  metrics: OverviewMetrics;
  benchmarkCoverage?: OverviewBenchmarkCoverage;
}

export function BandDistributionChart({ metrics, benchmarkCoverage }: BandDistributionChartProps) {
  const inBandCount = metrics.bandDistributionCounts.inBand;
  const aboveCount = metrics.bandDistributionCounts.above;
  const belowCount = metrics.bandDistributionCounts.below;
  const distribution = roundDistributionPercentages({
    inBand: inBandCount,
    above: aboveCount,
    below: belowCount,
  });
  const { inBand, below, above } = distribution;

  const targetInBand = 75;
  const progressPct = Math.min(100, (inBand / targetInBand) * 100);
  const remainingToTarget = Math.max(0, targetInBand - inBand);
  const donutSize = 160;
  const donutStroke = 22;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutCenter = donutSize / 2;

  const rows = [
    {
      label: "In Band",
      pct: inBand,
      count: inBandCount,
      color: OVERVIEW_BAND_COLORS.inBand,
      textColor: "text-[#1F8F6A]",
      bgColor: "#E7F6F1",
      borderColor: "border-[#C6EDE1]",
    },
    {
      label: "Above Band",
      pct: above,
      count: aboveCount,
      color: OVERVIEW_BAND_COLORS.aboveBand,
      textColor: "text-[#B56A00]",
      bgColor: "#FFF3E3",
      borderColor: "border-[#FFE0B2]",
    },
    {
      label: "Below Band",
      pct: below,
      count: belowCount,
      color: OVERVIEW_BAND_COLORS.belowBand,
      textColor: "text-[#C72C4D]",
      bgColor: "#FFE6EB",
      borderColor: "border-[#FFC9D4]",
    },
  ];

  return (
    <Card className="rounded-[16px] border-[#EEF1F6] bg-white p-7 shadow-[0px_2px_8px_rgba(16,24,40,0.04)]">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[#111827]">Band Distribution</h3>
        <p className="text-[13px] leading-5 text-[#6B7280]">
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
            aria-hidden="true"
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
              {buildDonutSegments([
                { value: inBand, color: OVERVIEW_BAND_COLORS.inBand },
                { value: above, color: OVERVIEW_BAND_COLORS.aboveBand },
                { value: below, color: OVERVIEW_BAND_COLORS.belowBand },
              ]).map((segment) => (
                <circle
                  key={segment.color}
                  cx={donutCenter}
                  cy={donutCenter}
                  r={donutRadius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={donutStroke}
                  strokeDasharray={`${segment.length} ${donutCircumference}`}
                  strokeDashoffset={-segment.offset}
                />
              ))}
            </g>
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between gap-4 rounded-[12px] border ${row.borderColor} px-4 py-4`}
              style={{ backgroundColor: row.bgColor }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <div className="min-w-0">
                  <div className={`text-[28px] font-bold leading-none ${row.textColor}`}>{row.pct}%</div>
                  <div className={`mt-1 text-sm font-semibold ${row.textColor}`}>{row.label}</div>
                  <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">{row.count} employees</p>
                </div>
              </div>
              <ArrowRight className={`h-4 w-4 shrink-0 ${row.textColor}`} strokeWidth={1.8} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] leading-5 text-[#6B7280]">Target</p>
            <p className="text-[28px] font-bold leading-none text-[#111827]">{targetInBand}% In Band</p>
          </div>
          <p className="text-[13px] font-semibold leading-5 text-[#6B5BFF]">
            {remainingToTarget === 0 ? "Target met" : `${remainingToTarget}% to go`}
          </p>
        </div>
        <div className="h-[10px] overflow-hidden rounded-full bg-[#E9E9F2]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #6B5BFF, #4C5CE7)",
            }}
          />
        </div>
        {benchmarkCoverage && benchmarkCoverage.benchmarkedEmployees < benchmarkCoverage.activeEmployees && (
          <p className="text-[12px] leading-5 text-[#6B7280]">
            Distribution is based on {benchmarkCoverage.benchmarkedEmployees} of {benchmarkCoverage.activeEmployees} active employees with benchmark matches.
          </p>
        )}
      </div>
    </Card>
  );
}

function buildDonutSegments(segments: Array<{ value: number; color: string }>) {
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
