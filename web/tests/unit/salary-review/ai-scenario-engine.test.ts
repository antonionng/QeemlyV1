import { describe, expect, it } from "vitest";
import {
  buildSalaryReviewAiScenarios,
  type SalaryReviewAiBenchmarkInput,
  type SalaryReviewAiEmployeeInput,
  type SalaryReviewAiFreshnessInput,
} from "@/lib/salary-review/ai-plan-engine";
import type { SalaryReviewAiPlanRequest } from "@/lib/salary-review";

const ROLE_ID = "r1";
const LEVEL_ID = "l1";
const LOCATION_ID = "dubai";

const baseRequest: SalaryReviewAiPlanRequest = {
  mode: "assistive",
  cycle: "annual",
  budgetType: "absolute",
  budgetAbsolute: 50_000,
};

const workspaceBenchmark: SalaryReviewAiBenchmarkInput = {
  roleId: ROLE_ID,
  levelId: LEVEL_ID,
  locationId: LOCATION_ID,
  p50: 125_000,
  provenance: "workspace",
  sourceSlug: "workspace_upload",
  sourceName: "Workspace benchmarks",
};

const freshness: SalaryReviewAiFreshnessInput[] = [
  { provenance: "workspace", lastUpdatedAt: "2026-03-01T00:00:00.000Z", confidence: "high" },
  { provenance: "ingestion", lastUpdatedAt: "2026-03-01T00:00:00.000Z", confidence: "high" },
];

function makeEmployee(overrides: Partial<SalaryReviewAiEmployeeInput> = {}): SalaryReviewAiEmployeeInput {
  return {
    id: "emp-1",
    firstName: "Alex",
    lastName: "Rivera",
    roleId: ROLE_ID,
    levelId: LEVEL_ID,
    locationId: LOCATION_ID,
    baseSalary: 105_000,
    performanceRating: "meets",
    hireDate: "2019-06-01",
    ...overrides,
  };
}

describe("buildSalaryReviewAiScenarios", () => {
  it("generates at least a hold scenario with 0% budget", () => {
    const result = buildSalaryReviewAiScenarios({
      request: { ...baseRequest, budgetAbsolute: 0, budgetType: "absolute" },
      employees: [makeEmployee()],
      workspaceBenchmarks: [workspaceBenchmark],
      ingestionBenchmarks: [],
      freshness,
    });

    const hold = result.scenarios.find((s) => s.id === "hold");
    expect(hold).toBeDefined();
    expect(hold!.items.every((item) => item.proposedIncrease === 0)).toBe(true);
    expect(hold!.riskSummary).toMatchObject({
      belowMarketCount: expect.any(Number),
      belowMarketTotalGap: expect.any(Number),
      retentionRiskCount: expect.any(Number),
      avgMarketGapPercent: expect.any(Number),
    });
  });

  it("generates multiple scenarios with positive budget", () => {
    const result = buildSalaryReviewAiScenarios({
      request: {
        ...baseRequest,
        budgetAbsolute: 20_000,
        budgetType: "absolute",
        objective: "balanced",
        budgetIntent: "target",
      },
      employees: [makeEmployee({ baseSalary: 100_000 })],
      workspaceBenchmarks: [workspaceBenchmark],
      ingestionBenchmarks: [],
      freshness,
    });

    expect(result.scenarios.length).toBeGreaterThanOrEqual(3);
    expect(result.scenarios.some((s) => s.isRecommended)).toBe(true);
  });

  it("marks balanced as recommended when objective is balanced", () => {
    const result = buildSalaryReviewAiScenarios({
      request: {
        ...baseRequest,
        budgetAbsolute: 15_000,
        objective: "balanced",
        budgetIntent: "target",
      },
      employees: [makeEmployee()],
      workspaceBenchmarks: [workspaceBenchmark],
      ingestionBenchmarks: [],
      freshness,
    });

    const recommended = result.scenarios.find((s) => s.isRecommended);
    expect(recommended?.id).toBe("balanced");
  });

  it("marks retention_first as recommended when objective is retention", () => {
    const result = buildSalaryReviewAiScenarios({
      request: {
        ...baseRequest,
        budgetAbsolute: 15_000,
        objective: "retention",
        budgetIntent: "target",
      },
      employees: [makeEmployee({ performanceRating: "exceeds" })],
      workspaceBenchmarks: [{ ...workspaceBenchmark, p50: 140_000 }],
      ingestionBenchmarks: [],
      freshness,
    });

    const recommended = result.scenarios.find((s) => s.isRecommended);
    expect(recommended?.id).toBe("retention_first");
  });

  it("excludes recent hires when populationRules.excludeRecentHires is true", () => {
    const recentId = "emp-recent";
    const veteranId = "emp-veteran";
    const result = buildSalaryReviewAiScenarios({
      request: {
        ...baseRequest,
        budgetAbsolute: 25_000,
        budgetIntent: "target",
        populationRules: { excludeRecentHires: true },
      },
      employees: [
        makeEmployee({
          id: recentId,
          firstName: "New",
          lastName: "Hire",
          baseSalary: 95_000,
          hireDate: "2025-08-01",
        }),
        makeEmployee({
          id: veteranId,
          firstName: "Long",
          lastName: "Tenure",
          baseSalary: 98_000,
          hireDate: "2020-01-01",
        }),
      ],
      workspaceBenchmarks: [workspaceBenchmark],
      ingestionBenchmarks: [],
      freshness,
    });

    const withIncreases = result.scenarios.filter((s) => s.summary.budgetUsed > 0);
    expect(withIncreases.length).toBeGreaterThan(0);

    for (const scenario of withIncreases) {
      expect(scenario.items.every((item) => item.employeeId === veteranId)).toBe(true);
      const recentItem = scenario.items.find((item) => item.employeeId === recentId);
      expect(recentItem == null || recentItem.proposedIncrease === 0).toBe(true);
    }

    const veteranGotIncrease = withIncreases.some((s) => {
      const row = s.items.find((i) => i.employeeId === veteranId);
      return row != null && row.proposedIncrease > 0;
    });
    expect(veteranGotIncrease).toBe(true);
  });

  it("hold scenario shows risk summary with below-market count", () => {
    const result = buildSalaryReviewAiScenarios({
      request: { ...baseRequest, budgetAbsolute: 0, budgetType: "absolute" },
      employees: [
        makeEmployee({
          baseSalary: 90_000,
          performanceRating: "meets",
        }),
      ],
      workspaceBenchmarks: [{ ...workspaceBenchmark, p50: 130_000 }],
      ingestionBenchmarks: [],
      freshness,
    });

    const hold = result.scenarios.find((s) => s.id === "hold");
    expect(hold!.riskSummary.belowMarketCount).toBeGreaterThan(0);
  });

  it("cohortContext contains correct benchmark coverage", () => {
    const result = buildSalaryReviewAiScenarios({
      request: { ...baseRequest, budgetAbsolute: 10_000 },
      employees: [
        makeEmployee({ id: "matched", baseSalary: 100_000 }),
        makeEmployee({
          id: "unmatched",
          roleId: "role-without-benchmark",
          baseSalary: 110_000,
        }),
      ],
      workspaceBenchmarks: [workspaceBenchmark],
      ingestionBenchmarks: [],
      freshness,
    });

    expect(result.cohortContext.benchmarkCoverage).toBe(50);
    expect(result.cohortContext.totalEmployees).toBe(2);
  });

  it("show_ideal budgetIntent includes market_alignment with ideal budget", () => {
    const baseSalary = 95_000;
    const p50Annual = 130_000;
    const gapToClose = p50Annual - baseSalary;

    const result = buildSalaryReviewAiScenarios({
      request: {
        ...baseRequest,
        budgetAbsolute: 1_000,
        budgetIntent: "show_ideal",
      },
      employees: [makeEmployee({ baseSalary })],
      workspaceBenchmarks: [{ ...workspaceBenchmark, p50: p50Annual }],
      ingestionBenchmarks: [],
      freshness,
    });

    const marketAlignment = result.scenarios.find((s) => s.id === "market_alignment");
    expect(marketAlignment).toBeDefined();
    expect(marketAlignment!.summary.budget).toBeGreaterThanOrEqual(gapToClose);
  });
});
