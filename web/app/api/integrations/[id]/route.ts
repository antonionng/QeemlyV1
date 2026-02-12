import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/integrations/:id
 * Returns details for a specific integration including recent sync logs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", profile?.workspace_id)
      .single();

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Fetch recent sync logs
    const { data: syncLogs } = await supabase
      .from("integration_sync_logs")
      .select("*")
      .eq("integration_id", id)
      .order("started_at", { ascending: false })
      .limit(20);

    // Fetch notification rules (if notification integration)
    const { data: rules } = await supabase
      .from("notification_rules")
      .select("*")
      .eq("integration_id", id);

    return NextResponse.json({
      integration,
      sync_logs: syncLogs || [],
      notification_rules: rules || [],
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/integrations/:id
 * Updates integration configuration (sync frequency, config, notification rules, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { config, sync_frequency, status } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (config !== undefined) updates.config = config;
    if (sync_frequency !== undefined) updates.sync_frequency = sync_frequency;
    if (status !== undefined) updates.status = status;

    const { data: integration, error } = await supabase
      .from("integrations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ integration });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/integrations/:id
 * Disconnects and removes an integration. Revokes tokens where applicable.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    // Verify ownership before deletion
    const { data: integration } = await supabase
      .from("integrations")
      .select("provider")
      .eq("id", id)
      .eq("workspace_id", profile?.workspace_id)
      .single();

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // TODO: Revoke OAuth tokens for Slack, Teams, etc.
    // TODO: Disconnect Merge.dev account if applicable

    // Delete integration (cascades to sync_logs and notification_rules)
    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true, provider: integration.provider });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
