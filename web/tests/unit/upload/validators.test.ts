import { describe, expect, it } from "vitest";
import { validateData } from "@/lib/upload/validators";
import type { ColumnMapping } from "@/lib/upload/column-detection";

describe("validateData", () => {
  it("flags invalid benchmark percentile ordering", () => {
    const rows = [["Engineer", "Dubai", "L3", "AED", "5000", "4000", "3000", "8000", "9000"]];
    const mappings: ColumnMapping[] = [
      { sourceColumn: "role", sourceIndex: 0, targetField: "role", confidence: 1, sampleValues: [] },
      { sourceColumn: "location", sourceIndex: 1, targetField: "location", confidence: 1, sampleValues: [] },
      { sourceColumn: "level", sourceIndex: 2, targetField: "level", confidence: 1, sampleValues: [] },
      { sourceColumn: "currency", sourceIndex: 3, targetField: "currency", confidence: 1, sampleValues: [] },
      { sourceColumn: "p10", sourceIndex: 4, targetField: "p10", confidence: 1, sampleValues: [] },
      { sourceColumn: "p25", sourceIndex: 5, targetField: "p25", confidence: 1, sampleValues: [] },
      { sourceColumn: "p50", sourceIndex: 6, targetField: "p50", confidence: 1, sampleValues: [] },
      { sourceColumn: "p75", sourceIndex: 7, targetField: "p75", confidence: 1, sampleValues: [] },
      { sourceColumn: "p90", sourceIndex: 8, targetField: "p90", confidence: 1, sampleValues: [] },
    ];

    const result = validateData(rows, mappings, "benchmarks");
    expect(result.errorRows).toBe(1);
    expect(result.issues.some((issue) => issue.message.includes("P10 should be less"))).toBe(true);
  });
});
