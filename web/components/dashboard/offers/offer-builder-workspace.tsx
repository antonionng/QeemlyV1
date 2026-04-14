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
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Loader2,
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
import type { OfferMode } from "@/lib/offers/types";
import {
  fetchInternalOfferAiDraft,
  type InternalOfferAiDraftRequest,
  type RegeneratableField,
} from "@/lib/offers/ai-draft";
import { AiExplainTooltip } from "@/components/ui/ai-explain-tooltip";
import { FieldTooltip } from "@/components/ui/field-tooltip";

type BuilderStep = "context" | "recipient" | "internal_details" | "review" | "complete";

interface OfferBuilderWorkspaceProps {
  result: BenchmarkResult | null;
  offerMode: OfferMode;
}

const BREAKDOWN_COLORS = [
  { bg: "bg-brand-500", label: "text-brand-700", name: "Basic Salary" },
  { bg: "bg-teal-400", label: "text-teal-700", name: "Housing" },
  { bg: "bg-amber-400", label: "text-amber-700", name: "Transport" },
  { bg: "bg-pink-400", label: "text-pink-700", name: "Other Allowances" },
];

const PERCENTILE_OPTIONS = [25, 50, 75, 90] as const;

export function OfferBuilderWorkspace({ result, offerMode }: OfferBuilderWorkspaceProps) {
  const isManual = offerMode === "candidate_manual";
  const isInternal = offerMode === "internal";

  const steps: { id: BuilderStep; label: string; number: number }[] = useMemo(() => {
    if (isInternal) {
      return [
        { id: "context", label: "Position", number: 1 },
        { id: "internal_details", label: "Internal Details", number: 2 },
        { id: "review", label: "Review", number: 3 },
        { id: "complete", label: "Complete", number: 4 },
      ];
    }
    return [
      { id: "context", label: "Position", number: 1 },
      { id: "recipient", label: "Recipient", number: 2 },
      { id: "review", label: "Review", number: 3 },
      { id: "complete", label: "Complete", number: 4 },
    ];
  }, [isInternal]);

  const benchmark = result?.benchmark ?? null;
  const role = result?.role ?? null;
  const level = result?.level ?? null;
  const location = result?.location ?? null;
  const companySettings = useCompanySettings();
  const { salaryView } = useSalaryView();
  const { createOffer } = useOffersStore();
  const targetCurrency = location?.currency ?? "SAR";

  const mod = result?.detailSurface?.modules.offerBuilder;
  const breakdown = mod?.data.breakdown;
  const adjacentLevels = mod?.data.adjacentLevels ?? [];

  const [step, setStep] = useState<BuilderStep>("context");
  const [offerTarget, setOfferTarget] = useState<number>(companySettings.targetPercentile);
  const [recipientMode, setRecipientMode] = useState<"employee" | "manual">("manual");
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

  // Manual mode fields
  const [manualOfferValue, setManualOfferValue] = useState<string>("");
  const [manualRoleTitle, setManualRoleTitle] = useState<string>("");
  const [manualLevelName, setManualLevelName] = useState<string>("");
  const [manualLocationCity, setManualLocationCity] = useState<string>("");
  const [manualLocationCountry, setManualLocationCountry] = useState<string>("");
  const [manualCurrency, setManualCurrency] = useState<string>("SAR");

  // Internal mode fields
  const [internalRationale, setInternalRationale] = useState<string>("");
  const [internalBandPosition, setInternalBandPosition] = useState<"below" | "in-band" | "above">("in-band");
  const [internalNegotiationFloor, setInternalNegotiationFloor] = useState<string>("");
  const [internalNegotiationCeiling, setInternalNegotiationCeiling] = useState<string>("");
  const [internalRiskFlags, setInternalRiskFlags] = useState<string>("");
  const [internalTalkingPoints, setInternalTalkingPoints] = useState<string>("");
  const [internalApprovalNotes, setInternalApprovalNotes] = useState<string>("");

  // AI draft state
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiDraftError, setAiDraftError] = useState<string | null>(null);
  const [regeneratingField, setRegeneratingField] = useState<RegeneratableField | null>(null);

  const buildAiDraftPayload = (
    regenField?: RegeneratableField,
  ): InternalOfferAiDraftRequest => ({
    role_title: role?.title ?? manualRoleTitle,
    level_name: level?.name ?? manualLevelName,
    location_city: location?.city ?? manualLocationCity,
    location_country: location?.country ?? manualLocationCountry,
    employment_type: result?.formData.employmentType ?? "national",
    currency: benchmark?.currency ?? manualCurrency ?? "SAR",
    target_percentile: offerTarget,
    offer_value: rawOfferValue,
    offer_low: rawOfferLow,
    offer_high: rawOfferHigh,
    benchmark_source:
      benchmark?.benchmarkSource === "uploaded"
        ? "uploaded"
        : benchmark?.benchmarkSource === "ai-estimated"
          ? "ai-estimated"
          : "market",
    benchmark_percentiles: benchmark?.percentiles
      ? {
          p25: benchmark.percentiles.p25,
          p50: benchmark.percentiles.p50,
          p75: benchmark.percentiles.p75,
          p90: benchmark.percentiles.p90,
        }
      : {},
    package_breakdown: breakdown
      ? {
          basic_pct: breakdown.basicSalaryPct,
          housing_pct: breakdown.housingPct,
          transport_pct: breakdown.transportPct,
          other_pct: breakdown.otherAllowancesPct,
        }
      : undefined,
    regenerate_field: regenField,
    existing_metadata: regenField
      ? {
          rationale: internalRationale || undefined,
          band_position: internalBandPosition,
          negotiation_floor: internalNegotiationFloor
            ? Number(internalNegotiationFloor)
            : undefined,
          negotiation_ceiling: internalNegotiationCeiling
            ? Number(internalNegotiationCeiling)
            : undefined,
          risk_flags: internalRiskFlags
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          talking_points: internalTalkingPoints
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          approval_notes: internalApprovalNotes || undefined,
        }
      : undefined,
  });

  const handleAiDraftAll = async () => {
    setIsAiDrafting(true);
    setAiDraftError(null);
    try {
      const draft = await fetchInternalOfferAiDraft(buildAiDraftPayload());
      if (draft.band_position) setInternalBandPosition(draft.band_position);
      if (draft.negotiation_floor != null)
        setInternalNegotiationFloor(String(draft.negotiation_floor));
      if (draft.negotiation_ceiling != null)
        setInternalNegotiationCeiling(String(draft.negotiation_ceiling));
      if (draft.rationale) setInternalRationale(draft.rationale);
      if (draft.risk_flags?.length)
        setInternalRiskFlags(draft.risk_flags.join("\n"));
      if (draft.talking_points?.length)
        setInternalTalkingPoints(draft.talking_points.join("\n"));
      if (draft.approval_notes) setInternalApprovalNotes(draft.approval_notes);
    } catch (err) {
      setAiDraftError(
        err instanceof Error ? err.message : "Unable to generate draft.",
      );
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleRegenerateField = async (field: RegeneratableField) => {
    setRegeneratingField(field);
    setAiDraftError(null);
    try {
      const draft = await fetchInternalOfferAiDraft(
        buildAiDraftPayload(field),
      );
      if (field === "rationale" && draft.rationale != null)
        setInternalRationale(draft.rationale);
      if (field === "risk_flags" && draft.risk_flags)
        setInternalRiskFlags(draft.risk_flags.join("\n"));
      if (field === "talking_points" && draft.talking_points)
        setInternalTalkingPoints(draft.talking_points.join("\n"));
      if (field === "approval_notes" && draft.approval_notes != null)
        setInternalApprovalNotes(draft.approval_notes);
    } catch (err) {
      setAiDraftError(
        err instanceof Error ? err.message : "Unable to regenerate field.",
      );
    } finally {
      setRegeneratingField(null);
    }
  };

  const navigateToStep = (target: BuilderStep) => {
    if (target === "complete") return;
    setSubmitError(null);
    setStep(target);
  };

  useEffect(() => {
    if (isInternal) return;
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
  }, [isInternal]);

  const convertToMarket = (
    value: number,
    sourceCurrency: string = benchmark?.currency ?? "SAR",
    payPeriod = benchmark?.payPeriod,
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
    if (!benchmark) return 0;
    const { p25, p50, p75, p90 } = benchmark.percentiles;
    if (percentile <= 25) return p25;
    if (percentile <= 50) return p25 + ((p50 - p25) * (percentile - 25)) / 25;
    if (percentile <= 75) return p50 + ((p75 - p50) * (percentile - 50)) / 25;
    if (percentile <= 90) return p75 + ((p90 - p75) * (percentile - 75)) / 15;
    return p90;
  };

  const rawOfferValue = isManual
    ? Math.round(Number(manualOfferValue) || 0)
    : Math.round(getRawOfferValue(offerTarget));
  const rawOfferLow = Math.round(rawOfferValue * 0.96);
  const rawOfferHigh = Math.round(rawOfferValue * 1.04);

  const offerValue = isManual
    ? (Number(manualOfferValue) || 0)
    : convertToMarket(getRawOfferValue(offerTarget));
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
    if (!level) return [];
    const idx = LEVELS.findIndex((l) => l.id === level.id);
    const start = Math.max(0, idx - 1);
    const end = Math.min(LEVELS.length, idx + 2);
    return LEVELS.slice(start, end);
  }, [level]);

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
      a.download = isInternal
        ? `qeemly_internal_brief_${offerId}.pdf`
        : `qeemly_offer_${offerId}.pdf`;
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

    if (isManual) {
      if (!manualOfferValue || Number(manualOfferValue) <= 0) {
        setSubmitError("Enter a valid offer value.");
        setIsSubmitting(false);
        return;
      }
      const val = Math.round(Number(manualOfferValue));
      const result_ = await createOffer({
        offer_mode: "candidate_manual",
        employee_id: isEmployeeMode ? selectedEmployeeId : null,
        recipient_name: isEmployeeMode ? null : recipientName.trim(),
        recipient_email: isEmployeeMode ? null : recipientEmail.trim(),
        role_id: role?.id ?? manualRoleTitle,
        level_id: level?.id ?? manualLevelName,
        location_id: location?.id ?? manualLocationCity,
        employment_type: result?.formData.employmentType ?? "national",
        target_percentile: offerTarget,
        offer_value: val,
        offer_low: Math.round(val * 0.96),
        offer_high: Math.round(val * 1.04),
        currency: manualCurrency || targetCurrency,
        salary_breakdown: breakdownSnapshot,
        benchmark_snapshot: benchmark
          ? {
              benchmark_percentiles: benchmark.percentiles,
              benchmark_source: benchmark.benchmarkSource === "uploaded" ? "uploaded" : "market",
              sample_size: benchmark.sampleSize,
              confidence: benchmark.confidence,
              last_updated: benchmark.lastUpdated,
              role: role!,
              level: level!,
              location: location!,
              form_data: result!.formData as unknown as Record<string, unknown>,
            }
          : undefined,
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
      return;
    }

    if (isInternal) {
      const riskFlags = internalRiskFlags
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const talkingPoints = internalTalkingPoints
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const result_ = await createOffer({
        offer_mode: "internal",
        role_id: role!.id,
        level_id: level!.id,
        location_id: location!.id,
        employment_type: result!.formData.employmentType,
        target_percentile: offerTarget,
        offer_value: rawOfferValue,
        offer_low: rawOfferLow,
        offer_high: rawOfferHigh,
        currency: benchmark!.currency,
        salary_breakdown: breakdownSnapshot,
        benchmark_snapshot: {
          benchmark_percentiles: benchmark!.percentiles,
          benchmark_source: benchmark!.benchmarkSource === "uploaded" ? "uploaded" : "market",
          sample_size: benchmark!.sampleSize,
          confidence: benchmark!.confidence,
          last_updated: benchmark!.lastUpdated,
          role: role!,
          level: level!,
          location: location!,
          form_data: result!.formData as unknown as Record<string, unknown>,
        },
        internal_metadata: {
          rationale: internalRationale || undefined,
          band_position: internalBandPosition,
          negotiation_floor: internalNegotiationFloor ? Number(internalNegotiationFloor) : undefined,
          negotiation_ceiling: internalNegotiationCeiling ? Number(internalNegotiationCeiling) : undefined,
          risk_flags: riskFlags.length > 0 ? riskFlags : undefined,
          talking_points: talkingPoints.length > 0 ? talkingPoints : undefined,
          approval_notes: internalApprovalNotes || undefined,
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
      return;
    }

    // candidate_advised
    const snapshotBenchmarkSource =
      benchmark!.benchmarkSource === "uploaded" ? "uploaded" : "market";

    const result_ = await createOffer({
      offer_mode: "candidate_advised",
      employee_id: isEmployeeMode ? selectedEmployeeId : null,
      recipient_name: isEmployeeMode ? null : recipientName.trim(),
      recipient_email: isEmployeeMode ? null : recipientEmail.trim(),
      role_id: role!.id,
      level_id: level!.id,
      location_id: location!.id,
      employment_type: result!.formData.employmentType,
      target_percentile: offerTarget,
      offer_value: rawOfferValue,
      offer_low: rawOfferLow,
      offer_high: rawOfferHigh,
      currency: benchmark!.currency,
      salary_breakdown: breakdownSnapshot,
      benchmark_snapshot: {
        benchmark_percentiles: benchmark!.percentiles,
        benchmark_source: snapshotBenchmarkSource,
        sample_size: benchmark!.sampleSize,
        confidence: benchmark!.confidence,
        last_updated: benchmark!.lastUpdated,
        role: role!,
        level: level!,
        location: location!,
        form_data: result!.formData as unknown as Record<string, unknown>,
      },
      advised_baseline: {
        recommended_value: rawOfferValue,
        recommended_low: rawOfferLow,
        recommended_high: rawOfferHigh,
        recommended_percentile: offerTarget,
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

  const goToNextAfterContext = () => {
    if (isInternal) {
      setStep("internal_details");
    } else {
      setStep("recipient");
    }
  };

  const goToReview = () => {
    if (!isInternal) {
      const error = validateRecipient();
      if (error) {
        setSubmitError(error);
        return;
      }
    }
    setSubmitError(null);
    setStep("review");
  };

  const recipientLabel = isInternal
    ? "Internal Brief"
    : recipientMode === "employee"
      ? employeeOptions.find((e) => e.id === selectedEmployeeId)?.name || "Employee"
      : recipientName || "Manual recipient";

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const ctaLabel = isInternal ? "Create Internal Brief" : "Create Offer";

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="bench-section">
        <div className="flex items-center justify-between gap-2">
          {steps.map((s, i) => {
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
                {i < steps.length - 1 && (
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
          {/* Manual mode: direct input fields */}
          {isManual && !result && (
            <div className="bench-section space-y-4">
              <h3 className="bench-section-header">Enter position details</h3>
              <p className="text-sm text-brand-600">
                Enter the role and compensation values manually.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-brand-700">
                    Role title
                  </label>
                  <input
                    value={manualRoleTitle}
                    onChange={(e) => setManualRoleTitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-brand-700">
                    Level
                  </label>
                  <input
                    value={manualLevelName}
                    onChange={(e) => setManualLevelName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                    placeholder="e.g. Senior (P3)"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-brand-700">
                    City
                  </label>
                  <input
                    value={manualLocationCity}
                    onChange={(e) => setManualLocationCity(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                    placeholder="e.g. Riyadh"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-brand-700">
                    Country
                  </label>
                  <input
                    value={manualLocationCountry}
                    onChange={(e) => setManualLocationCountry(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                    placeholder="e.g. Saudi Arabia"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-brand-700">
                    Currency
                  </label>
                  <select
                    value={manualCurrency}
                    onChange={(e) => setManualCurrency(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                  >
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-brand-700">
                    Total annual compensation
                  </label>
                  <input
                    type="number"
                    value={manualOfferValue}
                    onChange={(e) => setManualOfferValue(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                    placeholder="e.g. 600000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Benchmark-driven modes (advised and internal), or manual with existing benchmark */}
          {result && benchmark && role && level && location && (
            <>
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
                    <p className="text-sm font-bold text-brand-900">{role.title}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface-1 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-500">
                      <Briefcase className="h-3.5 w-3.5" />
                      Level
                    </div>
                    <p className="text-sm font-bold text-brand-900">{level.name}</p>
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
                      {result.formData.employmentType === "expat" ? "Expat" : "National"}
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
                    <h3 className="bench-section-header pb-0">Package breakdown</h3>
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
                          <p className={`font-medium ${item.label}`}>{item.name}</p>
                          <p className="text-xs text-brand-500">{item.percent}% of total package</p>
                        </div>
                      </div>
                      <div className="font-semibold text-brand-900">{formatShort(item.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adjacent levels */}
              {adjacentLevels.length > 0 && (
                <div className="bench-section">
                  <h3 className="bench-section-header">Market anchor by adjacent levels</h3>
                  <p className="mb-4 text-sm text-brand-600">
                    Check the proposed package against nearby seniority levels.
                  </p>
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
                      const pct = (v: number) =>
                        Math.max(0, Math.min(100, ((v - gMin) / (gMax - gMin)) * 100));

                      const isSelected = lvl.id === level!.id;
                      const tgtVal = isSelected ? convertToMarket(getRawOfferValue(offerTarget)) : p50;

                      return (
                        <div key={lvl.id}>
                          <div className="mb-2 text-xs font-medium text-brand-700">{lvl.name}</div>
                          <div className="relative h-10">
                            <div
                              className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-brand-300"
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
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={goToNextAfterContext}>
              Next: {isInternal ? "Internal Details" : "Select Recipient"}{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2a: Recipient (candidate modes only) */}
      {step === "recipient" && !isInternal && (
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

      {/* Step 2b: Internal Details (internal mode only) */}
      {step === "internal_details" && isInternal && (
        <div className="space-y-6">
          <div className="bench-section space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="bench-section-header pb-0 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  Internal Details
                </h3>
                <p className="mt-2 text-sm text-brand-600">
                  Add internal-only context for this compensation decision.
                  This information will not be shared with the candidate.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <AiExplainTooltip
                  label="What is this?"
                  message="The internal brief captures the reasoning, risk assessment, and negotiation guardrails behind a compensation decision. It is visible only to your team and helps managers and HR leads approve offers with full context. AI can draft all sections from the benchmark and position data you have already entered."
                />
                <button
                  type="button"
                  disabled={isAiDrafting}
                  onClick={handleAiDraftAll}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700 transition-colors",
                    "hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                  )}
                >
                  {isAiDrafting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isAiDrafting ? "Drafting..." : "Draft with AI"}
                </button>
              </div>
            </div>

            {aiDraftError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {aiDraftError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                  Band position
                  <FieldTooltip message="Where the offer sits relative to the market pay band (p25 to p75). Below band may require justification; above band typically needs director approval." />
                </label>
                <div className="flex gap-2">
                  {(["below", "in-band", "above"] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setInternalBandPosition(pos)}
                      className={clsx(
                        "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                        internalBandPosition === pos
                          ? "bg-brand-500 text-white"
                          : "bg-brand-50 text-brand-700 hover:bg-brand-100",
                      )}
                    >
                      {pos === "below" ? "Below Band" : pos === "in-band" ? "In Band" : "Above Band"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                    Negotiation floor
                    <FieldTooltip message="The minimum total compensation you are willing to offer. Set this at or slightly below the offer low to give the recruiter a hard boundary." />
                  </label>
                  <input
                    type="number"
                    value={internalNegotiationFloor}
                    onChange={(e) => setInternalNegotiationFloor(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                    placeholder="Minimum acceptable value"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                    Negotiation ceiling
                    <FieldTooltip message="The maximum total compensation you would approve. Set this at or slightly above the offer high to cap recruiter discretion." />
                  </label>
                  <input
                    type="number"
                    value={internalNegotiationCeiling}
                    onChange={(e) => setInternalNegotiationCeiling(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                    placeholder="Maximum acceptable value"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                    Rationale
                    <FieldTooltip message="Explain why this compensation level was chosen. Reference market positioning, candidate experience, and any special factors. This helps approvers understand the decision." />
                  </label>
                  <button
                    type="button"
                    disabled={regeneratingField === "rationale"}
                    onClick={() => handleRegenerateField("rationale")}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-brand-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
                  >
                    {regeneratingField === "rationale" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Re-generate
                  </button>
                </div>
                <textarea
                  value={internalRationale}
                  onChange={(e) => setInternalRationale(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                  placeholder="Why was this compensation level chosen?"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                    Risk flags (one per line)
                    <FieldTooltip message="List potential risks that could affect this offer. Examples: competing offers, above-band positioning, thin market data, or flight risk. One flag per line." />
                  </label>
                  <button
                    type="button"
                    disabled={regeneratingField === "risk_flags"}
                    onClick={() => handleRegenerateField("risk_flags")}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-brand-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
                  >
                    {regeneratingField === "risk_flags" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Re-generate
                  </button>
                </div>
                <textarea
                  value={internalRiskFlags}
                  onChange={(e) => setInternalRiskFlags(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                  placeholder={"Candidate has competing offer\nAbove band for this level"}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                    Talking points (one per line)
                    <FieldTooltip message="Key points for the recruiter or manager to use during the compensation conversation. Focus on value proposition, growth, benefits, or relocation support." />
                  </label>
                  <button
                    type="button"
                    disabled={regeneratingField === "talking_points"}
                    onClick={() => handleRegenerateField("talking_points")}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-brand-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
                  >
                    {regeneratingField === "talking_points" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Re-generate
                  </button>
                </div>
                <textarea
                  value={internalTalkingPoints}
                  onChange={(e) => setInternalTalkingPoints(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                  placeholder={"Emphasize career growth path\nHighlight relocation benefits"}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                    Approval notes
                    <FieldTooltip message="Context for the manager or HR lead who will approve this offer. Mention anything that requires special attention or escalation." />
                  </label>
                  <button
                    type="button"
                    disabled={regeneratingField === "approval_notes"}
                    onClick={() => handleRegenerateField("approval_notes")}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-brand-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
                  >
                    {regeneratingField === "approval_notes" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Re-generate
                  </button>
                </div>
                <textarea
                  value={internalApprovalNotes}
                  onChange={(e) => setInternalApprovalNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-900"
                  placeholder="Notes for the approving manager or HR lead"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep("context")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={goToReview}>
              Next: Review Brief <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review and create */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="bench-section">
            <h3 className="bench-section-header">
              {isInternal ? "Review internal brief" : "Review offer"}
            </h3>
            <p className="mb-6 text-sm text-brand-600">
              Confirm the details below, then {isInternal ? "create the brief" : "create the offer"}.
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface-1 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                    Position {!isInternal && "& Recipient"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("context")}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                    >
                      <Pencil className="h-3 w-3" /> Edit position
                    </button>
                    {!isInternal && (
                      <button
                        type="button"
                        onClick={() => setStep("recipient")}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                      >
                        <Pencil className="h-3 w-3" /> Edit recipient
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">Position</p>
                    <p className="mt-1 text-sm font-bold text-brand-900">
                      {role?.title ?? manualRoleTitle} - {level?.name ?? manualLevelName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">Location</p>
                    <p className="mt-1 text-sm font-bold text-brand-900">
                      {location ? `${location.city}, ${location.country}` : `${manualLocationCity}, ${manualLocationCountry}`}
                    </p>
                  </div>
                  {!isInternal && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">Recipient</p>
                      <p className="mt-1 text-sm font-bold text-brand-900">{recipientLabel}</p>
                      {recipientMode === "manual" && recipientEmail && (
                        <p className="text-xs text-brand-500">{recipientEmail}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">Employment type</p>
                    <p className="mt-1 text-sm font-bold text-brand-900">
                      {(result?.formData.employmentType ?? "national") === "expat" ? "Expat" : "National"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">Target percentile</p>
                    <p className="mt-1 text-xl font-bold text-brand-900">P{offerTarget}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">Total compensation</p>
                    <p className="mt-1 text-xl font-bold text-brand-900">{formatValue(offerValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">Negotiation range</p>
                    <p className="mt-1 text-xl font-bold text-brand-900">
                      {formatValue(offerRange.low)} - {formatValue(offerRange.high)}
                    </p>
                  </div>
                </div>
              </div>

              {!isManual && (
                <div className="rounded-2xl border border-border bg-surface-1 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-500">Package breakdown</p>
                  <div className="space-y-2">
                    {breakdownItems
                      .filter((item) => item.percent > 0)
                      .map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${item.bg}`} />
                            <span className="text-brand-700">{item.name}</span>
                            <span className="text-xs text-brand-400">({item.percent}%)</span>
                          </div>
                          <span className="font-semibold text-brand-900">{formatValue(item.amount)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {isInternal && (internalRationale || internalRiskFlags || internalTalkingPoints || internalApprovalNotes) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Internal Details</p>
                    <button
                      type="button"
                      onClick={() => setStep("internal_details")}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  </div>
                  <div className="space-y-2 text-sm text-brand-800">
                    <p><span className="font-semibold">Band:</span> {internalBandPosition === "below" ? "Below Band" : internalBandPosition === "in-band" ? "In Band" : "Above Band"}</p>
                    {internalRationale && <p><span className="font-semibold">Rationale:</span> {internalRationale}</p>}
                    {internalRiskFlags && <p><span className="font-semibold">Risk flags:</span> {internalRiskFlags.split("\n").filter(Boolean).join(", ")}</p>}
                    {internalTalkingPoints && <p><span className="font-semibold">Talking points:</span> {internalTalkingPoints.split("\n").filter(Boolean).join(", ")}</p>}
                    {internalApprovalNotes && <p><span className="font-semibold">Approval notes:</span> {internalApprovalNotes}</p>}
                  </div>
                </div>
              )}
            </div>

            {submitError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {submitError}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep(isInternal ? "internal_details" : "recipient")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleCreateOffer}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
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
              {isInternal ? "Internal brief created successfully" : "Offer created successfully"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-brand-600">
              {isInternal
                ? "The internal compensation brief has been saved to your workspace."
                : <>The offer for <span className="font-semibold">{recipientLabel}</span> has been saved to your workspace.</>}
              {" "}Download the branded PDF below.
            </p>

            <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 sm:flex-row sm:max-w-md">
              <Button
                onClick={() => downloadPdf(lastOfferId)}
                isLoading={isPdfDownloading}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                {isInternal ? "Download Internal Brief PDF" : "Download Branded PDF"}
              </Button>
            </div>
          </div>

          <div className="bench-section">
            <h3 className="bench-section-header">
              {isInternal ? "Brief summary" : "Offer summary"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-brand-500">Position</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-900">
                  {role?.title ?? manualRoleTitle} - {level?.name ?? manualLevelName}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-500">Location</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-900">
                  {location ? `${location.city}, ${location.country}` : `${manualLocationCity}, ${manualLocationCountry}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-500">Total compensation</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-900">
                  {formatValue(offerValue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-500">{isInternal ? "Type" : "Recipient"}</p>
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
