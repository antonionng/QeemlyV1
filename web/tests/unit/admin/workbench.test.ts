import { describe, expect, it } from "vitest";
import {
  ADMIN_DATA_OWNERSHIP,
  classifyResearchAsset,
  getWorkbenchCoverageSummary,
} from "@/lib/admin/workbench";

describe("admin workbench helpers", () => {
  it("keeps tenant company uploads separate from shared-market stewardship", () => {
    expect(ADMIN_DATA_OWNERSHIP).toEqual({
      tenantDashboard: [
        "Employee roster uploads",
        "Compensation updates",
        "Company pay band uploads",
        "Tenant reports and salary review actions",
      ],
      superAdminWorkbench: [
        "Shared market source ingestion",
        "Manual CSV and PDF research intake",
        "Normalization review",
        "Data quality and freshness governance",
        "Benchmark publishing",
      ],
    });
  });

  it("classifies manual research files by ingest path", () => {
    expect(classifyResearchAsset("gcc_survey.csv")).toEqual({
      kind: "csv",
      queue: "Structured import",
    });
    expect(classifyResearchAsset("salary-guide.pdf")).toEqual({
      kind: "pdf",
      queue: "Document review",
    });
    expect(classifyResearchAsset("notes.txt")).toEqual({
      kind: "other",
      queue: "Needs triage",
    });
  });

  it("summarizes workbench coverage from source, freshness, and benchmark stats", () => {
    expect(
      getWorkbenchCoverageSummary({
        totalSources: 28,
        enabledSources: 24,
        totalBenchmarks: 720,
        freshnessScore: "unknown",
      }),
    ).toEqual({
      sourceCoverageLabel: "24 of 28 sources enabled",
      benchmarkCoverageLabel: "720 shared market rows ready for review",
      publishStatusLabel: "Publish status unknown",
    });
  });
});
