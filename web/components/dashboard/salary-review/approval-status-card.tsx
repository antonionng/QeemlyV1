"use client";

import { Card } from "@/components/ui/card";
import type {
  SalaryReviewApprovalStepRecord,
  SalaryReviewProposalRecord,
} from "@/lib/salary-review/proposal-types";

export function ApprovalStatusCard({
  proposal,
  approvalSteps,
}: {
  proposal: SalaryReviewProposalRecord | null;
  approvalSteps: SalaryReviewApprovalStepRecord[];
}) {
  const pendingSteps = approvalSteps.filter((step) => step.status === "pending").length;
  const approvedSteps = approvalSteps.filter((step) => step.status === "approved").length;
  const currentStep = approvalSteps.find((step) => step.status === "pending");

  return (
    <Card className="dash-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">Status</p>
          <h3 className="mt-2 text-base font-semibold text-accent-900">Approval Status</h3>
          <p className="mt-1 max-w-md text-sm text-accent-600">
            {proposal
              ? "Track the selected salary-review proposal and approval progress."
              : "No approval proposal selected yet."}
          </p>
        </div>
        <span className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
          {proposal?.status?.replaceAll("_", " ") || "not selected"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Approved steps" value={`${approvedSteps}`} />
        <Metric label="Pending steps" value={`${pendingSteps}`} />
        <Metric label="Current step" value={currentStep?.step_label || "None"} />
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-accent-100 bg-accent-50/60 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-accent-950">{value}</div>
    </div>
  );
}
