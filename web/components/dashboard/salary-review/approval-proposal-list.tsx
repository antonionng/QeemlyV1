"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SalaryReviewProposalRecord } from "@/lib/salary-review/proposal-types";

function formatProposalDate(proposal: SalaryReviewProposalRecord) {
  const rawDate = proposal.updated_at || proposal.created_at;
  if (!rawDate) {
    return "No timestamp";
  }

  return new Date(rawDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ApprovalProposalList({
  proposals,
  isLoading,
  onSelect,
  eyebrow = "Queue",
  title = "Approval Queue",
  description = "Open a proposal batch to review the employee list, comments, routing, and actions.",
  emptyMessage = "No submitted proposals yet. Submit a review from Review Workspace to start the approval queue.",
  countLabel,
}: {
  proposals: SalaryReviewProposalRecord[];
  isLoading?: boolean;
  onSelect: (proposalId: string) => void;
  eyebrow?: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  countLabel?: string;
}) {
  return (
    <div className="space-y-5">
      <Card className="dash-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">{eyebrow}</p>
          <h3 className="mt-2 text-base font-semibold text-accent-900">{title}</h3>
          <p className="mt-1 max-w-md text-sm text-accent-600">
            {description}
          </p>
        </div>
        <span className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
          {countLabel ?? `${proposals.length} proposal${proposals.length === 1 ? "" : "s"}`}
        </span>
      </div>
      </Card>

      {isLoading && proposals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-accent-200 bg-accent-50/40 px-5 py-6 text-sm text-accent-600">
          Loading submitted proposals...
        </div>
      ) : null}

      {!isLoading && proposals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-accent-200 bg-accent-50/40 px-5 py-6 text-sm text-accent-600">
          {emptyMessage}
        </div>
      ) : null}

      {proposals.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {proposals.map((proposal) => {
            return (
              <Card
                key={proposal.id}
                className="dash-card border border-accent-100 bg-white p-5 transition-all hover:border-brand-200 hover:bg-accent-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-accent-950">
                      {proposal.source === "ai" ? "AI proposal" : "Manual proposal"}
                    </p>
                    <p className="mt-1 text-xs text-accent-600">
                      Updated {formatProposalDate(proposal)}
                    </p>
                  </div>
                  <span className="rounded-full border border-accent-200 bg-white px-2.5 py-1 text-xs font-semibold text-accent-700">
                    {proposal.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Metric label="Selected" value={`${proposal.summary.selectedEmployees}`} />
                  <Metric label="Proposed" value={`${proposal.summary.proposedEmployees}`} />
                  <Metric label="Increase" value={`${Math.round(proposal.summary.totalIncrease).toLocaleString()} AED`} />
                </div>

                <div className="mt-4 rounded-2xl border border-accent-100 bg-accent-50/50 px-4 py-3">
                  <p className="text-sm font-medium text-accent-900">Open Batch</p>
                  <p className="mt-1 text-sm text-accent-600">
                    Open the employee list, comments, routing, and actions for this batch.
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button size="sm" onClick={() => onSelect(proposal.id)}>
                    Open Batch
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-accent-100 bg-accent-50/60 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-accent-950">{value}</p>
    </div>
  );
}
