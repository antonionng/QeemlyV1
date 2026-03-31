"use client";

import { useState, useMemo, useEffect } from "react";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings } from "@/lib/company";
import { fetchDbEmployees } from "@/lib/employees/data-service";
import {
  formatBenchmarkCompact,
  formatCurrency,
  toBenchmarkDisplayValue,
} from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";
import { LEVELS, type SalaryBenchmark } from "@/lib/dashboard/dummy-data";
import { useOffersStore } from "@/lib/offers/store";
import type { OfferExportPayload } from "@/lib/offers/types";
import { getBenchmark } from "@/lib/benchmarks/data-service";
import { normalizeAiBreakdown } from "@/lib/benchmarks/detail-ai";
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
  const { createOffer } = useOffersStore();
  const targetCurrency = location.currency;
  const [offerTarget] = useState<number>(
    companySettings.targetPercentile,
  );
  const [recipientMode, setRecipientMode] = useState<"employee" | "manual">("manual");
  const [employeeOptions, setEmployeeOptions] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [lastExportPayload, setLastExportPayload] = useState<OfferExportPayload | null>(null);
  const [lastOfferId, setLastOfferId] = useState<string | null>(null);
  const [levelBenchmarks, setLevelBenchmarks] = useState<Record<string, SalaryBenchmark>>({});
  const aiLevelBands = result.aiDetailBriefing?.views.offerBuilder.levelBands
    ?? result.aiDetailBriefing?.views.levelTable.levelBands
    ?? null;

  useEffect(() => {
    const loadEmployees = async () => {
      const employees = await fetchDbEmployees();
      const normalized = employees
        .filter((employee) => employee.id)
        .map((employee) => ({
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`.trim(),
          email: employee.email,
        }));
      setEmployeeOptions(normalized);

      if (normalized.length > 0) {
        setSelectedEmployeeId(normalized[0].id);
      }
    };
    void loadEmployees();
  }, []);

  const convertToMarket = (
    value: number,
    sourceCurrency: string = benchmark.currency,
    payPeriod = benchmark.payPeriod,
  ) => {
    return toBenchmarkDisplayValue(value, {
      salaryView,
      sourceCurrency,
      targetCurrency,
      payPeriod,
    });
  };

  const formatValue = (value: number) => formatCurrency(value, targetCurrency);
  const formatShort = (v: number) => {
    return formatBenchmarkCompact(v, targetCurrency);
  };

  const getOfferValue = (percentile: number): number => {
    const { p25, p50, p75, p90 } = benchmark.percentiles;
    if (percentile <= 25) return p25;
    if (percentile <= 50) return p25 + ((p50 - p25) * (percentile - 25)) / 25;
    if (percentile <= 75) return p50 + ((p75 - p50) * (percentile - 50)) / 25;
    if (percentile <= 90) return p75 + ((p90 - p75) * (percentile - 75)) / 15;
    return p90;
  };

  const offerValue = convertToMarket(getOfferValue(offerTarget));
  const negotiationBuffer = 0.04;
  const offerRange = {
    low: Math.round(offerValue * (1 - negotiationBuffer)),
    high: Math.round(offerValue * (1 + negotiationBuffer)),
  };

  /* Salary breakdown */
  const aiPackageBreakdown = normalizeAiBreakdown(
    result.aiDetailBriefing?.views.offerBuilder.packageBreakdown
      ?? result.aiDetailBriefing?.views.compMix.compensationMix
      ?? null,
  );
  const basicPercent = aiPackageBreakdown?.basicSalaryPct ?? 100;
  const housingPercent = aiPackageBreakdown?.housingPct ?? 0;
  const transportPercent = aiPackageBreakdown?.transportPct ?? 0;
  const otherPercent = aiPackageBreakdown?.otherAllowancesPct ?? 0;

  const breakdownItems = [
    { ...BREAKDOWN_COLORS[0], percent: basicPercent, amount: Math.round((offerValue * basicPercent) / 100) },
    { ...BREAKDOWN_COLORS[1], percent: housingPercent, amount: Math.round((offerValue * housingPercent) / 100) },
    { ...BREAKDOWN_COLORS[2], percent: transportPercent, amount: Math.round((offerValue * transportPercent) / 100) },
    { ...BREAKDOWN_COLORS[3], percent: otherPercent, amount: offerValue - Math.round((offerValue * basicPercent) / 100) - Math.round((offerValue * housingPercent) / 100) - Math.round((offerValue * transportPercent) / 100) },
  ];

  /* Box plot data for adjacent levels */
  const shownLevels = useMemo(() => {
    const idx = LEVELS.findIndex((l) => l.id === level.id);
    const start = Math.max(0, idx - 1);
    const end = Math.min(LEVELS.length, idx + 2);
    return LEVELS.slice(start, end);
  }, [level.id]);

  const aiLevelBenchmarks = useMemo(
    () =>
      Object.fromEntries(
        (aiLevelBands ?? [])
          .filter((band) => shownLevels.some((entry) => entry.id === band.levelId))
          .map((band) => [
            band.levelId,
            {
              roleId: role.id,
              locationId: location.id,
              levelId: band.levelId,
              currency: benchmark.currency,
              payPeriod: "annual" as const,
              sourcePayPeriod: "annual" as const,
              percentiles: {
                p10: band.p10,
                p25: band.p25,
                p50: band.p50,
                p75: band.p75,
                p90: band.p90,
              },
              sampleSize: 0,
              confidence: "Medium" as const,
              lastUpdated: benchmark.lastUpdated,
              momChange: 0,
              yoyChange: 0,
              trend: [],
              benchmarkSource: "ai-estimated" as const,
            },
          ]),
      ) as Record<string, SalaryBenchmark>,
    [aiLevelBands, benchmark.currency, benchmark.lastUpdated, location.id, role.id, shownLevels],
  );

  useEffect(() => {
    if (Object.keys(aiLevelBenchmarks).length > 0) {
      setLevelBenchmarks(aiLevelBenchmarks);
      return;
    }

    const run = async () => {
      const entries = await Promise.all(
        shownLevels.map(async (lvl) => {
          const bm = await getBenchmark(role.id, location.id, lvl.id, {
            industry: result.formData.industry,
            companySize: result.formData.companySize,
          });
          return bm ? { levelId: lvl.id, benchmark: bm } : null;
        }),
      );
      const next: Record<string, SalaryBenchmark> = {};
      for (const entry of entries) {
        if (!entry) continue;
        next[entry.levelId] = entry.benchmark;
      }
      setLevelBenchmarks(next);
    };
    void run();
  }, [aiLevelBenchmarks, location.id, result.formData.companySize, result.formData.industry, role.id, shownLevels]);

  const downloadExportPayload = (payload: OfferExportPayload, offerId: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qeemly_offer_${offerId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateOffer = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const isEmployeeMode = recipientMode === "employee";
    if (isEmployeeMode && !selectedEmployeeId) {
      setIsSubmitting(false);
      setSubmitError("Select an employee recipient.");
      return;
    }
    if (!isEmployeeMode && (!recipientName.trim() || !recipientEmail.trim())) {
      setIsSubmitting(false);
      setSubmitError("Enter recipient name and email.");
      return;
    }

    const breakdownSnapshot = {
      basic: { percent: basicPercent, amount: Math.round((offerValue * basicPercent) / 100) },
      housing: { percent: housingPercent, amount: Math.round((offerValue * housingPercent) / 100) },
      transport: { percent: transportPercent, amount: Math.round((offerValue * transportPercent) / 100) },
      other: { percent: otherPercent, amount: offerValue - Math.round((offerValue * basicPercent) / 100) - Math.round((offerValue * housingPercent) / 100) - Math.round((offerValue * transportPercent) / 100) },
      total_compensation: offerValue,
    };

    const created = await createOffer({
      employee_id: isEmployeeMode ? selectedEmployeeId : null,
      recipient_name: isEmployeeMode ? null : recipientName.trim(),
      recipient_email: isEmployeeMode ? null : recipientEmail.trim(),
      role_id: role.id,
      level_id: level.id,
      location_id: location.id,
      employment_type: result.formData.employmentType,
      target_percentile: offerTarget,
      offer_value: offerValue,
      offer_low: offerRange.low,
      offer_high: offerRange.high,
      currency: targetCurrency,
      salary_breakdown: breakdownSnapshot,
      benchmark_snapshot: {
        benchmark_percentiles: benchmark.percentiles,
        benchmark_source: benchmark.benchmarkSource || "market",
        sample_size: benchmark.sampleSize,
        confidence: benchmark.confidence,
        last_updated: benchmark.lastUpdated,
        role,
        level,
        location,
        form_data: result.formData as unknown as Record<string, unknown>,
      },
      export_format: "JSON",
      status: "ready",
    });

    setIsSubmitting(false);
    if (!created) {
      setSubmitError("Unable to create offer. Please try again.");
      return;
    }

    setLastOfferId(created.offer.id);
    setLastExportPayload(created.exportPayload);
    setSubmitSuccess("Offer created successfully.");
  };

  return (
    <div id="offer-builder-view" className="space-y-6">
      <div className="bench-section">
        <div className="text-xs text-brand-500 mb-4">
          {role.title} · {level.name} · {location.city}, {location.country} ·{" "}
          {result.formData.employmentType === "expat" ? "Expat" : "National"}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
              Target percentile
            </p>
            <div className="mt-3 text-2xl font-bold text-brand-900">P{offerTarget}</div>
            <p className="mt-2 text-sm text-brand-600">
              Based on your workspace compensation policy.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
              Recommended package
            </p>
            <div className="mt-3 text-2xl font-bold text-brand-900">
              {formatValue(offerValue)}
            </div>
            <p className="mt-2 text-sm text-brand-600">
              Anchor point before negotiation or recruiter calibration.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
              Negotiation range
            </p>
            <div className="mt-3 text-2xl font-bold text-brand-900">
              {formatValue(offerRange.low)} to {formatValue(offerRange.high)}
            </div>
            <p className="mt-2 text-sm text-brand-600">
              A 4% buffer on either side of the recommendation.
            </p>
          </div>
        </div>
      </div>

      <div className="bench-section">
        <div className="flex items-center justify-between gap-3 pb-4">
          <div>
            <h3 className="bench-section-header pb-0">Package breakdown</h3>
            <p className="mt-2 text-sm text-brand-600">
              Keep the package readable. The main salary stays dominant, with allowances shown as a
              simple split instead of a decorative chart.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-brand-500">Total compensation</p>
            <p className="text-lg font-bold text-brand-900">{formatValue(offerValue)}</p>
          </div>
        </div>

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
      </div>

      <div className="bench-section space-y-4">
        <div>
          <h3 className="bench-section-header pb-0">Create offer</h3>
          <p className="mt-2 text-sm text-brand-600">
            Pick a recipient, then create a stored offer package from this benchmark. Export becomes
            available after the offer is created.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRecipientMode("employee")}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-semibold",
              recipientMode === "employee"
                ? "bg-brand-500 text-white"
                : "bg-brand-50 text-brand-700"
            )}
          >
            Employee recipient
          </button>
          <button
            type="button"
            onClick={() => setRecipientMode("manual")}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-semibold",
              recipientMode === "manual"
                ? "bg-brand-500 text-white"
                : "bg-brand-50 text-brand-700"
            )}
          >
            Manual recipient
          </button>
        </div>

        {recipientMode === "employee" ? (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-brand-700">
              Select employee
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-brand-900"
            >
              {employeeOptions.length === 0 ? (
                <option value="">No employees found. Use Manual recipient.</option>
              ) : (
                employeeOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} {employee.email ? `(${employee.email})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-700">
                Recipient name
              </label>
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-brand-900"
                placeholder="Candidate name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-700">
                Recipient email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-brand-900"
                placeholder="candidate@company.com"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCreateOffer}
            disabled={isSubmitting}
            className="bench-cta max-w-xs disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Create Offer"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {submitError && <p className="text-sm font-medium text-red-600">{submitError}</p>}
        {submitSuccess && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="text-sm font-semibold text-emerald-800">{submitSuccess}</p>
            <p className="mt-1 text-sm text-emerald-700">
              The offer is saved in Qeemly and ready for export or downstream review.
            </p>
            {lastExportPayload && lastOfferId && (
              <button
                type="button"
                onClick={() => downloadExportPayload(lastExportPayload, lastOfferId)}
                className="mt-4 rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700"
              >
                Download Export JSON
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bench-section">
        <div className="pb-4">
          <h3 className="bench-section-header pb-0">Market anchor by adjacent levels</h3>
          <p className="mt-2 text-sm text-brand-600">
            Check the proposed package against nearby seniority levels before sending the offer.
          </p>
          <p className="mt-2 text-xs text-brand-500">
            {Object.keys(aiLevelBenchmarks).length > 0
              ? "AI-derived adjacent-level anchors are being used for this market view."
              : "Anchors are being loaded from segmented market benchmark rows for adjacent levels."}
          </p>
        </div>
        <div className="space-y-8">
          {shownLevels.map((lvl) => {
            const bench = levelBenchmarks[lvl.id];
            if (!bench) return null;
            const p10 = convertToMarket(bench.percentiles.p10, bench.currency, bench.payPeriod);
            const p25 = convertToMarket(bench.percentiles.p25, bench.currency, bench.payPeriod);
            const p50 = convertToMarket(bench.percentiles.p50, bench.currency, bench.payPeriod);
            const p75 = convertToMarket(bench.percentiles.p75, bench.currency, bench.payPeriod);
            const p90 = convertToMarket(bench.percentiles.p90, bench.currency, bench.payPeriod);

            const gMin = p10 * 0.85;
            const gMax = p90 * 1.15;
            const pct = (v: number) =>
              Math.max(0, Math.min(100, ((v - gMin) / (gMax - gMin)) * 100));

            const isSelected = lvl.id === level.id;
            const tgtVal = isSelected ? convertToMarket(getOfferValue(offerTarget)) : p50;

            return (
              <div key={lvl.id}>
                <div className="text-xs font-medium text-brand-700 mb-2">
                  {lvl.name}
                </div>

                <div className="relative h-10">
                  {/* whisker line */}
                  <div
                    className="absolute top-1/2 h-[2px] bg-brand-300 -translate-y-1/2"
                    style={{
                      left: `${pct(p10)}%`,
                      width: `${pct(p90) - pct(p10)}%`,
                    }}
                  />
                  <div className="bench-boxplot-whisker" style={{ left: `${pct(p10)}%` }} />
                  <div className="bench-boxplot-whisker" style={{ left: `${pct(p90)}%` }} />
                  <div
                    className="bench-boxplot-box"
                    style={{
                      left: `${pct(p25)}%`,
                      width: `${pct(p75) - pct(p25)}%`,
                    }}
                  />
                  <div className="bench-boxplot-median" style={{ left: `${pct(p50)}%` }} />
                  {isSelected && (
                    <div className="bench-boxplot-target" style={{ left: `${pct(tgtVal)}%` }}>
                      {offerTarget}
                    </div>
                  )}
                </div>

                {/* Axis ticks */}
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
      </div>

      <SharedAiCallout section={result.aiDetailBriefing?.views.offerBuilder} />
    </div>
  );
}
