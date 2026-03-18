import { createServiceClient } from "@/lib/supabase/service";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import { __internal } from "@/lib/employees/data-service";
import type { Employee } from "@/lib/employees";

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        maybeSingle?: () => Promise<{ data: unknown | null; error?: { message?: string } | null }>;
      } & Promise<{ data: unknown[] | null; error?: { message?: string } | null }>;
      order?: (
        column: string,
        options: { ascending: boolean },
      ) => {
        limit: (value: number) => Promise<{ data: unknown[] | null; error?: { message?: string } | null }>;
      };
      maybeSingle?: () => Promise<{ data: unknown | null; error?: { message?: string } | null }>;
    };
    upsert?: (
      payload: Record<string, unknown>,
      options?: { onConflict?: string },
    ) => {
      select: (columns?: string) => {
        single: () => Promise<{ data: unknown | null; error?: { message?: string } | null }>;
      };
    };
  };
};

export type BenchmarkCoverageSnapshot = {
  workspace_id: string;
  captured_at: string;
  employee_count: number;
  exact_match_count: number;
  fallback_match_count: number;
  unresolved_count: number;
  low_confidence_count: number;
  market_coverage_rate: number;
  coverage_by_family: Record<string, { total: number; benchmarked: number }>;
  coverage_by_country: Record<string, { total: number; benchmarked: number }>;
};

function incrementCoverageBucket(
  buckets: Record<string, { total: number; benchmarked: number }>,
  key: string,
  hasBenchmark: boolean,
) {
  const current = buckets[key] ?? { total: 0, benchmarked: 0 };
  current.total += 1;
  if (hasBenchmark) current.benchmarked += 1;
  buckets[key] = current;
}

export function buildCoverageSnapshot(workspaceId: string, employees: Employee[]): BenchmarkCoverageSnapshot {
  const activeEmployees = employees.filter((employee) => employee.status === "active");
  const exactMatchCount = activeEmployees.filter(
    (employee) => employee.benchmarkContext?.matchQuality === "exact",
  ).length;
  const fallbackMatchCount = activeEmployees.filter(
    (employee) => employee.hasBenchmark && employee.benchmarkContext?.matchQuality !== "exact",
  ).length;
  const unresolvedCount = activeEmployees.filter((employee) => !employee.hasBenchmark).length;
  const lowConfidenceCount = activeEmployees.filter(
    (employee) => employee.benchmarkContext?.confidence === "Low",
  ).length;
  const coverageByFamily: Record<string, { total: number; benchmarked: number }> = {};
  const coverageByCountry: Record<string, { total: number; benchmarked: number }> = {};

  for (const employee of activeEmployees) {
    incrementCoverageBucket(coverageByFamily, employee.role.family || "Unknown", Boolean(employee.hasBenchmark));
    incrementCoverageBucket(
      coverageByCountry,
      employee.location.country || "Unknown",
      Boolean(employee.hasBenchmark),
    );
  }

  return {
    workspace_id: workspaceId,
    captured_at: new Date().toISOString(),
    employee_count: activeEmployees.length,
    exact_match_count: exactMatchCount,
    fallback_match_count: fallbackMatchCount,
    unresolved_count: unresolvedCount,
    low_confidence_count: lowConfidenceCount,
    market_coverage_rate:
      activeEmployees.length > 0
        ? Math.round(((exactMatchCount + fallbackMatchCount) / activeEmployees.length) * 100)
        : 0,
    coverage_by_family: coverageByFamily,
    coverage_by_country: coverageByCountry,
  };
}

export async function refreshBenchmarkCoverageSnapshot(
  workspaceId: string,
  client: SupabaseLike = createServiceClient() as unknown as SupabaseLike,
): Promise<BenchmarkCoverageSnapshot> {
  const [employeesResult, benchmarksResult, marketBenchmarks] = await Promise.all([
    client.from("employees").select("*").eq("workspace_id", workspaceId),
    client.from("salary_benchmarks").select("*").eq("workspace_id", workspaceId),
    fetchMarketBenchmarks(client as never).catch(() => []),
  ]);

  if (employeesResult.error) {
    throw new Error(employeesResult.error.message || "Failed to load employees for coverage refresh");
  }
  if (benchmarksResult.error) {
    throw new Error(benchmarksResult.error.message || "Failed to load benchmarks for coverage refresh");
  }

  const employees = __internal.mapRowsToEmployees(
    (employeesResult.data || []) as Record<string, unknown>[],
    (benchmarksResult.data || []) as Record<string, unknown>[],
    marketBenchmarks as Record<string, unknown>[],
  );
  const snapshot = buildCoverageSnapshot(workspaceId, employees);

  const upsert = client
    .from("benchmark_coverage_snapshots")
    .upsert?.(
      {
        ...snapshot,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" },
    );

  if (upsert) {
    const { error } = await upsert.select("*").single();
    if (error) {
      throw new Error(error.message || "Failed to persist coverage snapshot");
    }
  }

  return snapshot;
}

export async function loadLatestBenchmarkCoverageSnapshot(
  workspaceId: string,
  client: SupabaseLike,
): Promise<BenchmarkCoverageSnapshot | null> {
  const query = client
    .from("benchmark_coverage_snapshots")
    .select("*")
    .eq("workspace_id", workspaceId);
  const maybeSingle = query.maybeSingle?.bind(query);
  if (maybeSingle) {
    const { data, error } = await maybeSingle();
    if (error) return null;
    return data as BenchmarkCoverageSnapshot | null;
  }

  return null;
}
