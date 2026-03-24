import type { BenchmarkPayPeriod } from "@/lib/benchmarks/pay-period";

type SalaryRange = {
  min: number;
  max: number;
};

export type RobertWaltersBenchmarkRow = {
  rowIndex: number;
  rawText: string;
  roleTitle: string;
  functionName: string | null;
  employmentType: string | null;
  payPeriod: BenchmarkPayPeriod;
  currency: string;
  locationHint: string;
  levelHint: string;
  salaryRange2025: SalaryRange;
  salaryRange2026: SalaryRange;
  parseConfidence: "high" | "medium" | "low";
};

const ROBERT_WALTERS_FUNCTIONS = [
  "Accounting & Finance",
  "Banking & Financial Services",
  "Human Resources",
  "Sales & Marketing",
  "Supply Chain & Procurement",
  "Technology",
  "Legal",
  "Marketing",
  "Sales",
  "Finance",
] as const;

const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Temporary"] as const;

const RANGE_PATTERN =
  /\b([A-Z]{3})\s*([\d,.]+)\s*([kKmM]?)\s*-\s*([\d,.]+)\s*([kKmM]?)\b/g;

function normalizeInlineWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseScaledAmount(rawNumber: string, rawSuffix: string) {
  const numeric = Number(rawNumber.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;

  const suffix = rawSuffix.toLowerCase();
  if (suffix === "k") return numeric * 1_000;
  if (suffix === "m") return numeric * 1_000_000;
  return numeric;
}

function parseRanges(block: string) {
  const ranges: Array<{ currency: string; min: number; max: number }> = [];
  for (const match of block.matchAll(RANGE_PATTERN)) {
    const currency = match[1];
    const min = parseScaledAmount(match[2], match[3]);
    const max = parseScaledAmount(match[4], match[5]);
    if (!currency || min == null || max == null) {
      continue;
    }
    ranges.push({ currency, min, max });
  }
  return ranges;
}

function resolvePayPeriod(block: string): BenchmarkPayPeriod | null {
  if (/\bper\s+month\b/i.test(block)) return "monthly";
  if (/\bper\s+(annum|year)\b/i.test(block)) return "annual";
  return null;
}

function resolveEmploymentType(block: string) {
  return EMPLOYMENT_TYPES.find((value) => new RegExp(`\\b${value}\\b`, "i").test(block)) ?? null;
}

function resolveFunctionName(prefix: string) {
  const normalizedPrefix = normalizeInlineWhitespace(prefix);
  for (const functionName of ROBERT_WALTERS_FUNCTIONS) {
    if (new RegExp(`${functionName}$`, "i").test(normalizedPrefix)) {
      return functionName;
    }
  }
  return null;
}

function buildRowFromBlock(block: string, rowIndex: number): RobertWaltersBenchmarkRow | null {
  const normalizedBlock = normalizeInlineWhitespace(block);
  const payPeriod = resolvePayPeriod(normalizedBlock);
  const employmentType = resolveEmploymentType(normalizedBlock);
  const ranges = parseRanges(normalizedBlock);

  if (!payPeriod || !employmentType || ranges.length < 2) {
    return null;
  }

  const firstRangeIndex = normalizedBlock.search(RANGE_PATTERN);
  if (firstRangeIndex === -1) {
    return null;
  }

  const prefix = normalizedBlock.slice(0, firstRangeIndex).trim();
  const roleAndFunction = prefix
    .replace(new RegExp(`\\b${employmentType}\\b`, "i"), "")
    .replace(/\bper\s+(month|annum|year)\b/i, "")
    .trim();
  const functionName = resolveFunctionName(roleAndFunction);
  const roleTitle = functionName
    ? roleAndFunction.slice(0, roleAndFunction.length - functionName.length).trim()
    : roleAndFunction;

  if (!roleTitle) {
    return null;
  }

  const annualOrMonthlyRanges = ranges.slice(-2);
  const primaryCurrency = annualOrMonthlyRanges[0]?.currency ?? "AED";

  return {
    rowIndex,
    rawText: normalizedBlock,
    roleTitle,
    functionName,
    employmentType,
    payPeriod,
    currency: primaryCurrency,
    locationHint: "Dubai",
    levelHint: roleTitle,
    salaryRange2025: {
      min: annualOrMonthlyRanges[0].min,
      max: annualOrMonthlyRanges[0].max,
    },
    salaryRange2026: {
      min: annualOrMonthlyRanges[1].min,
      max: annualOrMonthlyRanges[1].max,
    },
    parseConfidence: functionName ? "high" : "medium",
  };
}

export function extractRobertWaltersBenchmarkRows(text: string): RobertWaltersBenchmarkRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: RobertWaltersBenchmarkRow[] = [];
  let buffer: string[] = [];

  for (const line of lines) {
    buffer.push(line);
    if (!RANGE_PATTERN.test(line)) {
      RANGE_PATTERN.lastIndex = 0;
      continue;
    }
    RANGE_PATTERN.lastIndex = 0;

    const row = buildRowFromBlock(buffer.join(" "), rows.length + 1);
    if (row) {
      rows.push(row);
    }
    buffer = [];
  }

  return rows;
}

export function toRobertWaltersNormalizationRow(row: RobertWaltersBenchmarkRow) {
  const p25 = row.salaryRange2026.min;
  const p75 = row.salaryRange2026.max;
  const p50 = Math.round((p25 + p75) / 2);

  return {
    role: row.roleTitle,
    location: row.locationHint,
    level: row.levelHint,
    currency: row.currency,
    pay_period: row.payPeriod,
    p10: p25,
    p25,
    p50,
    p75,
    p90: p75,
    sample_size: null,
    sector: row.functionName,
  };
}
