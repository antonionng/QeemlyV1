import type { SalaryReviewProposalRecord } from "./proposal-types";

type SalaryReviewDashboardTabId = "overview" | "drafts" | "review" | "approvals" | "history";

type SalaryReviewDashboardTab = {
  id: SalaryReviewDashboardTabId;
  label: string;
  badge: number;
};

type SalaryReviewDashboardModel = {
  tabs: Record<SalaryReviewDashboardTabId, SalaryReviewDashboardTab>;
  drafts: SalaryReviewProposalRecord[];
  awaitingReview: SalaryReviewProposalRecord[];
  history: SalaryReviewProposalRecord[];
  masterCycles: SalaryReviewProposalRecord[];
  departmentCyclesByMaster: Record<string, SalaryReviewProposalRecord[]>;
  hasDraft: boolean;
  primaryAction: "start-cycle" | "continue-draft";
  totalCycles: number;
};

type SalaryReviewWorkspaceVisibility = {
  showSettings: boolean;
  showWorkspaceSummary: boolean;
  showDiagnostics: boolean;
  showTable: boolean;
};

export type BuildReviewStep = "setup" | "draft" | "review";

type BuildReviewFlowStep = {
  id: BuildReviewStep;
  label: string;
  enabled: boolean;
};

type BuildReviewFlowModel = {
  activeStep: BuildReviewStep;
  steps: BuildReviewFlowStep[];
  canContinueToReview: boolean;
};

export function buildSalaryReviewDashboardModel(args: {
  activeProposal: SalaryReviewProposalRecord | null;
  cycles?: SalaryReviewProposalRecord[];
  approvalQueue: SalaryReviewProposalRecord[];
}): SalaryReviewDashboardModel {
  const drafts = (args.cycles ?? []).filter((proposal) => proposal.status === "draft");
  const awaitingReview = args.approvalQueue.filter(
    (proposal) => proposal.status === "submitted" || proposal.status === "in_review"
  );
  const history = args.approvalQueue.filter(
    (proposal) =>
      proposal.status === "approved" ||
      proposal.status === "rejected" ||
      proposal.status === "applied"
  );
  const hasDraft = args.activeProposal?.status === "draft";
  const masterCycles = (args.cycles ?? []).filter(
    (proposal) => proposal.review_mode === "department_split" && proposal.review_scope === "master"
  );
  const departmentCyclesByMaster = (args.cycles ?? []).reduce<Record<string, SalaryReviewProposalRecord[]>>(
    (groups, proposal) => {
      if (proposal.review_scope !== "department" || !proposal.parent_cycle_id) {
        return groups;
      }
      groups[proposal.parent_cycle_id] = [...(groups[proposal.parent_cycle_id] ?? []), proposal].sort((left, right) =>
        String(left.department ?? "").localeCompare(String(right.department ?? ""))
      );
      return groups;
    },
    {}
  );

  return {
    tabs: {
      overview: { id: "overview", label: "Overview", badge: awaitingReview.length + history.length },
      drafts: { id: "drafts", label: "Drafts", badge: drafts.length },
      review: { id: "review", label: "Build Review", badge: hasDraft ? 1 : 0 },
      approvals: { id: "approvals", label: "Approvals", badge: awaitingReview.length },
      history: { id: "history", label: "History", badge: history.length },
    },
    drafts,
    awaitingReview,
    history,
    masterCycles,
    departmentCyclesByMaster,
    hasDraft,
    primaryAction: hasDraft ? "continue-draft" : "start-cycle",
    totalCycles: args.cycles?.length ?? 0,
  };
}

export function shouldRedirectSalaryReviewTab(tab: string | null | undefined) {
  return tab === "review";
}

export function getSalaryReviewWorkspaceVisibility(args: {
  employeesCount: number;
  proposedEmployees: number;
  hasActiveProposal: boolean;
}): SalaryReviewWorkspaceVisibility {
  const hasMaterialDraft = args.proposedEmployees > 0 || args.hasActiveProposal;

  return {
    showSettings: true,
    showWorkspaceSummary: hasMaterialDraft,
    showDiagnostics: hasMaterialDraft && args.employeesCount > 0,
    showTable: args.employeesCount > 0,
  };
}

export function shouldShowEmployeeApprovalContext(hasActiveProposal: boolean) {
  return hasActiveProposal;
}

export function getPostSubmitReviewOutcome(proposalId: string | null) {
  return {
    nextTab: "approvals" as const,
    proposalId,
    feedbackMessage: "Review submitted for approval. You are now viewing its approval status.",
  };
}

export function getApprovalViewLevel(proposalId: string | null) {
  return proposalId ? "detail" : "queue";
}

export function getBuildReviewFlowModel(args: {
  requestedStep: BuildReviewStep | null;
  employeesCount: number;
  proposedEmployees: number;
}): BuildReviewFlowModel {
  const hasEmployees = args.employeesCount > 0;
  const hasDraftValues = args.proposedEmployees > 0;
  const resolvedStep = (() => {
    if (args.requestedStep === "review") {
      if (hasDraftValues) return "review";
      return hasEmployees ? "draft" : "setup";
    }
    if (args.requestedStep === "draft") {
      return hasEmployees ? "draft" : "setup";
    }
    if (args.requestedStep === "setup") {
      return "setup";
    }
    if (hasDraftValues) return "draft";
    return "setup";
  })();

  return {
    activeStep: resolvedStep,
    steps: [
      { id: "setup", label: "Setup", enabled: true },
      { id: "draft", label: "Draft", enabled: hasEmployees },
      { id: "review", label: "Final Review", enabled: hasDraftValues },
    ],
    canContinueToReview: hasDraftValues,
  };
}
