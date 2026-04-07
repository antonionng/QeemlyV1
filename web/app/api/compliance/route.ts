import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { refreshComplianceSnapshot } from "@/lib/compliance/snapshot-service";
import { jsonServerError } from "@/lib/errors/http";

function isMissingRelationError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  return (error.message || "").toLowerCase().includes("does not exist");
}

function isSnapshotEffectivelyEmpty(snapshot: Record<string, unknown> | null): boolean {
  if (!snapshot) return true;
  const score = Number(snapshot.compliance_score || 0);
  const hasAnyArrayData =
    ((snapshot.risk_items as unknown[]) || []).length > 0 ||
    ((snapshot.pay_equity_kpis as unknown[]) || []).length > 0 ||
    ((snapshot.equity_levels as unknown[]) || []).length > 0 ||
    ((snapshot.policy_items as unknown[]) || []).length > 0 ||
    ((snapshot.regulatory_updates as unknown[]) || []).length > 0 ||
    ((snapshot.deadline_items as unknown[]) || []).length > 0 ||
    ((snapshot.visa_stats as unknown[]) || []).length > 0 ||
    ((snapshot.visa_timeline as unknown[]) || []).length > 0 ||
    ((snapshot.document_items as unknown[]) || []).length > 0 ||
    ((snapshot.audit_log_items as unknown[]) || []).length > 0;
  const hasAnyEmployeesHint =
    ((snapshot.ai_scoring_metadata as { activeEmployees?: number; active_employees?: number } | null)
      ?.activeEmployees || 0) > 0 ||
    ((snapshot.ai_scoring_metadata as { activeEmployees?: number; active_employees?: number } | null)
      ?.active_employees || 0) > 0;
  return score <= 0 && !hasAnyArrayData && !hasAnyEmployeesHint;
}

function isSnapshotStale(snapshot: Record<string, unknown> | null): boolean {
  if (!snapshot || !snapshot.updated_at) return true;
  const updatedAt = Date.parse(String(snapshot.updated_at));
  if (!Number.isFinite(updatedAt)) return true;
  const staleHours = (Date.now() - updatedAt) / (1000 * 60 * 60);
  return staleHours > 24;
}

function buildSnapshotPayload(snapshot: Record<string, unknown> | null) {
  if (!snapshot) {
    return {
      compliance_score: 0,
      risk_items: [],
      pay_equity_kpis: [],
      equity_levels: [],
      policy_items: [],
      regulatory_updates: [],
      deadline_items: [],
      visa_stats: [],
      visa_timeline: [],
      document_items: [],
      audit_log_items: [],
      ai_scoring_metadata: {},
      uses_synthetic_fallback: false,
      synthetic_fallback_domains: [],
      updated_at: null,
    };
  }

  return {
    compliance_score: Number(snapshot.compliance_score || 0),
    risk_items: snapshot.risk_items || [],
    pay_equity_kpis: snapshot.pay_equity_kpis || [],
    equity_levels: snapshot.equity_levels || [],
    policy_items: snapshot.policy_items || [],
    regulatory_updates: snapshot.regulatory_updates || [],
    deadline_items: snapshot.deadline_items || [],
    visa_stats: snapshot.visa_stats || [],
    visa_timeline: snapshot.visa_timeline || [],
    document_items: snapshot.document_items || [],
    audit_log_items: snapshot.audit_log_items || [],
    ai_scoring_metadata: snapshot.ai_scoring_metadata || {},
    uses_synthetic_fallback: Boolean(
      (snapshot.ai_scoring_metadata as { uses_synthetic_fallback?: boolean } | null)
        ?.uses_synthetic_fallback,
    ),
    synthetic_fallback_domains: Array.isArray(
      (snapshot.ai_scoring_metadata as { synthetic_fallback_domains?: unknown[] } | null)
        ?.synthetic_fallback_domains,
    )
      ? (
          snapshot.ai_scoring_metadata as { synthetic_fallback_domains?: unknown[] } | null
        )?.synthetic_fallback_domains
          ?.filter((entry): entry is string => typeof entry === "string")
          ?? []
      : [],
    updated_at: snapshot.updated_at || null,
  };
}

export async function GET() {
  const isDev = process.env.NODE_ENV !== "production";
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id } = wsContext.context;
  const { data, error } = await supabase
    .from("compliance_snapshots")
    .select("*")
    .eq("workspace_id", workspace_id)
    .maybeSingle();

  if (error && !isMissingRelationError(error)) {
    return jsonServerError(error, {
      defaultMessage: "We could not load your compliance summary right now.",
      logLabel: "Compliance snapshot load failed",
    });
  }

  let snapshot = data as Record<string, unknown> | null;
  const staleSnapshot = isSnapshotStale(snapshot);
  const shouldRecompute = isSnapshotEffectivelyEmpty(snapshot) || staleSnapshot;
  if (shouldRecompute) {
    try {
      snapshot = (await refreshComplianceSnapshot(workspace_id)) as Record<string, unknown>;
    } catch {
      // Keep existing snapshot response if refresh cannot run.
    }
  }
  const payload = buildSnapshotPayload(snapshot);

  if (isDev) {
    return NextResponse.json({
      ...payload,
      diagnostics: {
        workspace_id: wsContext.context.workspace_id,
        is_override: wsContext.context.is_override,
        override_workspace_id: wsContext.context.override_workspace_id,
        profile_workspace_id: wsContext.context.profile_workspace_id,
        is_super_admin: wsContext.context.is_super_admin,
        recomputed: shouldRecompute,
        stale_snapshot: staleSnapshot,
      },
    });
  }

  return NextResponse.json(payload);
}
