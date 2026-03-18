import { describe, expect, it } from "vitest";
import {
  aggregateMarketPoolObservations,
  getMarketPoolMinimumContributors,
  type MarketPoolObservation,
} from "@/lib/benchmarks/platform-market-pool";

describe("aggregateMarketPoolObservations", () => {
  it("suppresses cohorts that do not meet the privacy threshold", () => {
    const observations: MarketPoolObservation[] = [
      {
        workspaceId: "w1",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 100_000,
        sourceType: "employee",
      },
      {
        workspaceId: "w2",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 110_000,
        sourceType: "employee",
      },
    ];

    const rows = aggregateMarketPoolObservations(observations, {
      minimumContributors: 3,
      effectiveDate: "2026-03-10",
    });

    expect(rows).toEqual([]);
  });

  it("builds a blended pooled row from employee, uploaded, and admin observations", () => {
    const observations: MarketPoolObservation[] = [
      {
        workspaceId: "w1",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 100_000,
        sourceType: "employee",
      },
      {
        workspaceId: "w2",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 120_000,
        sourceType: "uploaded",
      },
      {
        workspaceId: "platform",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 140_000,
        sourceType: "admin",
      },
    ];

    const [row] = aggregateMarketPoolObservations(observations, {
      minimumContributors: 3,
      effectiveDate: "2026-03-10",
    });

    expect(row).toMatchObject({
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      currency: "AED",
      sample_size: 3,
      contributor_count: 3,
      provenance: "blended",
      valid_from: "2026-03-10",
      source_breakdown: {
        employee: 1,
        uploaded: 1,
        admin: 1,
      },
    });
    expect(row.p10).toBe(100_000);
    expect(row.p25).toBe(100_000);
    expect(row.p50).toBe(120_000);
    expect(row.p75).toBe(140_000);
    expect(row.p90).toBe(140_000);
  });

  it("creates segmented cohorts alongside the base fallback cohort", () => {
    const observations: MarketPoolObservation[] = [
      {
        workspaceId: "w1",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 100_000,
        sourceType: "employee",
        industry: "Fintech",
        company_size: "201-500",
      },
      {
        workspaceId: "w2",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 110_000,
        sourceType: "uploaded",
        industry: "Fintech",
        company_size: "201-500",
      },
      {
        workspaceId: "platform",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 125_000,
        sourceType: "admin",
        industry: "Fintech",
        company_size: "201-500",
      },
    ];

    const rows = aggregateMarketPoolObservations(observations, {
      minimumContributors: 3,
      effectiveDate: "2026-03-11",
    });

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role_id: "swe",
          location_id: "dubai",
          level_id: "ic3",
          industry: null,
          company_size: null,
          sample_size: 3,
        }),
        expect.objectContaining({
          role_id: "swe",
          location_id: "dubai",
          level_id: "ic3",
          industry: "Fintech",
          company_size: null,
          sample_size: 3,
        }),
        expect.objectContaining({
          role_id: "swe",
          location_id: "dubai",
          level_id: "ic3",
          industry: "Fintech",
          company_size: "201-500",
          sample_size: 3,
        }),
      ]),
    );
  });

  it("treats seeded admin observations from three platform contributor workspaces as trusted coverage", () => {
    const observations: MarketPoolObservation[] = [
      {
        workspaceId: "qeemly-seed-a",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 78_000,
        sourceType: "admin",
      },
      {
        workspaceId: "qeemly-seed-b",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 80_000,
        sourceType: "admin",
      },
      {
        workspaceId: "qeemly-seed-c",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 82_000,
        sourceType: "admin",
      },
    ];

    const [row] = aggregateMarketPoolObservations(observations, {
      minimumContributors: 3,
      effectiveDate: "2026-03-12",
    });

    expect(row).toMatchObject({
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      contributor_count: 3,
      sample_size: 3,
      provenance: "admin",
      source_breakdown: {
        employee: 0,
        uploaded: 0,
        admin: 3,
      },
    });
    expect(row.p50).toBe(80_000);
  });

  it("counts distinct admin market sources even when they share one platform workspace", () => {
    const observations: MarketPoolObservation[] = [
      {
        workspaceId: "platform",
        contributorKey: "admin:uae_fcsc_workforce_comp",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 78_000,
        sourceType: "admin",
      },
      {
        workspaceId: "platform",
        contributorKey: "admin:qatar_wages",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 80_000,
        sourceType: "admin",
      },
      {
        workspaceId: "platform",
        contributorKey: "admin:oman_ncsi_wages",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 82_000,
        sourceType: "admin",
      },
    ];

    const [row] = aggregateMarketPoolObservations(observations, {
      minimumContributors: 3,
      effectiveDate: "2026-03-12",
    });

    expect(row).toMatchObject({
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      contributor_count: 3,
      sample_size: 3,
      provenance: "admin",
      source_breakdown: {
        employee: 0,
        uploaded: 0,
        admin: 3,
      },
    });
    expect(row.p50).toBe(80_000);
  });
});

describe("getMarketPoolMinimumContributors", () => {
  it("keeps the production trust threshold by default", () => {
    expect(getMarketPoolMinimumContributors({})).toBe(3);
    expect(getMarketPoolMinimumContributors({ QEEMLY_ENABLE_DEMO_MARKET_BOOTSTRAP: "false" })).toBe(3);
  });

  it("allows a single-workspace bootstrap only when explicitly enabled", () => {
    expect(getMarketPoolMinimumContributors({ QEEMLY_ENABLE_DEMO_MARKET_BOOTSTRAP: "true" })).toBe(1);
  });
});
