import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can revoke API keys" }, { status: 403 });
    }

    // Verify key belongs to workspace
    const { data: existingKey } = await supabase
      .from("api_keys")
      .select("id, name")
      .eq("id", id)
      .eq("workspace_id", profile.workspace_id)
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      revoked: true,
      key_name: existingKey.name,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
