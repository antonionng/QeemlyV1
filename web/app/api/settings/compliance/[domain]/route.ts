import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DOMAIN_CONFIG,
  getWorkspaceContextOrError,
  isComplianceDomain,
  requireAdminForWorkspace,
  safeRefreshComplianceSnapshot,
  sanitizeDomainPayload,
} from "../_shared";

type Params = { params: Promise<{ domain: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { domain } = await params;
  if (!isComplianceDomain(domain)) {
    return NextResponse.json({ error: "Unknown compliance domain" }, { status: 404 });
  }
  const resolved = await getWorkspaceContextOrError();
  if ("error" in resolved) return resolved.error;

  const supabase = await createClient();
  const { workspace_id } = resolved.context;
  const cfg = DOMAIN_CONFIG[domain];
  const { data, error } = await supabase
    .from(cfg.table)
    .select(cfg.select)
    .eq("workspace_id", workspace_id)
    .order(cfg.orderBy, { ascending: cfg.orderBy !== "event_time" && cfg.orderBy !== "updated_at" })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { domain } = await params;
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
  const parsed = sanitizeDomainPayload(domain, body, "create");
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const cfg = DOMAIN_CONFIG[domain];
  const { workspace_id } = resolved.context;
  const { data, error } = await supabase
    .from(cfg.table)
    .insert({ workspace_id, ...parsed.updates })
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
