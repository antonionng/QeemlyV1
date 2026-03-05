import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";

export async function GET() {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id } = wsContext.context;

  const [{ data: subscription }, { data: plans }, { data: invoices }] = await Promise.all([
    supabase
      .from("workspace_billing_subscriptions")
      .select("*, billing_plans(*)")
      .eq("workspace_id", workspace_id)
      .single(),
    supabase
      .from("billing_plans")
      .select("*")
      .eq("is_active", true)
      .order("monthly_price", { ascending: true }),
    supabase
      .from("billing_invoices")
      .select("*")
      .eq("workspace_id", workspace_id)
      .order("issued_at", { ascending: false })
      .limit(12),
  ]);

  return NextResponse.json({
    subscription: subscription || null,
    plans: plans || [],
    invoices: invoices || [],
  });
}
