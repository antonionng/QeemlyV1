"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClientError, toClientErrorBody } from "@/lib/errors/client-safe";
import { serverActionError } from "@/lib/errors/http";

const EMPLOYEE_SIGNUP_RECOVERY_ERROR =
  "We created your account but could not finish linking your invitation. Please contact your workspace admin.";

function getEmployeeSignupAuthError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();

  if (message.includes("already registered")) {
    return toClientErrorBody(
      createClientError({
        code: "email_in_use",
        message: "Please correct the highlighted fields and try again.",
        action: "Use the invited email address or sign in instead.",
        fields: {
          email: "This email is already linked to an account.",
        },
      }),
    );
  }

  if (message.includes("password") && (message.includes("least") || message.includes("weak"))) {
    return toClientErrorBody(
      createClientError({
        code: "weak_password",
        message: "Please correct the highlighted fields and try again.",
        action: "Choose a stronger password and try again.",
        fields: {
          password: "Password must meet the minimum security requirements.",
        },
      }),
    );
  }

  return serverActionError(error, {
    defaultMessage: "We could not create your account right now. Please try again.",
  });
}

export async function employeeSignup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("name") as string;
  const token = formData.get("token") as string;

  if (!token) {
    return { error: "Invalid invitation link." };
  }

  // Validate invitation
  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("id, email, workspace_id, role, status")
    .eq("token", token)
    .single();

  if (!invitation || invitation.status !== "pending") {
    return { error: "This invitation has expired or already been used." };
  }

  // Email must match invitation
  if (email.toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: "Email must match the invited email address." };
  }

  // Create the user account
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return getEmployeeSignupAuthError(error);
  }

  if (data.user) {
    // Find matching employee record
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("workspace_id", invitation.workspace_id)
      .eq("email", email.toLowerCase())
      .maybeSingle();

    // Create profile linked to workspace and employee record
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      workspace_id: invitation.workspace_id,
      full_name: fullName,
      role: invitation.role ?? "employee",
      employee_id: employee?.id ?? null,
    });

    if (profileError) {
      return { error: EMPLOYEE_SIGNUP_RECOVERY_ERROR };
    }

    // Mark invitation as accepted
    const { error: invitationUpdateError } = await supabase
      .from("team_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    if (invitationUpdateError) {
      return { error: EMPLOYEE_SIGNUP_RECOVERY_ERROR };
    }
  } else {
    return { error: "We could not create your account. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard/me");
}
