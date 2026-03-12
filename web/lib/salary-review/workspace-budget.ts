type WorkspaceBudgetArgs = {
  budgetType: "percentage" | "absolute";
  budgetPercentage: number;
  budgetAbsolute: number;
  totalCurrentPayroll: number;
  budgetUsed: number;
  selectedEmployees: number;
  proposedEmployees: number;
};

export function buildSalaryReviewBudgetModel(args: WorkspaceBudgetArgs) {
  const totalBudget =
    args.budgetType === "percentage"
      ? args.totalCurrentPayroll * (args.budgetPercentage / 100)
      : args.budgetAbsolute;
  const allocatedAmount = args.budgetUsed;
  const remainingAmount = totalBudget - allocatedAmount;

  const policyLabel =
    args.budgetType === "percentage"
      ? `${args.budgetPercentage}% of current payroll is available for this review cycle.`
      : "A fixed review budget is available for this cycle.";
  const allocationLabel =
    args.proposedEmployees > 0
      ? `${args.proposedEmployees} proposals currently count toward allocation across ${args.selectedEmployees} selected employees.`
      : `0 proposals are allocating budget yet across ${args.selectedEmployees} selected employees.`;
  const remainingLabel =
    remainingAmount < 0
      ? `${Math.abs(Math.round(remainingAmount)).toLocaleString()} AED over budget.`
      : `${Math.round(remainingAmount).toLocaleString()} AED remaining in the current policy.`;
  const usageLabel =
    "This budget applies to both manual edits in the review table and AI-generated proposals.";
  const applicationLabel =
    "You can build the review employee-by-employee yourself, or use AI to draft a starting allocation and adjust it manually after.";
  const effectiveDateLabel =
    "The effective date is saved on the draft and carried into the submitted review proposal.";

  return {
    totalBudget,
    allocatedAmount,
    remainingAmount,
    policyLabel,
    allocationLabel,
    remainingLabel,
    usageLabel,
    applicationLabel,
    effectiveDateLabel,
  };
}
