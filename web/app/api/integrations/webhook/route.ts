import { NextRequest, NextResponse } from "next/server";
import { verifyHmacSha256Signature } from "@/lib/security/webhook-signature";

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
    const rawBody = await request.text();
    const body = JSON.parse(rawBody) as Record<string, unknown>;

    // Determine the source from headers or payload
    const mergeSignature = request.headers.get("x-merge-webhook-signature");
    const slackSignature = request.headers.get("x-slack-signature");

    if (mergeSignature) {
      return handleMergeWebhook(body, rawBody, mergeSignature);
    }

    if (slackSignature) {
      return handleSlackWebhook(body, rawBody, slackSignature);
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

async function handleMergeWebhook(
  body: Record<string, unknown>,
  rawBody: string,
  signature: string
) {
  const secret = process.env.MERGE_WEBHOOK_SECRET;
  if (!secret || !verifyHmacSha256Signature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid Merge webhook signature" }, { status: 401 });
  }

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

async function handleSlackWebhook(
  body: Record<string, unknown>,
  rawBody: string,
  signature: string
) {
  const secret = process.env.SLACK_WEBHOOK_SECRET;
  if (!secret || !verifyHmacSha256Signature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid Slack webhook signature" }, { status: 401 });
  }

  // Slack URL verification challenge
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  // TODO: Handle actual Slack events
  return NextResponse.json({ received: true });
}
