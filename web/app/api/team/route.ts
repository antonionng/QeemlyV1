import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

const READ_ONLY_OVERRIDE_ERROR =
  "Team management is read-only while viewing another workspace as super admin.";

async function requireTeamManagementAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  context: NonNullable<Awaited<ReturnType<typeof getWorkspaceContext>>["context"]>,
) {
  if (context.is_super_admin && context.is_override) {
    return NextResponse.json({ error: READ_ONLY_OVERRIDE_ERROR }, { status: 403 });
  }

  if (context.is_super_admin) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", context.user_id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  return null;
}

/**
 * GET /api/team
 * List all team members in the current workspace (supports super admin override)
 */
export async function GET() {
  const supabase = await createClient();
  
  // Use workspace context (supports super admin override)
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, is_super_admin, is_override, user_id } = wsContext.context;

  // For super admins viewing another workspace, use service client to bypass RLS
  const queryClient = is_override ? createServiceClient() : supabase;

  // Get all members in this workspace
  const { data: members, error: membersError } = await queryClient
    .from("profiles")
    .select(`
      id,
      full_name,
      avatar_url,
      role,
      updated_at
    `)
    .eq("workspace_id", workspace_id)
    .order("role", { ascending: true })
    .order("full_name", { ascending: true });

  if (membersError) {
    return jsonServerError(membersError, {
      defaultMessage: "We could not load your team right now.",
      logLabel: "Team list failed",
    });
  }

  // Get the current user's profile to determine their role
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user_id)
    .single();

  // Enrich members with current user flag
  const enrichedMembers = (members || []).map((m) => ({
    ...m,
    is_current_user: m.id === user_id,
    email: m.id === user_id ? wsContext.context.user_email : null,
  }));

  // Get pending invitations
  const { data: invitations } = await queryClient
    .from("team_invitations")
    .select("id, email, role, status, created_at")
    .eq("workspace_id", workspace_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return NextResponse.json({
    members: enrichedMembers,
    invitations: invitations || [],
    current_user_role: currentProfile?.role || "member",
    can_manage_team: !(is_super_admin && is_override) && (is_super_admin || currentProfile?.role === "admin"),
    management_notice: is_super_admin && is_override ? READ_ONLY_OVERRIDE_ERROR : null,
    is_viewing_as_admin: is_override,
  });
}

/**
 * DELETE /api/team
 * Remove a member from the workspace
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  
  // Use workspace context
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, user_id } = wsContext.context;
  const accessError = await requireTeamManagementAccess(supabase, wsContext.context);
  if (accessError) {
    return accessError;
  }

  const { member_id } = await request.json();

  if (!member_id) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: { member_id: "Select a team member and try again." },
    });
  }

  // Can't remove yourself
  if (member_id === user_id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  // Use service client for cross-workspace operations
  const serviceClient = createServiceClient();

  // Verify member is in the target workspace
  const { data: memberProfile } = await serviceClient
    .from("profiles")
    .select("workspace_id")
    .eq("id", member_id)
    .single();

  if (!memberProfile || memberProfile.workspace_id !== workspace_id) {
    return NextResponse.json({ error: "Member not found in workspace" }, { status: 404 });
  }

  // Remove member by setting workspace_id to null
  const { error: updateError } = await serviceClient
    .from("profiles")
    .update({ workspace_id: null, role: "member" })
    .eq("id", member_id);

  if (updateError) {
    return jsonServerError(updateError, {
      defaultMessage: "We could not remove this team member right now.",
      logLabel: "Team member removal failed",
    });
  }

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/team
 * Update a member's role
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  
  // Use workspace context
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { workspace_id, user_id } = wsContext.context;
  const accessError = await requireTeamManagementAccess(supabase, wsContext.context);
  if (accessError) {
    return accessError;
  }

  const { member_id, role } = await request.json();

  if (!member_id || !role) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: {
        ...(member_id ? {} : { member_id: "Select a team member and try again." }),
        ...(role ? {} : { role: "Choose a role and try again." }),
      },
    });
  }

  // Validate role
  if (!["admin", "member", "employee"].includes(role)) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: { role: "Choose a valid role and try again." },
    });
  }

  // Can't change your own role
  if (member_id === user_id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  // Use service client for cross-workspace operations
  const serviceClient = createServiceClient();

  // Verify member is in the target workspace
  const { data: memberProfile } = await serviceClient
    .from("profiles")
    .select("workspace_id")
    .eq("id", member_id)
    .single();

  if (!memberProfile || memberProfile.workspace_id !== workspace_id) {
    return NextResponse.json({ error: "Member not found in workspace" }, { status: 404 });
  }

  // Update role
  const { error: updateError } = await serviceClient
    .from("profiles")
    .update({ role })
    .eq("id", member_id);

  if (updateError) {
    return jsonServerError(updateError, {
      defaultMessage: "We could not update this team member right now.",
      logLabel: "Team role update failed",
    });
  }

  return NextResponse.json({ success: true });
}
