import { NextResponse } from "next/server";
import { adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const supabase = createServiceClient();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, workspace_id, created_at")
      .limit(100);

    throwIfAdminQueryError(error, "Failed to load user profiles");

    const workspaceIds = Array.from(
      new Set((profiles ?? []).map((p) => p.workspace_id).filter(Boolean))
    ) as string[];
    const { data: workspaces, error: workspacesError } = workspaceIds.length
      ? await supabase
          .from("workspaces")
          .select("id, name")
          .in("id", workspaceIds)
      : { data: [] as Array<{ id: string; name: string }>, error: null };

    throwIfAdminQueryError(workspacesError, "Failed to load user workspaces");

    const workspaceById = new Map((workspaces ?? []).map((w) => [w.id, w.name]));
    const authUsers = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authUsers.error) {
      throw new Error(`Failed to load auth users: ${authUsers.error.message}`);
    }

    const authById = new Map((authUsers.data?.users ?? []).map((u) => [u.id, u]));
    const enriched = (profiles ?? []).map((p) => {
      const authUser = authById.get(p.id);
      return {
        id: p.id,
        full_name: p.full_name,
        role: p.role,
        email: authUser?.email ?? null,
        created_at: p.created_at,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        workspace_name: p.workspace_id ? workspaceById.get(p.workspace_id) ?? null : null,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
