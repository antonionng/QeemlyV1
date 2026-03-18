import { describe, expect, it } from "vitest";
import { resolveBenchmarkForEmployee } from "@/lib/benchmarks/benchmark-resolver";

describe("resolveBenchmarkForEmployee", () => {
  it("prefers an exact market match over an uploaded overlay", () => {
    const result = resolveBenchmarkForEmployee({
      employee: {
        roleId: "swe",
        levelId: "ic3",
        locationId: "dubai",
      },
      marketBenchmarks: [
        {
          id: "market-exact",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          p50: 120_000,
        },
      ],
      workspaceBenchmarks: [
        {
          id: "workspace-exact",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          p50: 140_000,
        },
      ],
    });

    expect(result).toMatchObject({
      source: "market",
      matchQuality: "exact",
      matchType: "exact",
      matchedBenchmarkId: "market-exact",
    });
  });

  it("uses a same-country market fallback before falling back to workspace data", () => {
    const result = resolveBenchmarkForEmployee({
      employee: {
        roleId: "swe",
        levelId: "ic3",
        locationId: "abu-dhabi",
      },
      marketBenchmarks: [
        {
          id: "market-country",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          p50: 120_000,
        },
      ],
      workspaceBenchmarks: [
        {
          id: "workspace-exact",
          role_id: "swe",
          level_id: "ic3",
          location_id: "abu-dhabi",
          p50: 140_000,
        },
      ],
    });

    expect(result).toMatchObject({
      source: "market",
      matchQuality: "role_level_fallback",
      matchType: "location_fallback",
      matchedBenchmarkId: "market-country",
      fallbackReason: "Used the closest market benchmark from the same country.",
    });
  });

  it("uses an adjacent-level market fallback before falling back to a family match", () => {
    const result = resolveBenchmarkForEmployee({
      employee: {
        roleId: "swe-fe",
        levelId: "ic4",
        locationId: "dubai",
      },
      marketBenchmarks: [
        {
          id: "adjacent-level",
          role_id: "swe-fe",
          level_id: "ic3",
          location_id: "dubai",
          p50: 120_000,
        },
        {
          id: "family-fallback",
          role_id: "swe",
          level_id: "ic4",
          location_id: "dubai",
          p50: 150_000,
        },
      ],
      workspaceBenchmarks: [],
    });

    expect(result).toMatchObject({
      source: "market",
      matchQuality: "role_level_fallback",
      matchType: "adjacent_level_fallback",
      matchedBenchmarkId: "adjacent-level",
    });
  });

  it("falls back to the canonical family when no exact-role rows exist", () => {
    const result = resolveBenchmarkForEmployee({
      employee: {
        roleId: "swe-fe",
        levelId: "ic3",
        locationId: "dubai",
      },
      marketBenchmarks: [
        {
          id: "family-fallback",
          role_id: "swe",
          level_id: "ic3",
          location_id: "dubai",
          p50: 120_000,
        },
      ],
      workspaceBenchmarks: [],
    });

    expect(result).toMatchObject({
      source: "market",
      matchQuality: "role_level_fallback",
      matchType: "family_fallback",
      matchedBenchmarkId: "family-fallback",
      fallbackReason: "Used a benchmark from the same canonical job family.",
    });
  });
});
