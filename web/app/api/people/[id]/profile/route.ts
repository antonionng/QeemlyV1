import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { refreshComplianceSnapshot } from "@/lib/compliance/snapshot-service";

type QueryClient = Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createServiceClient>;

async function loadProfileAggregate(queryClient: QueryClient, workspaceId: string, employeeId: string) {
  const [employeeResult, enrichmentResult, historyResult, contributionResult, equityResult, visaResult, timelineResult] =
    await Promise.all([
      queryClient
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .eq("workspace_id", workspaceId)
        .single(),
      queryClient
        .from("employee_profile_enrichment")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("employee_id", employeeId)
        .maybeSingle(),
      queryClient
        .from("compensation_history")
        .select("id, effective_date, base_salary, bonus, equity, currency, change_reason, change_percentage, created_at")
        .eq("employee_id", employeeId)
        .order("effective_date", { ascending: false }),
      queryClient
        .from("employee_contribution_snapshots")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("employee_id", employeeId)
        .order("effective_date", { ascending: false }),
      queryClient
        .from("equity_grants")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("employee_id", employeeId)
        .order("grant_date", { ascending: false }),
      queryClient
        .from("employee_visa_records")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("employee_id", employeeId)
        .order("expiry_date", { ascending: true }),
      queryClient
        .from("employee_timeline_events")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("employee_id", employeeId)
        .order("occurred_at", { ascending: false })
        .limit(200),
    ]);

  if (employeeResult.error) {
    throw new Error(employeeResult.error.message);
  }

  return {
    employee: employeeResult.data,
    profileEnrichment: enrichmentResult.data || null,
    compensationHistory: (historyResult.data || []).map((row) => ({
      id: row.id,
      effectiveDate: row.effective_date,
      baseSalary: Number(row.base_salary) || 0,
      bonus: row.bonus != null ? Number(row.bonus) : 0,
      equity: row.equity != null ? Number(row.equity) : 0,
      currency: row.currency || "AED",
      changeReason: row.change_reason,
      changePercentage: row.change_percentage != null ? Number(row.change_percentage) : null,
      createdAt: row.created_at,
    })),
    contributionSnapshots: contributionResult.data || [],
    equityGrants: equityResult.data || [],
    visaRecords: visaResult.data || [],
    timeline: timelineResult.data || [],
  };
}

async function emitTimelineEvent(
  queryClient: QueryClient,
  workspaceId: string,
  employeeId: string,
  eventType: string,
  payload: Record<string, unknown>,
  actorType = "system"
) {
  await queryClient.from("employee_timeline_events").insert({
    workspace_id: workspaceId,
    employee_id: employeeId,
    event_type: eventType,
    actor_type: actorType,
    actor_name: "profile_api",
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

  try {
    const aggregate = await loadProfileAggregate(queryClient, wsContext.context.workspace_id, id);
    return NextResponse.json({ ok: true, ...aggregate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
  const workspaceId = wsContext.context.workspace_id;
  const queryClient = wsContext.context.is_override ? createServiceClient() : supabase;
  const body = (await request.json()) as Record<string, unknown>;

  const employeeUpdates = (body.employeeUpdates || null) as Record<string, unknown> | null;
  const profileEnrichment = (body.profileEnrichment || null) as Record<string, unknown> | null;
  const visaRecords = Array.isArray(body.visaRecords) ? (body.visaRecords as Record<string, unknown>[]) : null;
  const contributionSnapshots = Array.isArray(body.contributionSnapshots)
    ? (body.contributionSnapshots as Record<string, unknown>[])
    : null;
  const equityGrants = Array.isArray(body.equityGrants) ? (body.equityGrants as Record<string, unknown>[]) : null;

  const { data: existingEmployee } = await queryClient
    .from("employees")
    .select("id")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!existingEmployee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  if (employeeUpdates && Object.keys(employeeUpdates).length > 0) {
    const { error } = await queryClient
      .from("employees")
      .update({ ...employeeUpdates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await emitTimelineEvent(queryClient, workspaceId, id, "profile_updated", {
      changed_fields: Object.keys(employeeUpdates),
    });
  }

  if (profileEnrichment) {
    const { error } = await queryClient.from("employee_profile_enrichment").upsert(
      {
        ...profileEnrichment,
        employee_id: id,
        workspace_id: workspaceId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await emitTimelineEvent(queryClient, workspaceId, id, "profile_updated", {
      section: "profileEnrichment",
      changed_fields: Object.keys(profileEnrichment),
    });
  }

  if (visaRecords) {
    const { error: deleteError } = await queryClient
      .from("employee_visa_records")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("employee_id", id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    if (visaRecords.length > 0) {
      const payload = visaRecords.map((record) => ({
        ...record,
        employee_id: id,
        workspace_id: workspaceId,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await queryClient.from("employee_visa_records").insert(payload);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await emitTimelineEvent(queryClient, workspaceId, id, "visa_updated", {
      records: visaRecords.length,
    });
  }

  if (contributionSnapshots) {
    const { error: deleteError } = await queryClient
      .from("employee_contribution_snapshots")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("employee_id", id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    if (contributionSnapshots.length > 0) {
      const payload = contributionSnapshots.map((snapshot) => ({
        ...snapshot,
        employee_id: id,
        workspace_id: workspaceId,
      }));
      const { error } = await queryClient.from("employee_contribution_snapshots").insert(payload);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await emitTimelineEvent(queryClient, workspaceId, id, "contribution_updated", {
      records: contributionSnapshots.length,
    });
  }

  if (equityGrants) {
    const { error: deleteError } = await queryClient
      .from("equity_grants")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("employee_id", id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    if (equityGrants.length > 0) {
      const payload = equityGrants.map((grant) => ({
        ...grant,
        employee_id: id,
        workspace_id: workspaceId,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await queryClient.from("equity_grants").insert(payload);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await emitTimelineEvent(queryClient, workspaceId, id, "equity_grant_updated", {
      records: equityGrants.length,
    });
  }

  try {
    await refreshComplianceSnapshot(workspaceId);
  } catch {
    // Keep profile mutation success even if compliance refresh fails.
  }

  const aggregate = await loadProfileAggregate(queryClient, workspaceId, id);
  return NextResponse.json({ ok: true, ...aggregate });
}
