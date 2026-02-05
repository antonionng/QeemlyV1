// Validation rules for uploaded data

import type { ColumnMapping, UploadDataType, FieldDefinition } from "./column-detection";
import { getFieldsForType } from "./column-detection";

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
