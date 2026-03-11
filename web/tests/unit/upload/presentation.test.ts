import { describe, expect, it } from "vitest";
import {
  buildUploadedBenchmarkPreviewRows,
  buildUploadedEmployeePreviewRows,
  getConfirmSummaryCopy,
  getFileUploadGuidance,
  getSelectableUploadTypes,
  getValidationLegend,
} from "@/lib/upload/presentation";

describe("upload presentation", () => {
  it("keeps the unfinished compensation path out of the generic type picker", () => {
    expect(getSelectableUploadTypes().map((type) => type.id)).toEqual([
      "employees",
      "benchmarks",
    ]);
  });

  it("explains that employee imports update by email when possible", () => {
    const guidance = getFileUploadGuidance("employees", "upsert");

    expect(guidance.helperText).toContain("CSV or Excel");
    expect(guidance.matchingRule).toContain("email");
    expect(guidance.matchingRule).toContain("updated");
  });

  it("explains destructive replace mode in plain language", () => {
    const copy = getConfirmSummaryCopy("employees", "replace");

    expect(copy.title).toContain("replace");
    expect(copy.body).toContain("remove your current employee roster");
    expect(copy.body).toContain("Qeemly market data");
  });

  it("defines clear validation legend labels for admins", () => {
    expect(getValidationLegend("employees")).toEqual([
      expect.objectContaining({ id: "ready", label: "Ready" }),
      expect.objectContaining({ id: "warning", label: "Warning" }),
      expect.objectContaining({ id: "error", label: "Error" }),
      expect.objectContaining({ id: "excluded", label: "Excluded" }),
    ]);
  });

  it("formats uploaded employee previews with batch-level benchmark insight", () => {
    const rows = buildUploadedEmployeePreviewRows(
      [
        {
          id: "emp-1",
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          department: "Engineering",
          role: { id: "swe", title: "Software Engineer", family: "Engineering", icon: "SWE" },
          level: { id: "ic3", name: "Senior (IC3)", category: "IC" },
          location: {
            id: "dubai",
            city: "Dubai",
            country: "UAE",
            countryCode: "AE",
            currency: "AED",
            flag: "AE",
          },
          status: "active",
          employmentType: "national",
          baseSalary: 120000,
          totalComp: 132000,
          bonus: 12000,
          bandPosition: "above",
          bandPercentile: 82,
          marketComparison: 12,
          hasBenchmark: true,
          benchmarkContext: { source: "market", matchQuality: "exact", provenance: "blended" },
          hireDate: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          id: "emp-2",
          firstName: "Grace",
          lastName: "Hopper",
          email: "grace@example.com",
          department: "Engineering",
          role: { id: "swe", title: "Software Engineer", family: "Engineering", icon: "SWE" },
          level: { id: "ic2", name: "Mid (IC2)", category: "IC" },
          location: {
            id: "riyadh",
            city: "Riyadh",
            country: "Saudi Arabia",
            countryCode: "SA",
            currency: "SAR",
            flag: "SA",
          },
          status: "active",
          employmentType: "national",
          baseSalary: 100000,
          totalComp: 100000,
          bandPosition: "in-band",
          bandPercentile: 50,
          marketComparison: 0,
          hasBenchmark: false,
          hireDate: new Date("2024-01-01T00:00:00.000Z"),
        },
      ],
      [
        {
          email: "ada@example.com",
          firstName: "Ada",
          lastName: "Lovelace",
          action: "created",
        },
        {
          email: "grace@example.com",
          firstName: "Grace",
          lastName: "Hopper",
          action: "updated",
        },
      ],
    );

    expect(rows).toEqual([
      expect.objectContaining({
        email: "ada@example.com",
        actionLabel: "Created",
        benchmarkLabel: "Benchmarked",
        insightLabel: "+12% vs market median",
      }),
      expect.objectContaining({
        email: "grace@example.com",
        actionLabel: "Updated",
        benchmarkLabel: "Needs mapping",
        insightLabel: "Add role, level, or location to benchmark this employee.",
      }),
    ]);
  });

  it("formats uploaded benchmark previews with overlay-specific insight", () => {
    const rows = buildUploadedBenchmarkPreviewRows(
      [
        {
          role_id: "swe",
          location_id: "dubai",
          level_id: "ic3",
          currency: "AED",
          p50: 250000,
          p25: 230000,
          p75: 280000,
          sample_size: 24,
          source: "uploaded",
          valid_from: "2026-03-11",
        },
        {
          role_id: "pm",
          location_id: "riyadh",
          level_id: "ic2",
          currency: "SAR",
          p50: 185000,
          p25: 170000,
          p75: 205000,
          sample_size: 14,
          source: "uploaded",
          valid_from: "2026-03-11",
        },
      ],
      [
        {
          roleId: "swe",
          locationId: "dubai",
          levelId: "ic3",
          action: "created",
          validFrom: "2026-03-11",
        },
        {
          roleId: "pm",
          locationId: "riyadh",
          levelId: "ic2",
          action: "updated",
          validFrom: "2026-03-11",
        },
      ],
    );

    expect(rows).toEqual([
      expect.objectContaining({
        actionLabel: "Created",
        roleTitle: "Software Engineer",
        locationLabel: "Dubai",
        levelLabel: "Senior (IC3)",
        insightLabel: "Median: 250,000 AED",
      }),
      expect.objectContaining({
        actionLabel: "Updated",
        roleTitle: "Product Manager",
        locationLabel: "Riyadh",
        levelLabel: "Mid-Level (IC2)",
        insightLabel: "Median: 185,000 SAR",
      }),
    ]);
  });
});
