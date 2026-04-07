import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { getAdminWorkspaceContextOrError, getWorkspaceContextOrError } from "@/lib/workspace-access";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

/**
 * GET /api/developer/webhooks
 * Lists all outgoing webhooks for the current workspace.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const workspaceContext = await getWorkspaceContextOrError();
    if (workspaceContext.error) {
      return workspaceContext.error;
    }
    const profile = { workspace_id: workspaceContext.context.workspace_id };

    const { data: webhooks, error } = await supabase
      .from("outgoing_webhooks")
      .select("id, url, events, enabled, created_at, updated_at")
      .eq("workspace_id", profile.workspace_id)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonServerError(error, {
        defaultMessage: "We could not load webhooks right now.",
        logLabel: "Webhooks list failed",
      });
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
    const workspaceContext = await getAdminWorkspaceContextOrError();
    if (workspaceContext.error) {
      return workspaceContext.error;
    }
    const profile = { workspace_id: workspaceContext.context.workspace_id };

    const body = await request.json();
    const { url, events } = body;

    if (!url || !Array.isArray(events) || events.length === 0) {
      return jsonValidationError({
        message: "Please correct the highlighted fields and try again.",
        fields: {
          ...(url ? {} : { url: "Enter a webhook URL and try again." }),
          ...(!Array.isArray(events) || events.length === 0
            ? { events: "Choose at least one event and try again." }
            : {}),
        },
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return jsonValidationError({
        message: "Please correct the highlighted fields and try again.",
        fields: { url: "Enter a valid webhook URL." },
      });
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
      return jsonServerError(error, {
        defaultMessage: "We could not create this webhook right now.",
        logLabel: "Webhook create failed",
      });
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
    const workspaceContext = await getAdminWorkspaceContextOrError();
    if (workspaceContext.error) {
      return workspaceContext.error;
    }
    const profile = { workspace_id: workspaceContext.context.workspace_id };

    const body = await request.json();
    const { id, url, events, enabled } = body;

    if (!id) {
      return jsonValidationError({
        message: "Please correct the highlighted fields and try again.",
        fields: { id: "Choose a webhook and try again." },
      });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (url !== undefined) updates.url = url;
    if (events !== undefined) updates.events = events;
    if (enabled !== undefined) updates.enabled = enabled;

    const { data: webhook, error } = await supabase
      .from("outgoing_webhooks")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id)
      .select()
      .single();

    if (error) {
      return jsonServerError(error, {
        defaultMessage: "We could not update this webhook right now.",
        logLabel: "Webhook update failed",
      });
    }

    return NextResponse.json({ webhook });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
