"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatAEDCompact } from "@/lib/employees";

type ReviewSummaryHeroProps = {
  budget: number;
  budgetUsed: number;
  budgetRemaining: number;
  budgetPolicyLabel: string;
  budgetAllocationLabel: string;
  budgetRemainingLabel: string;
  selectedEmployees: number;
  coveredEmployees: number;
  totalEmployees: number;
  belowBandEmployees: number;
  proposedEmployees: number;
  benchmarkTrustLabel: string;
};

export function ReviewSummaryHero({
  budget,
  budgetUsed,
  budgetRemaining,
  budgetPolicyLabel,
  budgetAllocationLabel,
  budgetRemainingLabel,
  selectedEmployees,
  coveredEmployees,
  totalEmployees,
  belowBandEmployees,
  proposedEmployees,
  benchmarkTrustLabel,
}: ReviewSummaryHeroProps) {
  const overBudget = budgetRemaining < 0;
  const coveragePct = totalEmployees > 0 ? Math.round((coveredEmployees / totalEmployees) * 100) : 0;

  return (
    <Card className="dash-card border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-accent-600">
            <span className="rounded-full bg-brand-100 px-3 py-1 font-semibold text-brand-700">
              Salary Review Workspace
            </span>
            <span>Primary source: {benchmarkTrustLabel}</span>
            <span>Coverage: {coveredEmployees}/{totalEmployees}</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-accent-950">
            Review workspace at a glance
          </h2>
          <p className="mt-1 text-sm text-accent-700">
            {budgetPolicyLabel} Budget changes stay in setup so the workspace summary remains easy to scan.
          </p>
        </div>

        <a
          href="#review-settings"
          className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-white px-4 py-2 text-sm font-semibold text-accent-700 transition-colors hover:bg-accent-50"
        >
          Edit budget
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightTile
          icon={<Users className="h-4 w-4 text-brand-500" />}
          label="Selected"
          value={`${selectedEmployees}`}
          body={`${proposedEmployees} with a proposal`}
        />
        <InsightTile
          icon={<ShieldCheck className="h-4 w-4 text-brand-500" />}
          label="Coverage"
          value={`${coveragePct}%`}
          body={`${coveredEmployees} benchmark-backed`}
        />
        <InsightTile
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          label="Below band"
          value={`${belowBandEmployees}`}
          body="Market-adjustment candidates"
        />
        <InsightTile
          icon={overBudget ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          label={overBudget ? "Over budget" : "Remaining"}
          value={overBudget ? `-${formatAEDCompact(Math.abs(budgetRemaining))}` : formatAEDCompact(budgetRemaining)}
          body={overBudget ? "Reduce allocations or raise budget" : "Available to allocate"}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-accent-200 bg-white/85 px-4 py-3">
        <MiniMetric label="Review budget" value={formatAEDCompact(budget)} />
        <MiniMetric label="Allocated" value={formatAEDCompact(budgetUsed)} />
        <MiniMetric
          label={overBudget ? "Over budget" : "Remaining"}
          value={overBudget ? `-${formatAEDCompact(Math.abs(budgetRemaining))}` : formatAEDCompact(budgetRemaining)}
        />
        <p className="text-xs leading-relaxed text-accent-500">
          {budgetAllocationLabel} {budgetRemainingLabel}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-accent-100">
        <div
          className={overBudget ? "h-full rounded-full bg-red-500" : "h-full rounded-full bg-emerald-500"}
          style={{ width: `${budget > 0 ? Math.min((budgetUsed / budget) * 100, 100) : 0}%` }}
        />
      </div>
    </Card>
  );
}

function InsightTile({
  icon,
  label,
  value,
  body,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-accent-100 bg-white/80 p-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-xl font-bold text-accent-950">{value}</p>
      <p className="mt-1 text-xs text-accent-600">{body}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-accent-100 bg-accent-50/60 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-accent-950">{value}</p>
    </div>
  );
}
