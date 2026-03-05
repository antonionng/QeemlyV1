import { describe, expect, it } from "vitest";
import { useSalaryReview, type SalaryReviewAiPlanResponse } from "@/lib/salary-review";

describe("salary review AI approval gate", () => {
  it("does not change salaries until applyAiProposal is explicitly invoked", () => {
    type SalaryReviewStoreState = ReturnType<typeof useSalaryReview.getState>;
    const employee = {
      id: "emp-1",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      department: "Engineering",
      role: { id: "r1", title: "Software Engineer" },
      level: { id: "l1", name: "L3", category: "Individual Contributor" },
      location: { id: "dubai", city: "Dubai", country: "UAE", region: "GCC", currency: "AED", adjustmentFactor: 1 },
      status: "active",
      employmentType: "national",
      baseSalary: 100_000,
      bonus: undefined,
      equity: undefined,
      totalComp: 100_000,
      bandPosition: "in-band",
      bandPercentile: 50,
      marketComparison: 0,
      hasBenchmark: true,
      hireDate: new Date("2020-01-01"),
      lastReviewDate: undefined,
      performanceRating: "meets",
      proposedIncrease: 0,
      proposedPercentage: 0,
      newSalary: 100_000,
      isSelected: true,
      guidance: undefined,
    } as const;

    useSalaryReview.setState({
      employees: [employee] as SalaryReviewStoreState["employees"],
      totalCurrentPayroll: 100_000,
      totalProposedPayroll: 100_000,
      totalIncrease: 0,
      budgetUsed: 0,
      budgetRemaining: 5_000,
      settings: {
        cycle: "annual",
        budgetType: "absolute",
        budgetPercentage: 0,
        budgetAbsolute: 5_000,
        effectiveDate: "2026-04-01",
        includeBonus: false,
      },
    });

    const proposal: SalaryReviewAiPlanResponse = {
      generatedAt: "2026-03-05T10:00:00.000Z",
      summary: {
        mode: "assistive",
        budget: 5_000,
        budgetUsed: 5_000,
        budgetRemaining: 0,
        budgetUsedPercentage: 100,
        totalCurrentPayroll: 100_000,
        totalProposedPayroll: 105_000,
        employeesConsidered: 1,
        employeesWithWarnings: 0,
      },
      items: [
        {
          employeeId: "emp-1",
          employeeName: "Test User",
          currentSalary: 100_000,
          proposedIncrease: 5_000,
          proposedSalary: 105_000,
          proposedPercentage: 5,
          confidence: 88,
          rationale: ["Benchmark aligned increase."],
          factors: [],
          benchmark: {
            provenance: "workspace",
            sourceSlug: "workspace_uploaded",
            sourceName: "Workspace Benchmarks",
            matchQuality: "exact",
            freshness: {
              lastUpdatedAt: "2026-03-05T09:00:00.000Z",
              confidence: "high",
            },
          },
          warnings: [],
        },
      ],
      warnings: [],
    };

    // No approval action yet -> no applied change.
    expect(useSalaryReview.getState().employees[0].proposedIncrease).toBe(0);

    // Explicit approval/apply action mutates review state.
    useSalaryReview.getState().applyAiProposal(proposal);
    expect(useSalaryReview.getState().employees[0].proposedIncrease).toBe(5_000);
  });
});

