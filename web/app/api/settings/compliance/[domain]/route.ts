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

function isCompatibilityError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "42P01") return true;
  const message = (error.message || "").toLowerCase();
  return message.includes("does not exist") || message.includes("not found");
}

function sortByField(rows: Record<string, unknown>[], field: string, asc: boolean) {
  return [...rows].sort((a, b) => {
    const left = a[field];
    const right = b[field];
    if (left === right) return 0;
    if (left == null) return 1;
    if (right == null) return -1;
    const leftText = String(left);
    const rightText = String(right);
    if (leftText === rightText) return 0;
    return asc ? (leftText < rightText ? -1 : 1) : leftText > rightText ? -1 : 1;
  });
}

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
  const ascending = cfg.orderBy !== "event_time" && cfg.orderBy !== "updated_at";
  const { data, error } = await supabase
    .from(cfg.table)
    .select(cfg.select)
    .eq("workspace_id", workspace_id)
    .order(cfg.orderBy, { ascending })
    .limit(200);

  if (error && isCompatibilityError(error)) {
    const fallback = await supabase
      .from(cfg.table)
      .select("*")
      .eq("workspace_id", workspace_id)
      .limit(200);

    if (fallback.error && isCompatibilityError(fallback.error)) {
      return NextResponse.json({ items: [] });
    }
    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }

    const rows = Array.isArray(fallback.data) ? (fallback.data as Record<string, unknown>[]) : [];
    return NextResponse.json({ items: sortByField(rows, cfg.orderBy, ascending) });
  }
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
