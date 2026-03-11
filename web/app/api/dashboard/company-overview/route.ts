import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import {
  fetchMarketBenchmarks,
  invalidateMarketBenchmarkCache,
} from "@/lib/benchmarks/platform-market";
import { __internal } from "@/lib/employees/data-service";
import {
  buildCompanyOverviewSnapshot,
  type OverviewFreshnessRow,
  type OverviewSyncLog,
} from "@/lib/dashboard/company-overview";

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  return (error.message || "").toLowerCase().includes("does not exist");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("refresh") === "1") {
    invalidateMarketBenchmarkCache();
  }

  const supabase = await createClient();
  const workspaceContext = await getWorkspaceContext();
  if (!workspaceContext.context) {
    return NextResponse.json({ error: workspaceContext.error }, { status: workspaceContext.status });
  }

  const { workspace_id, is_override } = workspaceContext.context;
  const queryClient = is_override ? createServiceClient() : supabase;

  const marketBenchmarks = await fetchMarketBenchmarks(queryClient).catch(() => []);

  const [
    employeesResult,
    benchmarksResult,
    enrichmentResult,
    visaResult,
    freshnessResult,
    integrationsResult,
  ] = await Promise.all([
    queryClient
      .from("employees")
      .select("*")
      .eq("workspace_id", workspace_id)
      .neq("status", "inactive")
      .order("created_at", { ascending: false }),
    queryClient
      .from("salary_benchmarks")
      .select("role_id,location_id,level_id,p10,p25,p50,p75,p90,valid_from,created_at,source,sample_size,confidence")
      .eq("workspace_id", workspace_id)
      .order("valid_from", { ascending: false })
      .order("created_at", { ascending: false }),
    queryClient
      .from("employee_profile_enrichment")
      .select("employee_id,avatar_url")
      .eq("workspace_id", workspace_id),
    queryClient
      .from("employee_visa_records")
      .select("employee_id,expiry_date,visa_status")
      .eq("workspace_id", workspace_id)
      .order("expiry_date", { ascending: true }),
    queryClient
      .from("data_freshness_metrics")
      .select("id,metric_type,last_updated_at,record_count,confidence,computed_at")
      .eq("workspace_id", workspace_id)
      .order("computed_at", { ascending: false }),
    queryClient
      .from("integrations")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("category", "hris"),
  ]);

  if (employeesResult.error) {
    return NextResponse.json({ error: employeesResult.error.message }, { status: 500 });
  }
  if (benchmarksResult.error) {
    return NextResponse.json({ error: benchmarksResult.error.message }, { status: 500 });
  }
  if (freshnessResult.error && !isMissingRelationError(freshnessResult.error)) {
    return NextResponse.json({ error: freshnessResult.error.message }, { status: 500 });
  }
  if (integrationsResult.error && !isMissingRelationError(integrationsResult.error)) {
    return NextResponse.json({ error: integrationsResult.error.message }, { status: 500 });
  }
  if (enrichmentResult.error && !isMissingRelationError(enrichmentResult.error)) {
    return NextResponse.json({ error: enrichmentResult.error.message }, { status: 500 });
  }
  if (visaResult.error && !isMissingRelationError(visaResult.error)) {
    return NextResponse.json({ error: visaResult.error.message }, { status: 500 });
  }

  const integrationIds = ((integrationsResult.data ?? []) as Array<{ id: string }>).map(
    (integration) => integration.id,
  );

  let syncLogs: OverviewSyncLog[] = [];
  if (integrationIds.length > 0) {
    const syncLogsResult = await queryClient
      .from("integration_sync_logs")
      .select("id, integration_id, status, records_created, records_updated, records_failed, started_at, completed_at")
      .in("integration_id", integrationIds)
      .order("started_at", { ascending: false })
      .limit(10);

    if (syncLogsResult.error && !isMissingRelationError(syncLogsResult.error)) {
      return NextResponse.json({ error: syncLogsResult.error.message }, { status: 500 });
    }

    syncLogs = (syncLogsResult.data ?? []).map((row) => ({
      id: String(row.id),
      status: String(row.status),
      records_created: Number(row.records_created ?? 0),
      records_updated: Number(row.records_updated ?? 0),
      records_failed: Number(row.records_failed ?? 0),
      started_at: String(row.started_at),
      completed_at: row.completed_at ? String(row.completed_at) : null,
    }));
  }

  const avatarByEmployee = new Map<string, string>();
  for (const row of isMissingRelationError(enrichmentResult.error) ? [] : enrichmentResult.data || []) {
    if (row.employee_id && row.avatar_url) {
      avatarByEmployee.set(String(row.employee_id), String(row.avatar_url));
    }
  }

  const earliestVisaByEmployee = new Map<
    string,
    { expiry_date: string | null; visa_status: string | null }
  >();
  for (const row of isMissingRelationError(visaResult.error) ? [] : visaResult.data || []) {
    if (!row.employee_id || earliestVisaByEmployee.has(String(row.employee_id))) continue;
    earliestVisaByEmployee.set(String(row.employee_id), {
      expiry_date: row.expiry_date ? String(row.expiry_date) : null,
      visa_status: row.visa_status ? String(row.visa_status) : null,
    });
  }

  const employeesWithProfile = (employeesResult.data || []).map((employee) => {
    const visa = earliestVisaByEmployee.get(String(employee.id));
    return {
      ...employee,
      avatar_url: avatarByEmployee.get(String(employee.id)) || null,
      visa_expiry_date: visa?.expiry_date || null,
      visa_status: visa?.visa_status || null,
    };
  });

  const employees = __internal.mapRowsToEmployees(
    employeesWithProfile,
    benchmarksResult.data || [],
    marketBenchmarks,
  );
  const snapshot = buildCompanyOverviewSnapshot({
    employees,
    freshness: ((isMissingRelationError(freshnessResult.error) ? [] : freshnessResult.data) ||
      []) as OverviewFreshnessRow[],
    syncLogs,
  });

  return NextResponse.json(snapshot);
}
