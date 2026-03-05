import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { refreshComplianceSnapshot } from "@/lib/compliance/snapshot-service";

export async function GET() {
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let snapshot = data;
  if (!snapshot) {
    try {
      snapshot = await refreshComplianceSnapshot(workspace_id);
    } catch {
      snapshot = null;
    }
  }

  if (!snapshot) {
    return NextResponse.json({
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
      updated_at: null,
    });
  }

  return NextResponse.json({
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
    updated_at: snapshot.updated_at,
  });
}
