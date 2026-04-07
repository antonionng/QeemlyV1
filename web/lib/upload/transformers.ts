// Data transformation utilities for normalizing uploaded data

import { LOCATIONS, LEVELS, ROLES } from "../dashboard/dummy-data";
import type { Location, Level, Role } from "../dashboard/dummy-data";

/**
 * Normalize a string for matching (lowercase, remove special chars)
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Split a full name into first and last name
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  
  // Assume last word is last name, rest is first name
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  
  return { firstName, lastName };
}

/**
 * Parse a number from a string, handling various formats
 */
export function parseNumber(value: string): number | null {
  if (!value || value.trim() === "") return null;
  
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[$€£¥₹,\s]/g, "").trim();
  const num = Number(cleaned);
  
  return Number.isFinite(num) ? num : null;
}

/**
 * Parse a date from various formats
 */
export function parseDate(value: string): string | null {
  if (!value || value.trim() === "") return null;
  
  const trimmed = value.trim();
  
  // Try ISO format first
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toISOString().split("T")[0];
  }
  
  // Try DD/MM/YYYY format
  const parts = trimmed.split(/[\/\-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    // Assume DD/MM/YYYY if first number <= 31
    if (a <= 31 && b <= 12 && c >= 1900) {
      const date = new Date(c, b - 1, a);
      return date.toISOString().split("T")[0];
    }
    // Try MM/DD/YYYY
    if (a <= 12 && b <= 31 && c >= 1900) {
      const date = new Date(c, a - 1, b);
      return date.toISOString().split("T")[0];
    }
  }
  
  return null;
}

// Build lookup maps for roles, locations, levels
const roleByNorm = new Map<string, Role>();
for (const r of ROLES) {
  roleByNorm.set(normalize(r.id), r);
  roleByNorm.set(normalize(r.title), r);
}

const locationByNorm = new Map<string, Location>();
for (const l of LOCATIONS) {
  locationByNorm.set(normalize(l.id), l);
  locationByNorm.set(normalize(l.city), l);
  locationByNorm.set(normalize(`${l.city}, ${l.country}`), l);
  locationByNorm.set(normalize(`${l.city} ${l.country}`), l);
  locationByNorm.set(normalize(l.country), l);
}

const levelByNorm = new Map<string, Level>();
for (const lv of LEVELS) {
  levelByNorm.set(normalize(lv.id), lv);
  levelByNorm.set(normalize(lv.name), lv);
}

// ILO ISIC sector codes -> canonical role_id (for ILOSTAT adapter)
const SECTOR_TO_ROLE: Record<string, string> = {
  J: "swe",
  K: "data-analyst",
  M: "pm",
  P: "ux-researcher",
};

// Economic activity names -> role_id (for Qatar/Bahrain government data)
const ACTIVITY_TO_ROLE: Record<string, string> = {
  ict: "swe",
  "information and communication": "swe",
  "information & communication": "swe",
  frontend: "swe-fe",
  "front end": "swe-fe",
  backend: "swe-be",
  "back end": "swe-be",
  mobile: "swe-mobile",
  "mobile applications": "swe-mobile",
  "machine learning": "swe-ml",
  "artificial intelligence": "swe-ml",
  "data engineering": "swe-data",
  "data platform": "swe-data",
  "technical program": "tpm",
  financial: "data-analyst",
  "financial and insurance": "data-analyst",
  "financial and insurance activities": "data-analyst",
  "real estate": "pm",
  "real estate activities": "pm",
  professional: "pm",
  "professional, scientific": "pm",
  "professional,scientific and technical activities": "pm",
  administrative: "data-analyst",
  "administrative and support": "data-analyst",
  construction: "swe-devops",
  "mining and quarrying": "data-scientist",
  manufacturing: "qa",
  education: "ux-researcher",
  "human health": "ux-researcher",
  "transportation and storage": "swe-devops",
};

// BLS SOC codes -> role_id (for US BLS data)
const SOC_TO_ROLE: Record<string, string> = {
  "15-1252": "swe",
  "15-2051": "data-scientist",
  "15-1211": "data-analyst",
  "11-3021": "pm",
  "27-1021": "designer",
  "15-1253": "qa",
  "15-1244": "swe-devops",
  "15-1212": "security",
  "19-3051": "ux-researcher",
};

// Profession keyword phrases -> role_id (for KAPSARC and similar survey data)
const PROFESSION_KEYWORDS: Array<{ keywords: string[]; roleId: string }> = [
  { keywords: ["frontend"], roleId: "swe-fe" },
  { keywords: ["front", "end"], roleId: "swe-fe" },
  { keywords: ["backend"], roleId: "swe-be" },
  { keywords: ["back", "end"], roleId: "swe-be" },
  { keywords: ["mobile"], roleId: "swe-mobile" },
  { keywords: ["ios"], roleId: "swe-mobile" },
  { keywords: ["android"], roleId: "swe-mobile" },
  { keywords: ["machine", "learning"], roleId: "swe-ml" },
  { keywords: ["ml"], roleId: "swe-ml" },
  { keywords: ["data", "engineer"], roleId: "swe-data" },
  { keywords: ["data", "platform"], roleId: "swe-data" },
  { keywords: ["technical", "program", "manager"], roleId: "tpm" },
  { keywords: ["tpm"], roleId: "tpm" },
  { keywords: ["scientific", "technical", "specialist"], roleId: "pm" },
  { keywords: ["scientific", "technical", "technician"], roleId: "swe" },
  { keywords: ["clerical"], roleId: "data-analyst" },
  { keywords: ["manager", "senior"], roleId: "pm" },
  { keywords: ["engineer", "computer"], roleId: "swe" },
  { keywords: ["programmer", "developer"], roleId: "swe" },
  { keywords: ["designer"], roleId: "designer" },
  { keywords: ["analyst", "data"], roleId: "data-analyst" },
  { keywords: ["software", "developer"], roleId: "swe" },
  { keywords: ["data", "scientist"], roleId: "data-scientist" },
  { keywords: ["product", "manager"], roleId: "pm" },
  { keywords: ["security"], roleId: "security" },
  { keywords: ["devops"], roleId: "swe-devops" },
  { keywords: ["quality", "assurance"], roleId: "qa" },
];

const ROLE_ALIASES: Record<string, string> = {
  "hr manager": "people-ops",
  "finance analyst": "financial-analyst",
  "marketing executive": "digital-marketing",
  "product owner": "pm",
  "content manager": "content-marketing",
  "operations analyst": "project-manager",
  "hr assistant": "hr-generalist",
  "business analyst": "product-analyst",
};

const ROLE_MATCH_THRESHOLD = 0.65;
const ROLE_STOP_WORDS = new Set([
  "and",
  "of",
  "the",
  "for",
  "to",
  "in",
  "a",
  "an",
  "with",
  "at",
  "on",
]);
const EXECUTIVE_ROLE_IDS = new Set([
  "ceo",
  "cfo",
  "cto",
  "cmo",
  "coo",
  "coo-exec",
]);
const EXECUTIVE_HINTS = ["chief", "officer", "executive", "ceo", "cfo", "cto", "cmo", "coo", "vp"];

function tokenizeRole(value: string): string[] {
  return normalize(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !ROLE_STOP_WORDS.has(token));
}

function keywordRoleFallback(normalized: string): { roleId: string; score: number } | null {
  if (normalized.includes("frontend") || normalized.includes("front end")) return { roleId: "swe-fe", score: 0.85 };
  if (normalized.includes("backend") || normalized.includes("back end")) return { roleId: "swe-be", score: 0.85 };
  if (normalized.includes("mobile") || normalized.includes("ios") || normalized.includes("android")) return { roleId: "swe-mobile", score: 0.85 };
  if (normalized.includes("machine learning") || normalized.includes(" ml ") || normalized.startsWith("ml ")) return { roleId: "swe-ml", score: 0.85 };
  if (normalized.includes("data engineer") || normalized.includes("data platform")) return { roleId: "swe-data", score: 0.8 };
  if (normalized.includes("technical program manager") || normalized.includes("tpm")) return { roleId: "tpm", score: 0.8 };
  if (normalized.includes("customer support")) return { roleId: "support-eng", score: 0.75 };
  if (normalized.includes("customer success")) return { roleId: "cs-manager", score: 0.78 };
  if (normalized.includes("marketing manager")) return { roleId: "marketing-manager", score: 0.8 };
  if (normalized.includes("digital marketing")) return { roleId: "digital-marketing", score: 0.82 };
  if (normalized.includes("technician") || normalized.includes("technical")) return { roleId: "swe", score: 0.68 };
  if (normalized.includes("information") || normalized.includes("ict") || normalized.includes("software")) return { roleId: "swe", score: 0.7 };
  if (normalized.includes("financial") || normalized.includes("insurance") || normalized.includes("bank")) return { roleId: "data-analyst", score: 0.7 };
  if (normalized.includes("professional") || normalized.includes("scientific")) return { roleId: "pm", score: 0.68 };
  return null;
}

function scoreRoleTokenOverlap(normalizedInput: string): { roleId: string; score: number } | null {
  const inputTokens = tokenizeRole(normalizedInput);
  if (inputTokens.length === 0) return null;

  let best: { roleId: string; score: number } | null = null;
  for (const role of ROLES) {
    const roleTokens = new Set([...tokenizeRole(role.id), ...tokenizeRole(role.title)]);
    if (roleTokens.size === 0) continue;
    const overlapCount = inputTokens.filter((token) => roleTokens.has(token)).length;
    if (overlapCount === 0) continue;
    const overlapRatio = overlapCount / Math.max(inputTokens.length, roleTokens.size);
    const coverageRatio = overlapCount / inputTokens.length;
    let score = overlapRatio * 0.55 + coverageRatio * 0.45;

    if (EXECUTIVE_ROLE_IDS.has(role.id)) {
      const hasExecutiveSignal = EXECUTIVE_HINTS.some((hint) => normalizedInput.includes(hint));
      if (!hasExecutiveSignal) {
        score -= 0.25;
      }
    }

    if (!best || score > best.score) {
      best = { roleId: role.id, score };
    }
  }

  return best;
}

export type RoleMatchConfidence = "high" | "medium" | "low";
export type RoleMatchWithConfidence = {
  roleId: string | null;
  confidence: RoleMatchConfidence;
  score: number;
};

export function matchRoleWithConfidence(roleStr: string): RoleMatchWithConfidence {
  const trimmed = roleStr.trim();
  if (!trimmed || trimmed === "__macro_indicator__" || trimmed === "__macro__") {
    return { roleId: null, confidence: "low", score: 0 };
  }

  const normalized = normalize(trimmed);
  if (normalized === "marketing") {
    return { roleId: null, confidence: "low", score: 0.5 };
  }

  const aliasedRole = ROLE_ALIASES[normalized];
  if (aliasedRole) {
    return { roleId: aliasedRole, confidence: "high", score: 1 };
  }

  const exactRole = roleByNorm.get(normalized);
  if (exactRole) {
    return { roleId: exactRole.id, confidence: "high", score: 1 };
  }

  if (trimmed.length === 1) {
    const sectorId = SECTOR_TO_ROLE[trimmed.toUpperCase()];
    if (sectorId) {
      return { roleId: sectorId, confidence: "high", score: 0.95 };
    }
  }

  const socMatch = trimmed.match(/^\d{2}-\d{4}$/);
  if (socMatch) {
    const socRole = SOC_TO_ROLE[trimmed];
    if (socRole) {
      return { roleId: socRole, confidence: "high", score: 0.95 };
    }
  }

  const activityRole = ACTIVITY_TO_ROLE[normalized];
  if (activityRole) {
    return { roleId: activityRole, confidence: "medium", score: 0.8 };
  }

  for (const [key, roleId] of Object.entries(ACTIVITY_TO_ROLE)) {
    if (key.length >= 4 && normalized.includes(key)) {
      return { roleId, confidence: "medium", score: 0.72 };
    }
  }

  for (const { keywords, roleId } of PROFESSION_KEYWORDS) {
    if (keywords.every((k) => normalized.includes(k))) {
      return { roleId, confidence: "medium", score: 0.75 };
    }
  }

  const keywordFallback = keywordRoleFallback(normalized);
  if (keywordFallback) {
    const confidence: RoleMatchConfidence =
      keywordFallback.score >= 0.85 ? "high" : keywordFallback.score >= ROLE_MATCH_THRESHOLD ? "medium" : "low";
    return {
      roleId: keywordFallback.score >= ROLE_MATCH_THRESHOLD ? keywordFallback.roleId : null,
      confidence,
      score: keywordFallback.score,
    };
  }

  const overlapCandidate = scoreRoleTokenOverlap(normalized);
  if (!overlapCandidate || overlapCandidate.score < ROLE_MATCH_THRESHOLD) {
    return { roleId: null, confidence: "low", score: overlapCandidate?.score ?? 0 };
  }

  return {
    roleId: overlapCandidate.roleId,
    confidence: overlapCandidate.score >= 0.85 ? "high" : "medium",
    score: overlapCandidate.score,
  };
}

/**
 * Match a role string to a known role ID
 * Supports: direct role names, ILO sector codes, BLS SOC codes, 
 * economic activity names (Qatar/Bahrain), and profession keywords
 */
export function matchRole(roleStr: string): string | null {
  return matchRoleWithConfidence(roleStr).roleId;
}

/**
 * Match a location string to a known location ID
 * Also handles special locations like "USA (National)" from BLS data
 */
export function matchLocation(locationStr: string): string | null {
  const normalized = normalize(locationStr);
  const location = locationByNorm.get(normalized);
  if (location) return location.id;
  
  // Handle special locations for international benchmarks
  if (normalized.includes("usa") || normalized.includes("united states") || normalized.includes("national")) {
    return "usa-national";
  }
  
  // Try partial matching
  for (const [key, value] of locationByNorm) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value.id;
    }
  }
  
  return null;
}

/**
 * Match a level string to a known level ID
 */
export function matchLevel(levelStr: string): string | null {
  const normalized = normalize(levelStr);
  const level = levelByNorm.get(normalized);
  if (level) return level.id;

  if (normalized === "executive") {
    return "vp";
  }

  const keywordLevels: Array<[string, string]> = [
    ["vice president", "vp"],
    ["senior director", "d2"],
    ["director", "d1"],
    ["senior manager", "m2"],
    ["manager", "m1"],
    ["junior", "ic1"],
    ["entry", "ic1"],
    ["mid", "ic2"],
    ["intermediate", "ic2"],
    ["staff", "ic4"],
    ["lead", "ic4"],
    ["principal", "ic5"],
    ["senior", "ic3"],
  ];
  for (const [keyword, levelId] of keywordLevels) {
    if (normalized.includes(keyword)) return levelId;
  }
  
  // Try to extract level codes like IC3, M2, etc.
  const match = normalized.match(/\b(ic[1-5]|m[1-2]|d[1-2]|vp)\b/);
  if (match?.[1]) {
    const matchedLevel = levelByNorm.get(match[1]);
    if (matchedLevel) return matchedLevel.id;
    return match[1];
  }
  
  return null;
}

/**
 * Normalize department name to standard values
 */
export function normalizeDepartment(dept: string): string {
  const normalized = normalize(dept);
  
  const departmentMap: Record<string, string> = {
    "engineering": "Engineering",
    "eng": "Engineering",
    "tech": "Engineering",
    "technology": "Engineering",
    "software": "Engineering",
    "product": "Product",
    "pm": "Product",
    "product management": "Product",
    "design": "Design",
    "ux": "Design",
    "ui": "Design",
    "user experience": "Design",
    "data": "Data",
    "analytics": "Data",
    "data science": "Data",
    "bi": "Data",
    "sales": "Sales",
    "revenue": "Sales",
    "marketing": "Marketing",
    "growth": "Marketing",
    "operations": "Operations",
    "ops": "Operations",
    "executive": "Executive",
    "leadership": "Executive",
    "finance": "Finance",
    "accounting": "Finance",
    "fp a": "Finance",
    "hr": "HR",
    "human resources": "HR",
    "people": "HR",
    "people ops": "HR",
  };
  
  // Check for exact match first
  if (departmentMap[normalized]) {
    return departmentMap[normalized];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(departmentMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  // Return original with proper casing
  return dept.trim().charAt(0).toUpperCase() + dept.trim().slice(1).toLowerCase();
}

/**
 * Normalize status value
 */
export function normalizeStatus(status: string): "active" | "inactive" {
  const normalized = normalize(status);
  if (["inactive", "terminated", "left", "resigned", "off"].includes(normalized)) {
    return "inactive";
  }
  return "active";
}

/**
 * Normalize employment type
 */
export function normalizeEmploymentType(type: string): "national" | "expat" {
  const normalized = normalize(type);
  if (["expat", "expatriate", "international", "foreign"].includes(normalized)) {
    return "expat";
  }
  return "national";
}

/**
 * Normalize performance rating
 */
export function normalizePerformanceRating(
  rating: string
): "low" | "meets" | "exceeds" | "exceptional" | null {
  const normalized = normalize(rating);
  
  const ratingMap: Record<string, "low" | "meets" | "exceeds" | "exceptional"> = {
    "low": "low",
    "below": "low",
    "underperforming": "low",
    "needs improvement": "low",
    "1": "low",
    "meets": "meets",
    "meets expectations": "meets",
    "satisfactory": "meets",
    "good": "meets",
    "2": "meets",
    "3": "meets",
    "exceeds": "exceeds",
    "exceeds expectations": "exceeds",
    "very good": "exceeds",
    "excellent": "exceeds",
    "4": "exceeds",
    "exceptional": "exceptional",
    "outstanding": "exceptional",
    "top performer": "exceptional",
    "5": "exceptional",
  };
  
  return ratingMap[normalized] || null;
}

/**
 * Get currency for a location
 */
export function getCurrencyForLocation(locationId: string): string {
  const location = LOCATIONS.find((l) => l.id === locationId);
  return location?.currency || "USD";
}

const DEFAULT_UNIT_VALUE = 100;

function toComparableEquityValue(params: {
  equityValue: number | null;
  equityUnits: number | null;
  equityPercent: number | null;
  totalSalary: number;
}): number | null {
  if (params.equityValue !== null) return params.equityValue;
  if (params.equityUnits !== null) return params.equityUnits * DEFAULT_UNIT_VALUE;
  if (params.equityPercent !== null) return params.totalSalary * (params.equityPercent / 100);
  return null;
}

export type TransformedEmployee = {
  firstName: string;
  lastName: string;
  email: string | null;
  department: string;
  roleId: string | null;
  canonicalRoleId: string | null;
  roleMappingConfidence: "high" | "medium" | "low";
  roleMappingSource: "upload";
  roleMappingStatus: "mapped" | "pending" | "needs_review";
  originalRoleText: string | null;
  levelId: string | null;
  originalLevelText: string | null;
  locationId: string;
  totalSalary?: number;
  baseSalary: number;
  transportAllowance?: number | null;
  accommodationAllowance?: number | null;
  bonus: number | null;
  equity: number | null;
  equityUnits?: number | null;
  equityPercent?: number | null;
  equityComparableValue?: number | null;
  currency: string;
  status: "active" | "inactive";
  employmentType: "national" | "expat";
  hireDate: string | null;
  performanceRating: "low" | "meets" | "exceeds" | "exceptional" | null;
  avatarUrl: string | null;
  visaType: string | null;
  visaStatus: "active" | "expiring" | "expired" | "pending" | "cancelled" | null;
  visaIssueDate: string | null;
  visaExpiryDate: string | null;
  visaSponsor: string | null;
  visaPermitId: string | null;
};

/**
 * Transform a row of validated data into an employee record
 */
export function transformEmployee(data: Record<string, unknown>): TransformedEmployee | null {
  // Handle full name splitting if needed
  let firstName = data.firstName as string | undefined;
  let lastName = data.lastName as string | undefined;
  
  if ((!firstName || !lastName) && data.fullName) {
    const split = splitFullName(data.fullName as string);
    firstName = firstName || split.firstName;
    lastName = lastName || split.lastName;
  }
  
  if (!firstName) return null;
  
  const locationId = matchLocation(data.location as string || "");
  if (!locationId) return null;
  
  const totalSalary = parseNumber(String(data.totalSalary || ""));
  const baseSalaryInput = parseNumber(String(data.baseSalary || ""));
  const transportAllowance = parseNumber(String(data.transportAllowance || ""));
  const accommodationAllowance = parseNumber(String(data.accommodationAllowance || ""));

  let baseSalary = baseSalaryInput;
  let normalizedTotalSalary = totalSalary;

  if (normalizedTotalSalary === null && baseSalaryInput !== null) {
    const derivedTotal =
      baseSalaryInput + (transportAllowance ?? 0) + (accommodationAllowance ?? 0);
    normalizedTotalSalary = derivedTotal;
  }

  if (baseSalary === null && normalizedTotalSalary !== null) {
    // Temporary default until company-level split setup is enforced server-side.
    baseSalary = normalizedTotalSalary;
  }

  if (baseSalary === null || normalizedTotalSalary === null) return null;
  
  const originalRoleText = (data.role as string | undefined)?.trim() || null;
  const originalLevelText = (data.level as string | undefined)?.trim() || null;
  const roleMatch = matchRoleWithConfidence(data.role as string || "");
  const roleId = roleMatch.roleId;
  const levelId = matchLevel(data.level as string || "");
  const roleMappingStatus =
    roleId && levelId
      ? "mapped"
      : originalRoleText
        ? "needs_review"
        : "pending";
  const equityValue =
    parseNumber(String(data.equityValue || "")) ??
    parseNumber(String(data.equity || ""));
  const equityUnits = parseNumber(String(data.equityUnits || ""));
  const equityPercent = parseNumber(String(data.equityPercent || ""));
  const equityComparableValue = toComparableEquityValue({
    equityValue,
    equityUnits,
    equityPercent,
    totalSalary: normalizedTotalSalary,
  });

  return {
    firstName,
    lastName: lastName || "",
    email: (data.email as string)?.toLowerCase() || null,
    department: normalizeDepartment(data.department as string || ""),
    roleId,
    canonicalRoleId: roleId,
    roleMappingConfidence:
      roleMappingStatus === "mapped"
        ? roleMatch.confidence
        : roleId || levelId
          ? "medium"
          : "low",
    roleMappingSource: "upload",
    roleMappingStatus,
    originalRoleText,
    levelId,
    originalLevelText,
    locationId,
    totalSalary: normalizedTotalSalary,
    baseSalary,
    transportAllowance,
    accommodationAllowance,
    bonus: parseNumber(String(data.bonus || "")),
    equity: equityComparableValue,
    equityUnits,
    equityPercent,
    equityComparableValue,
    currency: (data.currency as string) || getCurrencyForLocation(locationId),
    status: normalizeStatus(data.status as string || "active"),
    employmentType: normalizeEmploymentType(data.employmentType as string || "national"),
    hireDate: parseDate(data.hireDate as string || ""),
    performanceRating: normalizePerformanceRating(data.performanceRating as string || ""),
    avatarUrl: (data.avatarUrl as string)?.trim() || null,
    visaType: (data.visaType as string)?.trim() || null,
    visaStatus:
      (data.visaStatus as "active" | "expiring" | "expired" | "pending" | "cancelled" | undefined) || null,
    visaIssueDate: parseDate(data.visaIssueDate as string || ""),
    visaExpiryDate: parseDate(data.visaExpiryDate as string || ""),
    visaSponsor: (data.visaSponsor as string)?.trim() || null,
    visaPermitId: (data.visaPermitId as string)?.trim() || null,
  };
}

export type TransformedBenchmark = {
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
};

/**
 * Transform a row of validated data into a benchmark record
 */
export function transformBenchmark(data: Record<string, unknown>): TransformedBenchmark | null {
  const roleId = matchRole(data.role as string || "");
  const locationId = matchLocation(data.location as string || "");
  const levelId = matchLevel(data.level as string || "");
  
  if (!roleId || !locationId || !levelId) return null;
  
  const p10 = data.p10 as number | undefined;
  const p25 = data.p25 as number | undefined;
  const p50 = data.p50 as number | undefined;
  const p75 = data.p75 as number | undefined;
  const p90 = data.p90 as number | undefined;
  
  if (p10 === undefined || p25 === undefined || p50 === undefined || 
      p75 === undefined || p90 === undefined) {
    return null;
  }
  
  return {
    roleId,
    locationId,
    levelId,
    currency: (data.currency as string) || getCurrencyForLocation(locationId),
    p10,
    p25,
    p50,
    p75,
    p90,
    sampleSize: data.sampleSize as number | null,
  };
}

export type TransformedCompensationUpdate = {
  email: string;
  baseSalary: number;
  bonus: number | null;
  equity: number | null;
  effectiveDate: string | null;
  changeReason: string | null;
};

export function transformCompensationUpdate(
  data: Record<string, unknown>,
): TransformedCompensationUpdate | null {
  const email = (data.email as string | undefined)?.toLowerCase().trim();
  const baseSalary = parseNumber(String(data.baseSalary || ""));

  if (!email || baseSalary === null) {
    return null;
  }

  return {
    email,
    baseSalary,
    bonus: parseNumber(String(data.bonus || "")),
    equity: parseNumber(String(data.equity || "")),
    effectiveDate: parseDate(String(data.effectiveDate || "")),
    changeReason: (data.changeReason as string | undefined)?.trim() || null,
  };
}
