import { describe, expect, it } from "vitest";
import { buildSalaryReviewAiPlan } from "@/lib/salary-review/ai-plan-engine";
import type { SalaryReviewAiPlanRequest } from "@/lib/salary-review";

const baseRequest: SalaryReviewAiPlanRequest = {
  mode: "assistive",
  cycle: "annual",
  budgetType: "absolute",
  budgetAbsolute: 12_345,
};

describe("buildSalaryReviewAiPlan", () => {
  it("prefers platform market benchmarks over workspace benchmarks", () => {
    const plan = buildSalaryReviewAiPlan({
      request: { ...baseRequest, budgetAbsolute: 10_000 },
      employees: [
        {
          id: "e1",
          firstName: "A",
          lastName: "One",
          roleId: "r1",
          levelId: "l1",
          locationId: "dubai",
          baseSalary: 90_000,
          performanceRating: "meets",
          hireDate: "2020-01-01",
        },
      ],
      workspaceBenchmarks: [
        {
          roleId: "r1",
          levelId: "l1",
          locationId: "dubai",
          p50: 100_000,
          provenance: "workspace",
          sourceSlug: "workspace_uploaded",
          sourceName: "Workspace Benchmarks",
        },
      ],
      ingestionBenchmarks: [
        {
          roleId: "r1",
          levelId: "l1",
          locationId: "dubai",
          p50: 200_000,
          provenance: "ingestion",
          sourceSlug: "qeemly_ingestion",
          sourceName: "Qeemly Ingestion",
        },
      ],
      freshness: [
        { provenance: "workspace", lastUpdatedAt: "2026-03-05T10:00:00.000Z", confidence: "high" },
        { provenance: "ingestion", lastUpdatedAt: "2026-03-05T09:00:00.000Z", confidence: "medium" },
      ],
    });

    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].benchmark.provenance).toBe("ingestion");
    expect(plan.items[0].benchmark.sourceSlug).toBe("qeemly_ingestion");
  });

  it("falls back to ingestion role+level match when location match is missing", () => {
    const plan = buildSalaryReviewAiPlan({
      request: { ...baseRequest, budgetAbsolute: 8_000 },
      employees: [
        {
          id: "e1",
          firstName: "B",
          lastName: "Two",
          roleId: "r2",
          levelId: "l3",
          locationId: "riyadh",
          baseSalary: 110_000,
          performanceRating: "exceeds",
          hireDate: "2019-05-01",
        },
      ],
      workspaceBenchmarks: [],
      ingestionBenchmarks: [
        {
          roleId: "r2",
          levelId: "l3",
          locationId: "dubai",
          p50: 120_000,
          provenance: "ingestion",
          sourceSlug: "qeemly_ingestion",
          sourceName: "Qeemly Ingestion",
        },
      ],
      freshness: [
        { provenance: "workspace", lastUpdatedAt: null, confidence: "unknown" },
        { provenance: "ingestion", lastUpdatedAt: "2026-03-05T09:00:00.000Z", confidence: "high" },
      ],
    });

    expect(plan.items[0].benchmark.provenance).toBe("ingestion");
    expect(plan.items[0].benchmark.matchQuality).toBe("role_level_fallback");
    expect(plan.items[0].warnings.some((warning) => warning.includes("fallback"))).toBe(true);
  });

  it("uses the same-country market fallback before a workspace exact match", () => {
    const plan = buildSalaryReviewAiPlan({
      request: { ...baseRequest, budgetAbsolute: 8_000 },
      employees: [
        {
          id: "e1",
          firstName: "B",
          lastName: "Two",
          roleId: "r2",
          levelId: "l3",
          locationId: "abu-dhabi",
          baseSalary: 110_000,
          performanceRating: "exceeds",
          hireDate: "2019-05-01",
        },
      ],
      workspaceBenchmarks: [
        {
          roleId: "r2",
          levelId: "l3",
          locationId: "abu-dhabi",
          p50: 150_000,
          provenance: "workspace",
          sourceSlug: "workspace_uploaded",
          sourceName: "Workspace Benchmarks",
        },
      ],
      ingestionBenchmarks: [
        {
          roleId: "r2",
          levelId: "l3",
          locationId: "dubai",
          p50: 120_000,
          provenance: "ingestion",
          sourceSlug: "qeemly_ingestion",
          sourceName: "Qeemly Ingestion",
        },
      ],
      freshness: [
        { provenance: "workspace", lastUpdatedAt: "2026-03-05T10:00:00.000Z", confidence: "high" },
        { provenance: "ingestion", lastUpdatedAt: "2026-03-05T09:00:00.000Z", confidence: "high" },
      ],
    });

    expect(plan.items[0].benchmark.provenance).toBe("ingestion");
    expect(plan.items[0].benchmark.matchQuality).toBe("role_level_fallback");
    expect(plan.items[0].benchmark.matchType).toBe("location_fallback");
  });

  it("keeps total proposed increases within budget", () => {
    const plan = buildSalaryReviewAiPlan({
      request: baseRequest,
      employees: [
        {
          id: "e1",
          firstName: "C",
          lastName: "Three",
          roleId: "r1",
          levelId: "l1",
          locationId: "dubai",
          baseSalary: 100_000,
          performanceRating: "exceeds",
          hireDate: "2021-02-01",
        },
        {
          id: "e2",
          firstName: "D",
          lastName: "Four",
          roleId: "r1",
          levelId: "l1",
          locationId: "dubai",
          baseSalary: 80_000,
          performanceRating: "meets",
          hireDate: "2022-03-01",
        },
        {
          id: "e3",
          firstName: "E",
          lastName: "Five",
          roleId: "r1",
          levelId: "l1",
          locationId: "dubai",
          baseSalary: 120_000,
          performanceRating: "exceptional",
          hireDate: "2018-03-01",
        },
      ],
      workspaceBenchmarks: [
        {
          roleId: "r1",
          levelId: "l1",
          locationId: "dubai",
          p50: 11_000,
          provenance: "workspace",
          sourceSlug: "workspace_uploaded",
          sourceName: "Workspace Benchmarks",
        },
      ],
      ingestionBenchmarks: [],
      freshness: [
        { provenance: "workspace", lastUpdatedAt: "2026-03-05T10:00:00.000Z", confidence: "high" },
        { provenance: "ingestion", lastUpdatedAt: null, confidence: "unknown" },
      ],
    });

    expect(plan.summary.budget).toBe(12_345);
    expect(plan.summary.budgetUsed).toBeLessThanOrEqual(12_345);
    expect(plan.items.reduce((sum, item) => sum + item.proposedIncrease, 0)).toBe(plan.summary.budgetUsed);
  });
});

