// Column detection with fuzzy matching for header names

export type UploadDataType = "employees" | "benchmarks" | "compensation";

export type FieldDefinition = {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
  description?: string;
  type: "string" | "number" | "date" | "email" | "enum";
  enumValues?: string[];
};

export type ColumnMapping = {
  sourceColumn: string;
  sourceIndex: number;
  targetField: string | null;
  confidence: number; // 0-1
  sampleValues: string[];
};

// Field definitions for each data type
export const EMPLOYEE_FIELDS: FieldDefinition[] = [
  {
    key: "firstName",
    label: "First Name",
    required: true,
    aliases: ["first name", "firstname", "first", "given name", "forename"],
    type: "string",
  },
  {
    key: "lastName",
    label: "Last Name",
    required: true,
    aliases: ["last name", "lastname", "last", "surname", "family name"],
    type: "string",
  },
  {
    key: "fullName",
    label: "Full Name",
    required: false,
    aliases: ["full name", "fullname", "name", "employee name", "employee"],
    description: "Will be split into first and last name",
    type: "string",
  },
  {
    key: "email",
    label: "Email",
    required: false,
    aliases: ["email", "email address", "e-mail", "work email", "employee email"],
    type: "email",
  },
  {
    key: "department",
    label: "Department",
    required: true,
    aliases: ["department", "dept", "team", "division", "business unit", "org"],
    type: "enum",
    enumValues: ["Engineering", "Product", "Design", "Data", "Sales", "Marketing", "Operations", "Finance", "HR"],
  },
  {
    key: "role",
    label: "Role / Job Title",
    required: true,
    aliases: ["role", "job title", "title", "position", "job", "job role", "designation"],
    type: "string",
  },
  {
    key: "level",
    label: "Level",
    required: true,
    aliases: ["level", "grade", "band", "job level", "career level", "seniority"],
    type: "string",
  },
  {
    key: "location",
    label: "Location",
    required: true,
    aliases: ["location", "city", "office", "work location", "base location", "office location"],
    type: "string",
  },
  {
    key: "baseSalary",
    label: "Base Salary",
    required: true,
    aliases: ["base salary", "base", "salary", "annual salary", "base pay", "basic salary", "base compensation"],
    type: "number",
  },
  {
    key: "bonus",
    label: "Bonus",
    required: false,
    aliases: ["bonus", "annual bonus", "target bonus", "bonus amount", "incentive"],
    type: "number",
  },
  {
    key: "equity",
    label: "Equity",
    required: false,
    aliases: ["equity", "stock", "rsu", "options", "equity value", "shares", "stock options"],
    type: "number",
  },
  {
    key: "currency",
    label: "Currency",
    required: false,
    aliases: ["currency", "curr", "currency code", "pay currency"],
    type: "string",
  },
  {
    key: "status",
    label: "Status",
    required: false,
    aliases: ["status", "employment status", "active", "employee status"],
    type: "enum",
    enumValues: ["active", "inactive"],
  },
  {
    key: "employmentType",
    label: "Employment Type",
    required: false,
    aliases: ["employment type", "type", "local expat", "national expat", "contract type", "employee type"],
    type: "enum",
    enumValues: ["national", "expat"],
  },
  {
    key: "hireDate",
    label: "Hire Date",
    required: false,
    aliases: ["hire date", "start date", "join date", "date of joining", "doj", "hired", "employment date"],
    type: "date",
  },
  {
    key: "performanceRating",
    label: "Performance Rating",
    required: false,
    aliases: ["performance", "rating", "performance rating", "review rating", "perf rating"],
    type: "enum",
    enumValues: ["low", "meets", "exceeds", "exceptional"],
  },
];

export const BENCHMARK_FIELDS: FieldDefinition[] = [
  {
    key: "role",
    label: "Role",
    required: true,
    aliases: ["role", "job title", "title", "position", "job"],
    type: "string",
  },
  {
    key: "location",
    label: "Location",
    required: true,
    aliases: ["location", "city", "market", "region", "geography"],
    type: "string",
  },
  {
    key: "level",
    label: "Level",
    required: true,
    aliases: ["level", "grade", "band", "seniority", "job level"],
    type: "string",
  },
  {
    key: "currency",
    label: "Currency",
    required: true,
    aliases: ["currency", "curr", "currency code"],
    type: "string",
  },
  {
    key: "p10",
    label: "10th Percentile",
    required: true,
    aliases: ["p10", "10th percentile", "10th", "percentile 10", "10p"],
    type: "number",
  },
  {
    key: "p25",
    label: "25th Percentile",
    required: true,
    aliases: ["p25", "25th percentile", "25th", "percentile 25", "25p", "q1"],
    type: "number",
  },
  {
    key: "p50",
    label: "50th Percentile (Median)",
    required: true,
    aliases: ["p50", "50th percentile", "50th", "percentile 50", "50p", "median", "med"],
    type: "number",
  },
  {
    key: "p75",
    label: "75th Percentile",
    required: true,
    aliases: ["p75", "75th percentile", "75th", "percentile 75", "75p", "q3"],
    type: "number",
  },
  {
    key: "p90",
    label: "90th Percentile",
    required: true,
    aliases: ["p90", "90th percentile", "90th", "percentile 90", "90p"],
    type: "number",
  },
  {
    key: "sampleSize",
    label: "Sample Size",
    required: false,
    aliases: ["sample size", "samplesize", "n", "count", "sample", "data points"],
    type: "number",
  },
];

export const COMPENSATION_FIELDS: FieldDefinition[] = [
  {
    key: "employeeId",
    label: "Employee ID",
    required: false,
    aliases: ["employee id", "employeeid", "id", "emp id", "empid", "employee number"],
    type: "string",
  },
  {
    key: "email",
    label: "Email",
    required: true,
    aliases: ["email", "email address", "e-mail", "work email"],
    type: "email",
  },
  {
    key: "baseSalary",
    label: "New Base Salary",
    required: true,
    aliases: ["new salary", "new base", "base salary", "salary", "proposed salary", "updated salary"],
    type: "number",
  },
  {
    key: "bonus",
    label: "New Bonus",
    required: false,
    aliases: ["new bonus", "bonus", "target bonus", "proposed bonus"],
    type: "number",
  },
  {
    key: "equity",
    label: "New Equity",
    required: false,
    aliases: ["new equity", "equity", "stock", "rsu", "proposed equity"],
    type: "number",
  },
  {
    key: "effectiveDate",
    label: "Effective Date",
    required: false,
    aliases: ["effective date", "effective", "start date", "from date"],
    type: "date",
  },
  {
    key: "changeReason",
    label: "Change Reason",
    required: false,
    aliases: ["reason", "change reason", "adjustment reason", "notes", "comment"],
    type: "string",
  },
];

/**
 * Normalize a string for matching (lowercase, remove special chars)
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width chars
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Calculate similarity between two strings (0-1)
 * Uses a combination of exact match, prefix match, and Levenshtein-like scoring
 */
function calculateSimilarity(source: string, target: string): number {
  const s = normalize(source);
  const t = normalize(target);

  // Exact match
  if (s === t) return 1;

  // Contains match (high confidence)
  if (s.includes(t) || t.includes(s)) return 0.9;

  // Word overlap
  const sWords = s.split(" ");
  const tWords = t.split(" ");
  const commonWords = sWords.filter((w) => tWords.includes(w));
  if (commonWords.length > 0) {
    return 0.7 * (commonWords.length / Math.max(sWords.length, tWords.length));
  }

  // Prefix match
  if (s.startsWith(t.slice(0, 3)) || t.startsWith(s.slice(0, 3))) {
    return 0.5;
  }

  return 0;
}

/**
 * Get field definitions for a data type
 */
export function getFieldsForType(type: UploadDataType): FieldDefinition[] {
  switch (type) {
    case "employees":
      return EMPLOYEE_FIELDS;
    case "benchmarks":
      return BENCHMARK_FIELDS;
    case "compensation":
      return COMPENSATION_FIELDS;
  }
}

/**
 * Auto-detect column mappings based on header names
 */
export function detectColumnMappings(
  headers: string[],
  dataType: UploadDataType,
  sampleRows: string[][]
): ColumnMapping[] {
  const fields = getFieldsForType(dataType);
  const mappings: ColumnMapping[] = [];
  const usedFields = new Set<string>();

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const normalizedHeader = normalize(header);

    let bestMatch: { field: FieldDefinition; score: number } | null = null;

    for (const field of fields) {
      if (usedFields.has(field.key)) continue;

      // Check against field key
      let score = calculateSimilarity(normalizedHeader, field.key);

      // Check against field label
      score = Math.max(score, calculateSimilarity(normalizedHeader, field.label));

      // Check against aliases
      for (const alias of field.aliases) {
        score = Math.max(score, calculateSimilarity(normalizedHeader, alias));
      }

      if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { field, score };
      }
    }

    // Get sample values for this column
    const sampleValues = sampleRows
      .slice(0, 3)
      .map((row) => row[i] || "")
      .filter((v) => v !== "");

    if (bestMatch && bestMatch.score > 0.5) {
      usedFields.add(bestMatch.field.key);
      mappings.push({
        sourceColumn: header,
        sourceIndex: i,
        targetField: bestMatch.field.key,
        confidence: bestMatch.score,
        sampleValues,
      });
    } else {
      mappings.push({
        sourceColumn: header,
        sourceIndex: i,
        targetField: null,
        confidence: 0,
        sampleValues,
      });
    }
  }

  return mappings;
}

/**
 * Check if all required fields are mapped
 */
export function getMissingRequiredFields(
  mappings: ColumnMapping[],
  dataType: UploadDataType
): FieldDefinition[] {
  const fields = getFieldsForType(dataType);
  const mappedFields = new Set(mappings.map((m) => m.targetField).filter(Boolean));

  // Special case: if fullName is mapped, firstName and lastName are not required
  if (dataType === "employees" && mappedFields.has("fullName")) {
    return fields.filter(
      (f) =>
        f.required &&
        !mappedFields.has(f.key) &&
        f.key !== "firstName" &&
        f.key !== "lastName"
    );
  }

  return fields.filter((f) => f.required && !mappedFields.has(f.key));
}

/**
 * Get all unmapped fields that could still be mapped
 */
export function getUnmappedFields(
  mappings: ColumnMapping[],
  dataType: UploadDataType
): FieldDefinition[] {
  const fields = getFieldsForType(dataType);
  const mappedFields = new Set(mappings.map((m) => m.targetField).filter(Boolean));
  return fields.filter((f) => !mappedFields.has(f.key));
}
