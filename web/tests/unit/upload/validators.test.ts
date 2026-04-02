import { describe, expect, it } from "vitest";
import { validateData } from "@/lib/upload/validators";
import type { ColumnMapping } from "@/lib/upload/column-detection";

describe("validateData", () => {
  it("flags invalid benchmark percentile ordering", () => {
    const rows = [["Engineer", "Dubai", "L3", "AED", "5000", "4000", "3000", "8000", "9000"]];
    const mappings: ColumnMapping[] = [
      { sourceColumn: "role", sourceIndex: 0, targetField: "role", confidence: 1, sampleValues: [] },
      { sourceColumn: "location", sourceIndex: 1, targetField: "location", confidence: 1, sampleValues: [] },
      { sourceColumn: "level", sourceIndex: 2, targetField: "level", confidence: 1, sampleValues: [] },
      { sourceColumn: "currency", sourceIndex: 3, targetField: "currency", confidence: 1, sampleValues: [] },
      { sourceColumn: "p10", sourceIndex: 4, targetField: "p10", confidence: 1, sampleValues: [] },
      { sourceColumn: "p25", sourceIndex: 5, targetField: "p25", confidence: 1, sampleValues: [] },
      { sourceColumn: "p50", sourceIndex: 6, targetField: "p50", confidence: 1, sampleValues: [] },
      { sourceColumn: "p75", sourceIndex: 7, targetField: "p75", confidence: 1, sampleValues: [] },
      { sourceColumn: "p90", sourceIndex: 8, targetField: "p90", confidence: 1, sampleValues: [] },
    ];

    const result = validateData(rows, mappings, "benchmarks");
    expect(result.errorRows).toBe(1);
    expect(result.issues.some((issue) => issue.message.includes("P10 should be less"))).toBe(true);
  });

  it("flags unmapped benchmark role, location, and level values as errors", () => {
    const rows = [["Founder's Associate", "Atlantis", "Career Track Purple", "AED", "5000", "6000", "7000", "8000", "9000"]];
    const mappings: ColumnMapping[] = [
      { sourceColumn: "role", sourceIndex: 0, targetField: "role", confidence: 1, sampleValues: [] },
      { sourceColumn: "location", sourceIndex: 1, targetField: "location", confidence: 1, sampleValues: [] },
      { sourceColumn: "level", sourceIndex: 2, targetField: "level", confidence: 1, sampleValues: [] },
      { sourceColumn: "currency", sourceIndex: 3, targetField: "currency", confidence: 1, sampleValues: [] },
      { sourceColumn: "p10", sourceIndex: 4, targetField: "p10", confidence: 1, sampleValues: [] },
      { sourceColumn: "p25", sourceIndex: 5, targetField: "p25", confidence: 1, sampleValues: [] },
      { sourceColumn: "p50", sourceIndex: 6, targetField: "p50", confidence: 1, sampleValues: [] },
      { sourceColumn: "p75", sourceIndex: 7, targetField: "p75", confidence: 1, sampleValues: [] },
      { sourceColumn: "p90", sourceIndex: 8, targetField: "p90", confidence: 1, sampleValues: [] },
    ];

    const result = validateData(rows, mappings, "benchmarks");

    expect(result.errorRows).toBe(1);
    expect(result.rows[0]?.isValid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "role",
          severity: "error",
          message: "Role could not be mapped to a supported Qeemly benchmark role",
        }),
        expect.objectContaining({
          field: "location",
          severity: "error",
          message: "Location could not be mapped to a supported Qeemly benchmark market",
        }),
        expect.objectContaining({
          field: "level",
          severity: "error",
          message: "Level could not be mapped to a supported Qeemly benchmark level",
        }),
      ]),
    );
  });

  it("flags unmapped employee roles as errors", () => {
    const rows = [["Ava", "Stone", "Operations", "Founder's Associate", "IC3", "Dubai", "120000"]];
    const mappings: ColumnMapping[] = [
      { sourceColumn: "first_name", sourceIndex: 0, targetField: "firstName", confidence: 1, sampleValues: [] },
      { sourceColumn: "last_name", sourceIndex: 1, targetField: "lastName", confidence: 1, sampleValues: [] },
      { sourceColumn: "department", sourceIndex: 2, targetField: "department", confidence: 1, sampleValues: [] },
      { sourceColumn: "role", sourceIndex: 3, targetField: "role", confidence: 1, sampleValues: [] },
      { sourceColumn: "level", sourceIndex: 4, targetField: "level", confidence: 1, sampleValues: [] },
      { sourceColumn: "location", sourceIndex: 5, targetField: "location", confidence: 1, sampleValues: [] },
      { sourceColumn: "base_salary", sourceIndex: 6, targetField: "baseSalary", confidence: 1, sampleValues: [] },
    ];

    const result = validateData(rows, mappings, "employees");

    expect(result.errorRows).toBe(1);
    expect(result.rows[0]?.isValid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "role",
          severity: "error",
          message: "Role could not be mapped to a supported Qeemly job title",
        }),
      ]),
    );
  });

  it("flags unmapped employee levels as errors", () => {
    const rows = [["Ava", "Stone", "Engineering", "Software Engineer", "Career Track Purple", "Dubai", "120000"]];
    const mappings: ColumnMapping[] = [
      { sourceColumn: "first_name", sourceIndex: 0, targetField: "firstName", confidence: 1, sampleValues: [] },
      { sourceColumn: "last_name", sourceIndex: 1, targetField: "lastName", confidence: 1, sampleValues: [] },
      { sourceColumn: "department", sourceIndex: 2, targetField: "department", confidence: 1, sampleValues: [] },
      { sourceColumn: "role", sourceIndex: 3, targetField: "role", confidence: 1, sampleValues: [] },
      { sourceColumn: "level", sourceIndex: 4, targetField: "level", confidence: 1, sampleValues: [] },
      { sourceColumn: "location", sourceIndex: 5, targetField: "location", confidence: 1, sampleValues: [] },
      { sourceColumn: "base_salary", sourceIndex: 6, targetField: "baseSalary", confidence: 1, sampleValues: [] },
    ];

    const result = validateData(rows, mappings, "employees");

    expect(result.errorRows).toBe(1);
    expect(result.warningRows).toBe(0);
    expect(result.rows[0]?.isValid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "level",
          severity: "error",
          message: "Level could not be mapped to a supported Qeemly level",
        }),
      ]),
    );
  });

  it("flags unmapped employee locations as errors", () => {
    const rows = [["Ava", "Stone", "Engineering", "Software Engineer", "IC3", "Atlantis", "120000"]];
    const mappings: ColumnMapping[] = [
      { sourceColumn: "first_name", sourceIndex: 0, targetField: "firstName", confidence: 1, sampleValues: [] },
      { sourceColumn: "last_name", sourceIndex: 1, targetField: "lastName", confidence: 1, sampleValues: [] },
      { sourceColumn: "department", sourceIndex: 2, targetField: "department", confidence: 1, sampleValues: [] },
      { sourceColumn: "role", sourceIndex: 3, targetField: "role", confidence: 1, sampleValues: [] },
      { sourceColumn: "level", sourceIndex: 4, targetField: "level", confidence: 1, sampleValues: [] },
      { sourceColumn: "location", sourceIndex: 5, targetField: "location", confidence: 1, sampleValues: [] },
      { sourceColumn: "base_salary", sourceIndex: 6, targetField: "baseSalary", confidence: 1, sampleValues: [] },
    ];

    const result = validateData(rows, mappings, "employees");

    expect(result.errorRows).toBe(1);
    expect(result.rows[0]?.isValid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "location",
          severity: "error",
          message: "Location could not be mapped to a supported Qeemly location",
        }),
      ]),
    );
  });

  it("accepts common employee enum synonyms without warnings", () => {
    const rows = [["Ava", "Stone", "People Ops", "Software Engineer", "IC3", "Dubai", "120000", "Local", "Meets Expectations"]];
    const mappings: ColumnMapping[] = [
      { sourceColumn: "first_name", sourceIndex: 0, targetField: "firstName", confidence: 1, sampleValues: [] },
      { sourceColumn: "last_name", sourceIndex: 1, targetField: "lastName", confidence: 1, sampleValues: [] },
      { sourceColumn: "department", sourceIndex: 2, targetField: "department", confidence: 1, sampleValues: [] },
      { sourceColumn: "role", sourceIndex: 3, targetField: "role", confidence: 1, sampleValues: [] },
      { sourceColumn: "level", sourceIndex: 4, targetField: "level", confidence: 1, sampleValues: [] },
      { sourceColumn: "location", sourceIndex: 5, targetField: "location", confidence: 1, sampleValues: [] },
      { sourceColumn: "base_salary", sourceIndex: 6, targetField: "baseSalary", confidence: 1, sampleValues: [] },
      { sourceColumn: "employment_type", sourceIndex: 7, targetField: "employmentType", confidence: 1, sampleValues: [] },
      { sourceColumn: "performance_rating", sourceIndex: 8, targetField: "performanceRating", confidence: 1, sampleValues: [] },
    ];

    const result = validateData(rows, mappings, "employees");

    expect(result.errorRows).toBe(0);
    expect(result.warningRows).toBe(0);
    expect(result.rows[0]?.isValid).toBe(true);
    expect(result.rows[0]?.hasWarnings).toBe(false);
  });

  it("accepts the previously unsupported CSV values without errors", () => {
    const rows = [["John", "Walker", "Executive", "HR Manager", "Executive", "London", "150000"]];
    const mappings: ColumnMapping[] = [
      { sourceColumn: "first_name", sourceIndex: 0, targetField: "firstName", confidence: 1, sampleValues: [] },
      { sourceColumn: "last_name", sourceIndex: 1, targetField: "lastName", confidence: 1, sampleValues: [] },
      { sourceColumn: "department", sourceIndex: 2, targetField: "department", confidence: 1, sampleValues: [] },
      { sourceColumn: "role", sourceIndex: 3, targetField: "role", confidence: 1, sampleValues: [] },
      { sourceColumn: "level", sourceIndex: 4, targetField: "level", confidence: 1, sampleValues: [] },
      { sourceColumn: "location", sourceIndex: 5, targetField: "location", confidence: 1, sampleValues: [] },
      { sourceColumn: "base_salary", sourceIndex: 6, targetField: "baseSalary", confidence: 1, sampleValues: [] },
    ];

    const result = validateData(rows, mappings, "employees");

    expect(result.errorRows).toBe(0);
    expect(result.warningRows).toBe(0);
    expect(result.rows[0]?.isValid).toBe(true);
    expect(result.rows[0]?.hasWarnings).toBe(false);
  });
});
