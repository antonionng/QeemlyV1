import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, category, api_key, config } = body;

    if (!provider || !category) {
      return NextResponse.json(
        { error: "Missing required fields: provider, category" },
        { status: 400 }
      );
    }

    // Get user's workspace
    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // TODO: Implement actual OAuth / Merge Link / API key flows
    // For now, create the integration record directly
    const { data: integration, error } = await supabase
      .from("integrations")
      .upsert({
        workspace_id: profile.workspace_id,
        provider,
        category,
        status: "connected",
        config: config || {},
        access_token: api_key || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "workspace_id,provider" })
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
