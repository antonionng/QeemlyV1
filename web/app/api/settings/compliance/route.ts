import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getWorkspaceContextOrError,
  requireAdminForWorkspace,
  sanitizeComplianceSettingsPayload,
} from "./_shared";
import {
  DEFAULT_COMPLIANCE_SETTINGS,
} from "@/lib/compliance/settings-schema";

export async function GET() {
  const resolved = await getWorkspaceContextOrError();
  if ("error" in resolved) return resolved.error;

  const supabase = await createClient();
  const { workspace_id } = resolved.context;

  const [{ data: settings, error }, { data: syncRows }] = await Promise.all([
    supabase
      .from("workspace_compliance_settings")
      .select("*")
      .eq("workspace_id", workspace_id)
      .maybeSingle(),
    supabase
      .from("integration_sync_state")
      .select("id,last_success_at,updated_at,metadata")
      .eq("workspace_id", workspace_id),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    settings: settings || { workspace_id, ...DEFAULT_COMPLIANCE_SETTINGS },
    ingestion: {
      integration_sync_count: syncRows?.length || 0,
      last_integration_success_at:
        syncRows?.map((row) => row.last_success_at).filter(Boolean).sort().at(-1) || null,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const resolved = await getWorkspaceContextOrError();
  if ("error" in resolved) return resolved.error;
  const adminError = await requireAdminForWorkspace(
    resolved.context.user_id,
    resolved.context.is_super_admin
  );
  if (adminError) return adminError;

  const body = (await request.json()) as Record<string, unknown>;
  const parsed = sanitizeComplianceSettingsPayload(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const updates = { ...parsed.updates, updated_at: new Date().toISOString() };

  const supabase = await createClient();
  const { workspace_id } = resolved.context;
  const { data, error } = await supabase
    .from("workspace_compliance_settings")
    .upsert({ workspace_id, ...updates }, { onConflict: "workspace_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, settings: data });
}
