/**
 * GET /api/data/health
 * Returns data freshness and recent sync status for the current workspace.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContextOrError } from "@/lib/workspace-access";
import { toClientSafeError } from "@/lib/errors/client-safe";

export async function GET() {
  const workspaceContext = await getWorkspaceContextOrError();
  if (workspaceContext.error) {
    return workspaceContext.error;
  }
  const { workspace_id } = workspaceContext.context;

  let service: ReturnType<typeof createServiceClient>;
  try {
    service = createServiceClient();
  } catch (error) {
    const problem = toClientSafeError(error, {
      defaultMessage: "Data health details are temporarily unavailable. Please try again in a few minutes.",
      action: "Try again in a few minutes.",
    });
    return NextResponse.json({
      freshness: [],
      syncLogs: [],
      warning: problem.message,
    });
  }

  const [freshnessRes, integrationsRes] = await Promise.all([
    service
      .from("data_freshness_metrics")
      .select("*")
      .eq("workspace_id", workspace_id)
      .order("computed_at", { ascending: false }),
    service
      .from("integrations")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("category", "hris"),
  ]);

  const integrationIds = (integrationsRes?.data ?? []).map((i: { id: string }) => i.id);
  let syncLogs: { data: unknown[] } = { data: [] };
  if (integrationIds.length > 0) {
    const res = await service
      .from("integration_sync_logs")
      .select("id, integration_id, status, records_created, records_updated, records_failed, started_at, completed_at")
      .in("integration_id", integrationIds)
      .order("started_at", { ascending: false })
      .limit(10);
    syncLogs = { data: res.data ?? [] };
  }

  return NextResponse.json({
    freshness: freshnessRes?.data ?? [],
    syncLogs: syncLogs.data,
  });
}
