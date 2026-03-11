import { describe, expect, it } from "vitest";
import { composeReportResult } from "@/lib/reports/generation";
import type { Report } from "@/lib/reports/types";

function makeReport(typeId: Report["type_id"]): Report {
  return {
    id: "report-1",
    workspace_id: "workspace-1",
    title: "Test Report",
    type_id: typeId,
    status: "In Review",
    owner: "owner@example.com",
    tags: [],
    schedule_cadence: null,
    schedule_next_run: null,
    recipients: [],
    config: {},
    result_data: null,
    format: "PDF",
    template_id: null,
    template_version: null,
    last_run_id: null,
    build_error: null,
    last_run_at: null,
    created_at: "2026-03-10T00:00:00.000Z",
    updated_at: "2026-03-10T00:00:00.000Z",
  };
}

describe("composeReportResult", () => {
  it("builds an overview report from live generation inputs", () => {
    const result = composeReportResult(
      makeReport("overview"),
      {
        activeEmployees: 24,
        benchmarkedEmployees: 20,
        departmentCount: 5,
        totalPayroll: 4_200_000,
        avgMarketComparison: 3.4,
        marketRowsCount: 112,
        marketFreshnessAt: "2026-03-10T00:00:00.000Z",
        benchmarkTrustLabel: "Blended market pool",
        marketBackedEmployees: 18,
        complianceScore: 87,
        complianceUpdatedAt: "2026-03-09T00:00:00.000Z",
        usesSyntheticFallback: false,
        syntheticFallbackDomains: [],
      },
      "2026-03-10T12:00:00.000Z",
    );

    expect(result.summary).toContain("24 active employees");
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "active_employees", value: 24 }),
        expect.objectContaining({ id: "benchmark_source", value: "Blended market pool" }),
      ]),
    );
    expect(result.sections[0]?.notes).toContain("18 employees are market-backed");
  });

  it("surfaces synthetic fallback in compliance reports", () => {
    const result = composeReportResult(
      makeReport("compliance"),
      {
        activeEmployees: 10,
        benchmarkedEmployees: 8,
        departmentCount: 2,
        totalPayroll: 1_000_000,
        avgMarketComparison: 1.2,
        marketRowsCount: 20,
        marketFreshnessAt: "2026-03-10T00:00:00.000Z",
        benchmarkTrustLabel: "Admin market source",
        marketBackedEmployees: 8,
        complianceScore: 72,
        complianceUpdatedAt: "2026-03-08T00:00:00.000Z",
        usesSyntheticFallback: true,
        syntheticFallbackDomains: ["documents", "deadlines"],
      },
      "2026-03-10T12:00:00.000Z",
    );

    expect(result.summary).toContain("Synthetic fallback is active for: documents, deadlines.");
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "synthetic_fallback", value: "Yes" }),
      ]),
    );
  });
});
