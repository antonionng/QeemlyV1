"use client";

import type { SalaryReviewApprovalStepRecord } from "@/lib/salary-review/proposal-types";

export function ApprovalChainView({ steps }: { steps: SalaryReviewApprovalStepRecord[] }) {
  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-accent-100 bg-accent-50/40 px-4 py-3 text-sm text-accent-600">
        No approval chain yet.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((step) => (
        <span
          key={step.id}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            step.status === "approved"
              ? "bg-emerald-100 text-emerald-700"
              : step.status === "pending"
                ? "bg-accent-100 text-accent-700"
                : step.status === "returned"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
          }`}
        >
          {step.step_label}
        </span>
      ))}
    </div>
  );
}
