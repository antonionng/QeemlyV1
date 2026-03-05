import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { refreshComplianceSnapshot } from "@/lib/compliance/snapshot-service";

export async function POST() {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  try {
    const snapshot = await refreshComplianceSnapshot(wsContext.context.workspace_id);
    return NextResponse.json({
      ok: true,
      workspace_id: wsContext.context.workspace_id,
      compliance_score: Number(snapshot.compliance_score || 0),
      updated_at: snapshot.updated_at,
      ai_scoring_metadata: snapshot.ai_scoring_metadata || {},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh compliance snapshot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
