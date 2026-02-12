import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * GET /api/developer/webhooks
 * Lists all outgoing webhooks for the current workspace.
 */
export async function GET(request: NextRequest) {
  try {
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

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const { data: webhooks, error } = await supabase
      .from("outgoing_webhooks")
      .select("id, url, events, enabled, created_at, updated_at")
      .eq("workspace_id", profile.workspace_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ webhooks: webhooks || [] });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/developer/webhooks
 * Creates a new outgoing webhook.
 * 
 * Body:
 * {
 *   url: string         // Endpoint URL
 *   events: string[]    // Event types to subscribe to
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create webhooks" }, { status: 403 });
    }

    const body = await request.json();
    const { url, events } = body;

    if (!url || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: url, events (non-empty array)" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Generate webhook secret for signature verification
    const secret = `whsec_${crypto.randomBytes(24).toString("base64url")}`;

    const { data: webhook, error } = await supabase
      .from("outgoing_webhooks")
      .insert({
        workspace_id: profile.workspace_id,
        url,
        secret,
        events,
        enabled: true,
      })
      .select("id, url, events, enabled, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      webhook,
      secret, // Return secret only on creation
      warning: "Save the webhook secret now. It will not be shown again.",
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/developer/webhooks
 * Updates an existing webhook (url, events, enabled).
 * 
 * Body:
 * {
 *   id: string
 *   url?: string
 *   events?: string[]
 *   enabled?: boolean
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, url, events, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing webhook id" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (url !== undefined) updates.url = url;
    if (events !== undefined) updates.events = events;
    if (enabled !== undefined) updates.enabled = enabled;

    const { data: webhook, error } = await supabase
      .from("outgoing_webhooks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ webhook });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
