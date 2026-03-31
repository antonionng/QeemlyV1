import { describe, expect, it } from "vitest";
import { summarizePublishedBenchmarkCoverage } from "@/lib/benchmarks/coverage-contract";
import { ROLES, LEVELS, LOCATIONS } from "@/lib/dashboard/dummy-data";

const TOTAL_TRIPLES = ROLES.length * LEVELS.length * LOCATIONS.length;

describe("summarizePublishedBenchmarkCoverage tier reporting", () => {
  it("separates official exact coverage from proxy-backed exact coverage", () => {
    const summary = summarizePublishedBenchmarkCoverage([
      {
        role_id: "swe",
        level_id: "ic1",
        location_id: "dubai",
        market_source_tier: "official",
      },
      {
        role_id: "tpm",
        level_id: "ic5",
        location_id: "riyadh",
        market_source_tier: "proxy",
      },
    ]);

    expect(summary).toMatchObject({
      supportedExactTriples: TOTAL_TRIPLES,
      coveredExactTriples: 2,
      officialCoveredExactTriples: 1,
      proxyBackedExactTriples: 1,
      missingExactTriples: TOTAL_TRIPLES - 2,
    });
  });
});
