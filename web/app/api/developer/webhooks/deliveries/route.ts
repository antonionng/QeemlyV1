import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContextOrError } from "@/lib/workspace-access";
import { jsonServerError } from "@/lib/errors/http";

/**
 * GET /api/developer/webhooks/deliveries
 * 
 * Returns recent webhook delivery logs for the workspace's webhooks.
 * 
 * Query params:
 *   webhook_id?: string    // Filter by specific webhook
 *   limit?: number         // Number of records (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const workspaceContext = await getWorkspaceContextOrError();
    if (workspaceContext.error) {
      return workspaceContext.error;
    }

    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get("webhook_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    // Get workspace webhook IDs first
    const { data: webhooks } = await supabase
      .from("outgoing_webhooks")
      .select("id")
      .eq("workspace_id", workspaceContext.context.workspace_id);

    const webhookIds = (webhooks || []).map((w) => w.id);

    if (webhookIds.length === 0) {
      return NextResponse.json({ deliveries: [] });
    }

    let query = supabase
      .from("webhook_delivery_logs")
      .select("*")
      .in("webhook_id", webhookIds)
      .order("attempted_at", { ascending: false })
      .limit(limit);

    if (webhookId) {
      query = query.eq("webhook_id", webhookId);
    }

    const { data: deliveries, error } = await query;

    if (error) {
      return jsonServerError(error, {
        defaultMessage: "We could not load webhook deliveries right now.",
        logLabel: "Webhook deliveries load failed",
      });
    }

    return NextResponse.json({ deliveries: deliveries || [] });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
