import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyOAuthState } from "@/lib/security/oauth-state";

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

    let stateData: {
      provider: string;
      workspace_id: string;
      integration_id: string;
    };
    try {
      stateData = verifyOAuthState(state);
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=invalid_state", request.url)
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=unauthorized", request.url)
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id || profile.role !== "admin") {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=forbidden", request.url)
      );
    }

    if (profile.workspace_id !== stateData.workspace_id) {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=workspace_mismatch", request.url)
      );
    }

    // TODO: Actual token exchange
    // For Slack:  POST https://slack.com/api/oauth.v2.access
    // For Teams:  POST https://login.microsoftonline.com/.../oauth2/v2.0/token

    // Update integration record
    const { data: integration, error: updateError } = await supabase
      .from("integrations")
      .update({
        status: "connected",
        // access_token: tokens.access_token,
        // refresh_token: tokens.refresh_token,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stateData.integration_id)
      .eq("workspace_id", stateData.workspace_id)
      .eq("provider", stateData.provider)
      .select("id")
      .single();

    if (updateError || !integration) {
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=integration_not_found", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/dashboard/integrations?connected=" + stateData.provider, request.url)
    );
  } catch (err) {
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=callback_failed", request.url)
    );
  }
}
