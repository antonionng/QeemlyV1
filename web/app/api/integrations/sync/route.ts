import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/integrations/sync
 * 
 * Triggers a manual sync for a connected integration.
 * Pulls latest data from the provider and updates Qeemly records.
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { integration_id, sync_type = "incremental" } = body;

    if (!integration_id) {
      return NextResponse.json({ error: "Missing integration_id" }, { status: 400 });
    }

    // Verify integration belongs to user's workspace
    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("id", integration_id)
      .eq("workspace_id", profile?.workspace_id)
      .single();

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Update status to syncing
    await supabase
      .from("integrations")
      .update({ status: "syncing", updated_at: new Date().toISOString() })
      .eq("id", integration_id);

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from("integration_sync_logs")
      .insert({
        integration_id,
        sync_type,
        status: "success", // Will be updated when sync completes
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    // TODO: Implement actual sync logic per provider:
    // - Merge.dev: GET /api/hris/v1/employees with account_token
    // - ZenHR: GET /api/employees with API key
    // - Bayzat: GET /api/employees with API key
    // TODO: Map provider data to Qeemly employee schema
    // TODO: Upsert employees and compensation_history
    // TODO: Update sync log with results

    // Placeholder: simulate sync completion
    await supabase
      .from("integrations")
      .update({
        status: "connected",
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration_id);

    if (syncLog) {
      await supabase
        .from("integration_sync_logs")
        .update({
          status: "success",
          records_created: 0,
          records_updated: 0,
          records_failed: 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncLog.id);
    }

    return NextResponse.json({
      message: "Sync initiated",
      sync_log_id: syncLog?.id,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
