import { summarizeBenchmarkTrust } from "@/lib/benchmarks/trust";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import { buildAiBenchmarkRows } from "@/lib/benchmarks/ai-benchmark-rows";
import { __internal as employeeInternals } from "@/lib/employees/data-service";
import { createServiceClient } from "@/lib/supabase/service";

export type AnalyticsPayload = {
  currency: string;
  activeEmployees: number;
  benchmarkedEmployees: number;
  departmentCount: number;
  totalPayroll: number;
  avgMarketComparison: number;
  marketRowsCount: number;
  marketFreshnessAt: string | null;
  benchmarkTrustLabel: string;
  marketBackedEmployees: number;
  departments: DepartmentBreakdown[];
  benchmarkSourceBreakdown: SourceBreakdown[];
};

export type DepartmentBreakdown = {
  name: string;
  headcount: number;
  benchmarkedCount: number;
  avgMarketComparison: number;
  totalComp: number;
};

export type SourceBreakdown = {
  source: string;
  count: number;
};

export async function composeAnalytics(
  workspaceId: string,
): Promise<AnalyticsPayload> {
  const supabase = createServiceClient();

  const [employeesResult, workspaceBenchmarksResult, settingsResult] =
    await Promise.all([
      supabase
        .from("employees")
        .select(
          "id, first_name, last_name, email, department, role_id, level_id, location_id, base_salary, bonus, equity, status, employment_type, hire_date, performance_rating",
        )
        .eq("workspace_id", workspaceId)
        .neq("status", "inactive"),
      supabase
        .from("salary_benchmarks")
        .select(
          "role_id, location_id, level_id, p10, p25, p50, p75, p90, source, confidence, sample_size, created_at",
        )
        .eq("workspace_id", workspaceId)
        .eq("source", "uploaded")
        .order("created_at", { ascending: false }),
      supabase
        .from("workspace_settings")
        .select("default_currency")
        .eq("workspace_id", workspaceId)
        .maybeSingle(),
    ]);

  if (employeesResult.error) throw new Error(employeesResult.error.message);
  if (workspaceBenchmarksResult.error)
    throw new Error(workspaceBenchmarksResult.error.message);

  const currency: string =
    (settingsResult.data as Record<string, unknown> | null)?.default_currency as string
    || "AED";

  const employeeRows = (employeesResult.data || []) as Record<
    string,
    unknown
  >[];
  const workspaceBenchmarkRows = (workspaceBenchmarksResult.data ||
    []) as Record<string, unknown>[];

  const marketBenchmarks = await (async () => {
    try {
      const aiBenchmarks = await buildAiBenchmarkRows(
        employeeRows.map((row) => ({
          roleId: String(row.role_id || ""),
          locationId: String(row.location_id || ""),
        })),
      );
      if (aiBenchmarks.length > 0) return aiBenchmarks;
    } catch {
      // fall back to pooled market rows
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
    contributor_count:
      "contributor_count" in row ? row.contributor_count : null,
    sample_size: row.sample_size,
  }));

  const employees = employeeInternals.mapRowsToEmployees(
    employeeRows,
    workspaceBenchmarkRows,
    marketBenchmarkRows,
  );

  const activeEmployees = employees.filter((e) => e.status === "active");
  const benchmarkedEmployees = activeEmployees.filter((e) => e.hasBenchmark);
  const benchmarkTrust = summarizeBenchmarkTrust(activeEmployees);
  const totalPayroll = activeEmployees.reduce(
    (sum, e) => sum + e.totalComp,
    0,
  );
  const avgMarketComparison =
    benchmarkedEmployees.length > 0
      ? benchmarkedEmployees.reduce(
          (sum, e) => sum + e.marketComparison,
          0,
        ) / benchmarkedEmployees.length
      : 0;

  const deptMap = new Map<
    string,
    {
      headcount: number;
      benchmarked: number;
      marketCompSum: number;
      totalComp: number;
    }
  >();

  for (const emp of activeEmployees) {
    const dept = emp.department || "Unknown";
    const entry = deptMap.get(dept) || {
      headcount: 0,
      benchmarked: 0,
      marketCompSum: 0,
      totalComp: 0,
    };
    entry.headcount++;
    entry.totalComp += emp.totalComp;
    if (emp.hasBenchmark) {
      entry.benchmarked++;
      entry.marketCompSum += emp.marketComparison;
    }
    deptMap.set(dept, entry);
  }

  const departments: DepartmentBreakdown[] = [...deptMap.entries()]
    .map(([name, d]) => ({
      name,
      headcount: d.headcount,
      benchmarkedCount: d.benchmarked,
      avgMarketComparison:
        d.benchmarked > 0
          ? Math.round((d.marketCompSum / d.benchmarked) * 10) / 10
          : 0,
      totalComp: Math.round(d.totalComp),
    }))
    .sort((a, b) => b.headcount - a.headcount);

  const sourceMap = new Map<string, number>();
  for (const row of marketBenchmarks) {
    const src = row.source || "unknown";
    sourceMap.set(src, (sourceMap.get(src) || 0) + 1);
  }
  const benchmarkSourceBreakdown: SourceBreakdown[] = [...sourceMap.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return {
    currency,
    activeEmployees: activeEmployees.length,
    benchmarkedEmployees: benchmarkedEmployees.length,
    departmentCount: deptMap.size,
    totalPayroll,
    avgMarketComparison: Math.round(avgMarketComparison * 10) / 10,
    marketRowsCount: marketBenchmarks.length,
    marketFreshnessAt: benchmarkTrust.freshestAt,
    benchmarkTrustLabel: benchmarkTrust.primarySourceLabel,
    marketBackedEmployees: benchmarkTrust.marketBacked,
    departments,
    benchmarkSourceBreakdown,
  };
}
