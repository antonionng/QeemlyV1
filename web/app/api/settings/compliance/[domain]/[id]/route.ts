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
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

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
  if ("error" in parsed && typeof parsed.error === "string") {
    const errorMessage = parsed.error;
    const fieldKey = errorMessage.match(/^([a-zA-Z0-9_.]+)/)?.[1];
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: fieldKey ? { [fieldKey]: errorMessage } : undefined,
    });
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
  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not update this compliance record right now.",
      logLabel: "Compliance record update failed",
    });
  }

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
  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not delete this compliance record right now.",
      logLabel: "Compliance record delete failed",
    });
  }

  const refresh = await safeRefreshComplianceSnapshot(workspace_id);
  return NextResponse.json({
    success: true,
    refresh_warning: refresh.ok ? null : refresh.error,
  });
}
