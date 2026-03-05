import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/admin/auth";

function isRecoverableConfigError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("invalid api key") ||
    lower.includes("supabase_service_role_key") ||
    lower.includes("permission denied")
  );
}

/**
 * GET /api/admin/workspaces/list
 * Simple list of all workspaces for the switcher dropdown
 * Only accessible by super admins
 */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  let supabase: ReturnType<typeof createServiceClient> | Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = createServiceClient();
  } catch {
    // Allow dashboard/admin shell to operate when service key is not configured locally.
    supabase = await createClient();
  }

  // Get all workspaces with basic info
  const { data: workspaces, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, created_at")
    .order("name", { ascending: true });

  if (error) {
    if (isRecoverableConfigError(error.message || "")) {
      return NextResponse.json({
        workspaces: [],
        current_workspace_id: null,
        is_super_admin: true,
        warning: error.message,
      });
    }
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
