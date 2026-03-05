/**
 * Versioned normalization layer for ingestion pipeline.
 * Reuses web/lib/upload/transformers and adds mapping confidence.
 * Schema version: v1
 */

import {
  matchRole,
  matchLocation,
  matchLevel,
  getCurrencyForLocation,
  parseNumber,
  normalize,
} from "@/lib/upload/transformers";
import { LOCATIONS } from "@/lib/dashboard/dummy-data";

export type MappingConfidence = "high" | "medium" | "low";

export type RoleMappingResult = {
  roleId: string;
  confidence: MappingConfidence;
  original: string;
};

export type LocationMappingResult = {
  locationId: string;
  confidence: MappingConfidence;
  original: string;
  currency: string;
};

export type LevelMappingResult = {
  levelId: string;
  confidence: MappingConfidence;
  original: string;
};

/**
 * Map raw role string to canonical role_id with confidence.
 */
export function mapRole(roleStr: string): RoleMappingResult | null {
  const original = (roleStr || "").trim();
  if (!original) return null;

  const roleId = matchRole(original);
  if (!roleId) return null;

  const normalized = normalize(original);
  const normalizedId = normalize(roleId);
  const exact = normalized === normalizedId || normalized.replace(/\s/g, "") === normalizedId;
  return {
    roleId,
    confidence: exact ? "high" : "medium",
    original,
  };
}

/**
 * Map raw location string to canonical location_id with confidence.
 */
export function mapLocation(locationStr: string): LocationMappingResult | null {
  const original = (locationStr || "").trim();
  if (!original) return null;

  const locationId = matchLocation(original);
  if (!locationId) return null;

  const currency = getCurrencyForLocation(locationId);
  const normalized = normalize(original);

  // Exact match on id
  const exact =
    normalized === normalize(locationId) ||
    LOCATIONS.some(
      (l) =>
        normalize(l.id) === normalized ||
        normalize(l.city) === normalized ||
        normalize(`${l.city}, ${l.country}`) === normalized
    );

  return {
    locationId,
    confidence: exact ? "high" : "medium",
    original,
    currency,
  };
}

/**
 * Map raw level string to canonical level_id with confidence.
 */
export function mapLevel(levelStr: string): LevelMappingResult | null {
  const original = (levelStr || "").trim();
  if (!original) return null;

  const levelId = matchLevel(original);
  if (!levelId) return null;

  const normalized = normalize(original);
  const exact = normalized === normalize(levelId);

  return {
    levelId,
    confidence: exact ? "high" : "medium",
    original,
  };
}

/**
 * Compute overall mapping confidence from field results.
 */
export function overallConfidence(
  results: Array<{ confidence: MappingConfidence }>
): MappingConfidence {
  const hasLow = results.some((r) => r.confidence === "low");
  const hasMedium = results.some((r) => r.confidence === "medium");
  if (hasLow) return "low";
  if (hasMedium) return "medium";
  return "high";
}

export type NormalizedBenchmarkRow = {
  roleId: string;
  locationId: string;
  levelId: string;
  currency: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sampleSize: number | null;
  mappingConfidence: MappingConfidence;
  originalRole?: string;
  originalLocation?: string;
  originalLevel?: string;
};

/**
 * Transform a raw benchmark row into a normalized record with confidence.
 */
export function normalizeBenchmarkRow(
  row: Record<string, unknown>
): { ok: NormalizedBenchmarkRow } | { error: string } {
  const roleResult = mapRole(String(row.role ?? row.role_id ?? row.job_title ?? ""));
  const locationResult = mapLocation(String(row.location ?? row.location_id ?? row.city ?? ""));
  const levelResult = mapLevel(String(row.level ?? row.level_id ?? row.seniority ?? ""));

  if (!roleResult) return { error: "Unmapped role" };
  if (!locationResult) return { error: "Unmapped location" };
  if (!levelResult) return { error: "Unmapped level" };

  const p10 = parseNumber(String(row.p10 ?? row.p10th ?? "")) ?? 0;
  const p25 = parseNumber(String(row.p25 ?? row.p25th ?? "")) ?? 0;
  const p50 = parseNumber(String(row.p50 ?? row.median ?? row.p50th ?? "")) ?? 0;
  const p75 = parseNumber(String(row.p75 ?? row.p75th ?? "")) ?? 0;
  const p90 = parseNumber(String(row.p90 ?? row.p90th ?? "")) ?? 0;

  const sampleSize = row.sample_size != null ? Number(row.sample_size) : null;

  const mappingConfidence = overallConfidence([
    roleResult,
    locationResult,
    levelResult,
  ]);

  return {
    ok: {
      roleId: roleResult.roleId,
      locationId: locationResult.locationId,
      levelId: levelResult.levelId,
      currency: (row.currency as string) || locationResult.currency,
      p10,
      p25,
      p50,
      p75,
      p90,
      sampleSize: Number.isFinite(sampleSize) ? sampleSize : null,
      mappingConfidence,
      originalRole: roleResult.original,
      originalLocation: locationResult.original,
      originalLevel: levelResult.original,
    },
  };
}
