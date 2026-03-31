import { beforeEach, describe, expect, it, vi } from "vitest";
import { __internal, hasDbEmployees, invalidateEmployeeCache } from "@/lib/employees/data-service";

describe("mapRowsToEmployees", () => {
  it("prefers market benchmarks over workspace bands for employee positioning", () => {
    const [employee] = __internal.mapRowsToEmployees(
      [
        {
          id: "e1",
          first_name: "Ada",
          last_name: "Lovelace",
          email: "ada@example.com",
          department: "Engineering",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          base_salary: 120_000,
          bonus: 0,
          equity: 0,
          status: "active",
          employment_type: "national",
          hire_date: "2020-01-01",
          performance_rating: "meets",
        },
      ],
      [
        {
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          p10: 200_000,
          p25: 210_000,
          p50: 220_000,
          p75: 230_000,
          p90: 240_000,
        },
      ],
      [
        {
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          p10: 100_000,
          p25: 110_000,
          p50: 120_000,
          p75: 130_000,
          p90: 140_000,
          provenance: "blended",
          freshness_at: "2026-03-10T00:00:00.000Z",
          sample_size: 12,
        },
      ],
    );

    expect(employee.hasBenchmark).toBe(true);
    expect(employee.marketComparison).toBe(0);
    expect(employee.bandPosition).toBe("in-band");
    expect(employee.benchmarkContext).toMatchObject({
      source: "market",
      provenance: "blended",
      matchQuality: "exact",
      freshnessAt: "2026-03-10T00:00:00.000Z",
      sampleSize: 12,
    });
  });

  it("adds a unique display name when multiple employees share the same full name", () => {
    const employees = __internal.mapRowsToEmployees(
      [
        {
          id: "e1",
          first_name: "Ahmed",
          last_name: "Al-Qasimi",
          email: "ahmed.one@example.com",
          department: "Engineering",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          base_salary: 120_000,
          bonus: 0,
          equity: 0,
          status: "active",
          employment_type: "national",
          hire_date: "2020-01-01",
          performance_rating: "meets",
        },
        {
          id: "e2",
          first_name: "Ahmed",
          last_name: "Al-Qasimi",
          email: "ahmed.two@example.com",
          department: "Product",
          role_id: "pm",
          level_id: "ic3",
          location_id: "riyadh",
          base_salary: 130_000,
          bonus: 0,
          equity: 0,
          status: "active",
          employment_type: "national",
          hire_date: "2020-01-01",
          performance_rating: "meets",
        },
      ],
      [],
      [],
    );

    expect(employees.map((employee) => employee.displayName)).toEqual([
      "Ahmed Al-Qasimi (Dubai)",
      "Ahmed Al-Qasimi (Riyadh)",
    ]);
  });

  it("keeps unresolved roles visible without fabricating benchmark coverage", () => {
    const [employee] = __internal.mapRowsToEmployees(
      [
        {
          id: "e1",
          first_name: "Ava",
          last_name: "Stone",
          email: "ava@example.com",
          department: "Operations",
          role_id: null,
          level_id: "ic3",
          location_id: "dubai",
          original_role_text: "Founder's Associate",
          base_salary: 120_000,
          bonus: 0,
          equity: 0,
          status: "active",
          employment_type: "national",
          hire_date: "2020-01-01",
          performance_rating: "meets",
        },
      ],
      [],
      [],
    );

    expect(employee.role.title).toBe("Founder's Associate");
    expect(employee.hasBenchmark).toBe(false);
    expect(employee.benchmarkContext).toBeUndefined();
  });

  it("uses the shared same-country fallback before giving up on market coverage", () => {
    const [employee] = __internal.mapRowsToEmployees(
      [
        {
          id: "e1",
          first_name: "Ava",
          last_name: "Stone",
          email: "ava@example.com",
          department: "Engineering",
          role_id: "swe",
          level_id: "ic3",
          location_id: "abu-dhabi",
          base_salary: 120_000,
          bonus: 0,
          equity: 0,
          status: "active",
          employment_type: "national",
          hire_date: "2020-01-01",
          performance_rating: "meets",
        },
      ],
      [],
      [
        {
          id: "market-country",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          p10: 100_000,
          p25: 110_000,
          p50: 120_000,
          p75: 130_000,
          p90: 140_000,
          provenance: "blended",
          freshness_at: "2026-03-10T00:00:00.000Z",
          sample_size: 12,
        },
      ],
    );

    expect(employee.hasBenchmark).toBe(true);
    expect(employee.benchmarkContext).toMatchObject({
      source: "market",
      matchQuality: "role_level_fallback",
      matchType: "location_fallback",
      matchedBenchmarkId: "market-country",
    });
  });
});

describe("hasDbEmployees", () => {
  beforeEach(() => {
    invalidateEmployeeCache();
    vi.restoreAllMocks();
  });

  it("uses the lightweight employee existence endpoint", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ hasEmployees: true }),
    }) as unknown as typeof fetch;

    const result = await hasDbEmployees();

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith("/api/people/exists", {
      method: "GET",
      cache: "no-store",
    });
  });

  it("returns false when the existence endpoint says there are no employees", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ hasEmployees: false }),
    }) as unknown as typeof fetch;

    const result = await hasDbEmployees();

    expect(result).toBe(false);
  });
});
