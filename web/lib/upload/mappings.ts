import type { ColumnMapping } from "./column-detection";
import { matchLevel, matchRole, normalizeDepartment } from "./transformers";

export type UploadMappingOptions = {
  roles: Array<{ id: string; label: string }>;
  levels: Array<{ id: string; label: string; description: string }>;
};

export function extractUniqueFieldValues(
  rows: string[][],
  mappings: ColumnMapping[],
  targetField: string,
): string[] {
  const mapping = mappings.find((item) => item.targetField === targetField);
  if (!mapping) return [];
  const values = new Set<string>();
  for (const row of rows) {
    const raw = String(row[mapping.sourceIndex] ?? "").trim();
    if (raw) values.add(raw);
  }
  return Array.from(values);
}

export function applyValueMappingsToRows(
  rows: string[][],
  mappings: ColumnMapping[],
  mappingOverrides: {
    departmentMappings: Record<string, string>;
    roleMappings: Record<string, string>;
    levelMappings: Record<string, string>;
  },
): string[][] {
  const deptColumn = mappings.find((item) => item.targetField === "department")?.sourceIndex;
  const roleColumn = mappings.find((item) => item.targetField === "role")?.sourceIndex;
  const levelColumn = mappings.find((item) => item.targetField === "level")?.sourceIndex;

  return rows.map((row) => {
    const copy = [...row];
    if (typeof deptColumn === "number") {
      const source = String(copy[deptColumn] ?? "").trim();
      if (source && mappingOverrides.departmentMappings[source]) {
        copy[deptColumn] = mappingOverrides.departmentMappings[source];
      }
    }
    if (typeof roleColumn === "number") {
      const source = String(copy[roleColumn] ?? "").trim();
      if (source && mappingOverrides.roleMappings[source]) {
        copy[roleColumn] = mappingOverrides.roleMappings[source];
      }
    }
    if (typeof levelColumn === "number") {
      const source = String(copy[levelColumn] ?? "").trim();
      if (source && mappingOverrides.levelMappings[source]) {
        copy[levelColumn] = mappingOverrides.levelMappings[source];
      }
    }
    return copy;
  });
}

export function unresolvedRoleValues(values: string[]): string[] {
  return values.filter((value) => !matchRole(value));
}

export function unresolvedLevelValues(values: string[]): string[] {
  return values.filter((value) => !matchLevel(value));
}

export function defaultDepartmentMappings(values: string[]): Record<string, string> {
  const output: Record<string, string> = {};
  for (const value of values) output[value] = normalizeDepartment(value);
  return output;
}

export function suggestedLevelCategoryForRole(rawRole: string): "manager" | "ic" {
  const normalized = rawRole.toLowerCase();
  if (
    normalized.includes("manager") ||
    normalized.includes("director") ||
    normalized.includes("head") ||
    normalized.includes("chief")
  ) {
    return "manager";
  }
  return "ic";
}

export function toCustomMappingId(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized : "custom-value";
}

export function hasTotalOnlySalaryRows(rows: string[][], mappings: ColumnMapping[]): boolean {
  const totalColumn = mappings.find((item) => item.targetField === "totalSalary")?.sourceIndex;
  const baseColumn = mappings.find((item) => item.targetField === "baseSalary")?.sourceIndex;
  const transportColumn = mappings.find((item) => item.targetField === "transportAllowance")?.sourceIndex;
  const accommodationColumn = mappings.find((item) => item.targetField === "accommodationAllowance")?.sourceIndex;

  if (typeof totalColumn !== "number") return false;

  for (const row of rows) {
    const total = String(row[totalColumn] ?? "").trim();
    const base = typeof baseColumn === "number" ? String(row[baseColumn] ?? "").trim() : "";
    const transport = typeof transportColumn === "number" ? String(row[transportColumn] ?? "").trim() : "";
    const accommodation =
      typeof accommodationColumn === "number" ? String(row[accommodationColumn] ?? "").trim() : "";
    if (total && !base && !transport && !accommodation) {
      return true;
    }
  }

  return false;
}
