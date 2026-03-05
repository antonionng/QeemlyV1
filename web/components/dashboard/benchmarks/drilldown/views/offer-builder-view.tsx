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

  const [basicPercent] = useState<number>(100);

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

  const convertToMarket = (value: number, sourceCurrency: string = benchmark.currency) => {
    return toBenchmarkDisplayValue(value, {
      salaryView,
      sourceCurrency,
      targetCurrency,
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
  const remainingPercent = 100 - basicPercent;
  const housingPercent = Math.round(remainingPercent * 0.6);
  const transportPercent = Math.round(remainingPercent * 0.25);
  const otherPercent = remainingPercent - housingPercent - transportPercent;

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

  useEffect(() => {
    const run = async () => {
      const entries = await Promise.all(
        shownLevels.map(async (lvl) => {
          const bm = await getBenchmark(role.id, location.id, lvl.id);
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
  }, [location.id, role.id, shownLevels]);

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
        role,
        level,
        location,
        form_data: result.formData,
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
      {/* ── Top: Context + Summary ── */}
      <div className="bench-section">
        <div className="text-xs text-brand-500 mb-4">
          {role.title} · {level.name} · {location.city}, {location.country} ·{" "}
          {result.formData.employmentType === "expat" ? "Expat" : "National"}
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Negotiation range */}
          <div className="flex-1 rounded-xl bg-brand-50 p-5">
            <p className="text-xs font-semibold text-brand-700 mb-1">
              recommended offer
            </p>
            <p className="text-xs font-semibold text-brand-700">
              negotiation range
            </p>
            <div className="mt-3 text-lg font-bold text-brand-900">
              {formatValue(offerRange.low)} – {formatValue(offerRange.high)}
            </div>
          </div>

          {/* Breakdown card */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-brand-700 mb-2">
              Salary Breakdown
            </p>
            <p className="text-[10px] text-brand-400 mb-3">
              {level.name} · {location.city} · at P{offerTarget}
            </p>

            <div className="flex items-start gap-5">
              {/* Legend + values */}
              <div className="flex-1 space-y-2">
                {breakdownItems.map((item) => {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-sm ${item.bg}`}
                        />
                        <span className={`font-medium ${item.label}`}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-brand-400">{item.percent}%</span>
                        <span className="font-semibold text-brand-900 w-16 text-right">
                          {formatShort(item.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-semibold text-brand-900">
                  <span>Total Compensation</span>
                  <span>{formatShort(offerValue)}</span>
                </div>
              </div>

              {/* Donut placeholder */}
              <div className="bench-donut shrink-0" style={{
                background: `conic-gradient(
                  var(--color-brand-500) 0% ${basicPercent}%,
                  #2dd4bf ${basicPercent}% ${basicPercent + housingPercent}%,
                  #fbbf24 ${basicPercent + housingPercent}% ${basicPercent + housingPercent + transportPercent}%,
                  #f472b6 ${basicPercent + housingPercent + transportPercent}% 100%
                )`,
              }}>
                <div className="absolute inset-3 rounded-full bg-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Offer recipient + submit ── */}
      <div className="bench-section space-y-4">
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

          {lastExportPayload && lastOfferId && (
            <button
              type="button"
              onClick={() => downloadExportPayload(lastExportPayload, lastOfferId)}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-brand-700"
            >
              Download Export JSON
            </button>
          )}
        </div>

        {submitError && <p className="text-sm font-medium text-red-600">{submitError}</p>}
        {submitSuccess && <p className="text-sm font-medium text-emerald-700">{submitSuccess}</p>}
      </div>

      {/* ── Box Plots for adjacent levels ── */}
      <div className="bench-section">
        <div className="space-y-8">
          {shownLevels.map((lvl) => {
            const bench = levelBenchmarks[lvl.id];
            if (!bench) return null;
            const p10 = convertToMarket(bench.percentiles.p10, bench.currency);
            const p25 = convertToMarket(bench.percentiles.p25, bench.currency);
            const p50 = convertToMarket(bench.percentiles.p50, bench.currency);
            const p75 = convertToMarket(bench.percentiles.p75, bench.currency);
            const p90 = convertToMarket(bench.percentiles.p90, bench.currency);

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
    </div>
  );
}
