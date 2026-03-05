/**
 * API Key Authentication Middleware for Public API v1
 * 
 * Validates API keys from the Authorization header, checks scopes,
 * resolves the workspace, and logs usage.
 * 
 * Usage in route handlers:
 *   const auth = await authenticateApiKey(request, "employees:read");
 *   if (auth.error) return auth.error;
 *   const { workspaceId, apiKeyId } = auth;
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buildApiKeyPrefix, hashApiKey, isApiKeyFormat } from "@/lib/security/api-key";

// Use service role for API key validation (bypasses RLS)
function getServiceClient() {
  return createServiceClient();
}

type AuthResult =
  | { error: NextResponse; workspaceId?: never; apiKeyId?: never }
  | { error?: never; workspaceId: string; apiKeyId: string };

export async function authenticateApiKey(
  request: NextRequest,
  requiredScope?: string
): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        {
          error: "Missing or invalid Authorization header",
          hint: 'Use "Authorization: Bearer qeem_your_api_key"',
        },
        { status: 401 }
      ),
    };
  }

  const apiKey = authHeader.slice(7); // Remove "Bearer "

  if (!isApiKeyFormat(apiKey)) {
    return {
      error: NextResponse.json(
        { error: "Invalid API key format" },
        { status: 401 }
      ),
    };
  }

  const prefix = buildApiKeyPrefix(apiKey);
  const keyHash = hashApiKey(apiKey);
  const supabase = getServiceClient();

  // Look up by prefix + full hash to prevent prefix-only auth bypass.
  const { data: keyRecord } = await supabase
    .from("api_keys")
    .select("id, workspace_id, scopes, revoked_at, expires_at, key_hash")
    .eq("key_prefix", prefix)
    .eq("key_hash", keyHash)
    .single();

  if (!keyRecord) {
    return {
      error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
    };
  }

  // Check if revoked
  if (keyRecord.revoked_at) {
    return {
      error: NextResponse.json({ error: "API key has been revoked" }, { status: 401 }),
    };
  }

  // Check if expired
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return {
      error: NextResponse.json({ error: "API key has expired" }, { status: 401 }),
    };
  }

  // Check scope
  if (requiredScope) {
    const scopes = keyRecord.scopes as string[];
    if (!scopes.includes(requiredScope)) {
      return {
        error: NextResponse.json(
          {
            error: "Insufficient permissions",
            required_scope: requiredScope,
            available_scopes: scopes,
          },
          { status: 403 }
        ),
      };
    }
  }

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id);

  // Log the request
  const startTime = Date.now();
  // Note: Response logging happens in the route handler
  await supabase.from("api_request_logs").insert({
    api_key_id: keyRecord.id,
    workspace_id: keyRecord.workspace_id,
    endpoint: new URL(request.url).pathname,
    method: request.method,
    status_code: 200, // Will be approximate; exact logging can be done in route
    request_at: new Date().toISOString(),
    response_ms: 0,
  });

  return {
    workspaceId: keyRecord.workspace_id,
    apiKeyId: keyRecord.id,
  };
}
