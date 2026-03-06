import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { refreshComplianceSnapshot } from "@/lib/compliance/snapshot-service";
import { fetchMarketBenchmarks, type MarketBenchmark } from "@/lib/benchmarks/platform-market";

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  return (error.message || "").toLowerCase().includes("does not exist");
}

async function emitTimelineEvent(
  queryClient: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createServiceClient>,
  workspaceId: string,
  employeeId: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  await queryClient.from("employee_timeline_events").insert({
    workspace_id: workspaceId,
    employee_id: employeeId,
    event_type: eventType,
    actor_type: "system",
    actor_name: "people_api",
    source_system: "app",
    payload,
  });
}

export async function GET() {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, is_override } = wsContext.context;
  const queryClient = is_override ? createServiceClient() : supabase;

  let marketBenchmarks: MarketBenchmark[] = [];
  try {
    marketBenchmarks = await fetchMarketBenchmarks(queryClient);
  } catch {
    // Non-fatal — market data may not be available yet
  }

  const [employeesResult, benchmarksResult, enrichmentResult, visaResult] = await Promise.all([
    queryClient
      .from("employees")
      .select("*")
      .eq("workspace_id", workspace_id)
      .neq("status", "inactive")
      .order("created_at", { ascending: false }),
    queryClient
      .from("salary_benchmarks")
      .select("role_id,location_id,level_id,p10,p25,p50,p75,p90,valid_from,created_at,source")
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
  ]);

  if (employeesResult.error) {
    return NextResponse.json({ error: employeesResult.error.message }, { status: 500 });
  }
  if (benchmarksResult.error) {
    return NextResponse.json({ error: benchmarksResult.error.message }, { status: 500 });
  }
  if (enrichmentResult.error && !isMissingRelationError(enrichmentResult.error)) {
    return NextResponse.json({ error: enrichmentResult.error.message }, { status: 500 });
  }
  if (visaResult.error && !isMissingRelationError(visaResult.error)) {
    return NextResponse.json({ error: visaResult.error.message }, { status: 500 });
  }

  const avatarByEmployee = new Map<string, string>();
  const enrichmentRows = isMissingRelationError(enrichmentResult.error) ? [] : enrichmentResult.data || [];
  for (const row of enrichmentRows) {
    if (row.employee_id && row.avatar_url) {
      avatarByEmployee.set(String(row.employee_id), String(row.avatar_url));
    }
  }

  const earliestVisaByEmployee = new Map<string, { expiry_date: string | null; visa_status: string | null }>();
  const visaRows = isMissingRelationError(visaResult.error) ? [] : visaResult.data || [];
  for (const row of visaRows) {
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

  return NextResponse.json({
    workspace_id,
    employees: employeesWithProfile,
    benchmarks: benchmarksResult.data || [],
    market_benchmarks: marketBenchmarks,
    diagnostics:
      process.env.NODE_ENV !== "production"
        ? {
            is_override: wsContext.context.is_override,
            override_workspace_id: wsContext.context.override_workspace_id,
            profile_workspace_id: wsContext.context.profile_workspace_id,
          }
        : undefined,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const queryClient = wsContext.context.is_override ? createServiceClient() : supabase;
  const payload = {
    ...body,
    workspace_id: wsContext.context.workspace_id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await queryClient.from("employees").insert(payload).select("*").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await emitTimelineEvent(queryClient, wsContext.context.workspace_id, data.id, "employee_created", {
      changed_fields: Object.keys(body),
    });
  } catch {
    // Keep mutation success even if timeline table is not ready yet.
  }

  try {
    await refreshComplianceSnapshot(wsContext.context.workspace_id);
  } catch {
    // Keep mutation success even if compliance refresh fails.
  }

  return NextResponse.json({ ok: true, employee: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const queryClient = wsContext.context.is_override ? createServiceClient() : supabase;
  const body = (await request.json()) as { action?: string; ids?: string[] };
  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];

  if (body.action !== "archive_many" || ids.length === 0) {
    return NextResponse.json({ error: "Invalid bulk action payload" }, { status: 400 });
  }

  const { error } = await queryClient
    .from("employees")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("workspace_id", wsContext.context.workspace_id)
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await refreshComplianceSnapshot(wsContext.context.workspace_id);
  } catch {
    // Keep mutation success even if compliance refresh fails.
  }

  return NextResponse.json({ ok: true, count: ids.length });
}
