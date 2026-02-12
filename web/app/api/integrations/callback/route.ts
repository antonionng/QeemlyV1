import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/integrations/callback
 * 
 * OAuth callback handler for Slack, Microsoft Teams, and other OAuth-based integrations.
 * Receives the authorization code, exchanges it for access/refresh tokens,
 * and stores them in the integrations table.
 * 
 * Query params:
 *   code: string         // OAuth authorization code
 *   state: string        // Contains provider ID and workspace context
 *   error?: string       // OAuth error (if denied)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      // User denied the OAuth request
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=oauth_denied", request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=missing_params", request.url)
      );
    }

    // TODO: Parse state to get provider and workspace context
    // TODO: Exchange code for tokens based on provider
    // TODO: Store tokens in integrations table

    // Placeholder: decode state
    let stateData: { provider: string; workspace_id: string };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=invalid_state", request.url)
      );
    }

    const supabase = await createClient();

    // TODO: Actual token exchange
    // For Slack:  POST https://slack.com/api/oauth.v2.access
    // For Teams:  POST https://login.microsoftonline.com/.../oauth2/v2.0/token

    // Update integration record
    await supabase
      .from("integrations")
      .update({
        status: "connected",
        // access_token: tokens.access_token,
        // refresh_token: tokens.refresh_token,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", stateData.workspace_id)
      .eq("provider", stateData.provider);

    return NextResponse.redirect(
      new URL("/dashboard/integrations?connected=" + stateData.provider, request.url)
    );
  } catch (err) {
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=callback_failed", request.url)
    );
  }
}
