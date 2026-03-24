import { normalizeBenchmarkRow } from "@/lib/ingestion/normalizer";
import type { MappingConfidence } from "@/lib/ingestion/normalizer";
import type { BenchmarkPayPeriod } from "@/lib/benchmarks/pay-period";
import {
  extractRobertWaltersBenchmarkRows,
  toRobertWaltersNormalizationRow,
  type RobertWaltersBenchmarkRow,
} from "./robert-walters";

export const ROBERT_WALTERS_SOURCE_SLUG = "robert-walters-pdf";
export const ROBERT_WALTERS_SOURCE_FAMILY = "robert_walters";

export type AdminResearchPdfReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "ingested";

export type AdminResearchPdfRow = {
  id: string;
  upload_id: string;
  row_index: number;
  source_family: string;
  raw_text: string;
  role_title: string;
  function_name: string | null;
  employment_type: string | null;
  pay_period: BenchmarkPayPeriod;
  currency: string;
  location_hint: string;
  level_hint: string;
  salary_2025_min: number;
  salary_2025_max: number;
  salary_2026_min: number;
  salary_2026_max: number;
  parse_confidence: MappingConfidence;
  review_status: AdminResearchPdfReviewStatus;
  review_notes: string | null;
};

export function extractRobertWaltersReviewRows(text: string, uploadId: string) {
  return extractRobertWaltersBenchmarkRows(text).map((row) => buildReviewInsertRow(uploadId, row));
}

export function buildReviewInsertRow(uploadId: string, row: RobertWaltersBenchmarkRow) {
  return {
    upload_id: uploadId,
    row_index: row.rowIndex,
    source_family: ROBERT_WALTERS_SOURCE_FAMILY,
    raw_text: row.rawText,
    role_title: row.roleTitle,
    function_name: row.functionName,
    employment_type: row.employmentType,
    pay_period: row.payPeriod,
    currency: row.currency,
    location_hint: row.locationHint,
    level_hint: row.levelHint,
    salary_2025_min: row.salaryRange2025.min,
    salary_2025_max: row.salaryRange2025.max,
    salary_2026_min: row.salaryRange2026.min,
    salary_2026_max: row.salaryRange2026.max,
    parse_confidence: row.parseConfidence,
    review_status: "pending" as const,
    review_notes: null,
  };
}

export function toApprovedBenchmarkInput(row: Pick<
  AdminResearchPdfRow,
  | "role_title"
  | "location_hint"
  | "level_hint"
  | "currency"
  | "pay_period"
  | "salary_2026_min"
  | "salary_2026_max"
  | "function_name"
>) {
  const draft = toRobertWaltersNormalizationRow({
    rowIndex: 0,
    rawText: "",
    roleTitle: row.role_title,
    functionName: row.function_name,
    employmentType: null,
    payPeriod: row.pay_period,
    currency: row.currency,
    locationHint: row.location_hint,
    levelHint: row.level_hint,
    salaryRange2025: { min: row.salary_2026_min, max: row.salary_2026_max },
    salaryRange2026: { min: row.salary_2026_min, max: row.salary_2026_max },
    parseConfidence: "medium",
  });

  return {
    ...draft,
    sector: undefined,
  };
}

export function buildManualAdminBenchmarkPayload(
  row: Pick<
    AdminResearchPdfRow,
    | "id"
    | "role_title"
    | "location_hint"
    | "level_hint"
    | "currency"
    | "pay_period"
    | "salary_2026_min"
    | "salary_2026_max"
    | "function_name"
    | "parse_confidence"
  >,
  workspaceId: string,
) {
  const normalized = normalizeBenchmarkRow(toApprovedBenchmarkInput(row));
  if ("error" in normalized) {
    return { error: `${row.id}: ${normalized.error}` } as const;
  }

  const validFrom = new Date().toISOString().split("T")[0];

  return {
    ok: {
      workspace_id: workspaceId,
      role_id: normalized.ok.roleId,
      location_id: normalized.ok.locationId,
      level_id: normalized.ok.levelId,
      industry: normalized.ok.industry || null,
      company_size: normalized.ok.companySize || null,
      currency: normalized.ok.currency,
      p10: normalized.ok.p10,
      p25: normalized.ok.p25,
      p50: normalized.ok.p50,
      p75: normalized.ok.p75,
      p90: normalized.ok.p90,
      sample_size: normalized.ok.sampleSize,
      source: "market",
      pay_period: normalized.ok.payPeriod ?? row.pay_period,
      market_source_slug: ROBERT_WALTERS_SOURCE_SLUG,
      market_source_tier: "proxy",
      market_origin: "manual_admin",
      confidence: normalized.ok.mappingConfidence,
      valid_from: validFrom,
      valid_to: null,
    },
  } as const;
}
