"use client";

import { useEffect, useRef } from "react";
import {
  X,
  MapPin,
  Briefcase,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Shield,
  ArrowUpRight,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { type ReviewEmployee } from "@/lib/salary-review";
import {
  formatAED,
  generateCompensationHistory,
  computeAttritionRisk,
  computeTenure,
  type CompensationHistoryEntry,
  type AttritionRiskLevel,
} from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";

// ─── Props ────────────────────────────────────────────────────────────────────

interface EmployeeDetailPanelProps {
  employee: ReviewEmployee;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  neutral: "bg-brand-300",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

const PERFORMANCE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  exceptional: { bg: "bg-purple-100", text: "text-purple-700", label: "Exceptional" },
  exceeds: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Exceeds" },
  meets: { bg: "bg-blue-100", text: "text-blue-700", label: "Meets" },
  low: { bg: "bg-red-100", text: "text-red-700", label: "Low" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function EmployeeDetailPanel({ employee, onClose }: EmployeeDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { salaryView } = useSalaryView();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay listener to avoid the click that opened the panel from immediately closing it
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const tenure = computeTenure(employee.hireDate);
  const history = generateCompensationHistory(employee);
  const risk = computeAttritionRisk(employee);

  // Last salary increase (first non-hire entry)
  const lastIncrease = history.find(
    (h) => h.changeReason !== "hire" && h.changePercentage > 0
  );

  const riskCfg = RISK_CONFIG[risk.overall];
  const RiskIcon = riskCfg.icon;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-border bg-white shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 border-b border-border bg-white px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-brand-400 hover:bg-brand-100 hover:text-brand-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-base">
              {employee.firstName[0]}
              {employee.lastName[0]}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-brand-900 truncate">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-sm text-brand-500">{employee.role.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-brand-500">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {employee.department}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {employee.location.city}, {employee.location.country}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {tenure.label} tenure
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {employee.performanceRating && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${PERFORMANCE_BADGE[employee.performanceRating].bg} ${PERFORMANCE_BADGE[employee.performanceRating].text}`}
                  >
                    <Star className="h-3 w-3" />
                    {PERFORMANCE_BADGE[employee.performanceRating].label}
                  </span>
                )}
                <span className="text-xs text-brand-400">{employee.level.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          {/* ── Section 1: Last Salary Increase ───────────────────── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-3">
              Last Salary Increase
            </h3>
            {lastIncrease ? (
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span className="text-lg font-bold text-emerald-600">
                        +{lastIncrease.changePercentage}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-brand-700">
                      {formatAED(applyViewMode(lastIncrease.previousSalary, salaryView))}
                      <ArrowUpRight className="inline h-3 w-3 mx-1 text-brand-400" />
                      {formatAED(applyViewMode(lastIncrease.baseSalary, salaryView))}
                    </p>
                    <p className="text-xs text-brand-400 mt-1">
                      {REASON_LABELS[lastIncrease.changeReason]}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-brand-600">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(lastIncrease.effectiveDate)}
                    </div>
                    <p className="text-xs text-brand-400 mt-0.5">
                      {relativeTime(lastIncrease.effectiveDate)}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-4">
                <p className="text-sm text-brand-400">No salary increases on record</p>
              </Card>
            )}
          </section>

          {/* ── Section 2: Compensation History ───────────────────── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-3">
              Compensation History
            </h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-0">
                {history.map((entry, i) => (
                  <TimelineEntry
                    key={i}
                    entry={entry}
                    isFirst={i === 0}
                    isLast={i === history.length - 1}
                    salaryView={salaryView}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ── Section 3: Attrition Risk ─────────────────────────── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-3">
              Attrition Risk Indicators
            </h3>

            {/* Overall risk badge */}
            <div className={`rounded-xl border ${riskCfg.border} ${riskCfg.bg} p-4 mb-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiskIcon className={`h-5 w-5 ${riskCfg.text}`} />
                  <span className={`text-sm font-bold ${riskCfg.text}`}>{riskCfg.label}</span>
                </div>
                <span className={`text-2xl font-bold ${riskCfg.text}`}>{risk.score}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/60 overflow-hidden">
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

            {/* Factor list */}
            <div className="space-y-2">
              {risk.factors.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SIGNAL_DOT[f.signal]}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-800">{f.label}</p>
                    <p className="text-xs text-brand-500">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// ─── Timeline Entry ───────────────────────────────────────────────────────────

function TimelineEntry({
  entry,
  isFirst,
  isLast,
  salaryView,
}: {
  entry: CompensationHistoryEntry;
  isFirst: boolean;
  isLast: boolean;
  salaryView: "annual" | "monthly";
}) {
  const isHire = entry.changeReason === "hire";
  const isPromotion = entry.changeReason === "promotion";

  return (
    <div className="relative flex gap-4 pb-4 last:pb-0">
      {/* Dot */}
      <div
        className={`relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
          isFirst
            ? "border-brand-500 bg-brand-500"
            : isHire
              ? "border-brand-300 bg-white"
              : isPromotion
                ? "border-purple-400 bg-purple-50"
                : "border-brand-300 bg-brand-50"
        }`}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-brand-600">
            {formatDate(entry.effectiveDate)}
          </span>
          <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-brand-50 text-brand-600">
            {REASON_LABELS[entry.changeReason]}
          </span>
        </div>

        <p className="mt-1 text-sm font-semibold text-brand-900">
          {formatAED(applyViewMode(entry.baseSalary, salaryView))}
        </p>

        {!isHire && entry.changePercentage > 0 && (
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            <span className="flex items-center gap-0.5 text-emerald-600">
              <TrendingUp className="h-3 w-3" />+{entry.changePercentage}%
            </span>
            <span className="text-brand-400">
              from {formatAED(applyViewMode(entry.previousSalary, salaryView))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
