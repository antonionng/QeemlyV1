import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { buildApiKeyPrefix, hashApiKey } from "@/lib/security/api-key";
import { getAdminWorkspaceContextOrError, getWorkspaceContextOrError } from "@/lib/workspace-access";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

/**
 * GET /api/developer/api-keys
 * Lists all API keys for the current user's workspace.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const workspaceContext = await getWorkspaceContextOrError();
    if (workspaceContext.error) {
      return workspaceContext.error;
    }

    const { data: keys, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_by, created_at")
      .eq("workspace_id", workspaceContext.context.workspace_id)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonServerError(error, {
        defaultMessage: "We could not load API keys right now.",
        logLabel: "API keys list failed",
      });
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
    const workspaceContext = await getAdminWorkspaceContextOrError();
    if (workspaceContext.error) {
      return workspaceContext.error;
    }

    const body = await request.json();
    const { name, scopes, expires_at } = body;

    if (!name || !Array.isArray(scopes) || scopes.length === 0) {
      return jsonValidationError({
        message: "Please correct the highlighted fields and try again.",
        fields: {
          ...(name ? {} : { name: "Enter a name for this API key." }),
          ...(!Array.isArray(scopes) || scopes.length === 0
            ? { scopes: "Choose at least one scope and try again." }
            : {}),
        },
      });
    }

    // Generate a secure API key
    const randomPart = crypto.randomBytes(30).toString("base64url");
    const fullKey = `qeem_${randomPart}`;
    const keyPrefix = buildApiKeyPrefix(fullKey);
    const keyHash = hashApiKey(fullKey);

    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .insert({
        workspace_id: workspaceContext.context.workspace_id,
        name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes,
        expires_at: expires_at || null,
        created_by: workspaceContext.context.user_id,
      })
      .select("id, name, key_prefix, scopes, expires_at, created_at")
      .single();

    if (error) {
      return jsonServerError(error, {
        defaultMessage: "We could not create this API key right now.",
        logLabel: "API key create failed",
      });
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
