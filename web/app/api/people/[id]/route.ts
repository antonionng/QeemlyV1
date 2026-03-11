import { NextRequest, NextResponse } from "next/server";
import { refreshPlatformMarketPoolBestEffort } from "@/lib/benchmarks/platform-market-sync";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { refreshComplianceSnapshot } from "@/lib/compliance/snapshot-service";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const { id } = await params;
  const queryClient = wsContext.context.is_override ? createServiceClient() : supabase;

  const [employeeResult, enrichmentResult, visaResult, contributionResult, equityResult] = await Promise.all([
    queryClient
      .from("employees")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", wsContext.context.workspace_id)
      .single(),
    queryClient
      .from("employee_profile_enrichment")
      .select("*")
      .eq("employee_id", id)
      .eq("workspace_id", wsContext.context.workspace_id)
      .maybeSingle(),
    queryClient
      .from("employee_visa_records")
      .select("*")
      .eq("employee_id", id)
      .eq("workspace_id", wsContext.context.workspace_id)
      .order("expiry_date", { ascending: true }),
    queryClient
      .from("employee_contribution_snapshots")
      .select("*")
      .eq("employee_id", id)
      .eq("workspace_id", wsContext.context.workspace_id)
      .order("effective_date", { ascending: false }),
    queryClient
      .from("equity_grants")
      .select("*")
      .eq("employee_id", id)
      .eq("workspace_id", wsContext.context.workspace_id)
      .order("grant_date", { ascending: false }),
  ]);

  if (employeeResult.error) {
    return NextResponse.json({ error: employeeResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    employee: employeeResult.data,
    profileEnrichment: enrichmentResult.data || null,
    visaRecords: visaResult.data || [],
    contributionSnapshots: contributionResult.data || [],
    equityGrants: equityResult.data || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const { id } = await params;
  const queryClient = wsContext.context.is_override ? createServiceClient() : supabase;
  const updates = (await request.json()) as Record<string, unknown>;

  const { data, error } = await queryClient
    .from("employees")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", wsContext.context.workspace_id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await emitTimelineEvent(queryClient, wsContext.context.workspace_id, id, "profile_updated", {
      changed_fields: Object.keys(updates),
    });
  } catch {
    // Keep mutation success even if timeline table is not ready yet.
  }

  try {
    await refreshComplianceSnapshot(wsContext.context.workspace_id);
  } catch {
    // Keep mutation success even if compliance refresh fails.
  }
  await refreshPlatformMarketPoolBestEffort();

  return NextResponse.json({ ok: true, employee: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const { id } = await params;
  const queryClient = wsContext.context.is_override ? createServiceClient() : supabase;

  const { error } = await queryClient
    .from("employees")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", wsContext.context.workspace_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await emitTimelineEvent(queryClient, wsContext.context.workspace_id, id, "profile_updated", {
      changed_fields: ["status"],
      status: "inactive",
    });
  } catch {
    // Keep mutation success even if timeline table is not ready yet.
  }

  try {
    await refreshComplianceSnapshot(wsContext.context.workspace_id);
  } catch {
    // Keep mutation success even if compliance refresh fails.
  }
  await refreshPlatformMarketPoolBestEffort();

  return NextResponse.json({ ok: true, id });
}
