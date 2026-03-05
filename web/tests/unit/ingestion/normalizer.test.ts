import { describe, expect, it } from "vitest";
import { normalizeBenchmarkRow } from "@/lib/ingestion/normalizer";

describe("normalizeBenchmarkRow", () => {
  it("returns error for unmapped role", () => {
    const result = normalizeBenchmarkRow({
      role: "Completely Unknown Role",
      location: "Dubai",
      level: "L3",
      p10: "1000",
      p25: "2000",
      p50: "3000",
      p75: "4000",
      p90: "5000",
    });

    expect("error" in result).toBe(true);
  });

  it("normalizes known values into canonical output", () => {
    const result = normalizeBenchmarkRow({
      role: "swe",
      location: "Dubai",
      level: "ic3",
      p10: "10000",
      p25: "12000",
      p50: "14000",
      p75: "16000",
      p90: "18000",
    });

    expect("ok" in result).toBe(true);
    if ("ok" in result) {
      expect(result.ok.currency).toBeTruthy();
      expect(result.ok.p50).toBe(14000);
    }
  });
});
