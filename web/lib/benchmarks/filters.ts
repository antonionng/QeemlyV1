export type BenchmarkConfidence = "High" | "Medium" | "Low";

export type BenchmarkFilters = {
  roleIds: string[];
  roleFamilies: string[];
  locationIds: string[];
  levelIds: string[];
  industries: string[];
  companySizes: string[];
  experienceBands: string[];
  compTypes: string[];
  confidences: BenchmarkConfidence[];
  minSampleSize: number | null;
  timeRangeDays: number | null;
};

export const DEFAULT_BENCHMARK_FILTERS: BenchmarkFilters = {
  roleIds: [],
  roleFamilies: [],
  locationIds: [],
  levelIds: [],
  industries: [],
  companySizes: [],
  experienceBands: [],
  compTypes: [],
  confidences: [],
  minSampleSize: null,
  timeRangeDays: null,
};

export type BenchmarkRecord = {
  roleId: string;
  roleFamily?: string;
  locationId: string;
  levelId: string;
  currency: string;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  sampleSize?: number;
  confidence: BenchmarkConfidence;
  lastUpdated?: string;
  momChange?: number;
  yoyChange?: number;
  trend?: Array<{ month: string; date: string; p25: number; p50: number; p75: number }>;
  industry?: string;
  companySize?: string;
  experienceBand?: string;
  compTypes?: string[];
  source: "dummy" | "uploaded";
};

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseNumber(value: string | null) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseFiltersFromSearchParams(params: URLSearchParams): BenchmarkFilters {
  const confidences = parseList(params.get("conf")) as BenchmarkConfidence[];
  return {
    roleIds: parseList(params.get("role")),
    roleFamilies: parseList(params.get("family")),
    locationIds: parseList(params.get("location")),
    levelIds: parseList(params.get("level")),
    industries: parseList(params.get("industry")),
    companySizes: parseList(params.get("company")),
    experienceBands: parseList(params.get("exp")),
    compTypes: parseList(params.get("comp")),
    confidences,
    minSampleSize: parseNumber(params.get("minSample")),
    timeRangeDays: parseNumber(params.get("days")),
  };
}

function setListParam(params: URLSearchParams, key: string, values: string[]) {
  if (!values.length) {
    params.delete(key);
    return;
  }
  params.set(key, values.join(","));
}

export function serializeFiltersToSearchParams(filters: BenchmarkFilters): URLSearchParams {
  const params = new URLSearchParams();
  setListParam(params, "role", filters.roleIds);
  setListParam(params, "family", filters.roleFamilies);
  setListParam(params, "location", filters.locationIds);
  setListParam(params, "level", filters.levelIds);
  setListParam(params, "industry", filters.industries);
  setListParam(params, "company", filters.companySizes);
  setListParam(params, "exp", filters.experienceBands);
  setListParam(params, "comp", filters.compTypes);
  setListParam(params, "conf", filters.confidences);
  if (filters.minSampleSize != null) params.set("minSample", String(filters.minSampleSize));
  if (filters.timeRangeDays != null) params.set("days", String(filters.timeRangeDays));
  return params;
}

export function countActiveFilters(filters: BenchmarkFilters) {
  return (
    filters.roleIds.length +
    filters.roleFamilies.length +
    filters.locationIds.length +
    filters.levelIds.length +
    filters.industries.length +
    filters.companySizes.length +
    filters.experienceBands.length +
    filters.compTypes.length +
    filters.confidences.length +
    (filters.minSampleSize != null ? 1 : 0) +
    (filters.timeRangeDays != null ? 1 : 0)
  );
}

function matchesList(target: string | undefined, selected: string[]) {
  if (!selected.length) return true;
  if (!target) return false;
  return selected.includes(target);
}

function matchesAny(targets: string[] | undefined, selected: string[]) {
  if (!selected.length) return true;
  if (!targets || !targets.length) return false;
  return targets.some((t) => selected.includes(t));
}

function matchesDateRange(isoDate: string | undefined, days: number | null) {
  if (!days) return true;
  if (!isoDate) return false;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  const diffMs = Date.now() - date.getTime();
  return diffMs <= days * 24 * 60 * 60 * 1000;
}

export function matchesFilters(record: BenchmarkRecord, filters: BenchmarkFilters) {
  const sampleSize = record.sampleSize ?? 0;
  if (!matchesList(record.roleId, filters.roleIds)) return false;
  if (!matchesList(record.roleFamily ?? "unknown", filters.roleFamilies)) return false;
  if (!matchesList(record.locationId, filters.locationIds)) return false;
  if (!matchesList(record.levelId, filters.levelIds)) return false;
  if (!matchesList(record.industry ?? "unknown", filters.industries)) return false;
  if (!matchesList(record.companySize ?? "unknown", filters.companySizes)) return false;
  if (!matchesList(record.experienceBand ?? "unknown", filters.experienceBands)) return false;
  if (!matchesAny(record.compTypes, filters.compTypes)) return false;
  if (!matchesList(record.confidence, filters.confidences)) return false;
  if (filters.minSampleSize != null && sampleSize < filters.minSampleSize) return false;
  if (!matchesDateRange(record.lastUpdated, filters.timeRangeDays)) return false;
  return true;
}

export function applyFilters(records: BenchmarkRecord[], filters: BenchmarkFilters) {
  return records.filter((record) => matchesFilters(record, filters));
}

export function toggleFilterValue<T extends string>(values: T[], value: T): T[] {
  if (values.includes(value)) {
    return values.filter((v) => v !== value);
  }
  return [...values, value];
}
