"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    return { error: error.message };
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
    await supabase.from("profiles").insert({
      id: data.user.id,
      workspace_id: invitation.workspace_id,
      full_name: fullName,
      role: invitation.role ?? "employee",
      employee_id: employee?.id ?? null,
    });

    // Mark invitation as accepted
    await supabase
      .from("team_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard/me");
}
