/**
 * Data quality checks for ingestion pipeline.
 * Produces a per-run DQ report.
 */

export type DQReport = {
  totalRows: number;
  passed: number;
  failed: number;
  skipped: number;
  reasons: Record<string, number>; // reason -> count
  sampleErrors: Array<{ row: number; reason: string; value?: unknown }>;
  timestamp: string;
};

export type BenchmarkRow = {
  roleId: string;
  locationId: string;
  levelId: string;
  currency: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sampleSize?: number | null;
};

const MAX_SAMPLE_ERRORS = 10;
const UAE_LOCATIONS = new Set(["dubai", "abu-dhabi", "sharjah", "uae"]);

type ExplainabilityInput = {
  sourceLabel: string;
  lastUpdatedAt: string | null;
  percentile: 10 | 25 | 50 | 75 | 90;
  currency: string;
};

/**
 * Validate percentile ordering: p10 <= p25 <= p50 <= p75 <= p90
 */
export function checkPercentileOrdering(row: BenchmarkRow): string | null {
  const { p10, p25, p50, p75, p90 } = row;
  if (p10 > p25) return "p10_gt_p25";
  if (p25 > p50) return "p25_gt_p50";
  if (p50 > p75) return "p50_gt_p75";
  if (p75 > p90) return "p75_gt_p90";
  return null;
}

/**
 * Sanity check: compensation values in reasonable range (e.g. 1k–10M in local currency)
 */
export function checkCurrencySanity(row: BenchmarkRow): string | null {
  const { p50 } = row;
  const min = 1000;
  const max = 10_000_000;
  if (p50 < min) return "p50_below_min";
  if (p50 > max) return "p50_above_max";
  return null;
}

/**
 * Basic outlier detection: p50 should not be wildly different from neighbors
 */
export function checkOutlier(row: BenchmarkRow, _context?: { prevP50?: number; nextP50?: number }): string | null {
  const spread = (row.p90 - row.p10) / (row.p50 || 1);
  if (spread > 3) return "high_spread"; // p90-p10 > 3x p50
  if (spread < 0.05) return "low_spread"; // suspiciously tight
  return null;
}

/**
 * UAE pilot constraints:
 * - UAE locations must be in AED
 * - p50 should stay inside a practical pilot bound
 */
export function checkUaePilotConstraints(row: BenchmarkRow): string | null {
  const isUae = UAE_LOCATIONS.has(row.locationId.toLowerCase());
  if (!isUae) return null;
  if (row.currency !== "AED") return "uae_currency_must_be_aed";
  if (row.p50 < 3_000) return "uae_p50_below_pilot_floor";
  if (row.p50 > 500_000) return "uae_p50_above_pilot_ceiling";
  return null;
}

/**
 * Human-readable note used in UI/report exports for trust and auditability.
 */
export function buildBenchmarkExplainabilityNote(input: ExplainabilityInput): string {
  const freshness = input.lastUpdatedAt
    ? `Last refreshed ${new Date(input.lastUpdatedAt).toLocaleDateString("en-GB")}.`
    : "Freshness timestamp unavailable.";
  return `Source: ${input.sourceLabel}. Benchmark is computed using P${input.percentile} in ${input.currency}. ${freshness}`;
}

/**
 * Schema validation: required fields present
 */
export function checkRequiredFields(row: Record<string, unknown>): string | null {
  const required = ["roleId", "locationId", "levelId", "p10", "p25", "p50", "p75", "p90"];
  for (const f of required) {
    const v = row[f];
    if (v === undefined || v === null || v === "") return `missing_${f}`;
  }
  const p50 = Number(row.p50);
  if (!Number.isFinite(p50)) return "invalid_p50";
  return null;
}

/**
 * Run full DQ checks on a row and return first failure reason or null
 */
export function validateBenchmarkRow(row: BenchmarkRow): { ok: true } | { error: string } {
  const missing = checkRequiredFields(row as unknown as Record<string, unknown>);
  if (missing) return { error: missing };

  const order = checkPercentileOrdering(row);
  if (order) return { error: order };

  const sanity = checkCurrencySanity(row);
  if (sanity) return { error: sanity };

  const outlier = checkOutlier(row);
  if (outlier) return { error: outlier };

  const uaeConstraint = checkUaePilotConstraints(row);
  if (uaeConstraint) return { error: uaeConstraint };

  return { ok: true };
}

/**
 * Build a DQ report from validation results
 */
export function buildDQReport(
  results: Array<{ index: number; row: BenchmarkRow; error: string | null }>
): DQReport {
  const reasons: Record<string, number> = {};
  const sampleErrors: DQReport["sampleErrors"] = [];
  let passed = 0;
  let failed = 0;
  const skipped = 0;

  for (const { index, row, error } of results) {
    if (error === null) {
      passed++;
    } else {
      failed++;
      reasons[error] = (reasons[error] ?? 0) + 1;
      if (sampleErrors.length < MAX_SAMPLE_ERRORS) {
        sampleErrors.push({ row: index, reason: error, value: row.p50 });
      }
    }
  }

  return {
    totalRows: results.length,
    passed,
    failed,
    skipped,
    reasons,
    sampleErrors,
    timestamp: new Date().toISOString(),
  };
}
