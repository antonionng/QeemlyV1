"use client";

import { useState, useMemo } from "react";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings } from "@/lib/company";
import {
  formatBenchmarkCompact,
  formatCurrency,
  toBenchmarkDisplayValue,
} from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";
import { LEVELS } from "@/lib/dashboard/dummy-data";
import { ModuleStateBanner } from "../module-state-banner";
import { SharedAiCallout } from "../shared-ai-callout";

interface OfferBuilderViewProps {
  result: BenchmarkResult;
}

const BREAKDOWN_COLORS = [
  { bg: "bg-brand-500", label: "text-brand-700", name: "Basic Salary" },
  { bg: "bg-teal-400", label: "text-teal-700", name: "Housing" },
  { bg: "bg-amber-400", label: "text-amber-700", name: "Transport" },
  { bg: "bg-pink-400", label: "text-pink-700", name: "Other Allowances" },
];

export function OfferBuilderView({ result }: OfferBuilderViewProps) {
  const { benchmark, role, level, location } = result;
  const companySettings = useCompanySettings();
  const { salaryView } = useSalaryView();
  const targetCurrency = location.currency;

  const mod = result.detailSurface?.modules.offerBuilder;
  const isLoading = !mod || result.detailSurfaceStatus === "loading";
  const breakdown = mod?.data.breakdown;
  const adjacentLevels = mod?.data.adjacentLevels ?? [];

  const [offerTarget] = useState<number>(companySettings.targetPercentile);

  const convertToMarket = (
    value: number,
    sourceCurrency: string = benchmark.currency,
    payPeriod = benchmark.payPeriod,
  ) =>
    toBenchmarkDisplayValue(value, {
      salaryView,
      sourceCurrency,
      targetCurrency,
      payPeriod,
    });

  const formatValue = (value: number) => formatCurrency(value, targetCurrency);
  const formatShort = (v: number) => formatBenchmarkCompact(v, targetCurrency);

  const getRawOfferValue = (percentile: number): number => {
    const { p25, p50, p75, p90 } = benchmark.percentiles;
    if (percentile <= 25) return p25;
    if (percentile <= 50) return p25 + ((p50 - p25) * (percentile - 25)) / 25;
    if (percentile <= 75) return p50 + ((p75 - p50) * (percentile - 50)) / 25;
    if (percentile <= 90) return p75 + ((p90 - p75) * (percentile - 75)) / 15;
    return p90;
  };

  const offerValue = convertToMarket(getRawOfferValue(offerTarget));
  const negotiationBuffer = 0.04;
  const offerRange = {
    low: Math.round(offerValue * (1 - negotiationBuffer)),
    high: Math.round(offerValue * (1 + negotiationBuffer)),
  };

  const basicPercent = breakdown?.basicSalaryPct ?? 100;
  const housingPercent = breakdown?.housingPct ?? 0;
  const transportPercent = breakdown?.transportPct ?? 0;
  const otherPercent = breakdown?.otherAllowancesPct ?? 0;

  const breakdownItems = [
    { ...BREAKDOWN_COLORS[0], percent: basicPercent, amount: Math.round((offerValue * basicPercent) / 100) },
    { ...BREAKDOWN_COLORS[1], percent: housingPercent, amount: Math.round((offerValue * housingPercent) / 100) },
    { ...BREAKDOWN_COLORS[2], percent: transportPercent, amount: Math.round((offerValue * transportPercent) / 100) },
    {
      ...BREAKDOWN_COLORS[3],
      percent: otherPercent,
      amount:
        offerValue -
        Math.round((offerValue * basicPercent) / 100) -
        Math.round((offerValue * housingPercent) / 100) -
        Math.round((offerValue * transportPercent) / 100),
    },
  ];

  const shownLevels = useMemo(() => {
    const idx = LEVELS.findIndex((l) => l.id === level.id);
    const start = Math.max(0, idx - 1);
    const end = Math.min(LEVELS.length, idx + 2);
    return LEVELS.slice(start, end);
  }, [level.id]);

  return (
    <div id="offer-builder-view" className="space-y-6">
      <div className="bench-section">
        <div className="text-xs text-brand-500 mb-4">
          {role.title} · {level.name} · {location.city}, {location.country} ·{" "}
          {result.formData.employmentType === "expat" ? "Expat" : "National"}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Target percentile</p>
            <div className="mt-3 text-2xl font-bold text-brand-900">P{offerTarget}</div>
            <p className="mt-2 text-sm text-brand-600">Based on your workspace compensation policy.</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Recommended package</p>
            <div className="mt-3 text-2xl font-bold text-brand-900">{formatValue(offerValue)}</div>
            <p className="mt-2 text-sm text-brand-600">Anchor point before negotiation or recruiter calibration.</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Negotiation range</p>
            <div className="mt-3 text-2xl font-bold text-brand-900">
              {formatValue(offerRange.low)} to {formatValue(offerRange.high)}
            </div>
            <p className="mt-2 text-sm text-brand-600">A 4% buffer on either side of the recommendation.</p>
          </div>
        </div>
      </div>

      <div className="bench-section">
        <div className="flex items-center justify-between gap-3 pb-4">
          <div>
            <h3 className="bench-section-header pb-0">Package breakdown</h3>
            <p className="mt-2 text-sm text-brand-600">
              Keep the package readable. The main salary stays dominant, with allowances shown as a simple split instead of a decorative chart.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-brand-500">Total compensation</p>
            <p className="text-lg font-bold text-brand-900">{formatValue(offerValue)}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4 text-sm text-brand-700">
            Qeemly AI is preparing the package breakdown for this market view.
          </div>
        ) : (
          <>
            <div className="mb-5 flex h-4 overflow-hidden rounded-full bg-brand-100">
              {breakdownItems.map((item) => (
                <div
                  key={item.name}
                  className={item.bg}
                  style={{ width: `${item.percent}%` }}
                  title={`${item.name}: ${formatValue(item.amount)} (${item.percent}%)`}
                />
              ))}
            </div>

            <div className="space-y-3">
              {breakdownItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface-1 px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${item.bg}`} />
                    <div>
                      <p className={`font-medium ${item.label}`}>{item.name}</p>
                      <p className="text-xs text-brand-500">{item.percent}% of total package</p>
                    </div>
                  </div>
                  <div className="font-semibold text-brand-900">{formatShort(item.amount)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bench-section">
        <div className="pb-4">
          <h3 className="bench-section-header pb-0">Market anchor by adjacent levels</h3>
          <p className="mt-2 text-sm text-brand-600">
            Check the proposed package against nearby seniority levels before sending the offer.
          </p>
        </div>
        {isLoading ? (
          <ModuleStateBanner variant="loading" message="Qeemly AI is preparing adjacent-level anchors for this market view." />
        ) : adjacentLevels.length === 0 ? (
          <ModuleStateBanner variant="info" message="No adjacent level data available for box plots." />
        ) : (
          <div className="space-y-8">
            {shownLevels.map((lvl) => {
              const band = adjacentLevels.find((al) => al.levelId === lvl.id);
              if (!band) return null;
              const p10 = convertToMarket(band.p25 * 0.85);
              const p25 = convertToMarket(band.p25);
              const p50 = convertToMarket(band.p50);
              const p75 = convertToMarket(band.p75);
              const p90 = convertToMarket(band.p90);

              const gMin = p10 * 0.85;
              const gMax = p90 * 1.15;
              const pct = (v: number) => Math.max(0, Math.min(100, ((v - gMin) / (gMax - gMin)) * 100));

              const isSelected = lvl.id === level.id;
              const tgtVal = isSelected ? convertToMarket(getRawOfferValue(offerTarget)) : p50;

              return (
                <div key={lvl.id}>
                  <div className="text-xs font-medium text-brand-700 mb-2">{lvl.name}</div>

                  <div className="relative h-10">
                    <div
                      className="absolute top-1/2 h-[2px] bg-brand-300 -translate-y-1/2"
                      style={{ left: `${pct(p10)}%`, width: `${pct(p90) - pct(p10)}%` }}
                    />
                    <div className="bench-boxplot-whisker" style={{ left: `${pct(p10)}%` }} />
                    <div className="bench-boxplot-whisker" style={{ left: `${pct(p90)}%` }} />
                    <div
                      className="bench-boxplot-box"
                      style={{ left: `${pct(p25)}%`, width: `${pct(p75) - pct(p25)}%` }}
                    />
                    <div className="bench-boxplot-median" style={{ left: `${pct(p50)}%` }} />
                    {isSelected && (
                      <div className="bench-boxplot-target" style={{ left: `${pct(tgtVal)}%` }}>
                        {offerTarget}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-[9px] text-brand-400 mt-1">
                    <span>{formatShort(p10)}</span>
                    <span>{formatShort(p25)}</span>
                    <span>{formatShort(p50)}</span>
                    <span>{formatShort(p75)}</span>
                    <span>{formatShort(p90)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SharedAiCallout section={mod?.narrative} />
    </div>
  );
}
