"use client";

import { useState, useMemo, useEffect } from "react";
import clsx from "clsx";
import {
  ArrowRight,
  ArrowLeft,
  Briefcase,
  MapPin,
  User,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings } from "@/lib/company";
import {
  formatBenchmarkCompact,
  formatCurrency,
  toBenchmarkDisplayValue,
} from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";
import { LEVELS } from "@/lib/dashboard/dummy-data";
import { useOffersStore } from "@/lib/offers/store";
import { fetchDbEmployees } from "@/lib/employees/data-service";

type BuilderStep = "context" | "recipient" | "review" | "complete";

interface OfferBuilderWorkspaceProps {
  result: BenchmarkResult;
}

const BREAKDOWN_COLORS = [
  { bg: "bg-brand-500", label: "text-brand-700", name: "Basic Salary" },
  { bg: "bg-teal-400", label: "text-teal-700", name: "Housing" },
  { bg: "bg-amber-400", label: "text-amber-700", name: "Transport" },
  { bg: "bg-pink-400", label: "text-pink-700", name: "Other Allowances" },
];

const STEPS: { id: BuilderStep; label: string; number: number }[] = [
  { id: "context", label: "Position", number: 1 },
  { id: "recipient", label: "Recipient", number: 2 },
  { id: "review", label: "Review", number: 3 },
  { id: "complete", label: "Complete", number: 4 },
];

const PERCENTILE_OPTIONS = [25, 50, 75, 90] as const;

export function OfferBuilderWorkspace({ result }: OfferBuilderWorkspaceProps) {
  const { benchmark, role, level, location } = result;
  const companySettings = useCompanySettings();
  const { salaryView } = useSalaryView();
  const { createOffer } = useOffersStore();
  const targetCurrency = location.currency;

  const mod = result.detailSurface?.modules.offerBuilder;
  const breakdown = mod?.data.breakdown;
  const adjacentLevels = mod?.data.adjacentLevels ?? [];

  const [step, setStep] = useState<BuilderStep>("context");
  const [offerTarget, setOfferTarget] = useState<number>(companySettings.targetPercentile);
  const [recipientMode, setRecipientMode] = useState<"employee" | "manual">(
    "manual",
  );
  const [employeeOptions, setEmployeeOptions] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastOfferId, setLastOfferId] = useState<string | null>(null);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  const navigateToStep = (target: BuilderStep) => {
    if (target === "complete") return;
    setSubmitError(null);
    setStep(target);
  };

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoadingEmployees(true);
      setEmployeesError(null);
      try {
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
      } catch {
        setEmployeesError("Unable to load employee recipients right now.");
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    void loadEmployees();
  }, []);

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

  const rawOfferValue = Math.round(getRawOfferValue(offerTarget));
  const rawOfferLow = Math.round(rawOfferValue * 0.96);
  const rawOfferHigh = Math.round(rawOfferValue * 1.04);

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
    {
      ...BREAKDOWN_COLORS[0],
      percent: basicPercent,
      amount: Math.round((offerValue * basicPercent) / 100),
    },
    {
      ...BREAKDOWN_COLORS[1],
      percent: housingPercent,
      amount: Math.round((offerValue * housingPercent) / 100),
    },
    {
      ...BREAKDOWN_COLORS[2],
      percent: transportPercent,
      amount: Math.round((offerValue * transportPercent) / 100),
    },
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

  const downloadPdf = async (offerId: string) => {
    setIsPdfDownloading(true);
    try {
      const res = await fetch(`/api/offers/${offerId}/pdf`);
      if (!res.ok) {
        throw new Error("PDF generation failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qeemly_offer_${offerId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setSubmitError("Unable to download PDF. Please try again.");
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const validateRecipient = (): string | null => {
    if (recipientMode === "employee" && !selectedEmployeeId) {
      return "Select an employee recipient.";
    }
    if (recipientMode === "manual") {
      if (!recipientName.trim()) return "Enter a recipient name.";
      if (!recipientEmail.trim()) return "Enter a recipient email.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
        return "Enter a valid email address.";
      }
    }
    return null;
  };

  const handleCreateOffer = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const isEmployeeMode = recipientMode === "employee";

    const breakdownSnapshot = {
      basic: {
        percent: basicPercent,
        amount: Math.round((offerValue * basicPercent) / 100),
      },
      housing: {
        percent: housingPercent,
        amount: Math.round((offerValue * housingPercent) / 100),
      },
      transport: {
        percent: transportPercent,
        amount: Math.round((offerValue * transportPercent) / 100),
      },
      other: {
        percent: otherPercent,
        amount:
          offerValue -
          Math.round((offerValue * basicPercent) / 100) -
          Math.round((offerValue * housingPercent) / 100) -
          Math.round((offerValue * transportPercent) / 100),
      },
      total_compensation: offerValue,
    };

    const snapshotBenchmarkSource =
      benchmark.benchmarkSource === "uploaded" ? "uploaded" : "market";

    const result_ = await createOffer({
      employee_id: isEmployeeMode ? selectedEmployeeId : null,
      recipient_name: isEmployeeMode ? null : recipientName.trim(),
      recipient_email: isEmployeeMode ? null : recipientEmail.trim(),
      role_id: role.id,
      level_id: level.id,
      location_id: location.id,
      employment_type: result.formData.employmentType,
      target_percentile: offerTarget,
      offer_value: rawOfferValue,
      offer_low: rawOfferLow,
      offer_high: rawOfferHigh,
      currency: benchmark.currency,
      salary_breakdown: breakdownSnapshot,
      benchmark_snapshot: {
        benchmark_percentiles: benchmark.percentiles,
        benchmark_source: snapshotBenchmarkSource,
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
    if ("error" in result_) {
      setSubmitError(result_.error);
      return;
    }

    setLastOfferId(result_.offer.id);
    setStep("complete");
  };

  const goToRecipient = () => setStep("recipient");

  const goToReview = () => {
    const error = validateRecipient();
    if (error) {
      setSubmitError(error);
      return;
    }
    setSubmitError(null);
    setStep("review");
  };

  const recipientLabel =
    recipientMode === "employee"
      ? employeeOptions.find((e) => e.id === selectedEmployeeId)?.name ||
        "Employee"
      : recipientName || "Manual recipient";

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="bench-section">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const isActive = s.id === step;
            const isComplete = i < currentStepIndex;
            const canNavigate = isComplete && step !== "complete";
            return (
              <div key={s.id} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  disabled={!canNavigate}
                  onClick={() => canNavigate && navigateToStep(s.id)}
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    isActive && "bg-brand-500 text-white",
                    isComplete && "bg-emerald-500 text-white",
                    !isActive && !isComplete && "bg-brand-100 text-brand-400",
                    canNavigate && "cursor-pointer hover:ring-2 hover:ring-emerald-300",
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    s.number
                  )}
                </button>
                <button
                  type="button"
                  disabled={!canNavigate}
                  onClick={() => canNavigate && navigateToStep(s.id)}
                  className={clsx(
                    "hidden text-sm font-medium sm:inline",
                    isActive && "text-brand-900",
                    isComplete && "text-emerald-700",
                    !isActive && !isComplete && "text-brand-400",
                    canNavigate && "cursor-pointer hover:underline",
                  )}
                >
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={clsx(
                      "mx-2 h-px flex-1",
                      i < currentStepIndex ? "bg-emerald-300" : "bg-brand-100",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Position context */}
      {step === "context" && (
        <div className="space-y-6">
          <div className="bench-section">
            <h3 className="bench-section-header">Position details</h3>
            <p className="mb-6 text-sm text-brand-600">
              Review the benchmark position that will anchor this offer.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-surface-1 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-500">
                  <Briefcase className="h-3.5 w-3.5" />
                  Role
                </div>
                <p className="text-sm font-bold text-brand-900">
                  {role.title}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-1 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-500">
                  <Briefcase className="h-3.5 w-3.5" />
                  Level
                </div>
                <p className="text-sm font-bold text-brand-900">
                  {level.name}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-1 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-500">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </div>
                <p className="text-sm font-bold text-brand-900">
                  {location.city}, {location.country}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-1 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-500">
                  <User className="h-3.5 w-3.5" />
                  Type
                </div>
                <p className="text-sm font-bold text-brand-900">
                  {result.formData.employmentType === "expat"
                    ? "Expat"
                    : "National"}
                </p>
              </div>
            </div>
          </div>

          <div className="bench-section">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                  Target percentile
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {PERCENTILE_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOfferTarget(p)}
                      className={clsx(
                        "rounded-lg px-3 py-1.5 text-sm font-bold transition-colors",
                        offerTarget === p
                          ? "bg-brand-500 text-white shadow-sm"
                          : "bg-white text-brand-700 hover:bg-brand-100",
                      )}
                    >
                      P{p}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-brand-600">
                  Adjust to change the recommended package.
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

          {/* Package breakdown */}
          <div className="bench-section">
            <div className="flex items-center justify-between gap-3 pb-4">
              <div>
                <h3 className="bench-section-header pb-0">
                  Package breakdown
                </h3>
                <p className="mt-2 text-sm text-brand-600">
                  The salary split across allowance categories for this market
                  and location.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-brand-500">Total compensation</p>
                <p className="text-lg font-bold text-brand-900">
                  {formatValue(offerValue)}
                </p>
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
                      <p className={`font-medium ${item.label}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-brand-500">
                        {item.percent}% of total package
                      </p>
                    </div>
                  </div>
                  <div className="font-semibold text-brand-900">
                    {formatShort(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adjacent levels */}
          {adjacentLevels.length > 0 && (
            <div className="bench-section">
              <h3 className="bench-section-header">
                Market anchor by adjacent levels
              </h3>
              <p className="mb-4 text-sm text-brand-600">
                Check the proposed package against nearby seniority levels.
              </p>
              <div className="space-y-8">
                {shownLevels.map((lvl) => {
                  const band = adjacentLevels.find(
                    (al) => al.levelId === lvl.id,
                  );
                  if (!band) return null;
                  const p10 = convertToMarket(band.p25 * 0.85);
                  const p25 = convertToMarket(band.p25);
                  const p50 = convertToMarket(band.p50);
                  const p75 = convertToMarket(band.p75);
                  const p90 = convertToMarket(band.p90);

                  const gMin = p10 * 0.85;
                  const gMax = p90 * 1.15;
                  const pct = (v: number) =>
                    Math.max(
                      0,
                      Math.min(100, ((v - gMin) / (gMax - gMin)) * 100),
                    );

                  const isSelected = lvl.id === level.id;
                  const tgtVal = isSelected
                    ? convertToMarket(getRawOfferValue(offerTarget))
                    : p50;

                  return (
                    <div key={lvl.id}>
                      <div className="mb-2 text-xs font-medium text-brand-700">
                        {lvl.name}
                      </div>
                      <div className="relative h-10">
                        <div
                          className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-brand-300"
                          style={{
                            left: `${pct(p10)}%`,
                            width: `${pct(p90) - pct(p10)}%`,
                          }}
                        />
                        <div
                          className="bench-boxplot-whisker"
                          style={{ left: `${pct(p10)}%` }}
                        />
                        <div
                          className="bench-boxplot-whisker"
                          style={{ left: `${pct(p90)}%` }}
                        />
                        <div
                          className="bench-boxplot-box"
                          style={{
                            left: `${pct(p25)}%`,
                            width: `${pct(p75) - pct(p25)}%`,
                          }}
                        />
                        <div
                          className="bench-boxplot-median"
                          style={{ left: `${pct(p50)}%` }}
                        />
                        {isSelected && (
                          <div
                            className="bench-boxplot-target"
                            style={{ left: `${pct(tgtVal)}%` }}
                          >
                            {offerTarget}
                          </div>
                        )}
                      </div>
                      <div className="mt-1 flex justify-between text-[9px] text-brand-400">
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
          )}

          <div className="flex justify-end">
            <Button onClick={goToRecipient}>
              Next: Select Recipient <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Recipient */}
      {step === "recipient" && (
        <div className="space-y-6">
          <div className="bench-section space-y-4">
            <div>
              <h3 className="bench-section-header pb-0">Select recipient</h3>
              <p className="mt-2 text-sm text-brand-600">
                Choose an existing employee or enter a candidate manually.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRecipientMode("employee")}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  recipientMode === "employee"
                    ? "bg-brand-500 text-white"
                    : "bg-brand-50 text-brand-700 hover:bg-brand-100",
                )}
              >
                Employee recipient
              </button>
              <button
                type="button"
                onClick={() => setRecipientMode("manual")}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  recipientMode === "manual"
                    ? "bg-brand-500 text-white"
                    : "bg-brand-50 text-brand-700 hover:bg-brand-100",
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
                {isLoadingEmployees && (
                  <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                    Loading employees...
                  </div>
                )}
                {employeesError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {employeesError}
                  </div>
                )}
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                >
                  {employeeOptions.length === 0 ? (
                    <option value="">
                      No employees found. Use Manual recipient.
                    </option>
                  ) : (
                    employeeOptions.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}{" "}
                        {employee.email ? `(${employee.email})` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-brand-700">
                    <User className="h-3.5 w-3.5" />
                    Recipient name
                  </label>
                  <input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                    placeholder="Candidate name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-brand-700">
                    <Mail className="h-3.5 w-3.5" />
                    Recipient email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                    placeholder="candidate@company.com"
                  />
                </div>
              </div>
            )}

            {submitError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {submitError}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep("context")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={goToReview}>
              Next: Review Offer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review and create */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="bench-section">
            <h3 className="bench-section-header">Review offer</h3>
            <p className="mb-6 text-sm text-brand-600">
              Confirm the details below, then create the offer.
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface-1 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                    Position & Recipient
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("context")}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                    >
                      <Pencil className="h-3 w-3" /> Edit position
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("recipient")}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                    >
                      <Pencil className="h-3 w-3" /> Edit recipient
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                      Position
                    </p>
                    <p className="mt-1 text-sm font-bold text-brand-900">
                      {role.title} - {level.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                      Location
                    </p>
                    <p className="mt-1 text-sm font-bold text-brand-900">
                      {location.city}, {location.country}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                      Recipient
                    </p>
                    <p className="mt-1 text-sm font-bold text-brand-900">
                      {recipientLabel}
                    </p>
                    {recipientMode === "manual" && recipientEmail && (
                      <p className="text-xs text-brand-500">
                        {recipientEmail}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                      Employment type
                    </p>
                    <p className="mt-1 text-sm font-bold text-brand-900">
                      {result.formData.employmentType === "expat"
                        ? "Expat"
                        : "National"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                      Target percentile
                    </p>
                    <p className="mt-1 text-xl font-bold text-brand-900">
                      P{offerTarget}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                      Total compensation
                    </p>
                    <p className="mt-1 text-xl font-bold text-brand-900">
                      {formatValue(offerValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                      Negotiation range
                    </p>
                    <p className="mt-1 text-xl font-bold text-brand-900">
                      {formatValue(offerRange.low)} -{" "}
                      {formatValue(offerRange.high)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface-1 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-500">
                  Package breakdown
                </p>
                <div className="space-y-2">
                  {breakdownItems
                    .filter((item) => item.percent > 0)
                    .map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${item.bg}`}
                          />
                          <span className="text-brand-700">{item.name}</span>
                          <span className="text-xs text-brand-400">
                            ({item.percent}%)
                          </span>
                        </div>
                        <span className="font-semibold text-brand-900">
                          {formatValue(item.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {submitError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {submitError}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep("recipient")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleCreateOffer}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Offer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && lastOfferId && (
        <div className="space-y-6">
          <div className="bench-section py-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-brand-900">
              Offer created successfully
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-brand-600">
              The offer for{" "}
              <span className="font-semibold">{recipientLabel}</span> has been
              saved to your workspace. Download the branded PDF below.
            </p>

            <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 sm:flex-row sm:max-w-md">
              <Button
                onClick={() => downloadPdf(lastOfferId)}
                isLoading={isPdfDownloading}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download Branded PDF
              </Button>
            </div>
          </div>

          {/* Offer summary card */}
          <div className="bench-section">
            <h3 className="bench-section-header">Offer summary</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-brand-500">Position</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-900">
                  {role.title} - {level.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-500">Location</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-900">
                  {location.city}, {location.country}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-500">Total compensation</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-900">
                  {formatValue(offerValue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-500">Recipient</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-900">
                  {recipientLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
