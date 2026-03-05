import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const SUPERADMIN_ALLOWLIST = (process.env.QEEMLY_SUPERADMINS || "ag@experrt.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

const WORKSPACE_OVERRIDE_COOKIE = "qeemly_workspace_override";

export type WorkspaceContext = {
  workspace_id: string;
  is_override: boolean;
  is_super_admin: boolean;
  user_id: string;
  user_email: string;
};

/**
 * Get the effective workspace context for the current request.
 * Super admins can override the workspace via cookie.
 * Regular users get their profile's workspace_id.
 */
export async function getWorkspaceContext(): Promise<
  { context: WorkspaceContext; error?: never } | { context?: never; error: string; status: number }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  const email = user.email?.toLowerCase() || "";
  const isSuperAdmin = SUPERADMIN_ALLOWLIST.includes(email);

  // Check for workspace override cookie (super admins only)
  let overrideWorkspaceId: string | null = null;
  if (isSuperAdmin) {
    const cookieStore = await cookies();
    overrideWorkspaceId = cookieStore.get(WORKSPACE_OVERRIDE_COOKIE)?.value || null;

    // Validate override workspace exists
    if (overrideWorkspaceId) {
      const serviceClient = createServiceClient();
      const { data: workspace } = await serviceClient
        .from("workspaces")
        .select("id")
        .eq("id", overrideWorkspaceId)
        .single();

      if (!workspace) {
        overrideWorkspaceId = null;
      }
    }
  }

  // Get user's profile workspace
  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  let profileWorkspaceId = profile?.workspace_id || null;
  if (profileWorkspaceId) {
    const serviceClient = createServiceClient();
    const { data: workspace } = await serviceClient
      .from("workspaces")
      .select("id")
      .eq("id", profileWorkspaceId)
      .single();

    if (!workspace) {
      profileWorkspaceId = null;
    }
  }

  const effectiveWorkspaceId = overrideWorkspaceId || profileWorkspaceId;

  if (!effectiveWorkspaceId) {
    return { error: "No workspace found", status: 404 };
  }

  return {
    context: {
      workspace_id: effectiveWorkspaceId,
      is_override: !!overrideWorkspaceId,
      is_super_admin: isSuperAdmin,
      user_id: user.id,
      user_email: email,
    },
  };
}

/**
 * Check if the current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const email = user.email?.toLowerCase() || "";
  return SUPERADMIN_ALLOWLIST.includes(email);
}

/**
 * Get workspace override cookie name (for client-side use)
 */
export function getWorkspaceOverrideCookieName(): string {
  return WORKSPACE_OVERRIDE_COOKIE;
}
