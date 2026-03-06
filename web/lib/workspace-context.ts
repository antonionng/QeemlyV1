import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const SUPERADMIN_ALLOWLIST = (process.env.QEEMLY_SUPERADMINS || "ag@experrt.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

const WORKSPACE_OVERRIDE_COOKIE = "qeemly_workspace_override";
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type WorkspaceContext = {
  workspace_id: string;
  is_override: boolean;
  override_workspace_id: string | null;
  profile_workspace_id: string | null;
  is_super_admin: boolean;
  user_id: string;
  user_email: string;
};

async function ensureExperrtWorkspaceForUser(
  client: ReturnType<typeof createServiceClient> | SupabaseServerClient,
  userId: string,
  email: string
): Promise<string | null> {
  const isExperrtUser = email.endsWith("@experrt.com");
  const isAllowlisted = SUPERADMIN_ALLOWLIST.includes(email);
  if (!isExperrtUser && !isAllowlisted) {
    return null;
  }

  let workspaceId: string | null = null;

  const { data: existingWorkspace } = await client
    .from("workspaces")
    .select("id")
    .eq("slug", "experrt")
    .maybeSingle();

  workspaceId = existingWorkspace?.id ?? null;

  if (!workspaceId) {
    const { data: createdWorkspace, error: createWorkspaceError } = await client
      .from("workspaces")
      .insert({ name: "Experrt", slug: "experrt" })
      .select("id")
      .single();

    if (createWorkspaceError) {
      const { data: retryWorkspace } = await client
        .from("workspaces")
        .select("id")
        .eq("slug", "experrt")
        .maybeSingle();
      workspaceId = retryWorkspace?.id ?? null;
    } else {
      workspaceId = createdWorkspace?.id ?? null;
    }
  }

  if (!workspaceId) {
    return null;
  }

  const { data: existingProfile } = await client
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile?.id) {
    await client
      .from("profiles")
      .update({ workspace_id: workspaceId })
      .eq("id", userId);
  } else {
    await client.from("profiles").insert({
      id: userId,
      workspace_id: workspaceId,
      role: "admin",
      full_name: email.split("@")[0] || "Admin",
    });
  }

  return workspaceId;
}

/**
 * Get the effective workspace context for the current request.
 * Super admins can override the workspace via cookie.
 * Regular users get their profile's workspace_id.
 */
export async function getWorkspaceContext(): Promise<
  { context: WorkspaceContext; error?: never } | { context?: never; error: string; status: number }
> {
  const supabase = await createClient();
  let serviceClient: ReturnType<typeof createServiceClient> | null = null;
  try {
    serviceClient = createServiceClient();
  } catch {
    serviceClient = null;
  }

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
    if (overrideWorkspaceId && serviceClient) {
      const { data: workspace, error: wsError } = await serviceClient
        .from("workspaces")
        .select("id")
        .eq("id", overrideWorkspaceId)
        .single();

      if (!wsError && !workspace) {
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
  if (profileWorkspaceId && serviceClient) {
    const { data: workspace, error: wsError } = await serviceClient
      .from("workspaces")
      .select("id")
      .eq("id", profileWorkspaceId)
      .single();

    // Only invalidate the workspace ID if the query succeeded but found no row.
    // If the query errored (bad key, network, etc.) keep the profile workspace ID.
    if (!wsError && !workspace) {
      profileWorkspaceId = null;
    }
  }

  if (!profileWorkspaceId) {
    profileWorkspaceId = await ensureExperrtWorkspaceForUser(serviceClient ?? supabase, user.id, email);
  }

  const effectiveWorkspaceId = overrideWorkspaceId || profileWorkspaceId;

  if (!effectiveWorkspaceId) {
    return { error: "No workspace found", status: 404 };
  }

  return {
    context: {
      workspace_id: effectiveWorkspaceId,
      is_override: !!overrideWorkspaceId,
      override_workspace_id: overrideWorkspaceId,
      profile_workspace_id: profileWorkspaceId,
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
