import { describe, expect, it } from "vitest";
import {
  extractRobertWaltersBenchmarkRows,
  toRobertWaltersNormalizationRow,
} from "@/lib/admin/research/robert-walters";

const SAMPLE_TEXT = `
Group Chief Information Officer
(Group CIO) Technology Permanent Per
Month AED100k - 150k AED150k - 200k

Chief Strategy officer (Dig
Transformation) Technology Permanent Per
Month AED100k - 130k AED120k - 150k
`;

describe("extractRobertWaltersBenchmarkRows", () => {
  it("extracts wrapped Robert Walters calculator rows with monthly pay ranges", () => {
    const rows = extractRobertWaltersBenchmarkRows(SAMPLE_TEXT);

    expect(rows).toEqual([
      expect.objectContaining({
        rowIndex: 1,
        roleTitle: "Group Chief Information Officer (Group CIO)",
        functionName: "Technology",
        employmentType: "Permanent",
        payPeriod: "monthly",
        currency: "AED",
        locationHint: "Dubai",
        levelHint: "Group Chief Information Officer (Group CIO)",
        salaryRange2025: { min: 100_000, max: 150_000 },
        salaryRange2026: { min: 150_000, max: 200_000 },
        parseConfidence: "high",
      }),
      expect.objectContaining({
        rowIndex: 2,
        roleTitle: "Chief Strategy officer (Dig Transformation)",
        functionName: "Technology",
        employmentType: "Permanent",
        payPeriod: "monthly",
        currency: "AED",
        locationHint: "Dubai",
        levelHint: "Chief Strategy officer (Dig Transformation)",
        salaryRange2025: { min: 100_000, max: 130_000 },
        salaryRange2026: { min: 120_000, max: 150_000 },
      }),
    ]);
  });
});

describe("toRobertWaltersNormalizationRow", () => {
  it("builds a benchmark-ready row from the 2026 guide range", () => {
    const [row] = extractRobertWaltersBenchmarkRows(SAMPLE_TEXT);

    expect(toRobertWaltersNormalizationRow(row)).toEqual({
      role: "Group Chief Information Officer (Group CIO)",
      location: "Dubai",
      level: "Group Chief Information Officer (Group CIO)",
      currency: "AED",
      pay_period: "monthly",
      p10: 150_000,
      p25: 150_000,
      p50: 175_000,
      p75: 200_000,
      p90: 200_000,
      sample_size: null,
      sector: "Technology",
    });
  });
});
