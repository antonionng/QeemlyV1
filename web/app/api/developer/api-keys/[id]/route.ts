import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminWorkspaceContextOrError } from "@/lib/workspace-access";
import { jsonServerError } from "@/lib/errors/http";

/**
 * DELETE /api/developer/api-keys/:id
 * Revokes an API key (soft delete - sets revoked_at timestamp).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const workspaceContext = await getAdminWorkspaceContextOrError();
    if (workspaceContext.error) {
      return workspaceContext.error;
    }

    // Verify key belongs to workspace
    const { data: existingKey } = await supabase
      .from("api_keys")
      .select("id, name")
      .eq("id", id)
      .eq("workspace_id", workspaceContext.context.workspace_id)
      .single();

    if (!existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Soft-delete: set revoked_at
    const { error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return jsonServerError(error, {
        defaultMessage: "We could not revoke this API key right now.",
        logLabel: "API key revoke failed",
      });
    }

    return NextResponse.json({
      revoked: true,
      key_name: existingKey.name,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
