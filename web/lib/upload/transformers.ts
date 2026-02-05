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

/**
 * Match a role string to a known role ID
 */
export function matchRole(roleStr: string): string | null {
  const normalized = normalize(roleStr);
  const role = roleByNorm.get(normalized);
  if (role) return role.id;
  
  // Try partial matching
  for (const [key, value] of roleByNorm) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value.id;
    }
  }
  
  // Return the original string if no match (for custom roles)
  return roleStr.trim() || null;
}

/**
 * Match a location string to a known location ID
 */
export function matchLocation(locationStr: string): string | null {
  const normalized = normalize(locationStr);
  const location = locationByNorm.get(normalized);
  if (location) return location.id;
  
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
export function normalizeEmploymentType(type: string): "local" | "expat" {
  const normalized = normalize(type);
  if (["expat", "expatriate", "international", "foreign"].includes(normalized)) {
    return "expat";
  }
  return "local";
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

export type TransformedEmployee = {
  firstName: string;
  lastName: string;
  email: string | null;
  department: string;
  roleId: string;
  levelId: string;
  locationId: string;
  baseSalary: number;
  bonus: number | null;
  equity: number | null;
  currency: string;
  status: "active" | "inactive";
  employmentType: "local" | "expat";
  hireDate: string | null;
  performanceRating: "low" | "meets" | "exceeds" | "exceptional" | null;
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
  
  const baseSalary = parseNumber(String(data.baseSalary || ""));
  if (baseSalary === null) return null;
  
  return {
    firstName,
    lastName: lastName || "",
    email: (data.email as string)?.toLowerCase() || null,
    department: normalizeDepartment(data.department as string || ""),
    roleId: matchRole(data.role as string || "") || "swe",
    levelId: matchLevel(data.level as string || "") || "ic3",
    locationId,
    baseSalary,
    bonus: parseNumber(String(data.bonus || "")),
    equity: parseNumber(String(data.equity || "")),
    currency: (data.currency as string) || getCurrencyForLocation(locationId),
    status: normalizeStatus(data.status as string || "active"),
    employmentType: normalizeEmploymentType(data.employmentType as string || "local"),
    hireDate: parseDate(data.hireDate as string || ""),
    performanceRating: normalizePerformanceRating(data.performanceRating as string || ""),
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
