import { describe, expect, it } from "vitest";
import { buildSalaryReviewBudgetModel } from "@/lib/salary-review/workspace-budget";

describe("salary review workspace budget model", () => {
  it("explains percentage-based review budgets in policy-first language", () => {
    const model = buildSalaryReviewBudgetModel({
      budgetType: "percentage",
      budgetPercentage: 5,
      budgetAbsolute: 0,
      totalCurrentPayroll: 3_257_780,
      budgetUsed: 0,
      selectedEmployees: 95,
      proposedEmployees: 0,
    });

    expect(model.totalBudget).toBeCloseTo(162_889);
    expect(model.policyLabel).toContain("5% of current payroll");
    expect(model.allocationLabel).toContain("0 proposals");
    expect(model.remainingLabel).toContain("remaining");
    expect(model.usageLabel).toContain("manual edits");
    expect(model.usageLabel).toContain("AI-generated proposals");
    expect(model.effectiveDateLabel).toContain("effective date");
  });

  it("explains absolute review budgets without referencing payroll percentage", () => {
    const model = buildSalaryReviewBudgetModel({
      budgetType: "absolute",
      budgetPercentage: 0,
      budgetAbsolute: 250_000,
      totalCurrentPayroll: 3_257_780,
      budgetUsed: 80_000,
      selectedEmployees: 40,
      proposedEmployees: 12,
    });

    expect(model.totalBudget).toBe(250_000);
    expect(model.policyLabel).toContain("fixed review budget");
    expect(model.allocatedAmount).toBe(80_000);
    expect(model.remainingAmount).toBe(170_000);
    expect(model.applicationLabel).toContain("employee-by-employee");
    expect(model.applicationLabel).toContain("AI");
  });
});
