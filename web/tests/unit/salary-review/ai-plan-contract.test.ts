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

  const validBase = {
    mode: "assistive" as const,
    cycle: "annual" as const,
    budgetType: "percentage" as const,
    budgetPercentage: 5,
  };

  it("passes through valid objective", () => {
    const result = validateSalaryReviewAiPlanRequest({
      ...validBase,
      objective: "retention",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.objective).toBe("retention");
    }
  });

  it("ignores unknown objective", () => {
    const result = validateSalaryReviewAiPlanRequest({
      ...validBase,
      objective: "foo",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.objective).toBeUndefined();
    }
  });

  it("passes through valid budgetIntent", () => {
    const result = validateSalaryReviewAiPlanRequest({
      ...validBase,
      budgetIntent: "strict_cap",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.budgetIntent).toBe("strict_cap");
    }
  });

  it("validates populationRules with all fields", () => {
    const result = validateSalaryReviewAiPlanRequest({
      ...validBase,
      populationRules: {
        excludeRecentHires: true,
        excludeLowPerformers: true,
        maxIncreasePercent: 15,
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.populationRules).toEqual({
        excludeRecentHires: true,
        excludeLowPerformers: true,
        maxIncreasePercent: 15,
      });
    }
  });

  it("ignores non-object populationRules", () => {
    const result = validateSalaryReviewAiPlanRequest({
      ...validBase,
      populationRules: "invalid",
    } as unknown);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.populationRules).toBeUndefined();
    }
  });

  it("truncates contextNotes to 2000 chars", () => {
    const longNotes = "x".repeat(3000);
    const result = validateSalaryReviewAiPlanRequest({
      ...validBase,
      contextNotes: longNotes,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.contextNotes).toHaveLength(2000);
      expect(result.value.contextNotes).toBe("x".repeat(2000));
    }
  });

  it("accepts empty contextNotes without error", () => {
    const result = validateSalaryReviewAiPlanRequest({
      ...validBase,
      contextNotes: "",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.contextNotes).toBeUndefined();
    }
  });
});

