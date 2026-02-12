import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/integrations/webhook
 * 
 * Incoming webhook handler for:
 * - Merge.dev: employee.created, employee.updated, sync.completed, etc.
 * - Slack: event callbacks (message actions, slash commands)
 * - Other providers that push data to Qeemly
 * 
 * Each provider has a different payload format and verification method.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine the source from headers or payload
    const mergeSignature = request.headers.get("x-merge-webhook-signature");
    const slackSignature = request.headers.get("x-slack-signature");

    if (mergeSignature) {
      return handleMergeWebhook(body, mergeSignature);
    }

    if (slackSignature) {
      return handleSlackWebhook(body, slackSignature);
    }

    // Unknown webhook source
    return NextResponse.json({ error: "Unknown webhook source" }, { status: 400 });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// ============================================================================
// Merge.dev Webhook Handler
// ============================================================================

async function handleMergeWebhook(body: Record<string, unknown>, signature: string) {
  // TODO: Verify signature with Merge webhook secret
  // TODO: Validate payload structure

  const event = body.event as string;
  const data = body.data as Record<string, unknown>;

  switch (event) {
    case "employee.created":
    case "employee.updated":
      // TODO: Map Merge employee data to Qeemly schema
      // TODO: Upsert into employees table
      break;

    case "sync.completed":
      // TODO: Update integration last_sync_at
      // TODO: Create sync log entry
      break;

    case "account.linked":
      // TODO: Update integration status to connected
      break;

    default:
      console.log(`Unhandled Merge event: ${event}`);
  }

  return NextResponse.json({ received: true });
}

// ============================================================================
// Slack Webhook Handler
// ============================================================================

async function handleSlackWebhook(body: Record<string, unknown>, signature: string) {
  // TODO: Verify Slack request signature
  // TODO: Handle Slack events (URL verification, event callbacks)

  // Slack URL verification challenge
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  // TODO: Handle actual Slack events
  return NextResponse.json({ received: true });
}
