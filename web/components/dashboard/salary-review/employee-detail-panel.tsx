"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  MapPin,
  Briefcase,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Shield,
  ArrowUpRight,
  Star,
  ChevronDown,
  CheckCircle2,
  Circle,
  Sparkles,
  Send,
} from "lucide-react";
import { type ReviewEmployee, useSalaryReview } from "@/lib/salary-review";
import {
  formatAED,
  generateCompensationHistory,
  computeAttritionRisk,
  computeTenure,
  type AttritionRiskLevel,
} from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";
import { generateAdvisory } from "@/lib/advisory/generator";
import { buildBenchmarkTrustLabels } from "@/lib/benchmarks/trust";
import { shouldShowEmployeeApprovalContext } from "@/lib/salary-review/dashboard";
import { ApprovalChainView } from "./approval-chain-view";

interface EmployeeDetailPanelProps {
  employee: ReviewEmployee;
  onClose: () => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}mo ago` : `${years}y ago`;
}

const REASON_LABELS: Record<string, string> = {
  hire: "Initial Hire",
  "annual-review": "Annual Review",
  promotion: "Promotion",
  "market-adjustment": "Market Adjustment",
};

type PanelHistoryEntry = {
  effectiveDate: Date;
  baseSalary: number;
  previousSalary: number;
  changePercentage: number;
  changeReason: "hire" | "annual-review" | "promotion" | "market-adjustment";
};

type SectionKey = "history" | "actions" | "advisory" | "chat" | "risk";

const OPEN_AI_DRAWER_EVENT = "qeemly:open-ai-drawer";

const RISK_CONFIG: Record<
  AttritionRiskLevel,
  { bg: string; text: string; border: string; icon: typeof ShieldCheck; label: string }
> = {
  low: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: ShieldCheck, label: "Low Risk" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Shield, label: "Medium Risk" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: ShieldAlert, label: "High Risk" },
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: AlertTriangle, label: "Critical Risk" },
};

const SIGNAL_DOT: Record<string, string> = {
  positive: "bg-emerald-500",
  neutral: "bg-accent-300",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

const PERFORMANCE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  exceptional: { bg: "bg-purple-100", text: "text-purple-700", label: "Exceptional" },
  exceeds: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Exceeds" },
  meets: { bg: "bg-blue-100", text: "text-blue-700", label: "Meets" },
  low: { bg: "bg-red-100", text: "text-red-700", label: "Low" },
};

function normalizeReason(reason: string | null | undefined): PanelHistoryEntry["changeReason"] {
  const normalized = (reason || "").toLowerCase().replaceAll("_", "-");
  if (normalized === "promotion") return "promotion";
  if (normalized === "market-adjustment") return "market-adjustment";
  if (normalized === "annual-review") return "annual-review";
  return "hire";
}

function estimateSuggestedIncrease(employee: ReviewEmployee): number {
  let pct = 3;
  if (employee.bandPosition === "below") pct += 2;
  if (employee.bandPosition === "above") pct -= 1;
  if (employee.performanceRating === "exceptional") pct += 3;
  if (employee.performanceRating === "exceeds") pct += 2;
  if (employee.performanceRating === "low") pct -= 2;
  const clampedPct = Math.max(0, Math.min(15, pct));
  return Math.round(((employee.baseSalary * clampedPct) / 100) / 100) * 100;
}

export function EmployeeDetailPanel({ employee, onClose }: EmployeeDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { salaryView } = useSalaryView();
  const {
    workflowByEmployee,
    updateEmployeeWorkflow,
    applySuggestedIncrease,
    activeProposal,
    approvalSteps,
    proposalNotes,
  } = useSalaryReview();
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    history: true,
    actions: true,
    advisory: true,
    chat: true,
    risk: false,
  });
  const [question, setQuestion] = useState("");
  const [liveHistory, setLiveHistory] = useState<PanelHistoryEntry[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setLoadingHistory(true);
      setHistoryError(null);
      setLiveHistory(null);
      try {
        const response = await fetch(`/api/salary-review/history/${employee.id}`);
        if (!response.ok) {
          throw new Error("Failed to load compensation history");
        }
        const payload = await response.json();
        const rows: Array<{
          effectiveDate: string;
          baseSalary: number;
          changeReason: string | null;
          changePercentage: number | null;
        }> = payload?.history ?? [];

        const mapped = rows.map((row, idx) => {
          const nextRow = rows[idx + 1];
          const previousSalary = nextRow ? Number(nextRow.baseSalary) : Number(row.baseSalary);
          const inferredPct = previousSalary > 0
            ? ((Number(row.baseSalary) - previousSalary) / previousSalary) * 100
            : 0;
          const reason = normalizeReason(row.changeReason);

          return {
            effectiveDate: new Date(row.effectiveDate),
            baseSalary: Number(row.baseSalary) || 0,
            previousSalary,
            changePercentage: row.changePercentage ?? Math.max(0, Number(inferredPct.toFixed(1))),
            changeReason: reason,
          } as PanelHistoryEntry;
        });

        if (isMounted) {
          setLiveHistory(mapped);
        }
      } catch {
        if (isMounted) {
          setHistoryError("Live history unavailable. Showing generated timeline instead.");
          setLiveHistory([]);
        }
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [employee.id]);

  const history = useMemo<PanelHistoryEntry[]>(() => {
    if (liveHistory && liveHistory.length > 0) return liveHistory;
    return generateCompensationHistory(employee);
  }, [employee, liveHistory]);

  const tenure = computeTenure(employee.hireDate);
  const risk = computeAttritionRisk(employee);
  const workflow = workflowByEmployee[employee.id];
  const suggestedIncrease = estimateSuggestedIncrease(employee);

  const advisory = useMemo(
    () =>
      generateAdvisory({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        baseSalary: employee.baseSalary,
        bandPosition: employee.bandPosition,
        bandPercentile: employee.bandPercentile,
        marketComparison: employee.marketComparison,
        performanceRating: employee.performanceRating,
        employmentType: employee.employmentType,
        department: employee.department,
        roleName: employee.role.title,
        levelName: employee.level.name,
        hireDate: employee.hireDate,
        lastReviewDate: employee.lastReviewDate,
        proposedIncrease: employee.proposedIncrease,
      }),
    [employee]
  );

  const lastIncrease = history.find(
    (h) => h.changeReason !== "hire" && h.changePercentage > 0
  );
  const benchmarkTrust = buildBenchmarkTrustLabels(employee.benchmarkContext);
  const proposedOrSuggestedIncrease =
    employee.proposedIncrease > 0 ? employee.proposedIncrease : suggestedIncrease;
  const proposedOrSuggestedSalary =
    employee.proposedIncrease > 0 ? employee.newSalary : employee.baseSalary + suggestedIncrease;
  const historySourceLabel =
    loadingHistory ? "Loading live history" : historyError ? "Generated timeline" : "Live timeline";
  const employeeNotes = proposalNotes.filter(
    (note) => !note.employee_id || note.employee_id === employee.id
  );

  const riskCfg = RISK_CONFIG[risk.overall];
  const RiskIcon = riskCfg.icon;
  const toggleSection = (key: SectionKey) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const askEmployeeQuestion = () => {
    const prompt = question.trim();
    if (!prompt) return;

    window.dispatchEvent(
      new CustomEvent(OPEN_AI_DRAWER_EVENT, {
        detail: {
          mode: "employee",
          employeeId: employee.id,
          employee: {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`.trim(),
            role: employee.role.title,
            department: employee.department,
          },
          message: prompt,
        },
      })
    );
    setQuestion("");
    onClose();
  };
  const completeActionsCount =
    Number(Boolean(workflow?.managerFollowUpDone)) +
    Number(Boolean(workflow?.recommendationReady));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px] transition-opacity" />

      <div
        ref={panelRef}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-[420px] overflow-y-auto border-l border-border/60 bg-white shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-6 py-5 border-b border-border/40">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-1.5 text-accent-400 hover:bg-accent-100 hover:text-accent-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 font-bold text-base">
              {employee.firstName[0]}
              {employee.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-accent-900 truncate">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-sm text-accent-500">{employee.role.title}</p>
            </div>
          </div>

          {/* Meta pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-1 text-xs text-accent-600">
              <Briefcase className="h-3 w-3" />
              {employee.department}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-1 text-xs text-accent-600">
              <MapPin className="h-3 w-3" />
              {employee.location.city}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-1 text-xs text-accent-600">
              <Clock className="h-3 w-3" />
              {tenure.label}
            </span>
            {employee.performanceRating && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${PERFORMANCE_BADGE[employee.performanceRating].bg} ${PERFORMANCE_BADGE[employee.performanceRating].text}`}
              >
                <Star className="h-3 w-3" />
                {PERFORMANCE_BADGE[employee.performanceRating].label}
              </span>
            )}
            {benchmarkTrust && (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs text-brand-700">
                  {benchmarkTrust.sourceLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-1 text-xs text-accent-600">
                  {benchmarkTrust.matchLabel}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          {benchmarkTrust && (
            <section className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
                Benchmark Trust
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-700">
                  {benchmarkTrust.sourceLabel}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-700">
                  {benchmarkTrust.matchLabel}
                </span>
                {benchmarkTrust.confidenceLabel && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-700">
                    {benchmarkTrust.confidenceLabel}
                  </span>
                )}
                {benchmarkTrust.sampleLabel && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-700">
                    {benchmarkTrust.sampleLabel}
                  </span>
                )}
                {benchmarkTrust.freshnessLabel && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-700">
                    {benchmarkTrust.freshnessLabel}
                  </span>
                )}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-accent-200 bg-accent-50/40 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent-500">
                  Recommendation Snapshot
                </h3>
                <p className="mt-1 text-sm text-accent-700">
                  {employee.proposedIncrease > 0
                    ? "This employee already has a proposal in the current review."
                    : "No proposal has been applied yet. Suggested value shown below."}
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-accent-700">
                {employee.bandPosition === "below"
                  ? "Market adjustment candidate"
                  : employee.bandPosition === "above"
                    ? "Watch above-market pay"
                    : "Within market band"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white px-3 py-3">
                <p className="text-xs text-accent-500">Current salary</p>
                <p className="mt-1 text-lg font-semibold text-accent-950">
                  {formatAED(applyViewMode(employee.baseSalary, salaryView))}
                </p>
              </div>
              <div className="rounded-xl bg-white px-3 py-3">
                <p className="text-xs text-accent-500">
                  {employee.proposedIncrease > 0 ? "Current proposal" : "Suggested increase"}
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-700">
                  +{formatAED(applyViewMode(proposedOrSuggestedIncrease, salaryView))}
                </p>
              </div>
              <div className="rounded-xl bg-white px-3 py-3">
                <p className="text-xs text-accent-500">
                  {employee.proposedIncrease > 0 ? "Proposed salary" : "Suggested salary"}
                </p>
                <p className="mt-1 text-lg font-semibold text-accent-950">
                  {formatAED(applyViewMode(proposedOrSuggestedSalary, salaryView))}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-white bg-white/80 px-3 py-3 text-sm text-accent-700">
              {employee.bandPosition === "below"
                ? "This employee sits below the market range and should be reviewed early."
                : employee.bandPosition === "above"
                  ? "This employee is already above the market range, so salary changes need stronger justification."
                  : "This employee sits inside the market range. Use performance and retention context to decide the final outcome."}
            </div>
          </section>

          {shouldShowEmployeeApprovalContext(Boolean(activeProposal)) ? (
            <section className="rounded-xl border border-border/50 bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent-400">
                    Approval Workflow
                  </h3>
                  <p className="mt-1 text-xs text-accent-500">Current saved proposal chain</p>
                </div>
                <span className="rounded-full bg-accent-100 px-2.5 py-1 text-xs font-semibold text-accent-700">
                  {activeProposal?.status?.replaceAll("_", " ") || "draft only"}
                </span>
              </div>
              <div className="mt-3">
                <ApprovalChainView steps={approvalSteps} />
              </div>
              <div className="mt-3 space-y-2">
                {employeeNotes.slice(0, 2).map((note) => (
                  <div key={note.id} className="rounded-xl border border-accent-100 bg-accent-50/40 px-3 py-3">
                    <p className="text-sm text-accent-700">{note.note}</p>
                    <p className="mt-1 text-[11px] text-accent-500">
                      {new Date(note.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-border/50 bg-white">
            <button
              type="button"
              onClick={() => toggleSection("history")}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent-400 text-left">
                  Salary History
                </h3>
                <p className="mt-1 text-xs text-accent-500 text-left">
                  {loadingHistory ? "Loading live history..." : `${history.length} timeline event(s)`}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-accent-400 transition-transform ${
                  sections.history ? "rotate-180" : ""
                }`}
              />
            </button>

            {sections.history && (
              <div className="border-t border-border/40 px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-semibold text-accent-600">
                    {historySourceLabel}
                  </span>
                  {historyError && (
                    <span className="text-[11px] text-amber-700">{historyError}</span>
                  )}
                </div>
                <div className="mb-3 rounded-lg border border-border/50 bg-accent-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-500">
                    Last Salary Increase
                  </p>
                  {lastIncrease ? (
                    <div className="mt-2 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                          <span className="text-lg font-bold text-emerald-600">
                            +{lastIncrease.changePercentage}%
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-accent-700">
                          {formatAED(applyViewMode(lastIncrease.previousSalary, salaryView))}
                          <ArrowUpRight className="mx-1 inline h-3 w-3 text-accent-400" />
                          {formatAED(applyViewMode(lastIncrease.baseSalary, salaryView))}
                        </p>
                      </div>
                      <div className="text-right text-xs text-accent-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(lastIncrease.effectiveDate)}
                        </div>
                        <p className="mt-1 text-[11px] text-accent-400">
                          {relativeTime(lastIncrease.effectiveDate)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-accent-400">No salary increases on record</p>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border/60" />
                  <div className="space-y-0">
                    {history.map((entry, i) => (
                      <TimelineEntry
                        key={`${entry.effectiveDate.toISOString()}-${entry.baseSalary}-${i}`}
                        entry={entry}
                        isFirst={i === 0}
                        salaryView={salaryView}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border/50 bg-white">
            <button
              type="button"
              onClick={() => toggleSection("actions")}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent-400 text-left">
                  Action Items
                </h3>
                <p className="mt-1 text-xs text-accent-500 text-left">
                  {completeActionsCount}/2 completed
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-accent-400 transition-transform ${
                  sections.actions ? "rotate-180" : ""
                }`}
              />
            </button>
            {sections.actions && (
              <div className="space-y-2 border-t border-border/40 px-4 py-4">
                <button
                  type="button"
                  onClick={() => applySuggestedIncrease(employee.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-800">Apply suggested salary increase</p>
                    <p className="text-xs text-brand-600">
                      Suggested: {formatAED(applyViewMode(suggestedIncrease, salaryView))} this cycle
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-brand-500" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateEmployeeWorkflow(employee.id, {
                      managerFollowUpDone: !workflow?.managerFollowUpDone,
                    })
                  }
                  className="flex w-full items-start gap-2 rounded-lg border border-border/50 bg-accent-50/40 px-3 py-2 text-left"
                >
                  {workflow?.managerFollowUpDone ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 text-accent-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-accent-800">Manager follow-up conversation</p>
                    <p className="text-xs text-accent-500">
                      Capture rationale and confirm employee messaging.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateEmployeeWorkflow(employee.id, {
                      calibrationNeeded: !workflow?.calibrationNeeded,
                    })
                  }
                  className="flex w-full items-start gap-2 rounded-lg border border-border/50 bg-accent-50/40 px-3 py-2 text-left"
                >
                  {workflow?.calibrationNeeded ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 text-accent-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-accent-800">Calibration review required</p>
                    <p className="text-xs text-accent-500">
                      Include this case in calibration if equity or risk flags exist.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateEmployeeWorkflow(employee.id, {
                      recommendationReady: !workflow?.recommendationReady,
                    })
                  }
                  className="flex w-full items-start gap-2 rounded-lg border border-border/50 bg-accent-50/40 px-3 py-2 text-left"
                >
                  {workflow?.recommendationReady ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 text-accent-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-accent-800">Final recommendation ready</p>
                    <p className="text-xs text-accent-500">
                      Mark once proposal and narrative are complete.
                    </p>
                  </div>
                </button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border/50 bg-white">
            <button
              type="button"
              onClick={() => toggleSection("advisory")}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent-400 text-left">
                  Qeemly Advisory
                </h3>
                <p className="mt-1 text-xs text-accent-500 text-left">
                  Confidence {advisory.confidence_score}/100
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-accent-400 transition-transform ${
                  sections.advisory ? "rotate-180" : ""
                }`}
              />
            </button>
            {sections.advisory && (
              <div className="space-y-3 border-t border-border/40 px-4 py-4">
                <div className="rounded-lg bg-brand-50 px-3 py-2">
                  <p className="text-sm text-brand-900">{advisory.recommendation_summary}</p>
                </div>
                <div className="h-2 rounded-full bg-accent-100">
                  <div
                    className={`h-full rounded-full ${
                      advisory.confidence_score >= 80
                        ? "bg-emerald-500"
                        : advisory.confidence_score >= 60
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${advisory.confidence_score}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {advisory.rationale.slice(0, 2).map((item, idx) => (
                    <p key={idx} className="text-xs text-accent-600">
                      • {item.point}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border/50 bg-white">
            <button
              type="button"
              onClick={() => toggleSection("risk")}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent-400 text-left">
                  Attrition Risk
                </h3>
                <p className="mt-1 text-xs text-accent-500 text-left">
                  {riskCfg.label} ({risk.score}/100)
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-accent-400 transition-transform ${
                  sections.risk ? "rotate-180" : ""
                }`}
              />
            </button>
            {sections.risk && (
              <div className="space-y-3 border-t border-border/40 px-4 py-4">
                <div className={`rounded-xl border ${riskCfg.border} ${riskCfg.bg} p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RiskIcon className={`h-5 w-5 ${riskCfg.text}`} />
                      <span className={`text-sm font-bold ${riskCfg.text}`}>{riskCfg.label}</span>
                    </div>
                    <span className={`text-2xl font-bold ${riskCfg.text}`}>{risk.score}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/60">
                    <div
                      className={`h-full rounded-full transition-all ${
                        risk.score >= 60
                          ? "bg-red-500"
                          : risk.score >= 40
                            ? "bg-orange-500"
                            : risk.score >= 20
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                      }`}
                      style={{ width: `${risk.score}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  {risk.factors.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-border/40 bg-white p-3"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SIGNAL_DOT[f.signal]}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-accent-800">{f.label}</p>
                        <p className="text-xs text-accent-500">{f.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border/50 bg-white">
            <button
              type="button"
              onClick={() => toggleSection("chat")}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent-400 text-left">
                  Ask About This Employee
                </h3>
                <p className="mt-1 text-xs text-accent-500 text-left">
                  Open AI side chat in employee context
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-accent-400 transition-transform ${
                  sections.chat ? "rotate-180" : ""
                }`}
              />
            </button>
            {sections.chat && (
              <div className="space-y-3 border-t border-border/40 px-4 py-4">
                <div className="flex gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      askEmployeeQuestion();
                    }}
                    placeholder="Ask a compensation question for this employee..."
                    className="flex-1 h-10 rounded-lg border border-border bg-white px-3 text-sm text-accent-900 focus:border-brand-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={askEmployeeQuestion}
                    disabled={!question.trim()}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Ask
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function TimelineEntry({
  entry,
  isFirst,
  salaryView,
}: {
  entry: PanelHistoryEntry;
  isFirst: boolean;
  salaryView: "annual" | "monthly";
}) {
  const isHire = entry.changeReason === "hire";
  const isPromotion = entry.changeReason === "promotion";

  return (
    <div className="relative flex gap-4 pb-3.5 last:pb-0">
      <div
        className={`relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
          isFirst
            ? "border-brand-500 bg-brand-500"
            : isHire
              ? "border-accent-300 bg-white"
              : isPromotion
                ? "border-purple-400 bg-purple-50"
                : "border-accent-300 bg-accent-50"
        }`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-accent-600">
            {formatDate(entry.effectiveDate)}
          </span>
          <span className="inline-flex items-center rounded-md bg-accent-100 px-1.5 py-0.5 text-[10px] font-medium text-accent-600">
            {REASON_LABELS[entry.changeReason]}
          </span>
        </div>

        <p className="mt-0.5 text-sm font-semibold text-accent-900">
          {formatAED(applyViewMode(entry.baseSalary, salaryView))}
        </p>

        {!isHire && entry.changePercentage > 0 && (
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            <span className="flex items-center gap-0.5 text-emerald-600">
              <TrendingUp className="h-3 w-3" />+{entry.changePercentage}%
            </span>
            <span className="text-accent-400">
              from {formatAED(applyViewMode(entry.previousSalary, salaryView))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
