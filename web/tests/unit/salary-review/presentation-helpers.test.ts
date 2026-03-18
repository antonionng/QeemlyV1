import { describe, expect, it } from "vitest";
import type { ReviewEmployee } from "@/lib/salary-review";
import { buildSalaryReviewCsv } from "@/lib/salary-review/export";
import { applySalaryReviewFilters } from "@/lib/salary-review/filters";
import { buildSalaryReviewInsightModel } from "@/lib/salary-review/insights";
import type { SalaryReviewQueryState } from "@/lib/salary-review/url-state";

function makeEmployee(overrides: Partial<ReviewEmployee> = {}): ReviewEmployee {
  return {
    id: overrides.id ?? "emp-1",
    firstName: overrides.firstName ?? "Test",
    lastName: overrides.lastName ?? "User",
    email: overrides.email ?? "test@example.com",
    department: overrides.department ?? "Engineering",
    role: overrides.role ?? {
      id: "r1",
      title: "Software Engineer",
      family: "Engineering",
      icon: "SWE",
    },
    level: overrides.level ?? { id: "l1", name: "L3", category: "IC" },
    location: overrides.location ?? {
      id: "dubai",
      city: "Dubai",
      country: "UAE",
      countryCode: "AE",
      currency: "AED",
      flag: "AE",
    },
    status: overrides.status ?? "active",
    employmentType: overrides.employmentType ?? "national",
    baseSalary: overrides.baseSalary ?? 100_000,
    bonus: overrides.bonus,
    equity: overrides.equity,
    totalComp: overrides.totalComp ?? overrides.baseSalary ?? 100_000,
    bandPosition: overrides.bandPosition ?? "in-band",
    bandPercentile: overrides.bandPercentile ?? 50,
    marketComparison: overrides.marketComparison ?? 0,
    hasBenchmark: overrides.hasBenchmark ?? true,
    benchmarkContext: overrides.benchmarkContext,
    hireDate: overrides.hireDate ?? new Date("2020-01-01"),
    lastReviewDate: overrides.lastReviewDate,
    performanceRating: overrides.performanceRating ?? "meets",
    proposedIncrease: overrides.proposedIncrease ?? 0,
    proposedPercentage: overrides.proposedPercentage ?? 0,
    newSalary: overrides.newSalary ?? ((overrides.baseSalary ?? 100_000) + (overrides.proposedIncrease ?? 0)),
    isSelected: overrides.isSelected ?? true,
    guidance: overrides.guidance,
    avatar: overrides.avatar,
    visaExpiryDate: overrides.visaExpiryDate,
    visaStatus: overrides.visaStatus,
  };
}

describe("salary review filters", () => {
  const defaultQuery: SalaryReviewQueryState = {
    tab: "review",
    proposalId: null,
    department: "all",
    location: "all",
    pool: "all",
    benchmarkStatus: "all",
    workflowStatus: "all",
    bandFilter: "all",
    performance: "all",
    search: "",
  };

  it("keeps only outside-band employees for the outside-band shortcut", () => {
    const employees = [
      makeEmployee({ id: "a", bandPosition: "below" }),
      makeEmployee({ id: "b", bandPosition: "in-band" }),
      makeEmployee({ id: "c", bandPosition: "above" }),
    ];

    const result = applySalaryReviewFilters(employees, {
      ...defaultQuery,
      bandFilter: "outside-band",
    });

    expect(result.map((employee) => employee.id)).toEqual(["a", "c"]);
  });

  it("keeps only in-band employees for the in-band cohort", () => {
    const employees = [
      makeEmployee({ id: "a", bandPosition: "below" }),
      makeEmployee({ id: "b", bandPosition: "in-band" }),
      makeEmployee({ id: "c", bandPosition: "above" }),
    ];

    const result = applySalaryReviewFilters(employees, {
      ...defaultQuery,
      bandFilter: "in-band",
    });

    expect(result.map((employee) => employee.id)).toEqual(["b"]);
  });

  it("combines department and benchmark fallback filtering", () => {
    const employees = [
      makeEmployee({
        id: "a",
        department: "Engineering",
        benchmarkContext: {
          source: "market",
          matchQuality: "role_level_fallback",
          confidence: "Medium",
        },
      }),
      makeEmployee({
        id: "b",
        department: "Engineering",
        benchmarkContext: {
          source: "market",
          matchQuality: "exact",
          confidence: "High",
        },
      }),
      makeEmployee({
        id: "c",
        department: "Sales",
        benchmarkContext: {
          source: "market",
          matchQuality: "role_level_fallback",
          confidence: "Medium",
        },
      }),
    ];

    const result = applySalaryReviewFilters(employees, {
      ...defaultQuery,
      department: "Engineering",
      benchmarkStatus: "fallback",
    });

    expect(result.map((employee) => employee.id)).toEqual(["a"]);
  });
});

describe("salary review insight model", () => {
  it("builds trust, budget, and watchout signals for the page hero", () => {
    const employees = [
      makeEmployee({
        id: "a",
        bandPosition: "below",
        proposedIncrease: 5_000,
        proposedPercentage: 5,
        newSalary: 105_000,
        benchmarkContext: {
          source: "market",
          matchQuality: "exact",
          confidence: "High",
          freshnessAt: "2026-03-10T00:00:00.000Z",
        },
      }),
      makeEmployee({
        id: "b",
        bandPosition: "above",
        isSelected: false,
        benchmarkContext: {
          source: "market",
          matchQuality: "role_level_fallback",
          confidence: "Medium",
          freshnessAt: "2026-01-05T00:00:00.000Z",
        },
      }),
      makeEmployee({
        id: "c",
        hasBenchmark: false,
        benchmarkContext: undefined,
      }),
    ];

    const model = buildSalaryReviewInsightModel({
      employees,
      budget: 4_000,
      budgetUsed: 5_000,
      budgetRemaining: -1_000,
    });

    expect(model.summary.selectedEmployees).toBe(2);
    expect(model.summary.belowBandEmployees).toBe(1);
    expect(model.summary.coveredEmployees).toBe(2);
    expect(model.summary.overBudget).toBe(true);
    expect(model.watchouts.some((item) => item.title.includes("Over budget"))).toBe(true);
    expect(model.watchouts.some((item) => item.title.includes("Benchmark coverage gaps"))).toBe(true);
    expect(model.watchouts.some((item) => item.title.includes("Fallback-heavy matches"))).toBe(true);
  });
});

describe("salary review export", () => {
  it("exports selected employee review rows as CSV", () => {
    const csv = buildSalaryReviewCsv([
      makeEmployee({
        id: "a",
        firstName: "Ava",
        lastName: "Stone",
        department: "Engineering",
        proposedIncrease: 5_000,
        proposedPercentage: 5,
        newSalary: 105_000,
        benchmarkContext: {
          source: "market",
          matchQuality: "exact",
          confidence: "High",
          freshnessAt: "2026-03-10T00:00:00.000Z",
        },
      }),
      makeEmployee({
        id: "b",
        firstName: "Ben",
        lastName: "Hart",
        isSelected: false,
      }),
    ]);

    expect(csv).toContain("employee_id,employee_name,department,role,location,current_salary,proposed_increase,proposed_salary,proposed_percentage,band_position,performance,benchmark_source,benchmark_match,selected");
    expect(csv).toContain("a,Ava Stone,Engineering,Software Engineer,Dubai,100000,5000,105000,5,in-band,meets,Qeemly Market Dataset,Exact match,yes");
    expect(csv).not.toContain("Ben Hart");
  });
});
