"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AiDistributionModal } from "@/components/dashboard/salary-review";
import { buildSalaryReviewBudgetModel } from "@/lib/salary-review/workspace-budget";
import { formatAEDCompact } from "@/lib/employees";
import { useSalaryReview, type SalaryReviewAiPlanRequest } from "@/lib/salary-review";
import {
  BudgetUsageBar,
  ColumnVisibilityPanel,
  PayrollSummaryCards,
  ReviewSettingsCard,
  SalaryReviewFilters,
  SalaryReviewHeader,
  SalaryReviewTable,
} from "./workspace";

type SalaryReviewWizardProps = {
  onBack: () => void;
  onImport: () => void;
  onExport: () => void;
  onReset: () => void;
  onSubmitSuccess: (proposalId: string | null) => void;
};

type WizardStep = "setup" | "draft" | "final";

const STEP_COPY: Record<WizardStep, { label: string; title: string; body: string }> = {
  setup: {
    label: "Setup",
    title: "Configure the cycle",
    body: "Choose the cycle settings and decide whether to begin with an AI draft or a manual build.",
  },
  draft: {
    label: "Draft",
    title: "Adjust the salary draft",
    body: "Use the workspace table to refine proposed salaries before final review.",
  },
  final: {
    label: "Final Review",
    title: "Review before submission",
    body: "Confirm budget usage, approval routing, and employee coverage before submitting the batch.",
  },
};

function WizardStepBar({
  activeStep,
  steps = ["setup", "draft", "final"],
  onStepChange,
}: {
  activeStep: WizardStep;
  steps?: WizardStep[];
  onStepChange: (step: WizardStep) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {steps.map((step, index) => {
        const isActive = step === activeStep;
        return (
          <button
            key={step}
            type="button"
            onClick={() => onStepChange(step)}
            className={`inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium ${
              isActive ? "bg-[#6E56CF] text-white" : "bg-[#F1F2F8] text-[#7B8190]"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
              {index + 1}
            </span>
            <span>{STEP_COPY[step].label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SalaryReviewWizard({
  onBack,
  onImport,
  onExport,
  onReset,
  onSubmitSuccess,
}: SalaryReviewWizardProps) {
  const {
    settings,
    employees,
    activeProposal,
    approvalSteps,
    totalCurrentPayroll,
    budgetUsed,
    departmentAllocations,
    saveDraftProposal,
    submitActiveProposal,
    applyAiProposal,
    applyDefaultIncreases,
    updateSettings,
    syncDepartmentAllocations,
    updateDepartmentAllocation,
  } = useSalaryReview();
  const [activeStep, setActiveStep] = useState<WizardStep>("setup");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const isSplitReview = settings.reviewMode === "department_split";

  const aiPlanRequest: SalaryReviewAiPlanRequest = useMemo(
    () => ({
      mode: "assistive",
      cycle: settings.cycle === "monthly" ? "monthly" : "annual",
      budgetType: settings.budgetType,
      budgetPercentage: settings.budgetPercentage,
      budgetAbsolute: settings.budgetAbsolute,
      selectedEmployeeIds: employees.filter((employee) => employee.isSelected).map((employee) => employee.id),
    }),
    [employees, settings]
  );

  const budgetModel = buildSalaryReviewBudgetModel({
    budgetType: settings.budgetType,
    budgetPercentage: settings.budgetPercentage,
    budgetAbsolute: settings.budgetAbsolute,
    totalCurrentPayroll,
    budgetUsed,
    selectedEmployees: employees.filter((employee) => employee.isSelected).length,
    proposedEmployees: employees.filter((employee) => employee.proposedIncrease > 0).length,
  });

  const ensureDraft = async (source: "manual" | "ai") => {
    if (employees.length === 0) {
      setFeedback({ type: "error", message: "Import employees before starting a review cycle." });
      return false;
    }

    await saveDraftProposal(source);
    return true;
  };

  const handleCreateSplitReview = async () => {
    if (employees.length === 0) {
      setFeedback({ type: "error", message: "Import employees before starting a split review." });
      return;
    }

    syncDepartmentAllocations();

    try {
      await saveDraftProposal("manual");
      const proposalId = useSalaryReview.getState().activeProposal?.id ?? null;
      if (settings.allocationMethod === "finance_approval") {
        onSubmitSuccess(proposalId);
        return;
      }
      onBack();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Could not create department reviews.",
      });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-8 py-8">
      <SalaryReviewHeader
        actionLabel="Back to Overview"
        onPrimaryAction={onBack}
        onImport={onImport}
        onExport={onExport}
        onReset={onReset}
      />

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <WizardStepBar
        activeStep={activeStep}
        steps={isSplitReview ? ["setup"] : ["setup", "draft", "final"]}
        onStepChange={setActiveStep}
      />

      <Card className="rounded-2xl border-[#E6E8F0] bg-white p-6 shadow-none">
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">
          {STEP_COPY[activeStep].label}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[#1F2430]">{STEP_COPY[activeStep].title}</h2>
        <p className="mt-1 text-sm text-[#8A90A0]">{STEP_COPY[activeStep].body}</p>
      </Card>

      {activeStep === "setup" ? (
        <>
          <ReviewSettingsCard
            title="Review Cycle Setup"
            body="Set the budget policy and effective date before building the draft."
          />
          <Card className="rounded-2xl border-[#E6E8F0] bg-white p-6 shadow-none">
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Workflow Option</p>
            <h3 className="mt-2 text-lg font-semibold text-[#1F2430]">Choose how this salary review should run</h3>
            <p className="mt-1 text-sm text-[#8A90A0]">
              Keep the current company-wide review flow, or split the budget into department reviews that managers work independently.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    reviewMode: "company_wide",
                    allocationMethod: "direct",
                  })
                }
                className={`rounded-2xl border p-4 text-left ${
                  !isSplitReview ? "border-[#6E56CF] bg-[#F7F5FF]" : "border-[#E6E8F0] bg-white"
                }`}
              >
                <p className="text-sm font-semibold text-[#1F2430]">Run Full Company Review</p>
                <p className="mt-1 text-sm text-[#8A90A0]">
                  Use the existing single-cycle workflow with one company-wide budget.
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  updateSettings({ reviewMode: "department_split" });
                  syncDepartmentAllocations();
                }}
                className={`rounded-2xl border p-4 text-left ${
                  isSplitReview ? "border-[#6E56CF] bg-[#F7F5FF]" : "border-[#E6E8F0] bg-white"
                }`}
              >
                <p className="text-sm font-semibold text-[#1F2430]">Split By Department</p>
                <p className="mt-1 text-sm text-[#8A90A0]">
                  Create a master review, allocate budget per department, and let each department run its own workflow.
                </p>
              </button>
            </div>
          </Card>
          {isSplitReview ? (
            <Card className="rounded-2xl border-[#E6E8F0] bg-white p-6 shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Department Split</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#1F2430]">Allocate the master budget by department</h3>
                  <p className="mt-1 text-sm text-[#8A90A0]">
                    Choose whether budgets are assigned now or routed to Finance for approval, then confirm the amount for each department.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => syncDepartmentAllocations()}
                  className="h-10 rounded-[10px] border-[#E6E8F0] bg-[#F4F5FB] px-4 text-[#2E3440]"
                >
                  Auto-Split Budget
                </Button>
              </div>
              <div className="mt-5 flex rounded-[10px] bg-[#F4F5FB] p-1">
                <button
                  type="button"
                  onClick={() => updateSettings({ allocationMethod: "direct" })}
                  className={`flex-1 rounded-[8px] px-4 py-2 text-sm font-medium ${
                    settings.allocationMethod === "direct" ? "bg-[#6E56CF] text-white" : "text-[#2E3440]"
                  }`}
                >
                  Assigned Directly
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ allocationMethod: "finance_approval" })}
                  className={`flex-1 rounded-[8px] px-4 py-2 text-sm font-medium ${
                    settings.allocationMethod === "finance_approval"
                      ? "bg-[#6E56CF] text-white"
                      : "text-[#2E3440]"
                  }`}
                >
                  Finance Approval
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {departmentAllocations.map((allocation) => (
                  <div
                    key={allocation.department}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E6E8F0] bg-[#F7F8FC] px-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1F2430]">{allocation.department}</p>
                      <p className="mt-1 text-xs text-[#8A90A0]">
                        {allocation.selectedEmployeeIds.length} employee
                        {allocation.selectedEmployeeIds.length === 1 ? "" : "s"} in scope
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Budget</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={Math.round(allocation.allocatedBudget)}
                        onChange={(event) =>
                          updateDepartmentAllocation(allocation.department, Number(event.target.value))
                        }
                        className="h-10 w-[140px] rounded-[10px] border border-[#DADFF0] bg-white px-3 text-right text-sm text-[#1F2430] outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => void handleCreateSplitReview()}
                  className="h-10 rounded-[10px] bg-[linear-gradient(135deg,#6E56CF,#7C6AF2)] px-4 text-white"
                >
                  {settings.allocationMethod === "finance_approval"
                    ? "Submit Budget Split For Finance Approval"
                    : "Create Department Reviews"}
                </Button>
              </div>
            </Card>
          ) : null}
          {!isSplitReview ? (
            <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={async () => {
                try {
                  const ready = await ensureDraft("manual");
                  if (!ready) return;
                  setActiveStep("draft");
                  setFeedback({ type: "success", message: "Draft workspace is ready." });
                } catch (error) {
                  setFeedback({
                    type: "error",
                    message: error instanceof Error ? error.message : "Could not create a draft.",
                  });
                }
              }}
              className="h-10 rounded-[10px] bg-[linear-gradient(135deg,#6E56CF,#7C6AF2)] px-4 text-white"
            >
              Build Manually
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAiModal(true)}
              className="h-10 rounded-[10px] border-[#E6E8F0] bg-[#F4F5FB] px-4 text-[#2E3440]"
            >
              <Sparkles className="h-4 w-4" />
              Start With AI Draft
            </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {!isSplitReview && activeStep === "draft" ? (
        <>
          <PayrollSummaryCards />
          <Card className="rounded-2xl border-[#E6E8F0] bg-white p-6 shadow-none">
            <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <SalaryReviewFilters actions={<ColumnVisibilityPanel />} />
                <SalaryReviewTable
                  onSelectEmployee={(employee) => {
                    setSelectedEmployeeId(employee.id);
                  }}
                />
              </div>
              <Card className="rounded-2xl border-[#E6E8F0] bg-[#F7F8FC] p-5 shadow-none">
                <h3 className="text-lg font-semibold text-[#1F2430]">AI Recommendation Panel</h3>
                <p className="mt-2 text-sm text-[#8A90A0]">
                  Re-run the AI draft against the current budget and selected employees at any point in planning.
                </p>
                <div className="mt-4 space-y-3 text-sm text-[#2E3440]">
                  <p>Selected employees: {employees.filter((employee) => employee.isSelected).length}</p>
                  <p>Budget available: {formatAEDCompact(budgetModel.totalBudget)}</p>
                  <p>Draft employees: {employees.filter((employee) => employee.proposedIncrease > 0).length}</p>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowAiModal(true)}
                    className="h-10 rounded-[10px] bg-[linear-gradient(135deg,#6E56CF,#7C6AF2)] text-white"
                  >
                    Run AI Draft
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      applyDefaultIncreases();
                      setFeedback({ type: "success", message: "Default allocation applied to the draft." });
                    }}
                    className="h-10 rounded-[10px] border-[#E6E8F0] bg-white text-[#2E3440]"
                  >
                    Apply Default Allocation
                  </Button>
                </div>
              </Card>
            </div>
          </Card>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActiveStep("setup")}
              className="h-10 rounded-[10px] border-[#E6E8F0] bg-[#F4F5FB] px-4 text-[#2E3440]"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  const ready = await ensureDraft("manual");
                  if (!ready) return;
                  setActiveStep("final");
                  setFeedback({ type: "success", message: "Draft saved. Review the final summary before submit." });
                } catch (error) {
                  setFeedback({
                    type: "error",
                    message: error instanceof Error ? error.message : "Could not save the draft.",
                  });
                }
              }}
              className="h-10 rounded-[10px] bg-[linear-gradient(135deg,#6E56CF,#7C6AF2)] px-4 text-white"
            >
              Continue to Final Review
            </Button>
          </div>
        </>
      ) : null}

      {!isSplitReview && activeStep === "final" ? (
        <>
          <PayrollSummaryCards />
          <BudgetUsageBar />
          <Card className="rounded-2xl border-[#E6E8F0] bg-white p-6 shadow-none">
            <h3 className="text-lg font-semibold text-[#1F2430]">Final Review</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#E6E8F0] bg-[#F7F8FC] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Budget Summary</p>
                <p className="mt-3 text-2xl font-semibold text-[#1F2430]">
                  {formatAEDCompact(budgetUsed)} / {formatAEDCompact(budgetModel.totalBudget)}
                </p>
                <p className="mt-1 text-sm text-[#8A90A0]">Remaining {formatAEDCompact(Math.max(budgetModel.remainingAmount, 0))}</p>
              </div>
              <div className="rounded-2xl border border-[#E6E8F0] bg-[#F7F8FC] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Employee Count</p>
                <p className="mt-3 text-2xl font-semibold text-[#1F2430]">
                  {employees.filter((employee) => employee.isSelected).length}
                </p>
                <p className="mt-1 text-sm text-[#8A90A0]">
                  {employees.filter((employee) => employee.proposedIncrease > 0).length} employees with proposals
                </p>
              </div>
              <div className="rounded-2xl border border-[#E6E8F0] bg-[#F7F8FC] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Approval Routing</p>
                <div className="mt-3 space-y-2">
                  {(approvalSteps.length > 0 ? approvalSteps : [
                    { id: "manager", step_label: "Manager approval" },
                    { id: "hr", step_label: "HR review" },
                  ]).map((step) => (
                    <p key={step.id} className="text-sm text-[#2E3440]">
                      {step.step_label}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Card>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActiveStep("draft")}
              className="h-10 rounded-[10px] border-[#E6E8F0] bg-[#F4F5FB] px-4 text-[#2E3440]"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  if (!activeProposal) {
                    const ready = await ensureDraft("manual");
                    if (!ready) return;
                  }
                  await submitActiveProposal();
                  const proposalId = useSalaryReview.getState().activeProposal?.id ?? null;
                  onSubmitSuccess(proposalId);
                } catch (error) {
                  setFeedback({
                    type: "error",
                    message: error instanceof Error ? error.message : "Could not submit the review.",
                  });
                }
              }}
              className="h-10 rounded-[10px] bg-[linear-gradient(135deg,#6E56CF,#7C6AF2)] px-4 text-white"
            >
              Submit Review
            </Button>
          </div>
        </>
      ) : null}

      <AiDistributionModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        request={aiPlanRequest}
        onApprove={async ({ plan, selectedEmployeeIds }) => {
          if (plan.items.length === 0) {
            applyDefaultIncreases();
          } else {
            applyAiProposal(plan, selectedEmployeeIds);
          }
          await saveDraftProposal("ai");
          setActiveStep("draft");
          setShowAiModal(false);
          setFeedback({ type: "success", message: "AI draft applied. Review the changes in the workspace table." });
        }}
      />
    </div>
  );
}
