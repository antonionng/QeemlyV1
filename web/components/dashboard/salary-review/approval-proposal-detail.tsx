"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatAEDCompact } from "@/lib/employees";
import type {
  SalaryReviewApprovalStepRecord,
  SalaryReviewAuditEventRecord,
  SalaryReviewDepartmentAllocationRecord,
  SalaryReviewNoteRecord,
  SalaryReviewProposalItemRecord,
  SalaryReviewProposalRecord,
} from "@/lib/salary-review/proposal-types";
import { ApprovalStatusCard } from "./approval-status-card";
import { ApprovalTimeline } from "./approval-timeline";
import { ReviewerActionPanel } from "./reviewer-action-panel";

export function ApprovalProposalDetail({
  proposal,
  proposalItems,
  departmentAllocations = [],
  childCycles = [],
  approvalSteps,
  proposalNotes,
  proposalAuditEvents,
  isLoading,
  canTakeAction,
  canAddNote,
  onBack,
  onAction,
  onAddNote,
  mode = "approval",
}: {
  proposal: SalaryReviewProposalRecord | null;
  proposalItems: SalaryReviewProposalItemRecord[];
  departmentAllocations?: SalaryReviewDepartmentAllocationRecord[];
  childCycles?: SalaryReviewProposalRecord[];
  approvalSteps: SalaryReviewApprovalStepRecord[];
  proposalNotes: SalaryReviewNoteRecord[];
  proposalAuditEvents: SalaryReviewAuditEventRecord[];
  isLoading?: boolean;
  canTakeAction: boolean;
  canAddNote: boolean;
  onBack: () => void;
  onAction: (action: "approve" | "return" | "reject", note: string) => Promise<void> | void;
  onAddNote: (note: string, employeeId?: string | null) => Promise<void> | void;
  mode?: "approval" | "history";
}) {
  const [noteDraft, setNoteDraft] = useState("");
  const isHistoryMode = mode === "history";
  const detailLabel = isHistoryMode ? "Cycle Detail" : "Approval Detail";
  const isSplitMasterReview =
    proposal?.review_mode === "department_split" && proposal.review_scope === "master";
  const reviewEmployees = proposalItems
    .filter((item) => item.selected && item.employee_id)
    .map((item) => {
      const employeeId = String(item.employee_id);
      const employeeNotes = proposalNotes.filter((note) => note.employee_id === employeeId);
      const employeeAuditEvents = proposalAuditEvents.filter((event) => event.employee_id === employeeId);
      const benchmarkSnapshot = item.benchmark_snapshot as { bandPosition?: string } | null;

      return {
        employeeId,
        employeeName: item.employee_name,
        currentSalary: Number(item.current_salary || 0),
        proposedIncrease: Number(item.proposed_increase || 0),
        proposedSalary: Number(item.proposed_salary || 0),
        proposedPercentage: Number(item.proposed_percentage || 0),
        reasonSummary: item.reason_summary || "No reviewer rationale has been captured yet.",
        bandPosition: benchmarkSnapshot?.bandPosition ?? null,
        noteCount: employeeNotes.length,
        activityCount: employeeAuditEvents.length,
      };
    });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    reviewEmployees[0]?.employeeId ?? null
  );
  const selectedEmployee =
    reviewEmployees.find((employee) => employee.employeeId === selectedEmployeeId) ??
    reviewEmployees[0] ??
    null;
  const employeeNotes = selectedEmployee
    ? proposalNotes.filter((note) => note.employee_id === selectedEmployee.employeeId)
    : [];
  const employeeAuditEvents = selectedEmployee
    ? proposalAuditEvents.filter((event) => event.employee_id === selectedEmployee.employeeId)
    : [];
  const sharedNotes = proposalNotes.filter((note) => note.employee_id == null);
  const sharedAuditEvents = proposalAuditEvents.filter((event) => event.employee_id == null);

  if (isLoading && !proposal) {
    return (
      <Card className="dash-card h-full p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">Detail</p>
        <h3 className="mt-2 text-base font-semibold text-accent-900">{detailLabel}</h3>
        <div className="mt-5 rounded-2xl border border-dashed border-accent-200 bg-accent-50/40 px-5 py-6 text-sm text-accent-600">
          Loading proposal detail...
        </div>
      </Card>
    );
  }

  if (!proposal) {
    return (
      <Card className="dash-card h-full p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">Detail</p>
        <h3 className="mt-2 text-base font-semibold text-accent-900">{detailLabel}</h3>
        <div className="mt-5 rounded-2xl border border-dashed border-accent-200 bg-accent-50/40 px-5 py-6 text-sm text-accent-600">
          {isHistoryMode
            ? "Select a past cycle to review its status, notes, and audit history."
            : "Select a proposal from the queue to review routing, notes, and audit history."}
        </div>
      </Card>
    );
  }

  const noteDisabledReason = canAddNote
    ? null
    : isHistoryMode
      ? "Past review cycles stay read-only here. Use this view to inspect status, notes, and audit history."
      : "Notes open once a proposal is actively under review. Approved and rejected proposals stay read-only here.";
  const actionDisabledReason = canTakeAction
    ? null
    : isHistoryMode
      ? "Past review cycles are read-only. Reviewer actions are only available in the active approvals queue."
      : "Reviewer actions are available only while the proposal is submitted or in review.";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-start">
        <Button variant="outline" size="sm" onClick={onBack}>
          Back to queue
        </Button>
      </div>

      <Card className="dash-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
              {isHistoryMode ? "Selected Cycle" : "Selected Proposal"}
            </p>
            <h3 className="mt-2 text-base font-semibold text-accent-900">
              {isSplitMasterReview
                ? "Department budget allocation"
                : proposal.source === "ai"
                  ? "AI proposal"
                  : "Manual proposal"}
            </h3>
            <p className="mt-1 text-sm text-accent-600">
              Effective {new Date(proposal.effective_date).toLocaleDateString("en-GB")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
              {proposal.status.replaceAll("_", " ")}
            </span>
            <span className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
              {proposal.summary.selectedEmployees} selected
            </span>
          </div>
        </div>
      </Card>

      <Card className="dash-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
              {isSplitMasterReview ? "Department Budget Allocation" : "Employees"}
            </p>
            <h3 className="mt-2 text-base font-semibold text-accent-900">
              {isSplitMasterReview ? "Department allocation summary" : "Employee Review List"}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-accent-600">
              {isSplitMasterReview
                ? "Review the budget split and department workflow status before departments begin their individual review cycles."
                : "Review one employee at a time in a single list. Open a row to inspect compensation detail, comments, and activity inline."}
            </p>
          </div>
          <span className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
            {isSplitMasterReview ? `${departmentAllocations.length} department${departmentAllocations.length === 1 ? "" : "s"}` : `${reviewEmployees.length} in scope`}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {isSplitMasterReview ? (
            departmentAllocations.map((allocation) => {
              const childCycle = childCycles.find((cycle) => cycle.id === allocation.child_cycle_id);
              return (
                <div
                  key={allocation.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-100 bg-white px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-accent-950">{allocation.department}</p>
                    <p className="mt-1 text-xs text-accent-600">
                      {proposal.allocation_method === "finance_approval" ? "Finance approval" : "Direct allocation"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-accent-200 bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700">
                      {formatAEDCompact(Number(allocation.allocated_budget || 0))}
                    </span>
                    <span className="rounded-full border border-accent-200 bg-white px-2.5 py-1 text-xs font-semibold text-accent-700">
                      {allocation.allocation_status.replaceAll("_", " ")}
                    </span>
                    {childCycle ? (
                      <span className="rounded-full border border-accent-200 bg-white px-2.5 py-1 text-xs font-semibold text-accent-700">
                        {childCycle.department ?? "Department"} {childCycle.status.replaceAll("_", " ")}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : reviewEmployees.length > 0 ? (
            reviewEmployees.map((employee) => {
              const isExpanded = employee.employeeId === selectedEmployee?.employeeId;
              const rowNotes = proposalNotes.filter((note) => note.employee_id === employee.employeeId);
              const rowAuditEvents = proposalAuditEvents.filter(
                (event) => event.employee_id === employee.employeeId
              );

              return (
                <div
                  key={employee.employeeId}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? "border-brand-300 bg-brand-50 shadow-sm"
                      : "border-accent-100 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedEmployeeId(employee.employeeId)}
                    className="w-full px-4 py-4 text-left"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-accent-950">{employee.employeeName}</p>
                        <p className="mt-1 text-xs text-accent-600">
                          {employee.bandPosition === "below"
                            ? "Below band"
                            : employee.bandPosition === "above"
                              ? "Above band"
                              : "Within band"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-accent-200 bg-white px-2.5 py-1 text-xs font-semibold text-accent-700">
                          {employee.proposedPercentage.toFixed(1)}% increase
                        </span>
                        <span className="text-xs font-medium text-accent-500">
                          {isExpanded ? "Viewing details" : "Open details"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-4">
                      <Metric label="Current" value={formatAEDCompact(employee.currentSalary)} />
                      <Metric label="Proposed" value={formatAEDCompact(employee.proposedSalary)} />
                      <Metric label="Increase" value={formatAEDCompact(employee.proposedIncrease)} />
                      <Metric
                        label="Review context"
                        value={`${employee.noteCount} note${employee.noteCount === 1 ? "" : "s"}`}
                        caption={`${employee.activityCount} activity item${employee.activityCount === 1 ? "" : "s"}`}
                      />
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-brand-100 px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                            Reviewing {employee.employeeName}
                          </p>
                          <h4 className="mt-2 text-base font-semibold text-accent-900">
                            Inline Employee Review
                          </h4>
                          <p className="mt-1 max-w-2xl text-sm text-accent-600">
                            Compensation detail, notes, and activity stay attached to this employee inside the batch list.
                          </p>
                        </div>
                        <span className="rounded-full border border-accent-200 bg-white px-3 py-1 text-xs font-semibold text-accent-700">
                          {employee.proposedPercentage.toFixed(1)}% increase
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-4">
                        <Metric label="Current Salary" value={formatAEDCompact(employee.currentSalary)} />
                        <Metric label="Proposed Salary" value={formatAEDCompact(employee.proposedSalary)} />
                        <Metric label="Increase" value={formatAEDCompact(employee.proposedIncrease)} />
                        <Metric
                          label="Band Position"
                          value={
                            employee.bandPosition === "below"
                              ? "Below band"
                              : employee.bandPosition === "above"
                                ? "Above band"
                                : "Within band"
                          }
                        />
                      </div>

                      <div className="mt-5 rounded-2xl border border-accent-100 bg-white/80 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                          Recommendation
                        </p>
                        <p className="mt-2 text-sm text-accent-800">{employee.reasonSummary}</p>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-accent-900">Employee Review Notes</h4>
                            <p className="mt-1 text-sm text-accent-600">
                              Keep the discussion attached to this employee so small review groups stay easy to follow.
                            </p>
                          </div>
                          <span className="rounded-full border border-accent-200 bg-white px-3 py-1 text-xs font-semibold text-accent-700">
                            {rowNotes.length} note{rowNotes.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        {canAddNote ? (
                          <div className="mt-4 rounded-2xl border border-accent-100 bg-white/80 p-4">
                            <label
                              className="text-sm font-medium text-accent-900"
                              htmlFor={`approval-note-${employee.employeeId}`}
                            >
                              Add note for {employee.employeeName}
                            </label>
                            <textarea
                              id={`approval-note-${employee.employeeId}`}
                              value={isExpanded ? noteDraft : ""}
                              onChange={(event) => setNoteDraft(event.target.value)}
                              placeholder="Capture context for the next reviewer"
                              className="mt-3 min-h-24 w-full rounded-xl border border-accent-200 bg-white px-3 py-2 text-sm text-accent-900 focus:border-brand-300 focus:outline-none"
                            />
                            <div className="mt-3 flex justify-end">
                              <Button
                                size="sm"
                                onClick={async () => {
                                  await onAddNote(noteDraft, employee.employeeId);
                                  setNoteDraft("");
                                }}
                                disabled={!noteDraft.trim()}
                              >
                                Add Note
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-2xl border border-dashed border-accent-200 bg-accent-50/40 px-5 py-5 text-sm text-accent-600">
                            {noteDisabledReason}
                          </div>
                        )}

                        <div className="mt-4 space-y-3">
                          {rowNotes.length > 0 ? (
                            rowNotes.map((note) => (
                              <div key={note.id} className="rounded-xl border border-accent-100 bg-white px-4 py-3 shadow-sm">
                                <p className="text-sm text-accent-800">{note.note}</p>
                                <p className="mt-1 text-xs text-accent-500">
                                  {new Date(note.created_at).toLocaleDateString("en-GB")}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-accent-100 bg-white px-4 py-3 text-sm text-accent-600">
                              No employee-specific notes yet for this review card.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-accent-900">Employee Activity</h4>
                            <p className="mt-1 text-sm text-accent-600">
                              Track the employee-specific note and decision trail without leaving this list.
                            </p>
                          </div>
                          <span className="rounded-full border border-accent-200 bg-white px-3 py-1 text-xs font-semibold text-accent-700">
                            {rowAuditEvents.length} item{rowAuditEvents.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2">
                          {rowAuditEvents.length > 0 ? (
                            rowAuditEvents.map((event) => (
                              <div key={event.id} className="rounded-xl border border-accent-100 bg-white px-4 py-3 shadow-sm">
                                <p className="text-sm text-accent-800">{formatAuditEventLabel(event.event_type)}</p>
                                <p className="mt-1 text-xs text-accent-500">
                                  {new Date(event.created_at).toLocaleDateString("en-GB")}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-accent-100 bg-white px-4 py-3 text-sm text-accent-600">
                              No employee-specific activity yet for this review card.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-accent-200 bg-accent-50/40 px-5 py-6 text-sm text-accent-600">
              No employee review items are attached to this proposal yet.
            </div>
          )}
        </div>
      </Card>

      {sharedNotes.length > 0 || sharedAuditEvents.length > 0 ? (
        <Card className="dash-card p-5">
          <h4 className="text-sm font-semibold text-accent-900">Proposal Context</h4>
          <p className="mt-1 text-sm text-accent-600">
            Proposal-wide notes and audit events stay separate here for context shared across the whole batch.
          </p>

          {sharedNotes.length > 0 ? (
            <div className="mt-4 space-y-3">
              {sharedNotes.map((note) => (
                <div key={note.id} className="rounded-xl border border-accent-100 bg-white px-4 py-3 shadow-sm">
                  <p className="text-sm text-accent-800">{note.note}</p>
                  <p className="mt-1 text-xs text-accent-500">
                    {new Date(note.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {sharedAuditEvents.length > 0 ? (
            <div className="mt-4 space-y-2">
              {sharedAuditEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-accent-100 bg-white px-4 py-3 shadow-sm">
                  <p className="text-sm text-accent-800">{formatAuditEventLabel(event.event_type)}</p>
                  <p className="mt-1 text-xs text-accent-500">
                    {new Date(event.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}

      {!isHistoryMode ? (
        <ReviewerActionPanel
          disabled={!canTakeAction}
          disabledReason={actionDisabledReason ?? undefined}
          onAction={onAction}
          eyebrow="Proposal Decision"
          title="Finalize Proposal Decision"
          description="Use this after reviewing the relevant employee rows. This action updates the whole proposal, not just one employee."
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <ApprovalStatusCard proposal={proposal} approvalSteps={approvalSteps} />
        <ApprovalTimeline steps={approvalSteps} />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="rounded-xl border border-accent-100 bg-accent-50/60 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-accent-950">{value}</p>
      {caption ? <p className="mt-1 text-xs text-accent-500">{caption}</p> : null}
    </div>
  );
}

function formatAuditEventLabel(eventType: string) {
  return eventType.replaceAll("_", " ");
}
