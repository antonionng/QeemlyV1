import { describe, expect, it } from "vitest";
import { validateSalaryReviewAiPlanRequest } from "@/lib/salary-review";

describe("validateSalaryReviewAiPlanRequest", () => {
  it("accepts assistive percentage payload", () => {
    const result = validateSalaryReviewAiPlanRequest({
      mode: "assistive",
      cycle: "annual",
      budgetType: "percentage",
      budgetPercentage: 5,
      selectedEmployeeIds: ["e1", "e2"],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.budgetPercentage).toBe(5);
      expect(result.value.selectedEmployeeIds).toEqual(["e1", "e2"]);
    }
  });

  it("rejects missing budget for absolute mode", () => {
    const result = validateSalaryReviewAiPlanRequest({
      mode: "assistive",
      cycle: "annual",
      budgetType: "absolute",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toContain("budgetAbsolute");
    }
  });

  it("rejects unsupported mode", () => {
    const result = validateSalaryReviewAiPlanRequest({
      mode: "auto",
      cycle: "annual",
      budgetType: "percentage",
      budgetPercentage: 5,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("assistive");
    }
  });
});

