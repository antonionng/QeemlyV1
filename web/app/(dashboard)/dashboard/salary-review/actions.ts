"use server";

import { createClient } from "@/lib/supabase/server";
import { LOCATIONS } from "@/lib/dashboard/dummy-data";
import type { Department } from "@/lib/employees";

type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
  email?: string;
  department: Department;
  roleId: string;
  levelId: string;
  locationId: string;
  baseSalary: number;
  hireDate?: string;
};

export async function createEmployee(
  input: CreateEmployeeInput
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You need to be signed in." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.workspace_id) {
    return { success: false, error: "Could not find your workspace." };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email?.trim().toLowerCase();
  const baseSalary = Number(input.baseSalary);
  const selectedLocation = LOCATIONS.find((loc) => loc.id === input.locationId);

  if (!firstName || !lastName) {
    return { success: false, error: "First and last name are required." };
  }

  if (!Number.isFinite(baseSalary) || baseSalary <= 0) {
    return { success: false, error: "Base salary must be greater than 0." };
  }

  if (email && !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (!selectedLocation) {
    return { success: false, error: "Please select a valid location." };
  }

  const hireDate = input.hireDate?.trim()
    ? input.hireDate
    : new Date().toISOString().split("T")[0];

  const { error: insertError } = await supabase.from("employees").insert({
    workspace_id: profile.workspace_id,
    first_name: firstName,
    last_name: lastName,
    email: email || null,
    department: input.department,
    role_id: input.roleId,
    level_id: input.levelId,
    location_id: input.locationId,
    base_salary: Math.round(baseSalary),
    bonus: 0,
    equity: 0,
    currency: selectedLocation.currency,
    status: "active",
    employment_type: "national",
    hire_date: hireDate,
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true };
}
