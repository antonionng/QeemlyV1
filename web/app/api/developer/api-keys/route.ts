import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * GET /api/developer/api-keys
 * Lists all API keys for the current user's workspace.
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

    const { data: keys, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_by, created_at")
      .eq("workspace_id", profile.workspace_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ keys: keys || [] });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/developer/api-keys
 * Creates a new API key. Returns the full key only once.
 * 
 * Body:
 * {
 *   name: string          // Display name for the key
 *   scopes: string[]      // Permission scopes
 *   expires_at?: string   // Optional expiration date (ISO)
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

    // Only admins can create API keys
    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create API keys" }, { status: 403 });
    }

    const body = await request.json();
    const { name, scopes, expires_at } = body;

    if (!name || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: name, scopes (non-empty array)" },
        { status: 400 }
      );
    }

    // Generate a secure API key
    const randomPart = crypto.randomBytes(30).toString("base64url");
    const fullKey = `qeem_${randomPart}`;
    const keyPrefix = fullKey.slice(0, 13) + "...";
    const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");

    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .insert({
        workspace_id: profile.workspace_id,
        name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes,
        expires_at: expires_at || null,
        created_by: user.id,
      })
      .select("id, name, key_prefix, scopes, expires_at, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the full key only this once
    return NextResponse.json({
      key: apiKey,
      full_key: fullKey,
      warning: "Save this key now. It will not be shown again.",
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
