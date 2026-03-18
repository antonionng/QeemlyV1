import { describe, expect, it } from "vitest";
import {
  buildExpectedBenchmarkTriples,
  summarizeMarketSourceCoverage,
  summarizeMissingBenchmarkCoverageGroups,
  summarizeTopMissingBenchmarkTriples,
  summarizePublishedBenchmarkCoverage,
} from "@/lib/benchmarks/coverage-contract";

describe("benchmark coverage contract", () => {
  it("builds the full supported exact benchmark matrix", () => {
    const triples = buildExpectedBenchmarkTriples();

    expect(triples).toHaveLength(15 * 10 * 8);
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

    expect(summary.supportedExactTriples).toBe(1200);
    expect(summary.coveredExactTriples).toBe(2);
    expect(summary.missingExactTriples).toBe(1198);
    expect(summary.missingExamples).toContain("swe::ic2::dubai");
    expect(summary.missingExamples).not.toContain("swe::ic1::dubai");
    expect(summary.coveragePercent).toBeCloseTo((2 / 1200) * 100, 2);
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

    expect(summary).toEqual([
      {
        sourceSlug: "uae_fcsc_workforce_comp",
        exactTriples: 2,
        coveragePercent: 0.17,
        sampleTriples: ["swe::ic1::dubai", "swe::ic2::dubai"],
      },
      {
        sourceSlug: "qatar_wages",
        exactTriples: 1,
        coveragePercent: 0.08,
        sampleTriples: ["pm::ic3::riyadh"],
      },
    ]);
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

    expect(summary.byRoleFamily.slice(0, 3)).toEqual([
      { label: "Engineering", missingExactTriples: 719 },
      { label: "Data", missingExactTriples: 160 },
      { label: "Design", missingExactTriples: 160 },
    ]);
    expect(summary.byCountry).toEqual([
      { label: "Saudi Arabia", missingExactTriples: 299 },
      { label: "UAE", missingExactTriples: 299 },
      { label: "Bahrain", missingExactTriples: 150 },
      { label: "Kuwait", missingExactTriples: 150 },
      { label: "Oman", missingExactTriples: 150 },
      { label: "Qatar", missingExactTriples: 150 },
    ]);
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
