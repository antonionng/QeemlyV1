"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { type SalaryReviewAiPlanRequest, type SalaryReviewAiPlanResponse } from "@/lib/salary-review";
import { formatAED } from "@/lib/employees";
import { buildSalaryReviewBudgetModel } from "@/lib/salary-review/workspace-budget";

type AiDistributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  request: SalaryReviewAiPlanRequest;
  onApprove: (args: { plan: SalaryReviewAiPlanResponse; selectedEmployeeIds?: string[] }) => void;
};

type LoadState =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; plan: SalaryReviewAiPlanResponse };

function ConfidenceBadge({ value }: { value: number }) {
  const tone =
    value >= 80
      ? "bg-emerald-100 text-emerald-700"
      : value >= 60
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";
  return <span className={clsx("rounded-full px-2 py-0.5 text-xs font-semibold", tone)}>{value}%</span>;
}

function ProvenanceBadge({
  provenance,
}: {
  provenance: SalaryReviewAiPlanResponse["items"][number]["benchmark"]["provenance"];
}) {
  const label = provenance === "workspace" ? "Workspace" : provenance === "ingestion" ? "Qeemly Ingestion" : "No Match";
  const tone =
    provenance === "workspace"
      ? "bg-brand-100 text-brand-700"
      : provenance === "ingestion"
      ? "bg-sky-100 text-sky-700"
      : "bg-accent-100 text-accent-600";

  return <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold", tone)}>{label}</span>;
}

export function AiDistributionModal({ isOpen, onClose, request, onApprove }: AiDistributionModalProps) {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    setState({ status: "loading" });

    const run = async () => {
      try {
        const res = await fetch("/api/salary-review/ai-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || "Failed to generate AI plan");
        }
        const plan = (await res.json()) as SalaryReviewAiPlanResponse;
        setState({ status: "ready", plan });
        setSelected(
          Object.fromEntries(plan.items.map((item) => [item.employeeId, true]))
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate AI proposal";
        setState({ status: "error", message });
      }
    };

    void run();
  }, [isOpen, request]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, value]) => value).map(([employeeId]) => employeeId),
    [selected]
  );
  const budgetModel =
    state.status === "ready"
      ? buildSalaryReviewBudgetModel({
          budgetType: request.budgetType,
          budgetPercentage: request.budgetPercentage ?? 0,
          budgetAbsolute: request.budgetAbsolute ?? 0,
          totalCurrentPayroll: state.plan.summary.totalCurrentPayroll,
          budgetUsed: state.plan.summary.budgetUsed,
          selectedEmployees: state.plan.summary.employeesConsidered,
          proposedEmployees: state.plan.items.filter((item) => item.proposedIncrease > 0).length,
        })
      : null;

  if (!isOpen) return null;

  const applySelected = () => {
    if (state.status !== "ready") return;
    onApprove({
      plan: state.plan,
      selectedEmployeeIds: selectedIds,
    });
    onClose();
  };

  const applyAll = () => {
    if (state.status !== "ready") return;
    onApprove({ plan: state.plan });
    onClose();
  };

  const content = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close AI proposal modal"
        className="absolute inset-0 bg-accent-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl border border-border bg-white shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-brand-500 via-brand-400 to-sky-500" />
        <div className="border-b border-border/50 bg-brand-50/40 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-accent-900">AI Distribution Review</h2>
                <p className="text-sm text-accent-600">
                  Benchmark-grounded recommendations. Use this draft as a starting point, then continue in the review flow to adjust and submit it.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-accent-500 hover:bg-accent-100 hover:text-accent-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-170px)] overflow-y-auto p-6">
          {state.status === "loading" && (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
                <p className="mt-3 text-sm text-accent-600">Building AI proposal from benchmarks and employee context...</p>
              </div>
            </div>
          )}

          {state.status === "error" && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-700">Could not build AI proposal</p>
                  <p className="mt-1 text-sm text-red-600">{state.message}</p>
                </div>
              </div>
            </div>
          )}

          {state.status === "ready" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-brand-100 bg-gradient-to-r from-brand-50/70 via-white to-accent-50/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                      AI review summary
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-accent-900">
                      Review the policy, budget impact, and benchmark rationale before applying any proposal.
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-accent-700">
                      {state.plan.strategicSummary ?? `${budgetModel?.policyLabel} ${budgetModel?.allocationLabel}`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-accent-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                      Current policy
                    </p>
                    <p className="mt-1 text-base font-semibold text-accent-950">
                      {request.budgetType === "percentage"
                        ? `${request.budgetPercentage ?? 0}% of payroll`
                        : formatAED(request.budgetAbsolute ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              {state.plan.strategicSummary && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">
                        Analyst briefing
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-violet-950">
                        {state.plan.strategicSummary}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Current payroll</div>
                  <div className="mt-1 text-lg font-bold text-accent-900">{formatAED(state.plan.summary.totalCurrentPayroll)}</div>
                </div>
                <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Proposed payroll</div>
                  <div className="mt-1 text-lg font-bold text-accent-900">{formatAED(state.plan.summary.totalProposedPayroll)}</div>
                </div>
                <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Allocated</div>
                  <div className="mt-1 text-lg font-bold text-accent-900">
                    {formatAED(state.plan.summary.budgetUsed)} ({state.plan.summary.budgetUsedPercentage.toFixed(1)}%)
                  </div>
                  <div className="mt-1 text-xs text-accent-500">{budgetModel?.allocationLabel}</div>
                </div>
                <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Remaining</div>
                  <div
                    className={clsx(
                      "mt-1 text-lg font-bold",
                      state.plan.summary.budgetRemaining < 0 ? "text-red-600" : "text-emerald-600"
                    )}
                  >
                    {state.plan.summary.budgetRemaining < 0 ? "-" : ""}
                    {formatAED(Math.abs(state.plan.summary.budgetRemaining))}
                  </div>
                  <div className="mt-1 text-xs text-accent-500">{budgetModel?.remainingLabel}</div>
                </div>
              </div>

              {state.plan.warnings.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-700">AI warnings</p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-700">
                    {state.plan.warnings.map((warning) => (
                      <li key={warning} className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
                <table className="w-full">
                  <thead className="bg-accent-50">
                    <tr>
                      <th className="w-10 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={state.plan.items.length > 0 && selectedIds.length === state.plan.items.length}
                          onChange={(event) => {
                            setSelected(
                              Object.fromEntries(
                                state.plan.items.map((item) => [item.employeeId, event.target.checked])
                              )
                            );
                          }}
                          className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-accent-500">Employee</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-accent-500">Current</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-accent-500">Increase</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-accent-500">Proposed</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-accent-500">Source</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-accent-500">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 bg-white">
                    {state.plan.items.map((item) => (
                      <tr key={item.employeeId}>
                        <td className="px-3 py-3 align-top">
                          <input
                            type="checkbox"
                            checked={Boolean(selected[item.employeeId])}
                            onChange={() =>
                              setSelected((prev) => ({ ...prev, [item.employeeId]: !prev[item.employeeId] }))
                            }
                            className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                          />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="text-sm font-semibold text-accent-900">{item.employeeName}</div>
                          <details className="mt-2 rounded-xl border border-accent-100 bg-accent-50/60 px-3 py-2">
                            <summary className="cursor-pointer text-xs font-semibold text-accent-600">
                              Why AI suggested this
                            </summary>
                            <div className="mt-2 space-y-2 text-xs text-accent-600">
                              <p className="text-sm leading-relaxed text-accent-700">
                                {item.aiRationale ?? item.rationale.join(" ")}
                              </p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {item.factors.map((factor) => (
                                  <span
                                    key={factor.key}
                                    className="rounded-full border border-accent-200 bg-white px-2.5 py-1 text-[11px] font-medium text-accent-700"
                                  >
                                    {factor.label}: {factor.value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </details>
                          {item.warnings.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.warnings.map((warning) => (
                                <div key={warning} className="flex items-start gap-1.5 text-xs text-amber-700">
                                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                  <span>{warning}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-right text-sm text-accent-700">{formatAED(item.currentSalary)}</td>
                        <td className="px-3 py-3 align-top text-right text-sm font-semibold text-emerald-600">
                          +{formatAED(item.proposedIncrease)}
                          <div className="text-xs font-normal text-accent-500">{item.proposedPercentage.toFixed(1)}%</div>
                        </td>
                        <td className="px-3 py-3 align-top text-right text-sm font-semibold text-accent-900">{formatAED(item.proposedSalary)}</td>
                        <td className="px-3 py-3 align-top">
                          <div className="space-y-1">
                            <ProvenanceBadge provenance={item.benchmark.provenance} />
                            <div className="text-xs text-accent-500">
                              {item.benchmark.sourceName ?? "No data source"}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="space-y-1">
                            <ConfidenceBadge value={item.confidence} />
                            <div className="text-xs text-accent-500">
                              Match: {item.benchmark.matchQuality.replaceAll("_", " ")}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/50 bg-white px-6 py-4">
          <div className="text-sm text-accent-500">
            {state.status === "ready"
              ? `${selectedIds.length} selected for draft apply. Changes still need review and submission after this step.`
              : "Review AI recommendation details before using this draft"}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>Reject</Button>
            <Button
              variant="outline"
              onClick={applySelected}
              disabled={state.status !== "ready" || selectedIds.length === 0}
            >
              Use Selected Recommendations
            </Button>
            <Button onClick={applyAll} disabled={state.status !== "ready"}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Use AI Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}

