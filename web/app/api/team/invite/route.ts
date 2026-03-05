import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { randomBytes } from "node:crypto";

type InvitationPayload = {
  invitationId?: string;
  invitation_id?: string;
};

export function resolveInvitationId(payload: InvitationPayload): string | undefined {
  return payload.invitationId ?? payload.invitation_id;
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
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
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

  // Only admins can invite
  if (profile.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { email, role = "member" } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Validate role
  if (!["admin", "member", "employee"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Check if invitation already exists
  const { data: existingInvite } = await supabase
    .from("team_invitations")
    .select("id, status")
    .eq("workspace_id", profile.workspace_id)
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
      workspace_id: profile.workspace_id,
      email: email.toLowerCase(),
      invited_by: user.id,
      role,
      token,
      status: "pending",
    })
    .select()
    .single();

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const { error: emailError } = await sendBrandedInviteEmail({
    email: invitation.email,
    role: invitation.role,
    workspaceId: profile.workspace_id,
    token: invitation.token,
    request,
  });

  if (emailError) {
    await supabase.from("team_invitations").delete().eq("id", invitation.id);
    return NextResponse.json(
      { error: `Invitation email could not be sent: ${emailError.message}` },
      { status: 500 }
    );
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
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
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
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const payload = (await request.json()) as InvitationPayload;
  const invitationId = resolveInvitationId(payload);

  if (!invitationId) {
    return NextResponse.json({ error: "Invitation ID required" }, { status: 400 });
  }

  // Verify invitation belongs to this workspace
  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("workspace_id")
    .eq("id", invitationId)
    .single();

  if (!invitation || invitation.workspace_id !== profile.workspace_id) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  // Delete the invitation
  const { error: deleteError } = await supabase
    .from("team_invitations")
    .delete()
    .eq("id", invitationId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/team/invite
 * Resend an invitation (updates created_at to reset expiry)
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
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
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const payload = (await request.json()) as InvitationPayload;
  const invitationId = resolveInvitationId(payload);

  if (!invitationId) {
    return NextResponse.json({ error: "Invitation ID required" }, { status: 400 });
  }

  // Verify invitation belongs to this workspace
  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("workspace_id, email, role, token")
    .eq("id", invitationId)
    .single();

  if (!invitation || invitation.workspace_id !== profile.workspace_id) {
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
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: emailError } = await sendBrandedInviteEmail({
    email: invitation.email,
    role: invitation.role ?? "member",
    workspaceId: profile.workspace_id,
    token: invitation.token,
    request,
  });

  if (emailError) {
    return NextResponse.json(
      { error: `Invitation resend failed: ${emailError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ 
    success: true,
    message: "Invitation resent",
  });
}
