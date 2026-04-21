import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=invalid_invite`);
  }

  const supabase = await createClient();

  // Validate the invitation token
  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("id, email, workspace_id, role, status")
    .eq("token", token)
    .single();

  if (!invitation || invitation.status !== "pending") {
    return NextResponse.redirect(`${origin}/login?error=invite_expired`);
  }

  // Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User already has an account — link them
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, role, workspace_id")
      .eq("id", user.id)
      .single();

    if (existingProfile && existingProfile.workspace_id === invitation.workspace_id) {
      // Same workspace: update role and link employee
      if (invitation.role === "employee") {
        // Find employee record by email
        const { data: employee } = await supabase
          .from("employees")
          .select("id")
          .eq("workspace_id", invitation.workspace_id)
          .eq("email", invitation.email.toLowerCase())
          .maybeSingle();

        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            role: "employee",
            employee_id: employee?.id ?? null,
          })
          .eq("id", user.id);

        if (profileUpdateError) {
          return NextResponse.redirect(`${origin}/login?error=invite_accept_failed`);
        }
      } else if (invitation.role === "admin" || invitation.role === "company_admin") {
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            role: "admin",
            employee_id: null,
          })
          .eq("id", user.id);

        if (profileUpdateError) {
          return NextResponse.redirect(`${origin}/login?error=invite_accept_failed`);
        }
      }

      // Mark invitation accepted
      const { error: invitationUpdateError } = await supabase
        .from("team_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      if (invitationUpdateError) {
        return NextResponse.redirect(`${origin}/login?error=invite_accept_failed`);
      }

      const postAcceptPath =
        invitation.role === "admin" || invitation.role === "company_admin"
          ? "/onboarding"
          : "/dashboard/me";

      return NextResponse.redirect(`${origin}${postAcceptPath}`);
    }

    return NextResponse.redirect(`${origin}/login?error=invite_wrong_workspace`);
  }

  // Not logged in — redirect to employee signup with token
  const signupUrl = new URL(`${origin}/register/employee`);
  signupUrl.searchParams.set("token", token);
  signupUrl.searchParams.set("email", invitation.email);
  if (invitation.role === "admin" || invitation.role === "company_admin") {
    signupUrl.searchParams.set("role", "admin");
  }
  return NextResponse.redirect(signupUrl.toString());
}
