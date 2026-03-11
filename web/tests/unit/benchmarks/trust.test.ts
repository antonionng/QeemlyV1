import { describe, expect, it } from "vitest";
import {
  buildBenchmarkTrustLabels,
  getBenchmarkSourceLabel,
  summarizeBenchmarkTrust,
} from "@/lib/benchmarks/trust";

describe("benchmark trust helpers", () => {
  it("uses one premium vocabulary for market-backed benchmarks", () => {
    expect(
      buildBenchmarkTrustLabels({
        source: "market",
        provenance: "blended",
        matchQuality: "role_level_fallback",
        confidence: "high",
        sampleSize: 18,
        freshnessAt: "2026-03-10T00:00:00.000Z",
      }),
    ).toEqual({
      sourceLabel: "Qeemly Market Dataset",
      matchLabel: "Role and level match",
      confidenceLabel: "High confidence",
      freshnessLabel: "Updated Mar 10, 2026",
      sampleLabel: "Sample size 18",
    });
  });

  it("uses company overlay wording for uploaded data", () => {
    expect(
      getBenchmarkSourceLabel({
        source: "uploaded",
        provenance: "uploaded",
      }),
    ).toBe("Company Overlay");
  });

  it("summarizes source mix with the dominant premium label", () => {
    const summary = summarizeBenchmarkTrust([
      {
        id: "e1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        department: "Engineering",
        role: { id: "swe", title: "Software Engineer", family: "Engineering", icon: "code" },
        level: { id: "ic3", name: "IC3", category: "IC" },
        location: {
          id: "dubai",
          city: "Dubai",
          country: "United Arab Emirates",
          countryCode: "AE",
          currency: "AED",
          flag: "AE",
        },
        status: "active",
        employmentType: "national",
        baseSalary: 120000,
        totalComp: 120000,
        bandPosition: "in-band",
        bandPercentile: 50,
        marketComparison: 0,
        hasBenchmark: true,
        hireDate: new Date("2020-01-01"),
        benchmarkContext: {
          source: "market",
          provenance: "blended",
          matchQuality: "exact",
          freshnessAt: "2026-03-09T00:00:00.000Z",
        },
      },
      {
        id: "e2",
        firstName: "Grace",
        lastName: "Hopper",
        email: "grace@example.com",
        department: "Engineering",
        role: { id: "swe", title: "Software Engineer", family: "Engineering", icon: "code" },
        level: { id: "ic3", name: "IC3", category: "IC" },
        location: {
          id: "dubai",
          city: "Dubai",
          country: "United Arab Emirates",
          countryCode: "AE",
          currency: "AED",
          flag: "AE",
        },
        status: "active",
        employmentType: "national",
        baseSalary: 125000,
        totalComp: 125000,
        bandPosition: "in-band",
        bandPercentile: 55,
        marketComparison: 2,
        hasBenchmark: true,
        hireDate: new Date("2021-01-01"),
        benchmarkContext: {
          source: "uploaded",
          provenance: "uploaded",
          matchQuality: "role_level_fallback",
          lastUpdated: "2026-03-10T00:00:00.000Z",
        },
      },
    ]);

    expect(summary).toMatchObject({
      benchmarkedEmployees: 2,
      marketBacked: 1,
      workspaceBacked: 1,
      exactMatches: 1,
      fallbackMatches: 1,
      freshestAt: "2026-03-10T00:00:00.000Z",
    });
    expect(summary.primarySourceLabel).toBe("Qeemly Market Dataset");
  });
});
