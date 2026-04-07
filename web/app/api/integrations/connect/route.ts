import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOAuthState } from "@/lib/security/oauth-state";
import { getAdminWorkspaceContextOrError } from "@/lib/workspace-access";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

/**
 * POST /api/integrations/connect
 * 
 * Initiates an integration connection. For OAuth-based integrations (Slack, Teams),
 * returns an authorization URL. For Merge.dev integrations, returns a Merge Link token.
 * For API-key based integrations (ZenHR, Bayzat), accepts the key directly.
 * 
 * Body:
 * {
 *   provider: string      // e.g. "slack", "bamboohr", "zenhr"
 *   category: string      // "notification" | "hris" | "ats"
 *   api_key?: string      // For API-key based integrations
 *   config?: object       // Additional connection configuration
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const workspaceContext = await getAdminWorkspaceContextOrError();
    if (workspaceContext.error) {
      return workspaceContext.error;
    }

    const body = await request.json();
    const { provider, category, api_key, config } = body;

    if (!provider || !category) {
      return jsonValidationError({
        message: "Please correct the highlighted fields and try again.",
        fields: {
          ...(provider ? {} : { provider: "Choose an integration provider and try again." }),
          ...(category ? {} : { category: "Choose an integration category and try again." }),
        },
      });
    }

    const { data: integration, error } = await supabase
      .from("integrations")
      .upsert({
        workspace_id: workspaceContext.context.workspace_id,
        provider,
        category,
        status: "connecting",
        config: config || {},
        access_token: api_key || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "workspace_id,provider" })
      .select()
      .single();

    if (error) {
      return jsonServerError(error, {
        defaultMessage: "We could not start this integration right now.",
        logLabel: "Integration connect create failed",
      });
    }

    if (provider === "slack" || provider === "teams") {
      const state = createOAuthState({
        provider,
        workspace_id: workspaceContext.context.workspace_id,
        integration_id: integration.id,
      });
      const callbackUrl = new URL("/api/integrations/callback", request.url).toString();
      const oauthBase =
        provider === "slack"
          ? process.env.SLACK_OAUTH_AUTHORIZE_URL
          : process.env.TEAMS_OAUTH_AUTHORIZE_URL;

      if (!oauthBase) {
        return NextResponse.json(
          { error: "This integration is not available right now." },
          { status: 500 }
        );
      }

      const oauthUrl = new URL(oauthBase);
      oauthUrl.searchParams.set("state", state);
      oauthUrl.searchParams.set("redirect_uri", callbackUrl);

      return NextResponse.json({ integration, oauth_url: oauthUrl.toString(), state_required: true });
    }

    if (integration.status !== "connected") {
      const { data: connectedIntegration, error: updateError } = await supabase
        .from("integrations")
        .update({ status: "connected", updated_at: new Date().toISOString() })
        .eq("id", integration.id)
        .eq("workspace_id", workspaceContext.context.workspace_id)
        .select()
        .single();

      if (updateError) {
        return jsonServerError(updateError, {
          defaultMessage: "We could not finish connecting this integration right now.",
          logLabel: "Integration connect finalize failed",
        });
      }

      return NextResponse.json({ integration: connectedIntegration });
    }

    return NextResponse.json({ integration });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
