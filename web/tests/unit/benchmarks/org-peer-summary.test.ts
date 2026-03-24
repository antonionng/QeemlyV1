import { describe, expect, it } from "vitest";
import type { DbBenchmark } from "@/lib/benchmarks/data-service";
import type { MarketBenchmark } from "@/lib/benchmarks/platform-market";
import { getOrgPeerSummary } from "@/lib/benchmarks/org-peer-summary";

type EmployeeCompRow = {
  id: string;
  role_id: string;
  level_id: string;
  location_id: string;
  status: string;
  base_salary: number;
  bonus: number;
  equity: number;
};

function createEmployee(overrides: Partial<EmployeeCompRow> = {}): EmployeeCompRow {
  return {
    id: "emp-1",
    role_id: "swe",
    level_id: "ic3",
    location_id: "dubai",
    status: "active",
    base_salary: 180_000,
    bonus: 0,
    equity: 0,
    ...overrides,
  };
}

function createMarketBenchmark(
  overrides: Partial<MarketBenchmark> & { pay_period?: "monthly" | "annual" } = {},
): MarketBenchmark & { pay_period?: "monthly" | "annual" } {
  return {
    role_id: "swe",
    location_id: "dubai",
    level_id: "ic3",
    currency: "AED",
    industry: null,
    company_size: null,
    p10: 12_000,
    p25: 14_000,
    p50: 16_000,
    p75: 18_000,
    p90: 20_000,
    sample_size: 12,
    source: "market",
    pay_period: "monthly",
    ...overrides,
  };
}

function createWorkspaceBenchmark(
  overrides: Partial<DbBenchmark> & { pay_period?: "monthly" | "annual" } = {},
): DbBenchmark & { pay_period?: "monthly" | "annual" } {
  return {
    id: "bench-1",
    workspace_id: "ws-1",
    role_id: "swe",
    location_id: "dubai",
    level_id: "ic3",
    currency: "AED",
    p10: 10_000,
    p25: 11_000,
    p50: 12_000,
    p75: 13_000,
    p90: 14_000,
    sample_size: 6,
    source: "uploaded",
    confidence: "medium",
    valid_from: "2026-03-12",
    created_at: "2026-03-12T00:00:00.000Z",
    industry: null,
    company_size: null,
    pay_period: "monthly",
    ...overrides,
  };
}

describe("getOrgPeerSummary", () => {
  it("counts only active employees in the current role, level, and location who are within p25 to p75", () => {
    const result = getOrgPeerSummary({
      employees: [
        createEmployee({ id: "in-band-1", base_salary: 150_000 }),
        createEmployee({ id: "in-band-2", base_salary: 180_000 }),
        createEmployee({ id: "below-band", base_salary: 130_000 }),
        createEmployee({ id: "above-band", base_salary: 210_000 }),
        createEmployee({ id: "inactive", base_salary: 160_000, status: "inactive" }),
        createEmployee({ id: "other-level", base_salary: 165_000, level_id: "ic4" }),
      ],
      marketBenchmarks: [createMarketBenchmark()],
      workspaceBenchmarks: [],
      roleId: "swe",
      locationId: "dubai",
      levelId: "ic3",
    });

    expect(result).toMatchObject({
      benchmarkSource: "market",
      matchingEmployeeCount: 4,
      inBandCount: 2,
      bandLow: 168_000,
      bandHigh: 216_000,
    });
  });

  it("uses the segmented market row that matches the current benchmark filters", () => {
    const result = getOrgPeerSummary({
      employees: [
        createEmployee({ id: "fintech-match", base_salary: 180_000 }),
        createEmployee({ id: "base-only", base_salary: 150_000 }),
      ],
      marketBenchmarks: [
        createMarketBenchmark({
          p25: 12_000,
          p75: 14_000,
        }),
        createMarketBenchmark({
          industry: "Fintech",
          company_size: "201-500",
          p25: 15_000,
          p75: 17_000,
        }),
      ],
      workspaceBenchmarks: [],
      roleId: "swe",
      locationId: "dubai",
      levelId: "ic3",
      industry: "Fintech",
      companySize: "201-500",
    });

    expect(result).toMatchObject({
      benchmarkSource: "market",
      bandLow: 180_000,
      bandHigh: 204_000,
      inBandCount: 1,
    });
  });

  it("falls back to a workspace benchmark when no market row exists", () => {
    const result = getOrgPeerSummary({
      employees: [
        createEmployee({ id: "in-band", base_salary: 145_000 }),
        createEmployee({ id: "out-of-band", base_salary: 170_000 }),
      ],
      marketBenchmarks: [],
      workspaceBenchmarks: [createWorkspaceBenchmark()],
      roleId: "swe",
      locationId: "dubai",
      levelId: "ic3",
    });

    expect(result).toMatchObject({
      benchmarkSource: "uploaded",
      bandLow: 132_000,
      bandHigh: 156_000,
      inBandCount: 1,
      matchingEmployeeCount: 2,
    });
  });

  it("returns a zero-count summary when no benchmark can be resolved", () => {
    const result = getOrgPeerSummary({
      employees: [createEmployee({ id: "emp-1", base_salary: 170_000 })],
      marketBenchmarks: [],
      workspaceBenchmarks: [],
      roleId: "swe",
      locationId: "dubai",
      levelId: "ic3",
    });

    expect(result).toEqual({
      benchmarkSource: null,
      bandLow: null,
      bandHigh: null,
      matchingEmployeeCount: 1,
      inBandCount: 0,
    });
  });

  it("matches peers across locations and does not annualize annual benchmark rows again", () => {
    const result = getOrgPeerSummary({
      employees: [
        createEmployee({ id: "dubai-peer", location_id: "dubai", base_salary: 180_000 }),
        createEmployee({ id: "riyadh-peer", location_id: "riyadh", base_salary: 175_000 }),
        createEmployee({ id: "other-role", role_id: "pm", location_id: "riyadh", base_salary: 180_000 }),
      ],
      marketBenchmarks: [
        createMarketBenchmark({
          pay_period: "annual",
          p25: 170_000,
          p75: 190_000,
        }),
      ],
      workspaceBenchmarks: [],
      roleId: "swe",
      locationId: "dubai",
      levelId: "ic3",
    });

    expect(result).toMatchObject({
      benchmarkSource: "market",
      matchingEmployeeCount: 2,
      inBandCount: 2,
      bandLow: 170_000,
      bandHigh: 190_000,
    });
  });
});
