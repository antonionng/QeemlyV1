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

const ACCOUNTING_SPLIT_RANGE_TEXT = `
All salary packages are inclusive of basic salary, housing and transport and should be considered the monthly cash pay.
Accounting & Finance in Middle East
Finance
Transformation
Manager
Management 7+ Years Permanent Per
Month
AED35k
- 55k
AED30k
- 45k
Tax Manager Management 7+ Years Permanent Per
Month
AED25k
- 40k
AED25k
- 40k
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
        levelHint: "VP",
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
        levelHint: "VP",
        salaryRange2025: { min: 100_000, max: 130_000 },
        salaryRange2026: { min: 120_000, max: 150_000 },
      }),
    ]);
  });

  it("filters Robert Walters page chrome before extracting rows", () => {
    const rows = extractRobertWaltersBenchmarkRows(`
Job Title Job Group Role Type Pay Rate Salary Range 2025 Salary Range 2026 Market Insights
Technology in Middle East Jump to Key Insights
24/03/2026, 09:37 Robert Walters | Salary Calculator Results
https://engage.robertwalters.com/team-salary-benchmark-tool-2026/results-199ZT-1125QP.html
-- 1 of 3 --
All salary packages are inclusive of basic salary, housing and transport.
Showing 1 to 45 of 45 entries
Head of Software Engineering
Technology Permanent Per Month AED60k - 80k AED40k - 60k
    `);

    expect(rows).toEqual([
      expect.objectContaining({
        rowIndex: 1,
        roleTitle: "Head of Software Engineering",
        levelHint: "Director",
        salaryRange2025: { min: 60_000, max: 80_000 },
        salaryRange2026: { min: 40_000, max: 60_000 },
      }),
    ]);
  });

  it("extracts accounting rows when salary ranges are split across separate lines", () => {
    const rows = extractRobertWaltersBenchmarkRows(ACCOUNTING_SPLIT_RANGE_TEXT);

    expect(rows).toEqual([
      expect.objectContaining({
        rowIndex: 1,
        roleTitle: "Finance Transformation Manager",
        functionName: "Accounting & Finance",
        employmentType: "Permanent",
        payPeriod: "monthly",
        currency: "AED",
        salaryRange2025: { min: 35_000, max: 55_000 },
        salaryRange2026: { min: 30_000, max: 45_000 },
      }),
      expect.objectContaining({
        rowIndex: 2,
        roleTitle: "Tax Manager",
        functionName: "Accounting & Finance",
        employmentType: "Permanent",
        payPeriod: "monthly",
        currency: "AED",
        salaryRange2025: { min: 25_000, max: 40_000 },
        salaryRange2026: { min: 25_000, max: 40_000 },
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
      level: "VP",
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
