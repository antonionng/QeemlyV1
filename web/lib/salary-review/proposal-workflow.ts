export type SalaryReviewProposalStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "applied";

export type SalaryReviewApprovalAction = "approve" | "reject" | "return";
export type SalaryReviewApprovalStepStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "returned";

export type SalaryReviewDraftItemInput = {
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  proposedIncrease: number;
  proposedSalary: number;
  proposedPercentage: number;
  selected: boolean;
  reasonSummary: string;
  changeReason: string | null;
  recommendedLevelId: string | null;
  recommendedLevelName: string | null;
  benchmarkSnapshot: Record<string, unknown> | null;
};

export type SalaryReviewApprovalStep = {
  stepKey: "manager" | "director" | "hr" | "exec";
  label: string;
  status: SalaryReviewApprovalStepStatus;
  triggerReason: string | null;
  actorUserId: string | null;
  note: string | null;
  actedAt: string | null;
};

export function summarizeProposalDraft(items: SalaryReviewDraftItemInput[]) {
  const selectedItems = items.filter((item) => item.selected);
  return {
    selectedEmployees: selectedItems.length,
    proposedEmployees: selectedItems.filter((item) => item.proposedIncrease > 0).length,
    totalCurrentPayroll: selectedItems.reduce((sum, item) => sum + item.currentSalary, 0),
    totalIncrease: selectedItems.reduce((sum, item) => sum + item.proposedIncrease, 0),
    totalProposedPayroll: selectedItems.reduce((sum, item) => sum + item.proposedSalary, 0),
    maxIncreasePercentage: selectedItems.reduce(
      (max, item) => Math.max(max, item.proposedPercentage),
      0
    ),
  };
}

export function buildApprovalChain(args: {
  totalIncrease: number;
  maxIncreasePercentage: number;
  hasAboveBandIncreases: boolean;
  hasBandUpgradeRecommendations?: boolean;
}): SalaryReviewApprovalStep[] {
  const steps: SalaryReviewApprovalStep[] = [
    createStep("manager", null),
  ];

  if (args.maxIncreasePercentage >= 10 || args.hasAboveBandIncreases || args.hasBandUpgradeRecommendations) {
    const reasons: string[] = [];
    if (args.maxIncreasePercentage >= 10) reasons.push("Increase exceeds 10%");
    if (args.hasAboveBandIncreases) reasons.push("Proposal includes above-band pay decisions");
    if (args.hasBandUpgradeRecommendations) reasons.push("Proposal includes band upgrade recommendations");
    steps.push(createStep("director", reasons.join(". ")));
  }

  steps.push(createStep("hr", "HR review confirms policy and narrative quality."));

  if (args.maxIncreasePercentage >= 15 || args.totalIncrease >= 50_000) {
    const reasons: string[] = [];
    if (args.maxIncreasePercentage >= 15) reasons.push("Increase exceeds 15%");
    if (args.totalIncrease >= 50_000) reasons.push("Total increase exceeds 50,000 AED");
    steps.push(createStep("exec", reasons.join(". ")));
  }

  return steps;
}

export function getProposalStatusFromSteps(
  steps: SalaryReviewApprovalStep[]
): SalaryReviewProposalStatus {
  if (steps.some((step) => step.status === "rejected")) return "rejected";
  if (steps.some((step) => step.status === "returned")) return "draft";
  if (steps.length > 0 && steps.every((step) => step.status === "approved")) return "approved";
  return "in_review";
}

export function advanceApprovalChain(
  steps: SalaryReviewApprovalStep[],
  args: {
    action: SalaryReviewApprovalAction;
    actorUserId: string;
    note?: string;
  }
) {
  const pendingIndex = steps.findIndex((step) => step.status === "pending");
  if (pendingIndex === -1) {
    return {
      steps,
      proposalStatus: getProposalStatusFromSteps(steps),
    };
  }

  const now = new Date().toISOString();
  const nextSteps = steps.map((step, index) => {
    if (index !== pendingIndex) return step;
    const nextStatus: SalaryReviewApprovalStepStatus =
      args.action === "approve"
        ? "approved"
        : args.action === "reject"
          ? "rejected"
          : "returned";
    return {
      ...step,
      status: nextStatus,
      actorUserId: args.actorUserId,
      note: args.note ?? null,
      actedAt: now,
    };
  });

  return {
    steps: nextSteps,
    proposalStatus: getProposalStatusFromSteps(nextSteps),
  };
}

function createStep(
  stepKey: SalaryReviewApprovalStep["stepKey"],
  triggerReason: string | null
): SalaryReviewApprovalStep {
  return {
    stepKey,
    label:
      stepKey === "manager"
        ? "Manager review"
        : stepKey === "director"
          ? "Director review"
          : stepKey === "hr"
            ? "HR review"
            : "Executive review",
    status: "pending",
    triggerReason,
    actorUserId: null,
    note: null,
    actedAt: null,
  };
}
