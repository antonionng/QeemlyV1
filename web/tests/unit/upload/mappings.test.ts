import { describe, expect, it } from "vitest";
import {
  applyValueMappingsToRows,
  extractUniqueFieldValues,
  hasTotalOnlySalaryRows,
  suggestedLevelCategoryForRole,
  toCustomMappingId,
  unresolvedLevelValues,
  unresolvedRoleValues,
} from "@/lib/upload/mappings";
import type { ColumnMapping } from "@/lib/upload/column-detection";

describe("upload mappings helpers", () => {
  const mappings: ColumnMapping[] = [
    { sourceColumn: "department", sourceIndex: 0, targetField: "department", confidence: 1, sampleValues: [] },
    { sourceColumn: "role", sourceIndex: 1, targetField: "role", confidence: 1, sampleValues: [] },
    { sourceColumn: "level", sourceIndex: 2, targetField: "level", confidence: 1, sampleValues: [] },
  ];

  it("extracts unique field values by mapped target field", () => {
    const rows = [
      ["Engineering", "Software Engineer", "IC3"],
      ["Engineering", "Software Engineer", "IC3"],
      ["People", "Founder's Associate", "Senior Jedi"],
    ];
    expect(extractUniqueFieldValues(rows, mappings, "department")).toEqual(["Engineering", "People"]);
  });

  it("applies department, role, and level overrides to rows", () => {
    const rows = [["People Ops", "Founder's Associate", "Senior Jedi"]];
    const output = applyValueMappingsToRows(rows, mappings, {
      departmentMappings: { "People Ops": "HR" },
      roleMappings: { "Founder's Associate": "pm" },
      levelMappings: { "Senior Jedi": "ic3" },
    });
    expect(output[0]).toEqual(["HR", "pm", "ic3"]);
  });

  it("returns unresolved roles and levels that are not recognized", () => {
    expect(unresolvedRoleValues(["Software Engineer", "Founder's Associate"])).toEqual(["Founder's Associate"]);
    expect(unresolvedLevelValues(["IC3", "Galaxy Purple"])).toEqual(["Galaxy Purple"]);
  });

  it("suggests manager category for manager-like roles", () => {
    expect(suggestedLevelCategoryForRole("Engineering Manager")).toBe("manager");
    expect(suggestedLevelCategoryForRole("Software Engineer")).toBe("ic");
  });

  it("detects total-salary-only rows that require defaults", () => {
    const salaryMappings: ColumnMapping[] = [
      { sourceColumn: "total_salary", sourceIndex: 0, targetField: "totalSalary", confidence: 1, sampleValues: [] },
      { sourceColumn: "base_salary", sourceIndex: 1, targetField: "baseSalary", confidence: 1, sampleValues: [] },
      {
        sourceColumn: "transport_allowance",
        sourceIndex: 2,
        targetField: "transportAllowance",
        confidence: 1,
        sampleValues: [],
      },
      {
        sourceColumn: "accommodation_allowance",
        sourceIndex: 3,
        targetField: "accommodationAllowance",
        confidence: 1,
        sampleValues: [],
      },
    ];
    expect(hasTotalOnlySalaryRows([["120000", "", "", ""]], salaryMappings)).toBe(true);
    expect(hasTotalOnlySalaryRows([["120000", "100000", "10000", "10000"]], salaryMappings)).toBe(false);
  });

  it("creates stable custom mapping ids", () => {
    expect(toCustomMappingId("Senior Customer Success Manager")).toBe("senior-customer-success-manager");
  });
});
