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
        hasBenchmark: true,
        benchmarkContext: {
          source: "market",
          provenance: "blended",
          matchQuality: "exact",
          freshnessAt: "2026-03-09T00:00:00.000Z",
        },
      },
      {
        hasBenchmark: true,
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
