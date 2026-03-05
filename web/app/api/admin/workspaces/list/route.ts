import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

/**
 * GET /api/admin/workspaces/list
 * Simple list of all workspaces for the switcher dropdown
 * Only accessible by super admins
 */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const supabase = createServiceClient();

  // Get all workspaces with basic info
  const { data: workspaces, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, created_at")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user's own workspace from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", auth.user.id)
    .single();

  return NextResponse.json({
    workspaces: workspaces || [],
    current_workspace_id: profile?.workspace_id || null,
    is_super_admin: true,
  });
}
