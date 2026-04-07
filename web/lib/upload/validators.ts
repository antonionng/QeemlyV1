// Validation rules for uploaded data

import type { ColumnMapping, UploadDataType, FieldDefinition } from "./column-detection";
import { getFieldsForType } from "./column-detection";
import {
  matchLevel,
  matchLocation,
  matchRole,
  normalizeDepartment,
  normalizeEmploymentType,
  normalizePerformanceRating,
  normalizeStatus,
} from "./transformers";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  row: number;
  column: string;
  field: string;
  value: string;
  message: string;
  severity: ValidationSeverity;
};

export type RowValidationResult = {
  rowIndex: number;
  isValid: boolean;
  hasWarnings: boolean;
  issues: ValidationIssue[];
  data: Record<string, unknown>;
};

export type ValidationResult = {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  issues: ValidationIssue[];
  rows: RowValidationResult[];
  meta?: {
    duplicateRows: number;
    currencies: string[];
  };
};

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Date patterns to try parsing
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
  /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
  /^\d{1,2}\s+\w+\s+\d{4}$/, // D Month YYYY
];

/**
 * Parse a number from a string, handling commas and currency symbols
 */
function parseNumber(value: string): number | null {
  if (!value || value.trim() === "") return null;
  
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[$€£¥₹,\s]/g, "").trim();
  const num = Number(cleaned);
  
  return Number.isFinite(num) ? num : null;
}

/**
 * Parse a date from various formats
 */
function parseDate(value: string): Date | null {
  if (!value || value.trim() === "") return null;
  
  const trimmed = value.trim();
  
  // Try ISO format first
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try DD/MM/YYYY format
  const parts = trimmed.split(/[\/\-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    // Assume DD/MM/YYYY if first number <= 31
    if (a <= 31 && b <= 12 && c >= 1900) {
      return new Date(c, b - 1, a);
    }
    // Try MM/DD/YYYY
    if (a <= 12 && b <= 31 && c >= 1900) {
      return new Date(c, a - 1, b);
    }
  }
  
  return null;
}

/**
 * Validate a single field value
 */
function validateField(
  value: string,
  field: FieldDefinition,
  rowIndex: number,
  sourceColumn: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const trimmedValue = value.trim();

  // Required field check
  if (field.required && !trimmedValue) {
    issues.push({
      row: rowIndex,
      column: sourceColumn,
      field: field.key,
      value: trimmedValue,
      message: `${field.label} is required`,
      severity: "error",
    });
    return issues;
  }

  // Skip further validation if empty and not required
  if (!trimmedValue) return issues;

  // Type-specific validation
  switch (field.type) {
    case "email":
      if (!EMAIL_REGEX.test(trimmedValue)) {
        issues.push({
          row: rowIndex,
          column: sourceColumn,
          field: field.key,
          value: trimmedValue,
          message: "Invalid email format",
          severity: "warning",
        });
      }
      break;

    case "number":
      const num = parseNumber(trimmedValue);
      if (num === null) {
        issues.push({
          row: rowIndex,
          column: sourceColumn,
          field: field.key,
          value: trimmedValue,
          message: "Invalid number format",
          severity: "error",
        });
      } else if (num < 0 && (field.key.includes("salary") || field.key.includes("Salary"))) {
        issues.push({
          row: rowIndex,
          column: sourceColumn,
          field: field.key,
          value: trimmedValue,
          message: "Salary cannot be negative",
          severity: "error",
        });
      }
      break;

    case "date":
      const date = parseDate(trimmedValue);
      if (date === null) {
        issues.push({
          row: rowIndex,
          column: sourceColumn,
          field: field.key,
          value: trimmedValue,
          message: "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY",
          severity: "warning",
        });
      }
      break;

    case "enum":
      if (field.enumValues) {
        const normalizedValue = trimmedValue.toLowerCase();
        const validValues = field.enumValues.map((v) => v.toLowerCase());
        if (!validValues.includes(normalizedValue)) {
          issues.push({
            row: rowIndex,
            column: sourceColumn,
            field: field.key,
            value: trimmedValue,
            message: `Invalid value. Expected one of: ${field.enumValues.join(", ")}`,
            severity: "warning",
          });
        }
      }
      break;
  }

  return issues;
}

/**
 * Validate benchmark-specific rules (percentile ordering)
 */
function validateBenchmarkRow(
  data: Record<string, unknown>,
  rowIndex: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const roleValue = typeof data.role === "string" ? data.role.trim() : "";
  if (roleValue && !matchRole(roleValue)) {
    issues.push({
      row: rowIndex,
      column: "role",
      field: "role",
      value: roleValue,
      message: "Role could not be mapped to a supported Qeemly benchmark role",
      severity: "error",
    });
  }

  const locationValue = typeof data.location === "string" ? data.location.trim() : "";
  if (locationValue && !matchLocation(locationValue)) {
    issues.push({
      row: rowIndex,
      column: "location",
      field: "location",
      value: locationValue,
      message: "Location could not be mapped to a supported Qeemly benchmark market",
      severity: "error",
    });
  }

  const levelValue = typeof data.level === "string" ? data.level.trim() : "";
  if (levelValue && !matchLevel(levelValue)) {
    issues.push({
      row: rowIndex,
      column: "level",
      field: "level",
      value: levelValue,
      message: "Level could not be mapped to a supported Qeemly benchmark level",
      severity: "error",
    });
  }
  
  const p10 = data.p10 as number | undefined;
  const p25 = data.p25 as number | undefined;
  const p50 = data.p50 as number | undefined;
  const p75 = data.p75 as number | undefined;
  const p90 = data.p90 as number | undefined;

  if (p10 !== undefined && p25 !== undefined && p10 > p25) {
    issues.push({
      row: rowIndex,
      column: "p10/p25",
      field: "percentiles",
      value: `p10=${p10}, p25=${p25}`,
      message: "P10 should be less than or equal to P25",
      severity: "error",
    });
  }

  if (p25 !== undefined && p50 !== undefined && p25 > p50) {
    issues.push({
      row: rowIndex,
      column: "p25/p50",
      field: "percentiles",
      value: `p25=${p25}, p50=${p50}`,
      message: "P25 should be less than or equal to P50",
      severity: "error",
    });
  }

  if (p50 !== undefined && p75 !== undefined && p50 > p75) {
    issues.push({
      row: rowIndex,
      column: "p50/p75",
      field: "percentiles",
      value: `p50=${p50}, p75=${p75}`,
      message: "P50 should be less than or equal to P75",
      severity: "error",
    });
  }

  if (p75 !== undefined && p90 !== undefined && p75 > p90) {
    issues.push({
      row: rowIndex,
      column: "p75/p90",
      field: "percentiles",
      value: `p75=${p75}, p90=${p90}`,
      message: "P75 should be less than or equal to P90",
      severity: "error",
    });
  }

  return issues;
}

function validateEmployeeRow(
  data: Record<string, unknown>,
  rowIndex: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const roleValue = typeof data.role === "string" ? data.role.trim() : "";
  if (roleValue && !matchRole(roleValue)) {
    issues.push({
      row: rowIndex,
      column: "role",
      field: "role",
      value: roleValue,
      message: "Role could not be confidently mapped and needs review",
      severity: "error",
    });
  }

  const levelValue = typeof data.level === "string" ? data.level.trim() : "";
  if (levelValue && !matchLevel(levelValue)) {
    issues.push({
      row: rowIndex,
      column: "level",
      field: "level",
      value: levelValue,
      message: "Level could not be mapped to a supported Qeemly level",
      severity: "error",
    });
  }

  const locationValue = typeof data.location === "string" ? data.location.trim() : "";
  if (locationValue && !matchLocation(locationValue)) {
    issues.push({
      row: rowIndex,
      column: "location",
      field: "location",
      value: locationValue,
      message: "Location could not be mapped to a supported Qeemly location",
      severity: "error",
    });
  }

  const totalSalary = typeof data.totalSalary === "number" ? data.totalSalary : null;
  const baseSalary = typeof data.baseSalary === "number" ? data.baseSalary : null;
  const transportAllowance =
    typeof data.transportAllowance === "number" ? data.transportAllowance : null;
  const accommodationAllowance =
    typeof data.accommodationAllowance === "number" ? data.accommodationAllowance : null;
  const hasAllowances = transportAllowance !== null || accommodationAllowance !== null;

  if (baseSalary !== null && totalSalary === null && !hasAllowances) {
    issues.push({
      row: rowIndex,
      column: "base_salary",
      field: "baseSalary",
      value: String(baseSalary),
      message: "Base salary only is not allowed. Provide total salary or include allowances.",
      severity: "error",
    });
  }

  if (totalSalary === null && baseSalary === null && !hasAllowances) {
    issues.push({
      row: rowIndex,
      column: "total_salary",
      field: "totalSalary",
      value: "",
      message: "Missing salary data. Add total salary or provide base plus allowances.",
      severity: "error",
    });
  }

  if (totalSalary !== null && baseSalary !== null && !hasAllowances) {
    issues.push({
      row: rowIndex,
      column: "total_salary/base_salary",
      field: "salary",
      value: `${totalSalary}/${baseSalary}`,
      message: "Total salary and base salary are both provided. We will keep total salary as source of truth.",
      severity: "warning",
    });
  }

  const equityValue = typeof data.equityValue === "number" ? data.equityValue : null;
  const equityUnits = typeof data.equityUnits === "number" ? data.equityUnits : null;
  const equityPercent = typeof data.equityPercent === "number" ? data.equityPercent : null;
  if (equityValue === null && (equityUnits !== null || equityPercent !== null)) {
    issues.push({
      row: rowIndex,
      column: "equity",
      field: "equity",
      value: `${equityUnits ?? ""}/${equityPercent ?? ""}`,
      message:
        "Equity units or percent provided without explicit value. A comparable value estimate will be applied.",
      severity: "warning",
    });
  }

  return issues;
}

function filterEmployeeEnumWarnings(
  issues: ValidationIssue[],
  data: Record<string, unknown>,
): ValidationIssue[] {
  return issues.filter((issue) => {
    if (issue.severity !== "warning") return true;

    if (issue.field === "department") {
      const normalizedDepartment = normalizeDepartment(String(data.department ?? ""));
      return ![
        "Engineering",
        "Product",
        "Design",
        "Data",
        "Sales",
        "Marketing",
        "Operations",
        "Executive",
        "Finance",
        "HR",
      ].includes(normalizedDepartment);
    }

    if (issue.field === "employmentType") {
      return false;
    }

    if (issue.field === "performanceRating") {
      return normalizePerformanceRating(String(data.performanceRating ?? "")) === null;
    }

    if (issue.field === "status") {
      return false;
    }

    return true;
  });
}

/**
 * Transform a value to the appropriate type
 */
function transformValue(value: string, field: FieldDefinition): unknown {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  switch (field.type) {
    case "number":
      return parseNumber(trimmed);
    case "date":
      return parseDate(trimmed)?.toISOString().split("T")[0];
    case "email":
      return trimmed.toLowerCase();
    case "enum":
      // Normalize to lowercase for matching
      return trimmed.toLowerCase();
    default:
      return trimmed;
  }
}

/**
 * Validate all rows against mappings and field definitions
 */
export function validateData(
  rows: string[][],
  mappings: ColumnMapping[],
  dataType: UploadDataType
): ValidationResult {
  const fields = getFieldsForType(dataType);
  const fieldMap = new Map(fields.map((f) => [f.key, f]));
  const allIssues: ValidationIssue[] = [];
  const rowResults: RowValidationResult[] = [];
  const seenKeys = new Set<string>();
  let duplicateRows = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const rowIssues: ValidationIssue[] = [];
    const data: Record<string, unknown> = {};

    // Validate each mapped column
    for (const mapping of mappings) {
      if (!mapping.targetField) continue;

      const field = fieldMap.get(mapping.targetField);
      if (!field) continue;

      const value = row[mapping.sourceIndex] || "";
      const issues = validateField(value, field, rowIndex + 1, mapping.sourceColumn);
      rowIssues.push(...issues);

      // Transform and store the value
      data[field.key] = transformValue(value, field);
    }

    // Additional type-specific validation
    if (dataType === "benchmarks") {
      const benchmarkIssues = validateBenchmarkRow(data, rowIndex + 1);
      rowIssues.push(...benchmarkIssues);
    }
    if (dataType === "employees") {
      const employeeIssues = validateEmployeeRow(data, rowIndex + 1);
      rowIssues.push(...employeeIssues);
      const filteredIssues = filterEmployeeEnumWarnings(rowIssues, data);
      rowIssues.length = 0;
      rowIssues.push(...filteredIssues);

      const emailKey = String(data.email ?? "").trim().toLowerCase();
      const compositeKey = [
        String(data.firstName ?? "").trim().toLowerCase(),
        String(data.lastName ?? "").trim().toLowerCase(),
        String(data.role ?? "").trim().toLowerCase(),
        String(data.level ?? "").trim().toLowerCase(),
        String(data.location ?? "").trim().toLowerCase(),
      ].join("|");
      const duplicateKey = emailKey || compositeKey;
      if (duplicateKey.replace(/\|/g, "").length > 0) {
        if (seenKeys.has(duplicateKey)) {
          duplicateRows += 1;
          rowIssues.push({
            row: rowIndex + 1,
            column: "row",
            field: "row",
            value: duplicateKey,
            message: "Possible duplicate row detected",
            severity: "warning",
          });
        } else {
          seenKeys.add(duplicateKey);
        }
      }
    }

    const hasErrors = rowIssues.some((i) => i.severity === "error");
    const hasWarnings = rowIssues.some((i) => i.severity === "warning");

    rowResults.push({
      rowIndex: rowIndex + 1, // 1-indexed for display
      isValid: !hasErrors,
      hasWarnings,
      issues: rowIssues,
      data,
    });

    allIssues.push(...rowIssues);
  }

  const validRows = rowResults.filter((r) => r.isValid && !r.hasWarnings).length;
  const warningRows = rowResults.filter((r) => r.isValid && r.hasWarnings).length;
  const errorRows = rowResults.filter((r) => !r.isValid).length;

  return {
    totalRows: rows.length,
    validRows,
    warningRows,
    errorRows,
    issues: allIssues,
    rows: rowResults,
    meta: {
      duplicateRows,
      currencies: Array.from(
        new Set(
          rowResults
            .map((row) => String(row.data.currency ?? "").trim().toUpperCase())
            .filter((value) => value.length > 0),
        ),
      ),
    },
  };
}

/**
 * Get summary of validation issues by field
 */
export function getIssueSummary(issues: ValidationIssue[]): Map<string, number> {
  const summary = new Map<string, number>();
  for (const issue of issues) {
    const key = `${issue.field}: ${issue.message}`;
    summary.set(key, (summary.get(key) || 0) + 1);
  }
  return summary;
}
