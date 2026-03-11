import { describe, expect, it } from "vitest";
import { __internal } from "@/lib/employees/data-service";

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
});
