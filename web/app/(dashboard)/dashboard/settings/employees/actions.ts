"use server";

import { createClient } from "@/lib/supabase/server";
import { toClientSafeError } from "@/lib/errors/client-safe";

export type InvitableEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  department: string;
  invited: boolean;
  linkedProfileId: string | null;
};

export async function getInvitableEmployees(): Promise<InvitableEmployee[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return [];

  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, email, department")
    .eq("workspace_id", profile.workspace_id);

  if (!employees) return [];

  // Get existing invitations for this workspace
  const { data: invitations } = await supabase
    .from("team_invitations")
    .select("email, status")
    .eq("workspace_id", profile.workspace_id)
    .eq("role", "employee");

  const invitedEmails = new Set(
    (invitations ?? [])
      .filter((i) => i.status === "pending" || i.status === "accepted")
      .map((i) => i.email.toLowerCase())
  );

  // Get profiles linked to employee records
  const { data: linkedProfiles } = await supabase
    .from("profiles")
    .select("id, employee_id")
    .eq("workspace_id", profile.workspace_id)
    .eq("role", "employee")
    .not("employee_id", "is", null);

  const linkedEmployeeIds = new Map(
    (linkedProfiles ?? []).map((p) => [p.employee_id, p.id])
  );

  return employees.map((emp) => ({
    id: emp.id,
    firstName: emp.first_name,
    lastName: emp.last_name,
    email: emp.email,
    department: emp.department,
    invited: emp.email ? invitedEmails.has(emp.email.toLowerCase()) : false,
    linkedProfileId: linkedEmployeeIds.get(emp.id) ?? null,
  }));
}

export async function inviteEmployee(
  employeeEmail: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin")
    return { success: false, error: "Admin access required" };

  if (!employeeEmail || !employeeEmail.includes("@"))
    return { success: false, error: "Valid email required" };

  // Check if already invited
  const { data: existing } = await supabase
    .from("team_invitations")
    .select("id")
    .eq("workspace_id", profile.workspace_id)
    .eq("email", employeeEmail.toLowerCase())
    .eq("role", "employee")
    .eq("status", "pending")
    .maybeSingle();

  if (existing)
    return { success: false, error: "Already invited" };

  const { error } = await supabase.from("team_invitations").insert({
    workspace_id: profile.workspace_id,
    email: employeeEmail.toLowerCase(),
    invited_by: user.id,
    role: "employee",
  });

  if (error) {
    return {
      success: false,
      error: toClientSafeError(error, {
        defaultMessage: "We could not send this employee invitation right now.",
      }).message,
    };
  }
  return { success: true };
}

export async function inviteAllEmployees(): Promise<{
  success: boolean;
  invited: number;
  skipped: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, invited: 0, skipped: 0, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin")
    return { success: false, invited: 0, skipped: 0, error: "Admin access required" };

  const employees = await getInvitableEmployees();
  const toInvite = employees.filter(
    (e) => e.email && !e.invited && !e.linkedProfileId
  );

  let invited = 0;
  let skipped = 0;

  for (const emp of toInvite) {
    const result = await inviteEmployee(emp.email!);
    if (result.success) invited++;
    else skipped++;
  }

  return {
    success: true,
    invited,
    skipped,
  };
}

export async function inviteByEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  return inviteEmployee(email);
}
