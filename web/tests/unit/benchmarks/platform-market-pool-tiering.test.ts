import { describe, expect, it } from "vitest";
import {
  aggregateMarketPoolObservations,
  type MarketPoolObservation,
} from "@/lib/benchmarks/platform-market-pool";

type TieredObservation = MarketPoolObservation & {
  marketSourceTier: "official" | "proxy";
};

describe("aggregateMarketPoolObservations source tiers", () => {
  it("prefers official market support over proxy support for the same exact cohort", () => {
    const observations = [
      {
        workspaceId: "platform",
        contributorKey: "admin:official-1",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 100_000,
        sourceType: "admin",
        marketSourceTier: "official",
      },
      {
        workspaceId: "platform",
        contributorKey: "admin:official-2",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 110_000,
        sourceType: "admin",
        marketSourceTier: "official",
      },
      {
        workspaceId: "platform",
        contributorKey: "admin:official-3",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 120_000,
        sourceType: "admin",
        marketSourceTier: "official",
      },
      {
        workspaceId: "platform",
        contributorKey: "admin:proxy-1",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 200_000,
        sourceType: "admin",
        marketSourceTier: "proxy",
      },
      {
        workspaceId: "platform",
        contributorKey: "admin:proxy-2",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 210_000,
        sourceType: "admin",
        marketSourceTier: "proxy",
      },
      {
        workspaceId: "platform",
        contributorKey: "admin:proxy-3",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        value: 220_000,
        sourceType: "admin",
        marketSourceTier: "proxy",
      },
    ] as TieredObservation[];

    const [row] = aggregateMarketPoolObservations(observations, {
      minimumContributors: 3,
      effectiveDate: "2026-03-16",
    });

    expect(row).toMatchObject({
      role_id: "swe",
      level_id: "ic3",
      location_id: "dubai",
      sample_size: 3,
      contributor_count: 3,
      market_source_tier: "official",
    });
    expect(row.p50).toBe(110_000);
  });

  it("publishes proxy support when no official exact cohort exists", () => {
    const observations = [
      {
        workspaceId: "platform",
        contributorKey: "admin:proxy-1",
        role_id: "tpm",
        location_id: "riyadh",
        level_id: "ic5",
        currency: "SAR",
        value: 130_000,
        sourceType: "admin",
        marketSourceTier: "proxy",
      },
      {
        workspaceId: "platform",
        contributorKey: "admin:proxy-2",
        role_id: "tpm",
        location_id: "riyadh",
        level_id: "ic5",
        currency: "SAR",
        value: 140_000,
        sourceType: "admin",
        marketSourceTier: "proxy",
      },
      {
        workspaceId: "platform",
        contributorKey: "admin:proxy-3",
        role_id: "tpm",
        location_id: "riyadh",
        level_id: "ic5",
        currency: "SAR",
        value: 150_000,
        sourceType: "admin",
        marketSourceTier: "proxy",
      },
    ] as TieredObservation[];

    const [row] = aggregateMarketPoolObservations(observations, {
      minimumContributors: 3,
      effectiveDate: "2026-03-16",
    });

    expect(row).toMatchObject({
      role_id: "tpm",
      level_id: "ic5",
      location_id: "riyadh",
      sample_size: 3,
      contributor_count: 3,
      market_source_tier: "proxy",
    });
    expect(row.p50).toBe(140_000);
  });
});
