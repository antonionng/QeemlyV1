import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DOMAIN_CONFIG,
  getWorkspaceContextOrError,
  isComplianceDomain,
  requireAdminForWorkspace,
  safeRefreshComplianceSnapshot,
  sanitizeDomainPayload,
} from "../../_shared";

type Params = { params: Promise<{ domain: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { domain, id } = await params;
  if (!isComplianceDomain(domain)) {
    return NextResponse.json({ error: "Unknown compliance domain" }, { status: 404 });
  }
  const resolved = await getWorkspaceContextOrError();
  if ("error" in resolved) return resolved.error;
  const adminError = await requireAdminForWorkspace(
    resolved.context.user_id,
    resolved.context.is_super_admin
  );
  if (adminError) return adminError;

  const body = (await request.json()) as Record<string, unknown>;
  const parsed = sanitizeDomainPayload(domain, body, "update");
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const cfg = DOMAIN_CONFIG[domain];
  const supabase = await createClient();
  const { workspace_id } = resolved.context;
  const { data, error } = await supabase
    .from(cfg.table)
    .update({ ...parsed.updates, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspace_id)
    .eq("id", id)
    .select(cfg.select)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const refresh = await safeRefreshComplianceSnapshot(workspace_id);
  return NextResponse.json({
    success: true,
    item: data,
    refresh_warning: refresh.ok ? null : refresh.error,
  });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { domain, id } = await params;
  if (!isComplianceDomain(domain)) {
    return NextResponse.json({ error: "Unknown compliance domain" }, { status: 404 });
  }
  const resolved = await getWorkspaceContextOrError();
  if ("error" in resolved) return resolved.error;
  const adminError = await requireAdminForWorkspace(
    resolved.context.user_id,
    resolved.context.is_super_admin
  );
  if (adminError) return adminError;

  const cfg = DOMAIN_CONFIG[domain];
  const supabase = await createClient();
  const { workspace_id } = resolved.context;
  const { error } = await supabase
    .from(cfg.table)
    .delete()
    .eq("workspace_id", workspace_id)
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const refresh = await safeRefreshComplianceSnapshot(workspace_id);
  return NextResponse.json({
    success: true,
    refresh_warning: refresh.ok ? null : refresh.error,
  });
}
