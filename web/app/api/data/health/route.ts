/**
 * GET /api/data/health
 * Returns data freshness and recent sync status for the current workspace.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) {
    return NextResponse.json({
      freshness: [],
      syncLogs: [],
    });
  }

  const service = createServiceClient();

  const [freshnessRes, integrationsRes] = await Promise.all([
    service
      .from("data_freshness_metrics")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .order("computed_at", { ascending: false }),
    service
      .from("integrations")
      .select("id")
      .eq("workspace_id", profile.workspace_id)
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
