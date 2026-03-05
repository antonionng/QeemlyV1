import { describe, expect, it } from "vitest";
import {
  buildBenchmarkExplainabilityNote,
  checkPercentileOrdering,
  checkUaePilotConstraints,
  validateBenchmarkRow,
} from "@/lib/ingestion/data-quality";

describe("data quality checks", () => {
  it("detects percentile ordering violations", () => {
    const reason = checkPercentileOrdering({
      roleId: "software_engineer",
      locationId: "dubai",
      levelId: "l3",
      currency: "AED",
      p10: 100,
      p25: 90,
      p50: 120,
      p75: 130,
      p90: 140,
    });

    expect(reason).toBe("p10_gt_p25");
  });

  it("passes for a healthy benchmark row", () => {
    const result = validateBenchmarkRow({
      roleId: "software_engineer",
      locationId: "dubai",
      levelId: "l3",
      currency: "AED",
      p10: 10000,
      p25: 12000,
      p50: 14000,
      p75: 16000,
      p90: 18000,
      sampleSize: 25,
    });

    expect(result).toEqual({ ok: true });
  });

  it("rejects UAE rows that are not in AED", () => {
    const reason = checkUaePilotConstraints({
      roleId: "software_engineer",
      locationId: "dubai",
      levelId: "l3",
      currency: "USD",
      p10: 10000,
      p25: 12000,
      p50: 14000,
      p75: 16000,
      p90: 18000,
    });

    expect(reason).toBe("uae_currency_must_be_aed");
  });

  it("builds explainability note with UAE source context", () => {
    const note = buildBenchmarkExplainabilityNote({
      sourceLabel: "MOHRE UAE sample set",
      lastUpdatedAt: "2026-02-28T00:00:00.000Z",
      percentile: 50,
      currency: "AED",
    });

    expect(note).toContain("MOHRE UAE sample set");
    expect(note).toContain("P50");
    expect(note).toContain("AED");
  });
});
