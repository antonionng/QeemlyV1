import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "../middleware";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

/**
 * GET /api/v1/sync-status
 * 
 * Returns the current status of all connected integrations and their latest sync results.
 * Requires scope: integrations:read
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request, "integrations:read");
  if (auth.error) return auth.error;

  const supabase = getServiceClient();

  // Fetch all integrations for the workspace
  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("id, provider, category, status, last_sync_at, sync_frequency")
    .eq("workspace_id", auth.workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch latest sync log for each integration
  const integrationsWithLogs = await Promise.all(
    (integrations || []).map(async (integration) => {
      const { data: latestLog } = await supabase
        .from("integration_sync_logs")
        .select("status, records_created, records_updated, records_failed, started_at, completed_at")
        .eq("integration_id", integration.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      return {
        provider: integration.provider,
        category: integration.category,
        status: integration.status,
        last_sync_at: integration.last_sync_at,
        sync_frequency: integration.sync_frequency,
        last_sync_status: latestLog?.status || null,
        records_synced: latestLog
          ? (latestLog.records_created || 0) + (latestLog.records_updated || 0)
          : null,
      };
    })
  );

  return NextResponse.json({ integrations: integrationsWithLogs });
}
