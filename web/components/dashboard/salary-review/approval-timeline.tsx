"use client";

import { Card } from "@/components/ui/card";
import type { SalaryReviewApprovalStepRecord } from "@/lib/salary-review/proposal-types";

export function ApprovalTimeline({ steps }: { steps: SalaryReviewApprovalStepRecord[] }) {
  return (
    <Card className="dash-card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">Timeline</p>
      <h3 className="mt-2 text-base font-semibold text-accent-900">Approval Timeline</h3>
      <p className="mt-1 max-w-md text-sm text-accent-600">
        Approval routing is shown in sequence so reviewers can see what is next.
      </p>

      <div className="mt-5 space-y-3">
        {steps.length > 0 ? (
          steps.map((step) => (
            <div key={step.id} className="rounded-xl border border-accent-100 bg-accent-50/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-accent-950">{step.step_label}</p>
                  {step.trigger_reason && (
                    <p className="mt-1 text-xs text-accent-600">{step.trigger_reason}</p>
                  )}
                </div>
                <span className="rounded-full border border-accent-200 bg-white px-2.5 py-1 text-xs font-semibold text-accent-700">
                  {step.status.replaceAll("_", " ")}
                </span>
              </div>
              {(step.note || step.acted_at) && (
                <p className="mt-2 text-xs text-accent-500">
                  {step.note || "Reviewed"} {step.acted_at ? `· ${new Date(step.acted_at).toLocaleDateString("en-GB")}` : ""}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-accent-200 bg-accent-50/40 px-5 py-6 text-sm text-accent-600">
            No approval steps are recorded for this proposal yet.
          </div>
        )}
      </div>
    </Card>
  );
}
