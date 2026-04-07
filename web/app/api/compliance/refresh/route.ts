import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { refreshComplianceSnapshot } from "@/lib/compliance/snapshot-service";
import { jsonServerError } from "@/lib/errors/http";

function isRecoverableConfigError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("invalid api key") ||
    lower.includes("missing openai_api_key") ||
    lower.includes("supabase_service_role_key") ||
    lower.includes("supabase")
  );
}

export async function POST() {
  const isDev = process.env.NODE_ENV !== "production";
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  try {
    const snapshot = await refreshComplianceSnapshot(wsContext.context.workspace_id);
    const payload = {
      ok: true,
      workspace_id: wsContext.context.workspace_id,
      compliance_score: Number(snapshot.compliance_score || 0),
      updated_at: snapshot.updated_at,
      ai_scoring_metadata: snapshot.ai_scoring_metadata || {},
    };
    if (isDev) {
      return NextResponse.json({
        ...payload,
        diagnostics: {
          is_override: wsContext.context.is_override,
          override_workspace_id: wsContext.context.override_workspace_id,
          profile_workspace_id: wsContext.context.profile_workspace_id,
          is_super_admin: wsContext.context.is_super_admin,
        },
      });
    }
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh compliance snapshot";
    if (isRecoverableConfigError(message)) {
      const payload = {
        ok: false,
        workspace_id: wsContext.context.workspace_id,
        compliance_score: 0,
        updated_at: null,
        ai_scoring_metadata: { missing_data: ["refresh_unavailable"] },
        error: "Compliance refresh is temporarily unavailable.",
        message: "Compliance refresh is temporarily unavailable.",
        code: "service_unavailable",
        action: "Try again in a few minutes.",
      };
      if (isDev) {
        return NextResponse.json({
          ...payload,
          diagnostics: {
            is_override: wsContext.context.is_override,
            override_workspace_id: wsContext.context.override_workspace_id,
            profile_workspace_id: wsContext.context.profile_workspace_id,
            is_super_admin: wsContext.context.is_super_admin,
          },
        });
      }
      return NextResponse.json(payload);
    }
    return jsonServerError(error, {
      defaultMessage: "We could not refresh compliance data right now.",
      logLabel: "Compliance refresh failed",
    });
  }
}
