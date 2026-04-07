import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext, type WorkspaceContext } from "@/lib/workspace-context";

type WorkspaceAccessResult =
  | { context: WorkspaceContext; error?: never }
  | { context?: never; error: Response };

type AdminWorkspaceAccessResult =
  | { context: WorkspaceContext; role: string | null; error?: never }
  | { context?: never; role?: never; error: Response };

export async function getWorkspaceContextOrError(): Promise<WorkspaceAccessResult> {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return {
      error: NextResponse.json({ error: wsContext.error }, { status: wsContext.status }),
    };
  }

  return { context: wsContext.context };
}

async function getCurrentWorkspaceRole(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role ?? null;
}

export async function getAdminWorkspaceContextOrError(options?: {
  allowSuperAdmin?: boolean;
}): Promise<AdminWorkspaceAccessResult> {
  const workspaceContext = await getWorkspaceContextOrError();
  if (workspaceContext.error) {
    return workspaceContext;
  }

  const role = await getCurrentWorkspaceRole(workspaceContext.context.user_id);
  const allowSuperAdmin = options?.allowSuperAdmin !== false;
  const isAuthorized = role === "admin" || (allowSuperAdmin && workspaceContext.context.is_super_admin);

  if (!isAuthorized) {
    return {
      error: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    };
  }

  return {
    context: workspaceContext.context,
    role,
  };
}
