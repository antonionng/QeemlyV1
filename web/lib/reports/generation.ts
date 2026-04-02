import { summarizeBenchmarkTrust } from "@/lib/benchmarks/trust";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import { buildAiBenchmarkRows } from "@/lib/benchmarks/ai-benchmark-rows";
import { __internal as employeeInternals } from "@/lib/employees/data-service";
import { createServiceClient } from "@/lib/supabase/service";
import type { Report } from "./types";

type ReportMetric = {
  id: string;
  label: string;
  value: string | number;
};

export type GeneratedReportResult = {
  generated_at: string;
  template_id: string | null;
  summary: string;
  metrics: ReportMetric[];
  sections: Array<{ title: string; notes: string }>;
};

export type ReportGenerationInputs = {
  activeEmployees: number;
  benchmarkedEmployees: number;
  departmentCount: number;
  totalPayroll: number;
  avgMarketComparison: number;
  marketRowsCount: number;
  marketFreshnessAt: string | null;
  benchmarkTrustLabel: string;
  marketBackedEmployees: number;
  complianceScore: number | null;
  complianceUpdatedAt: string | null;
  usesSyntheticFallback: boolean;
  syntheticFallbackDomains: string[];
};

function roundNumber(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatDate(value: string | null): string {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return date.toLocaleDateString("en-GB");
}

export function composeReportResult(
  report: Report,
  inputs: ReportGenerationInputs,
  generatedAt = new Date().toISOString()
): GeneratedReportResult {
  const commonMetrics: ReportMetric[] = [
    { id: "active_employees", label: "Active Employees", value: inputs.activeEmployees },
    { id: "benchmarked_employees", label: "Benchmarked Employees", value: inputs.benchmarkedEmployees },
    { id: "market_rows", label: "Market Rows", value: inputs.marketRowsCount },
    { id: "benchmark_source", label: "Primary Benchmark Source", value: inputs.benchmarkTrustLabel },
  ];

  if (report.type_id === "overview") {
    return {
      generated_at: generatedAt,
      template_id: report.template_id,
      summary: `Overview built from ${inputs.activeEmployees} active employees, ${inputs.benchmarkedEmployees} benchmarked employees, and ${inputs.marketRowsCount} live market rows.`,
      metrics: [
        ...commonMetrics,
        { id: "departments", label: "Departments", value: inputs.departmentCount },
        { id: "total_payroll", label: "Total Payroll", value: Math.round(inputs.totalPayroll) },
        { id: "avg_market_comparison", label: "Average vs Market %", value: roundNumber(inputs.avgMarketComparison) },
      ],
      sections: [
        {
          title: "Benchmark Coverage",
          notes: `${inputs.marketBackedEmployees} employees are market-backed. Latest market refresh: ${formatDate(inputs.marketFreshnessAt)}.`,
        },
        {
          title: "Compliance Snapshot",
          notes:
            inputs.complianceScore == null
              ? "No compliance snapshot was available at generation time."
              : `Compliance score ${inputs.complianceScore}/100 as of ${formatDate(inputs.complianceUpdatedAt)}.`,
        },
      ],
    };
  }

  if (report.type_id === "benchmark") {
    return {
      generated_at: generatedAt,
      template_id: report.template_id,
      summary: `Benchmark report built from the shared market pool with ${inputs.marketRowsCount} live rows and ${inputs.benchmarkedEmployees} employee matches.`,
      metrics: [
        ...commonMetrics,
        { id: "market_backed_employees", label: "Market-backed Employees", value: inputs.marketBackedEmployees },
        { id: "market_refresh", label: "Market Refresh", value: formatDate(inputs.marketFreshnessAt) },
      ],
      sections: [
        {
          title: "Market Pool",
          notes: `Primary source is ${inputs.benchmarkTrustLabel}. Average employee position vs market: ${roundNumber(inputs.avgMarketComparison)}%.`,
        },
        {
          title: "Coverage",
          notes: `${inputs.benchmarkedEmployees} of ${inputs.activeEmployees} active employees resolved against a benchmark.`,
        },
      ],
    };
  }

  if (report.type_id === "compliance") {
    const fallbackNote = inputs.usesSyntheticFallback
      ? ` Synthetic fallback is active for: ${inputs.syntheticFallbackDomains.join(", ")}.`
      : "";
    return {
      generated_at: generatedAt,
      template_id: report.template_id,
      summary:
        inputs.complianceScore == null
          ? "Compliance report generated without a current snapshot. Refresh compliance data to enrich this output."
          : `Compliance report built from the latest live snapshot with score ${inputs.complianceScore}/100.${fallbackNote}`.trim(),
      metrics: [
        { id: "compliance_score", label: "Compliance Score", value: inputs.complianceScore ?? "Unavailable" },
        { id: "compliance_updated_at", label: "Compliance Updated", value: formatDate(inputs.complianceUpdatedAt) },
        { id: "synthetic_fallback", label: "Synthetic Fallback", value: inputs.usesSyntheticFallback ? "Yes" : "No" },
        { id: "benchmarked_employees", label: "Benchmarked Employees", value: inputs.benchmarkedEmployees },
      ],
      sections: [
        {
          title: "Snapshot",
          notes:
            inputs.complianceScore == null
              ? "Compliance snapshot is not available yet."
              : `Snapshot timestamp: ${formatDate(inputs.complianceUpdatedAt)}.`,
        },
        {
          title: "Benchmark Context",
          notes: `Compensation context used ${inputs.benchmarkTrustLabel} with ${inputs.marketRowsCount} available market rows.`,
        },
      ],
    };
  }

  return {
    generated_at: generatedAt,
    template_id: report.template_id,
    summary: `Custom report built from ${inputs.activeEmployees} employees, ${inputs.marketRowsCount} market rows, and the latest available compliance context.`,
    metrics: [
      ...commonMetrics,
      { id: "compliance_score", label: "Compliance Score", value: inputs.complianceScore ?? "Unavailable" },
    ],
    sections: [
      {
        title: "People",
        notes: `${inputs.activeEmployees} active employees with ${inputs.departmentCount} departments in scope.`,
      },
      {
        title: "Compliance",
        notes:
          inputs.complianceScore == null
            ? "No compliance snapshot available."
            : `Compliance score ${inputs.complianceScore}/100 as of ${formatDate(inputs.complianceUpdatedAt)}.`,
      },
    ],
  };
}

export async function generateReportResult(report: Report): Promise<GeneratedReportResult> {
  const supabase = createServiceClient();
  const [employeesResult, workspaceBenchmarksResult, complianceResult] = await Promise.all([
    supabase
      .from("employees")
      .select("id, first_name, last_name, email, department, role_id, level_id, location_id, base_salary, bonus, equity, status, employment_type, hire_date, performance_rating")
      .eq("workspace_id", report.workspace_id)
      .neq("status", "inactive"),
    supabase
      .from("salary_benchmarks")
      .select("role_id, location_id, level_id, p10, p25, p50, p75, p90, source, confidence, sample_size, created_at")
      .eq("workspace_id", report.workspace_id)
      .eq("source", "uploaded")
      .order("created_at", { ascending: false }),
    supabase
      .from("compliance_snapshots")
      .select("compliance_score, updated_at, ai_scoring_metadata")
      .eq("workspace_id", report.workspace_id)
      .maybeSingle(),
  ]);

  if (employeesResult.error) throw new Error(employeesResult.error.message);
  if (workspaceBenchmarksResult.error) throw new Error(workspaceBenchmarksResult.error.message);
  if (complianceResult.error) throw new Error(complianceResult.error.message);

  const employeeRows = (employeesResult.data || []) as Record<string, unknown>[];
  const workspaceBenchmarkRows = (workspaceBenchmarksResult.data || []) as Record<string, unknown>[];
  const marketBenchmarks = await (async () => {
    try {
      const aiBenchmarks = await buildAiBenchmarkRows(
        employeeRows.map((row) => ({
          roleId: String(row.role_id || ""),
          locationId: String(row.location_id || ""),
        })),
      );
      if (aiBenchmarks.length > 0) {
        return aiBenchmarks;
      }
    } catch {
      // Fall back to pooled market rows.
    }

    return fetchMarketBenchmarks(supabase);
  })();
  const marketBenchmarkRows = marketBenchmarks.map((row) => ({
    role_id: row.role_id,
    location_id: row.location_id,
    level_id: row.level_id,
    p10: row.p10,
    p25: row.p25,
    p50: row.p50,
    p75: row.p75,
    p90: row.p90,
    source: row.source,
    provenance: row.provenance,
    freshness_at: row.freshness_at,
    contributor_count: row.contributor_count,
    sample_size: row.sample_size,
  }));

  const employees = employeeInternals.mapRowsToEmployees(
    employeeRows,
    workspaceBenchmarkRows,
    marketBenchmarkRows
  );
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const benchmarkedEmployees = activeEmployees.filter((employee) => employee.hasBenchmark);
  const benchmarkTrust = summarizeBenchmarkTrust(activeEmployees);
  const totalPayroll = activeEmployees.reduce((sum, employee) => sum + employee.totalComp, 0);
  const avgMarketComparison =
    benchmarkedEmployees.length > 0
      ? benchmarkedEmployees.reduce((sum, employee) => sum + employee.marketComparison, 0) /
        benchmarkedEmployees.length
      : 0;
  const complianceMetadata = (complianceResult.data?.ai_scoring_metadata || {}) as {
    uses_synthetic_fallback?: boolean;
    synthetic_fallback_domains?: unknown[];
  };

  return composeReportResult(report, {
    activeEmployees: activeEmployees.length,
    benchmarkedEmployees: benchmarkedEmployees.length,
    departmentCount: new Set(activeEmployees.map((employee) => employee.department)).size,
    totalPayroll,
    avgMarketComparison,
    marketRowsCount: marketBenchmarks.length,
    marketFreshnessAt: benchmarkTrust.freshestAt,
    benchmarkTrustLabel: benchmarkTrust.primarySourceLabel,
    marketBackedEmployees: benchmarkTrust.marketBacked,
    complianceScore:
      complianceResult.data && complianceResult.data.compliance_score != null
        ? Number(complianceResult.data.compliance_score)
        : null,
    complianceUpdatedAt: complianceResult.data?.updated_at || null,
    usesSyntheticFallback: Boolean(complianceMetadata.uses_synthetic_fallback),
    syntheticFallbackDomains: Array.isArray(complianceMetadata.synthetic_fallback_domains)
      ? complianceMetadata.synthetic_fallback_domains.filter(
          (entry): entry is string => typeof entry === "string"
        )
      : [],
  });
}
