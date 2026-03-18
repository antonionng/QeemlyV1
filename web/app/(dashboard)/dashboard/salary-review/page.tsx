"use client";

import { Suspense, useState, useEffect, useMemo, type FormEvent } from "react";
import { Calendar, RefreshCw, Download, Upload, Loader2, Sparkles, UserPlus, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiDistributionModal, ApprovalProposalDetail, ApprovalProposalList, ReviewTable, ReviewTabs } from "@/components/dashboard/salary-review";
import { UploadModal } from "@/components/dashboard/upload";
import { SalaryReviewOverview } from "@/components/salary-review";
import { useSalaryReview, type SalaryReviewAiPlanRequest } from "@/lib/salary-review";
import { REVIEW_CYCLES, type ReviewCycle } from "@/lib/company";
import { formatAEDCompact, type Department } from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";
import { LOCATIONS, LEVELS, ROLES } from "@/lib/dashboard/dummy-data";
import { summarizeBenchmarkTrust } from "@/lib/benchmarks/trust";
import { buildSalaryReviewCsv } from "@/lib/salary-review/export";
import { buildSalaryReviewInsightModel } from "@/lib/salary-review/insights";
import { parseSalaryReviewSearchParams } from "@/lib/salary-review/url-state";
import { buildSalaryReviewBudgetModel } from "@/lib/salary-review/workspace-budget";
import { ReviewActionCards } from "@/components/dashboard/salary-review/review-action-cards";
import { ReviewDataHealth } from "@/components/dashboard/salary-review/review-data-health";
import { ReviewSummaryHero } from "@/components/dashboard/salary-review/review-summary-hero";
import { ReviewWatchouts } from "@/components/dashboard/salary-review/review-watchouts";
import {
  canAddApprovalNote,
  canTakeApprovalAction,
} from "@/lib/salary-review/approval-center";
import {
  type BuildReviewStep,
  buildSalaryReviewDashboardModel,
  getApprovalViewLevel,
  getBuildReviewFlowModel,
  getPostSubmitReviewOutcome,
  getSalaryReviewWorkspaceVisibility,
  shouldRedirectSalaryReviewTab,
} from "@/lib/salary-review/dashboard";
import type { SalaryReviewTab } from "@/lib/salary-review/url-state";
import { createEmployee } from "./actions";

const PERCENTAGE_BUDGET_SUGGESTIONS = [2, 3, 5, 8, 10];
const ABSOLUTE_BUDGET_SUGGESTIONS = [25000, 50000, 100000, 250000, 500000];
const DEPARTMENTS: Department[] = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "HR",
];

type AddEmployeeForm = {
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  roleId: string;
  levelId: string;
  locationId: string;
  baseSalary: string;
  hireDate: string;
};

const DEFAULT_ADD_EMPLOYEE_FORM: AddEmployeeForm = {
  firstName: "",
  lastName: "",
  email: "",
  department: DEPARTMENTS[0],
  roleId: ROLES[0]?.id ?? "",
  levelId: LEVELS[0]?.id ?? "",
  locationId: LOCATIONS[0]?.id ?? "",
  baseSalary: "",
  hireDate: "",
};

function SalaryReviewPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [addAnotherOnSave, setAddAnotherOnSave] = useState(false);
  const [addEmployeeForm, setAddEmployeeForm] = useState<AddEmployeeForm>(DEFAULT_ADD_EMPLOYEE_FORM);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [requestedBuildReviewStep, setRequestedBuildReviewStep] = useState<BuildReviewStep | null>(null);
  const {
    settings,
    employees,
    isLoading,
    totalCurrentPayroll,
    budgetUsed,
    budgetRemaining,
    updateSettings,
    applyDefaultIncreases,
    applyAiProposal,
    resetReview,
    loadEmployeesFromDb,
    loadCycles,
    activeProposal,
    departmentAllocations,
    childCycles,
    isProposalLoading,
    cycles,
    loadLatestProposal,
    loadApprovalProposalList,
    selectCycle,
    selectApprovalProposal,
    reviewSelectedApprovalProposal,
    addApprovalProposalNote,
    saveDraftProposal,
    submitActiveProposal,
    approvalQueue,
    selectedApprovalProposalId,
    selectedApprovalProposal,
    selectedApprovalDepartmentAllocations,
    selectedApprovalChildCycles,
    selectedApprovalItemsByEmployee,
    selectedApprovalSteps,
    selectedApprovalNotes,
    selectedApprovalAuditEvents,
    isApprovalQueueLoading,
    isApprovalDetailLoading,
  } = useSalaryReview();
  const { salaryView, setSalaryView } = useSalaryView();

  // Load employees from database on mount
  useEffect(() => {
    void (async () => {
      try {
        await loadEmployeesFromDb();
        await loadCycles();
        await loadLatestProposal();
        await loadApprovalProposalList();
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Could not load the latest salary review draft.",
        });
      }
    })();
  }, [loadEmployeesFromDb, loadCycles, loadLatestProposal, loadApprovalProposalList]);

  useEffect(() => {
    if (activeProposal?.cycle) {
      setSalaryView(activeProposal.cycle);
    }
  }, [activeProposal?.cycle, setSalaryView]);

  const [showSettings, setShowSettings] = useState(true);
  const budgetInput =
    settings.budgetType === "percentage"
      ? (settings.budgetPercentage === 0 ? "" : String(settings.budgetPercentage))
      : (settings.budgetAbsolute === 0 ? "" : String(settings.budgetAbsolute));

  const budget = settings.budgetType === "percentage"
    ? totalCurrentPayroll * (settings.budgetPercentage / 100)
    : settings.budgetAbsolute;

  const selectedCount = employees.filter(e => e.isSelected).length;
  const selectedEmployeeIds = employees.filter((employee) => employee.isSelected).map((employee) => employee.id);
  const withIncreaseCount = employees.filter(e => e.proposedIncrease > 0).length;
  const currentBudgetSuggestions = settings.budgetType === "percentage"
    ? PERCENTAGE_BUDGET_SUGGESTIONS
    : ABSOLUTE_BUDGET_SUGGESTIONS;
  const aiPlanCycle: SalaryReviewAiPlanRequest["cycle"] =
    settings.cycle === "monthly" ? "monthly" : "annual";
  const aiPlanRequest: SalaryReviewAiPlanRequest = {
    mode: "assistive",
    cycle: aiPlanCycle,
    budgetType: settings.budgetType,
    budgetPercentage: settings.budgetPercentage,
    budgetAbsolute: settings.budgetAbsolute,
    selectedEmployeeIds,
  };
  const benchmarkTrust = summarizeBenchmarkTrust(employees);
  const initialQueryState = useMemo(
    () => parseSalaryReviewSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );
  const activeTab = initialQueryState.tab;
  const renderedTab = shouldRedirectSalaryReviewTab(activeTab) ? "overview" : activeTab;
  const dashboardModel = useMemo(
    () => buildSalaryReviewDashboardModel({ activeProposal, cycles, approvalQueue }),
    [activeProposal, approvalQueue, cycles]
  );
  const detailProposals = renderedTab === "history" ? dashboardModel.history : dashboardModel.awaitingReview;
  const requestedApprovalProposalId = initialQueryState.proposalId;
  const activeApprovalProposalId = useMemo(
    () =>
      requestedApprovalProposalId &&
      detailProposals.some((proposal) => proposal.id === requestedApprovalProposalId)
        ? requestedApprovalProposalId
        : null,
    [detailProposals, requestedApprovalProposalId]
  );
  const approvalViewLevel = getApprovalViewLevel(activeApprovalProposalId);

  useEffect(() => {
    if (renderedTab !== "approvals" && renderedTab !== "history") {
      return;
    }

    if (!activeApprovalProposalId) {
      return;
    }

    if (activeApprovalProposalId !== selectedApprovalProposalId) {
      void selectApprovalProposal(activeApprovalProposalId);
    }
  }, [
    renderedTab,
    activeApprovalProposalId,
    selectedApprovalProposalId,
    selectApprovalProposal,
  ]);

  const insightModel = buildSalaryReviewInsightModel({
    employees,
    budget,
    budgetUsed,
    budgetRemaining,
  });
  const budgetModel = buildSalaryReviewBudgetModel({
    budgetType: settings.budgetType,
    budgetPercentage: settings.budgetPercentage,
    budgetAbsolute: settings.budgetAbsolute,
    totalCurrentPayroll,
    budgetUsed,
    selectedEmployees: selectedCount,
    proposedEmployees: withIncreaseCount,
  });
  const workspaceVisibility = getSalaryReviewWorkspaceVisibility({
    employeesCount: employees.length,
    proposedEmployees: withIncreaseCount,
    hasActiveProposal: Boolean(activeProposal),
  });
  const reviewTabs = [
    dashboardModel.tabs.overview,
    dashboardModel.tabs.approvals,
    dashboardModel.tabs.history,
  ];
  useEffect(() => {
    if (!shouldRedirectSalaryReviewTab(initialQueryState.tab)) {
      return;
    }

    router.replace("/dashboard/salary-review/new");
  }, [initialQueryState.tab, router]);

  const buildReviewFlow = useMemo(
    () =>
      getBuildReviewFlowModel({
        requestedStep: requestedBuildReviewStep,
        employeesCount: employees.length,
        proposedEmployees: withIncreaseCount,
      }),
    [requestedBuildReviewStep, employees.length, withIncreaseCount]
  );

  const handleExport = () => {
    const csv = buildSalaryReviewCsv(employees);
    if (!csv.trim() || csv.split("\n").length <= 1) {
      setFeedback({ type: "error", message: "Select at least one employee before exporting." });
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `salary-review-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback({ type: "success", message: "Salary review export downloaded." });
  };

  const handleTabChange = (tab: SalaryReviewTab, proposalId?: string | null) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", tab);
    if (tab === "overview" || tab === "review") {
      nextParams.delete("proposalId");
    } else if (proposalId) {
      nextParams.set("proposalId", proposalId);
    } else {
      nextParams.delete("proposalId");
    }
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  };

  const handleProposalSelect = (tab: "approvals" | "history", proposalId: string) => {
    handleTabChange(tab, proposalId);
  };

  const handleBackToQueue = (tab: "approvals" | "history") => {
    handleTabChange(tab, null);
  };

  const handleStartNewCycle = async () => {
    router.push("/dashboard/salary-review/new");
  };

  const handleContinueDraft = () => {
    router.push("/dashboard/salary-review/new");
  };

  const handleStartWithAiDraft = async () => {
    router.push("/dashboard/salary-review/new");
  };

  const handleBuildManually = () => {
    setRequestedBuildReviewStep("draft");
  };

  const handleOpenFinalReview = () => {
    setRequestedBuildReviewStep("review");
  };

  const handleBackToSetup = () => {
    setRequestedBuildReviewStep("setup");
  };

  const handleBackToDraft = () => {
    setRequestedBuildReviewStep("draft");
  };

  const handleSaveDraft = async (source: "manual" | "ai" = "manual") => {
    try {
      await saveDraftProposal(source);
      setFeedback({ type: "success", message: "Salary review draft saved." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Could not save the salary review draft.",
      });
    }
  };

  const handleSubmitProposal = async () => {
    try {
      await submitActiveProposal();
      const submittedProposalId = useSalaryReview.getState().activeProposal?.id ?? null;
      const outcome = getPostSubmitReviewOutcome(submittedProposalId);
      setFeedback({ type: "success", message: outcome.feedbackMessage });
      handleTabChange(outcome.nextTab, outcome.proposalId);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Could not submit the salary review proposal.",
      });
    }
  };

  const handleReviewDecision = async (action: "approve" | "return" | "reject", note: string) => {
    try {
      await reviewSelectedApprovalProposal(action, note);
      const message =
        action === "approve"
          ? "Proposal approved."
          : action === "reject"
            ? "Proposal rejected."
            : "Proposal returned for revision.";
      setFeedback({ type: "success", message });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Could not update proposal review status.",
      });
    }
  };

  const handleApprovalNote = async (note: string, employeeId?: string | null) => {
    try {
      await addApprovalProposalNote(note, employeeId);
      setFeedback({ type: "success", message: "Approval note added." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Could not add a note to the selected proposal.",
      });
    }
  };

  const handleBudgetInputChange = (value: string) => {
    const normalizedValue = value.replace(/,/g, "").trim();
    if (!/^\d*\.?\d*$/.test(normalizedValue)) return;

    if (normalizedValue === "") {
      if (settings.budgetType === "percentage") {
        updateSettings({ budgetPercentage: 0 });
      } else {
        updateSettings({ budgetAbsolute: 0 });
      }
      return;
    }

    const parsedValue = Number(normalizedValue);
    if (!Number.isFinite(parsedValue)) return;

    if (settings.budgetType === "percentage") {
      updateSettings({ budgetPercentage: parsedValue });
    } else {
      updateSettings({ budgetAbsolute: parsedValue });
    }
  };

  const handleAddEmployee = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    setIsCreatingEmployee(true);

    const result = await createEmployee({
      firstName: addEmployeeForm.firstName,
      lastName: addEmployeeForm.lastName,
      email: addEmployeeForm.email || undefined,
      department: addEmployeeForm.department,
      roleId: addEmployeeForm.roleId,
      levelId: addEmployeeForm.levelId,
      locationId: addEmployeeForm.locationId,
      baseSalary: Number(addEmployeeForm.baseSalary),
      hireDate: addEmployeeForm.hireDate || undefined,
    });

    if (!result.success) {
      setFeedback({ type: "error", message: result.error });
      setIsCreatingEmployee(false);
      return;
    }

    if (addAnotherOnSave) {
      setFeedback({ type: "success", message: "Employee added. Add the next one." });
      setAddEmployeeForm((prev) => ({
        ...prev,
        firstName: "",
        lastName: "",
        email: "",
        baseSalary: "",
      }));
    } else {
      setFeedback({ type: "success", message: "Employee added successfully." });
      setShowAddEmployeeModal(false);
      setAddEmployeeForm(DEFAULT_ADD_EMPLOYEE_FORM);
    }
    await loadEmployeesFromDb();
    setIsCreatingEmployee(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500 mx-auto" />
          <p className="mt-3 text-brand-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div id="review-controls" className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">
            Salary Review
          </h1>
          <p className="mt-1 text-sm text-accent-600">
            {activeTab === "overview"
              ? "Start a new cycle, continue an active draft, or review alerts and past cycles."
              : activeTab === "review"
                ? buildReviewFlow.activeStep === "setup"
                  ? "Step 1 of 3. Set up the cycle, choose the employee scope, and decide whether to draft manually or with AI."
                  : buildReviewFlow.activeStep === "draft"
                    ? "Step 2 of 3. Adjust salary recommendations manually or refine the AI draft before final review."
                    : "Step 3 of 3. Review the final budget, watchouts, and data health before submitting for approval."
                : activeTab === "approvals"
                  ? "Review proposals that are actively awaiting approval."
                  : "Browse completed review cycles and inspect their history."}
          </p>
        </div>
        {activeTab === "review" ? (
          <div className="flex items-center gap-2 shrink-0">
            {buildReviewFlow.activeStep === "setup" ? (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="h-9 rounded-full bg-brand-500 px-5 text-white hover:bg-brand-600"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(true)}
                  className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBuildManually}
                  disabled={employees.length === 0}
                  className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
                >
                  Build Manually
                </Button>
              </>
            ) : buildReviewFlow.activeStep === "draft" ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleSaveDraft()}
                  disabled={isProposalLoading || employees.length === 0}
                  className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
                >
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  onClick={handleOpenFinalReview}
                  disabled={!buildReviewFlow.canContinueToReview}
                  className="h-9 rounded-full bg-brand-500 px-5 text-white hover:bg-brand-600"
                >
                  Continue To Final Review
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToDraft}
                  className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
                >
                  Back To Adjustments
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button
                  size="sm"
                  onClick={() => void handleSubmitProposal()}
                  disabled={isProposalLoading || !activeProposal}
                  className="h-9 rounded-full bg-brand-500 px-5 text-white hover:bg-brand-600"
                >
                  Submit For Approval
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleStartNewCycle()}
              className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              New Cycle
            </Button>
          </div>
        ) : null}
      </div>

      <ReviewTabs activeTab={renderedTab} items={reviewTabs} onChange={handleTabChange} />

      {activeTab === "review" ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50/70 via-white to-accent-50/60 p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Display</p>
            <h3 className="mt-1 text-sm font-semibold text-accent-900">Salary View</h3>
            <p className="mt-0.5 text-xs text-accent-500">Switch between monthly and annual salary figures without changing saved proposal values.</p>
          </div>
          <div className="flex overflow-hidden rounded-2xl border border-brand-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => {
                setSalaryView("monthly");
              }}
              className={`px-6 py-2.5 text-sm font-semibold transition-all ${
                salaryView === "monthly"
                  ? "rounded-xl bg-brand-500 text-white shadow-sm"
                  : "rounded-xl bg-white text-accent-600 hover:bg-brand-50"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => {
                setSalaryView("annual");
              }}
              className={`px-6 py-2.5 text-sm font-semibold transition-all ${
                salaryView === "annual"
                  ? "rounded-xl bg-brand-500 text-white shadow-sm"
                  : "rounded-xl bg-white text-accent-600 hover:bg-brand-50"
              }`}
            >
              Annual
            </button>
          </div>
        </div>
      ) : null}

      {renderedTab === "overview" && (
        <>
          {activeProposal?.review_mode === "department_split" &&
          activeProposal.review_scope === "master" ? (
            <Card className="dash-card border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                    Master Review
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-accent-950">Department split overview</h2>
                  <p className="mt-2 text-sm text-accent-700">
                    Track the master budget, department allocations, and department review progress in one place.
                  </p>
                </div>
                <div className="rounded-2xl border border-accent-200 bg-white px-4 py-3 text-sm font-medium text-accent-700 shadow-sm">
                  {departmentAllocations.length} department allocation
                  {departmentAllocations.length === 1 ? "" : "s"}
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <OverviewMetric
                  label="Master budget"
                  value={formatAEDCompact(activeProposal.budget_absolute || 0)}
                  body="This is the total budget being split across departments."
                />
                <OverviewMetric
                  label="Allocated budget"
                  value={formatAEDCompact(
                    departmentAllocations.reduce((sum, allocation) => sum + allocation.allocatedBudget, 0)
                  )}
                  body="Sum of all current department allocations."
                />
                <OverviewMetric
                  label="Departments ready"
                  value={`${childCycles.filter((cycle) => cycle.allocation_status === "approved").length}`}
                  body="Departments whose budgets are approved and ready for manager action."
                />
                <OverviewMetric
                  label="Departments pending"
                  value={`${childCycles.filter((cycle) => cycle.allocation_status !== "approved").length}`}
                  body="Departments still waiting on allocation approval."
                />
              </div>
              {childCycles.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {childCycles.map((cycle) => (
                    <div
                      key={cycle.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-100 bg-white px-4 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-accent-950">{cycle.department ?? "Department"}</p>
                        <p className="mt-1 text-xs text-accent-600">
                          Allocation {cycle.allocation_status?.replaceAll("_", " ") ?? "pending"}.
                          Review {cycle.status.replaceAll("_", " ")}.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void selectCycle(cycle.id)}
                        className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
                      >
                        Open Department Review
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          ) : null}
          <SalaryReviewOverview
            cycles={cycles}
            activeCycle={activeProposal}
            actionLabel={dashboardModel.hasDraft ? "Continue Draft" : "Start Review Cycle"}
            onPrimaryAction={dashboardModel.hasDraft ? handleContinueDraft : () => void handleStartNewCycle()}
            onImport={() => setShowUploadModal(true)}
            onExport={handleExport}
            onReset={resetReview}
            onSelectCycle={(proposalId) => void selectCycle(proposalId)}
            initialQueryState={initialQueryState}
          />
        </>
      )}

      {activeTab === "review" && (
        <>
          <Card className="dash-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              {buildReviewFlow.steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (step.enabled) setRequestedBuildReviewStep(step.id);
                  }}
                  disabled={!step.enabled}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                    buildReviewFlow.activeStep === step.id
                      ? "border-brand-300 bg-brand-50 text-brand-800"
                      : step.enabled
                        ? "border-accent-200 bg-white text-accent-700 hover:bg-accent-50"
                        : "border-accent-100 bg-accent-50/60 text-accent-400"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-accent-700">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p className="text-xs">
                      {step.id === "setup"
                        ? "Set policy and decide how to draft"
                        : step.id === "draft"
                          ? "Adjust employee recommendations"
                          : "Review before submission"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {buildReviewFlow.activeStep === "setup" ? (
            <Card id="review-settings" className="dash-card p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">Step 1</p>
                  <h2 className="mt-1 text-base font-semibold text-accent-900">Set up this review cycle</h2>
                  <p className="mt-1 text-sm text-accent-600">
                    Confirm the cycle, budget policy, and effective date. Then choose whether to draft manually in the employee table or start with AI recommendations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowAiModal(true)}
                    className="h-8 rounded-full bg-brand-500 px-4 text-xs text-white hover:bg-brand-600"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Start With AI Draft
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBuildManually}
                    disabled={employees.length === 0}
                    className="h-8 rounded-full border-border bg-white px-4 text-xs text-accent-700 hover:bg-accent-50"
                  >
                    Build Manually
                  </Button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-xs font-medium text-accent-500 transition-colors hover:text-accent-700"
                  >
                    {showSettings ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {showSettings && (
                <>
                  <div className="grid items-start gap-4 md:grid-cols-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">
                        Review cycle
                      </label>
                      <select
                        value={settings.cycle}
                        onChange={(e) => updateSettings({ cycle: e.target.value as ReviewCycle })}
                        className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-accent-900 focus:border-brand-300 focus:outline-none"
                      >
                        {REVIEW_CYCLES.map((cycle) => (
                          <option key={cycle.value} value={cycle.value}>
                            {cycle.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">
                        Budget policy
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={budgetInput}
                        onChange={(e) => handleBudgetInputChange(e.target.value)}
                        placeholder={settings.budgetType === "percentage" ? "Enter budget %" : "Enter budget in AED"}
                        className="rounded-xl"
                        fullWidth
                      />
                      <p className="mt-2 text-xs text-accent-500">
                        {settings.budgetType === "percentage"
                          ? "Percentage is calculated from current payroll."
                          : "Fixed amount is used as the full review budget."}
                      </p>
                      <p className="mt-1 text-xs text-accent-500">{budgetModel.usageLabel}</p>
                      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
                        {currentBudgetSuggestions.map((value) => (
                          <button
                            key={`${settings.budgetType}-${value}`}
                            type="button"
                            onClick={() => {
                              if (settings.budgetType === "percentage") {
                                updateSettings({ budgetPercentage: value });
                              } else {
                                updateSettings({ budgetAbsolute: value });
                              }
                            }}
                            className="shrink-0 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-accent-600 transition-colors hover:bg-accent-50"
                          >
                            {settings.budgetType === "percentage" ? `${value}%` : formatAEDCompact(value)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">
                        Budget type
                      </label>
                      <div className="flex self-start overflow-hidden rounded-xl border border-border">
                        <button
                          onClick={() => {
                            updateSettings({ budgetType: "percentage" });
                          }}
                          className={`h-11 flex-1 text-sm font-medium transition-colors ${
                            settings.budgetType === "percentage"
                              ? "bg-brand-500 text-white"
                              : "bg-white text-accent-600 hover:bg-accent-50"
                          }`}
                        >
                          %
                        </button>
                        <button
                          onClick={() => {
                            updateSettings({ budgetType: "absolute" });
                          }}
                          className={`h-11 flex-1 text-sm font-medium transition-colors ${
                            settings.budgetType === "absolute"
                              ? "bg-brand-500 text-white"
                              : "bg-white text-accent-600 hover:bg-accent-50"
                          }`}
                        >
                          AED
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">
                        Effective date
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={settings.effectiveDate}
                          onChange={(e) => updateSettings({ effectiveDate: e.target.value })}
                          className="rounded-xl pl-3 pr-10"
                          fullWidth
                        />
                        <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-400" />
                      </div>
                      <p className="mt-2 text-xs text-accent-500">{budgetModel.effectiveDateLabel}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-2xl border border-accent-100 bg-accent-50/60 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                        Budget scope
                      </p>
                      <p className="mt-1 text-sm text-accent-700">{budgetModel.usageLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-accent-100 bg-accent-50/60 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                        Build the proposal
                      </p>
                      <p className="mt-1 text-sm text-accent-700">{budgetModel.applicationLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-accent-100 bg-accent-50/60 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                        Effective date
                      </p>
                      <p className="mt-1 text-sm text-accent-700">{budgetModel.effectiveDateLabel}</p>
                    </div>
                  </div>
                </>
              )}
            </Card>
          ) : null}

          {buildReviewFlow.activeStep === "draft" ? (
            <>
              <Card className="dash-card border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Step 2</p>
                    <h2 className="mt-2 text-xl font-semibold text-accent-950">Adjust the draft</h2>
                    <p className="mt-2 text-sm text-accent-700">
                      Review the employee-level recommendations, make manual changes where needed, save the draft, and continue only when the proposal is ready for final review.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={handleBackToSetup}
                      className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
                    >
                      Back To Setup
                    </Button>
                    <Button
                      onClick={handleOpenFinalReview}
                      disabled={!buildReviewFlow.canContinueToReview}
                      className="h-9 rounded-full bg-brand-500 px-5 text-white hover:bg-brand-600"
                    >
                      Continue To Final Review
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <OverviewMetric label="Selected employees" value={`${selectedCount}`} body="These employees are currently in scope for the draft." />
                  <OverviewMetric label="Proposed changes" value={`${withIncreaseCount}`} body="Employees with a proposed increase already applied." />
                  <OverviewMetric label="Remaining budget" value={formatAEDCompact(applyViewMode(budgetRemaining, salaryView))} body={withIncreaseCount > 0 ? "Once changes look right, move to final review." : "Apply AI or manual changes to unlock final review."} />
                </div>
              </Card>

              {employees.length === 0 ? (
                <Card className="dash-card p-8 text-center">
                  <div className="mx-auto max-w-xl space-y-3">
                    <h3 className="text-lg font-semibold text-accent-900">No employees yet</h3>
                    <p className="text-sm text-accent-600">
                      Add one employee in seconds, or import a file when you are ready for bulk updates.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => setShowAddEmployeeModal(true)}
                        className="h-9 rounded-full bg-brand-500 px-5 text-white hover:bg-brand-600"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Employee
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUploadModal(true)}
                        className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Bulk Import
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <ReviewTable initialQueryState={initialQueryState} />
              )}
            </>
          ) : null}

          {buildReviewFlow.activeStep === "review" ? (
            <>
              <Card className="dash-card border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Step 3</p>
                    <h2 className="mt-2 text-xl font-semibold text-accent-950">Final review before approval</h2>
                    <p className="mt-2 text-sm text-accent-700">
                      Check the budget, diagnostics, and review watchouts here. If anything needs changing, go back to adjustments before you submit this cycle for approval.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={handleBackToDraft}
                      className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
                    >
                      Back To Adjustments
                    </Button>
                    <Button
                      onClick={() => void handleSubmitProposal()}
                      disabled={isProposalLoading || !activeProposal}
                      className="h-9 rounded-full bg-brand-500 px-5 text-white hover:bg-brand-600"
                    >
                      Submit For Approval
                    </Button>
                  </div>
                </div>
              </Card>

              {workspaceVisibility.showWorkspaceSummary ? (
                <ReviewSummaryHero
                  budget={applyViewMode(budget, salaryView)}
                  budgetUsed={applyViewMode(budgetUsed, salaryView)}
                  budgetRemaining={applyViewMode(budgetRemaining, salaryView)}
                  budgetPolicyLabel={budgetModel.policyLabel}
                  budgetAllocationLabel={budgetModel.allocationLabel}
                  budgetRemainingLabel={budgetModel.remainingLabel}
                  selectedEmployees={insightModel.summary.selectedEmployees}
                  coveredEmployees={insightModel.summary.coveredEmployees}
                  totalEmployees={employees.length}
                  belowBandEmployees={insightModel.summary.belowBandEmployees}
                  proposedEmployees={insightModel.summary.proposedEmployees}
                  benchmarkTrustLabel={insightModel.summary.benchmarkTrustLabel}
                />
              ) : null}

              {workspaceVisibility.showDiagnostics ? (
                <>
                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <ReviewWatchouts items={insightModel.watchouts} />
                    <ReviewDataHealth benchmarkTrust={benchmarkTrust} activeEmployees={employees.length} />
                  </div>

                  <div id="review-export">
                    <ReviewActionCards
                      selectedEmployees={selectedCount}
                      coveredEmployees={benchmarkTrust.benchmarkedEmployees}
                      totalEmployees={employees.length}
                      proposedEmployees={withIncreaseCount}
                    />
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </>
      )}

      {renderedTab === "approvals" && (
        <>
          <Card className="dash-card border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Approvals</p>
                <h2 className="mt-2 text-xl font-semibold text-accent-950">Approval Center</h2>
                <p className="mt-2 text-sm text-accent-700">
                  Review submitted proposal batches from a single queue, then click into one batch to work through employee rows, comments, routing, and actions in one place.
                </p>
              </div>
              <div className="rounded-2xl border border-accent-200 bg-white px-4 py-3 text-sm font-medium text-accent-700 shadow-sm">
                {dashboardModel.awaitingReview.length > 0
                  ? `${dashboardModel.awaitingReview.length} awaiting review`
                  : "Submit a review from Review Workspace to start approvals."}
              </div>
            </div>
          </Card>

          {approvalViewLevel === "queue" ? (
            <ApprovalProposalList
              proposals={dashboardModel.awaitingReview}
              isLoading={isApprovalQueueLoading}
              onSelect={(proposalId) => handleProposalSelect("approvals", proposalId)}
            />
          ) : (
            <ApprovalProposalDetail
              key={activeApprovalProposalId ?? "approvals-empty"}
              proposal={selectedApprovalProposal}
              proposalItems={Object.values(selectedApprovalItemsByEmployee)}
              departmentAllocations={selectedApprovalDepartmentAllocations}
              childCycles={selectedApprovalChildCycles}
              approvalSteps={selectedApprovalSteps}
              proposalNotes={selectedApprovalNotes}
              proposalAuditEvents={selectedApprovalAuditEvents}
              isLoading={isApprovalDetailLoading}
              canTakeAction={
                canTakeApprovalAction(selectedApprovalProposal?.status) &&
                selectedApprovalSteps.some((step) => step.status === "pending") &&
                !isApprovalDetailLoading
              }
              canAddNote={canAddApprovalNote(selectedApprovalProposal?.status) && !isApprovalDetailLoading}
              onBack={() => handleBackToQueue("approvals")}
              onAction={(action, note) => void handleReviewDecision(action, note)}
              onAddNote={(note, employeeId) => void handleApprovalNote(note, employeeId)}
            />
          )}
        </>
      )}

      {renderedTab === "history" && (
        <>
          <Card className="dash-card border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">History</p>
                <h2 className="mt-2 text-xl font-semibold text-accent-950">Past Review Cycles</h2>
                <p className="mt-2 text-sm text-accent-700">
                  Browse completed review batches, then click into one batch to inspect its employee rows, comments, routing, and audit trail.
                </p>
              </div>
              <div className="rounded-2xl border border-accent-200 bg-white px-4 py-3 text-sm font-medium text-accent-700 shadow-sm">
                {dashboardModel.history.length > 0
                  ? `${dashboardModel.history.length} completed cycle${dashboardModel.history.length === 1 ? "" : "s"}`
                  : "Completed review cycles will appear here once approvals finish."}
              </div>
            </div>
          </Card>

          {approvalViewLevel === "queue" ? (
            <ApprovalProposalList
              proposals={dashboardModel.history}
              isLoading={isApprovalQueueLoading}
              onSelect={(proposalId) => handleProposalSelect("history", proposalId)}
              eyebrow="History"
              title="Completed Cycles"
              description="Open a completed batch to inspect its employee list, notes, routing, and audit trail."
              emptyMessage="No completed review cycles yet."
              countLabel={`${dashboardModel.history.length} cycle${dashboardModel.history.length === 1 ? "" : "s"}`}
            />
          ) : (
            <ApprovalProposalDetail
              key={activeApprovalProposalId ?? "history-empty"}
              proposal={selectedApprovalProposal}
              proposalItems={Object.values(selectedApprovalItemsByEmployee)}
              departmentAllocations={selectedApprovalDepartmentAllocations}
              childCycles={selectedApprovalChildCycles}
              approvalSteps={selectedApprovalSteps}
              proposalNotes={selectedApprovalNotes}
              proposalAuditEvents={selectedApprovalAuditEvents}
              isLoading={isApprovalDetailLoading}
              canTakeAction={false}
              canAddNote={false}
              onBack={() => handleBackToQueue("history")}
              onAction={(action, note) => void handleReviewDecision(action, note)}
              onAddNote={(note, employeeId) => void handleApprovalNote(note, employeeId)}
              mode="history"
            />
          )}
        </>
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="Close add employee modal"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!isCreatingEmployee) setShowAddEmployeeModal(false);
            }}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-2xl mx-4">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-accent-900">Add Employee</h3>
                <p className="text-sm text-accent-500">
                  Quick add for one employee without going through the upload flow.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-1.5 text-accent-500 hover:bg-accent-100 hover:text-accent-700"
                onClick={() => setShowAddEmployeeModal(false)}
                disabled={isCreatingEmployee}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={addEmployeeForm.firstName}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First name"
                  required
                  fullWidth
                />
                <Input
                  value={addEmployeeForm.lastName}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last name"
                  required
                  fullWidth
                />
              </div>

              <Input
                type="email"
                value={addEmployeeForm.email}
                onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email (optional)"
                fullWidth
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={addEmployeeForm.department}
                  onChange={(e) =>
                    setAddEmployeeForm((prev) => ({
                      ...prev,
                      department: e.target.value as Department,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
                  required
                >
                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={addEmployeeForm.baseSalary}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, baseSalary: e.target.value }))}
                  placeholder="Base salary (annual)"
                  required
                  fullWidth
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={addEmployeeForm.roleId}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, roleId: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
                  required
                >
                  {ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                    </option>
                  ))}
                </select>
                <select
                  value={addEmployeeForm.levelId}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, levelId: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
                  required
                >
                  {LEVELS.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
                <select
                  value={addEmployeeForm.locationId}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, locationId: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
                  required
                >
                  {LOCATIONS.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.city}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                type="date"
                value={addEmployeeForm.hireDate}
                onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, hireDate: e.target.value }))}
                fullWidth
              />

              <label className="inline-flex items-center gap-2 text-sm text-accent-700">
                <input
                  type="checkbox"
                  checked={addAnotherOnSave}
                  onChange={(e) => setAddAnotherOnSave(e.target.checked)}
                  className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                />
                Add another after save
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddEmployeeModal(false)}
                  disabled={isCreatingEmployee}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isCreatingEmployee} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Save Employee
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AiDistributionModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        request={aiPlanRequest}
        onApprove={async ({ plan, selectedEmployeeIds: approvedIds }) => {
          if (plan.items.length === 0) {
            applyDefaultIncreases();
            await handleSaveDraft("ai");
            setRequestedBuildReviewStep("draft");
            setFeedback({
              type: "success",
              message: "AI draft applied. Review the employee-level changes, then continue to final review.",
            });
            return;
          }
          applyAiProposal(plan, approvedIds);
          await handleSaveDraft("ai");
          setRequestedBuildReviewStep("draft");
          setFeedback({
            type: "success",
            message: "AI draft applied. Review the employee-level changes, then continue to final review.",
          });
        }}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        type="compensation"
        onSuccess={() => {
          loadEmployeesFromDb();
          setShowUploadModal(false);
        }}
      />
    </div>
  );
}

function OverviewMetric({
  label,
  value,
  body,
}: {
  label: string;
  value: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-accent-100 bg-white/85 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-accent-950">{value}</p>
      <p className="mt-1 text-xs text-accent-600">{body}</p>
    </div>
  );
}

export default function SalaryReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500 mx-auto" />
          <p className="mt-3 text-brand-600">Loading salary review...</p>
        </div>
      </div>
    }>
      <SalaryReviewPageContent />
    </Suspense>
  );
}
