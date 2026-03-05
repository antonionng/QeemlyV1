import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { getWorkspaceOverrideCookieName } from "@/lib/workspace-context";

const COOKIE_NAME = getWorkspaceOverrideCookieName();

/**
 * POST /api/admin/workspace-override
 * Set workspace override for super admin
 */
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { workspace_id } = body;

  if (!workspace_id) {
    return NextResponse.json({ error: "workspace_id required" }, { status: 400 });
  }

  // Verify workspace exists
  const supabase = createServiceClient();
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("id", workspace_id)
    .single();

  if (error || !workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Set the override cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, workspace_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({
    success: true,
    workspace,
    message: `Now viewing as "${workspace.name}"`,
  });
}

/**
 * DELETE /api/admin/workspace-override
 * Clear workspace override (return to own workspace)
 */
export async function DELETE() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  return NextResponse.json({
    success: true,
    message: "Returned to your own workspace",
  });
}

/**
 * GET /api/admin/workspace-override
 * Get current override status
 */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const cookieStore = await cookies();
  const overrideId = cookieStore.get(COOKIE_NAME)?.value;

  if (!overrideId) {
    return NextResponse.json({
      is_overriding: false,
      workspace: null,
    });
  }

  const supabase = createServiceClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("id", overrideId)
    .single();

  return NextResponse.json({
    is_overriding: true,
    workspace: workspace || null,
  });
}
