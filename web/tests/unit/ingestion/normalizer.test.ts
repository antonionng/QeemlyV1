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

  it("carries industry and company size segmentation when provided", () => {
    const result = normalizeBenchmarkRow({
      role: "swe",
      location: "Dubai",
      level: "ic3",
      industry: "Fintech",
      company_size: "201-500",
      p10: "10000",
      p25: "12000",
      p50: "14000",
      p75: "16000",
      p90: "18000",
    });

    expect("ok" in result).toBe(true);
    if ("ok" in result) {
      expect(result.ok.industry).toBe("Fintech");
      expect(result.ok.companySize).toBe("201-500");
    }
  });
});
