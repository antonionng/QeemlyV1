import { describe, expect, it } from "vitest";
import {
  buildExpectedBenchmarkTriples,
  summarizeMarketSourceCoverage,
  summarizeMissingBenchmarkCoverageGroups,
  summarizeTopMissingBenchmarkTriples,
  summarizePublishedBenchmarkCoverage,
} from "@/lib/benchmarks/coverage-contract";
import { ROLES, LEVELS, LOCATIONS } from "@/lib/dashboard/dummy-data";

const TOTAL_TRIPLES = ROLES.length * LEVELS.length * LOCATIONS.length;

describe("benchmark coverage contract", () => {
  it("builds the full supported exact benchmark matrix", () => {
    const triples = buildExpectedBenchmarkTriples();

    expect(triples).toHaveLength(TOTAL_TRIPLES);
    expect(triples).toContainEqual({
      roleId: "swe",
      levelId: "ic1",
      locationId: "dubai",
      key: "swe::ic1::dubai",
    });
    expect(triples).toContainEqual({
      roleId: "tpm",
      levelId: "vp",
      locationId: "riyadh",
      key: "tpm::vp::riyadh",
    });
  });

  it("measures exact published coverage against the supported matrix", () => {
    const summary = summarizePublishedBenchmarkCoverage([
      {
        role_id: "swe",
        level_id: "ic1",
        location_id: "dubai",
      },
      {
        role_id: "tpm",
        level_id: "vp",
        location_id: "riyadh",
      },
    ]);

    expect(summary.supportedExactTriples).toBe(TOTAL_TRIPLES);
    expect(summary.coveredExactTriples).toBe(2);
    expect(summary.missingExactTriples).toBe(TOTAL_TRIPLES - 2);
    expect(summary.missingExamples).toContain("swe::ic2::dubai");
    expect(summary.missingExamples).not.toContain("swe::ic1::dubai");
    expect(summary.coveragePercent).toBeCloseTo((2 / TOTAL_TRIPLES) * 100, 2);
  });

  it("summarizes exact coverage per market source slug", () => {
    const summary = summarizeMarketSourceCoverage([
      {
        role_id: "swe",
        level_id: "ic1",
        location_id: "dubai",
        market_source_slug: "uae_fcsc_workforce_comp",
      },
      {
        role_id: "swe",
        level_id: "ic2",
        location_id: "dubai",
        market_source_slug: "uae_fcsc_workforce_comp",
      },
      {
        role_id: "pm",
        level_id: "ic3",
        location_id: "riyadh",
        market_source_slug: "qatar_wages",
      },
    ]);

    expect(summary).toHaveLength(2);
    expect(summary[0]).toMatchObject({
      sourceSlug: "uae_fcsc_workforce_comp",
      exactTriples: 2,
      sampleTriples: ["swe::ic1::dubai", "swe::ic2::dubai"],
    });
    expect(summary[1]).toMatchObject({
      sourceSlug: "qatar_wages",
      exactTriples: 1,
      sampleTriples: ["pm::ic3::riyadh"],
    });
  });

  it("groups missing exact coverage by role family and country", () => {
    const summary = summarizeMissingBenchmarkCoverageGroups([
      {
        role_id: "swe",
        level_id: "ic1",
        location_id: "dubai",
      },
      {
        role_id: "pm",
        level_id: "ic1",
        location_id: "riyadh",
      },
    ]);

    const engFamily = summary.byRoleFamily.find((f) => f.label === "Engineering");
    expect(engFamily).toBeDefined();
    expect(engFamily!.missingExactTriples).toBeGreaterThan(0);

    const totalMissing = summary.byCountry.reduce((sum, c) => sum + c.missingExactTriples, 0);
    expect(totalMissing).toBe(TOTAL_TRIPLES - 2);
  });

  it("lists concrete missing exact benchmark triples with readable labels", () => {
    const summary = summarizeTopMissingBenchmarkTriples(
      [
        {
          role_id: "swe",
          level_id: "ic1",
          location_id: "dubai",
        },
      ],
      3,
    );

    expect(summary).toEqual([
      {
        key: "swe::ic1::abu-dhabi",
        roleTitle: "Software Engineer",
        levelName: "Junior (IC1)",
        locationLabel: "Abu Dhabi, UAE",
      },
      {
        key: "swe::ic1::riyadh",
        roleTitle: "Software Engineer",
        levelName: "Junior (IC1)",
        locationLabel: "Riyadh, Saudi Arabia",
      },
      {
        key: "swe::ic1::jeddah",
        roleTitle: "Software Engineer",
        levelName: "Junior (IC1)",
        locationLabel: "Jeddah, Saudi Arabia",
      },
    ]);
  });
});
