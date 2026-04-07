import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { randomBytes } from "node:crypto";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

const READ_ONLY_OVERRIDE_ERROR =
  "Team management is read-only while viewing another workspace as super admin.";

type InvitationPayload = {
  invitationId?: string;
  invitation_id?: string;
};

export function resolveInvitationId(payload: InvitationPayload): string | undefined {
  return payload.invitationId ?? payload.invitation_id;
}

async function requireTeamInviteAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  context: NonNullable<Awaited<ReturnType<typeof getWorkspaceContext>>["context"]>,
) {
  if (context.is_super_admin && context.is_override) {
    return { error: NextResponse.json({ error: READ_ONLY_OVERRIDE_ERROR }, { status: 403 }) };
  }

  if (context.is_super_admin) {
    return { workspaceId: context.workspace_id };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", context.user_id)
    .single();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }

  return { workspaceId: context.workspace_id };
}

function resolveAppOrigin(request: NextRequest): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");
  return new URL(request.url).origin;
}

async function sendBrandedInviteEmail(params: {
  email: string;
  role: string;
  workspaceId: string;
  token: string;
  request: NextRequest;
}) {
  const serviceClient = createServiceClient();
  const redirectTo = `${resolveAppOrigin(params.request)}/auth/accept-invite?token=${encodeURIComponent(params.token)}`;

  return serviceClient.auth.admin.inviteUserByEmail(params.email, {
    redirectTo,
    data: {
      workspace_id: params.workspaceId,
      invited_role: params.role,
      invitation_token: params.token,
    },
  });
}

/**
 * POST /api/team/invite
 * Send an invitation to join the workspace
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const access = await requireTeamInviteAccess(supabase, wsContext.context);
  if (access.error) {
    return access.error;
  }
  const workspaceId = access.workspaceId;

  const { email, role = "member" } = await request.json();

  if (!email) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: { email: "Enter an email address to send the invitation." },
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: { email: "Enter a valid email address." },
    });
  }

  // Validate role
  if (!["admin", "member", "employee"].includes(role)) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: { role: "Choose a valid role and try again." },
    });
  }

  // Check if invitation already exists
  const { data: existingInvite } = await supabase
    .from("team_invitations")
    .select("id, status")
    .eq("workspace_id", workspaceId)
    .eq("email", email.toLowerCase())
    .eq("status", "pending")
    .single();

  if (existingInvite) {
    return NextResponse.json({ 
      error: "An invitation has already been sent to this email" 
    }, { status: 409 });
  }

  const token = randomBytes(32).toString("hex");

  // Create invitation
  const { data: invitation, error: inviteError } = await supabase
    .from("team_invitations")
    .insert({
      workspace_id: workspaceId,
      email: email.toLowerCase(),
      invited_by: wsContext.context.user_id,
      role,
      token,
      status: "pending",
    })
    .select()
    .single();

  if (inviteError) {
    return jsonServerError(inviteError, {
      defaultMessage: "We could not create this invitation right now.",
      logLabel: "Team invitation create failed",
    });
  }

  const { error: emailError } = await sendBrandedInviteEmail({
    email: invitation.email,
    role: invitation.role,
    workspaceId,
    token: invitation.token,
    request,
  });

  if (emailError) {
    await supabase.from("team_invitations").delete().eq("id", invitation.id);
    return jsonServerError(emailError, {
      defaultMessage: "We created the invitation but could not send the email. Please try again.",
      logLabel: "Team invitation email failed",
    });
  }

  return NextResponse.json({ 
    success: true, 
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      created_at: invitation.created_at,
    },
  });
}

/**
 * DELETE /api/team/invite
 * Cancel/revoke a pending invitation
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const access = await requireTeamInviteAccess(supabase, wsContext.context);
  if (access.error) {
    return access.error;
  }
  const workspaceId = access.workspaceId;

  const payload = (await request.json()) as InvitationPayload;
  const invitationId = resolveInvitationId(payload);

  if (!invitationId) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: { invitationId: "Select an invitation and try again." },
    });
  }

  // Verify invitation belongs to this workspace
  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("workspace_id")
    .eq("id", invitationId)
    .single();

  if (!invitation || invitation.workspace_id !== workspaceId) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  // Delete the invitation
  const { error: deleteError } = await supabase
    .from("team_invitations")
    .delete()
    .eq("id", invitationId);

  if (deleteError) {
    return jsonServerError(deleteError, {
      defaultMessage: "We could not cancel this invitation right now.",
      logLabel: "Team invitation delete failed",
    });
  }

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/team/invite
 * Resend an invitation (updates created_at to reset expiry)
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }
  const access = await requireTeamInviteAccess(supabase, wsContext.context);
  if (access.error) {
    return access.error;
  }
  const workspaceId = access.workspaceId;

  const payload = (await request.json()) as InvitationPayload;
  const invitationId = resolveInvitationId(payload);

  if (!invitationId) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: { invitationId: "Select an invitation and try again." },
    });
  }

  // Verify invitation belongs to this workspace
  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("workspace_id, email, role, token")
    .eq("id", invitationId)
    .single();

  if (!invitation || invitation.workspace_id !== workspaceId) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  // Reset timestamp so admins can track last resend time.
  const { error: updateError } = await supabase
    .from("team_invitations")
    .update({ 
      created_at: new Date().toISOString(),
    })
    .eq("id", invitationId);

  if (updateError) {
    return jsonServerError(updateError, {
      defaultMessage: "We could not resend this invitation right now.",
      logLabel: "Team invitation update failed",
    });
  }

  const { error: emailError } = await sendBrandedInviteEmail({
    email: invitation.email,
    role: invitation.role ?? "member",
    workspaceId,
    token: invitation.token,
    request,
  });

  if (emailError) {
    return jsonServerError(emailError, {
      defaultMessage: "We could not resend this invitation email right now.",
      logLabel: "Team invitation resend email failed",
    });
  }

  return NextResponse.json({ 
    success: true,
    message: "Invitation resent",
  });
}
