import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runIntegrationSync } from "@/lib/ingestion/integration-sync";
import { getWorkspaceContextOrError } from "@/lib/workspace-access";

/**
 * POST /api/integrations/sync
 *
 * Triggers a manual sync for a connected integration.
 * Uses the same fetch -> normalize -> DQ -> upsert pattern as market ingestion.
 *
 * Body:
 * {
 *   integration_id: string    // ID of the integration to sync
 *   sync_type?: string        // "full" | "incremental" (default: "incremental")
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const workspaceContext = await getWorkspaceContextOrError();
    if (workspaceContext.error) {
      return workspaceContext.error;
    }
    const workspaceId = workspaceContext.context.workspace_id;

    const body = await request.json();
    const { integration_id, sync_type = "incremental" } = body;

    if (!integration_id) {
      return NextResponse.json({ error: "Missing integration_id" }, { status: 400 });
    }

    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("id", integration_id)
      .eq("workspace_id", workspaceId)
      .single();

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    await supabase
      .from("integrations")
      .update({ status: "syncing", updated_at: new Date().toISOString() })
      .eq("id", integration_id)
      .eq("workspace_id", workspaceId);

    const { data: syncLog } = await supabase
      .from("integration_sync_logs")
      .insert({
        integration_id,
        sync_type,
        status: "success",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const result = await runIntegrationSync(integration_id);

    await supabase
      .from("integrations")
      .update({
        status: result.status === "failed" ? "error" : "connected",
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration_id)
      .eq("workspace_id", workspaceId);

    if (syncLog) {
      await supabase
        .from("integration_sync_logs")
        .update({
          status: result.status,
          records_created: result.records_created,
          records_updated: result.records_updated,
          records_failed: result.records_failed,
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncLog.id);
    }

    return NextResponse.json({
      message: "Sync completed",
      sync_log_id: syncLog?.id,
      ...result,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
