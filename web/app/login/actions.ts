"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("name") as string;
  const company = formData.get("company") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company_name: company,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Create workspace and profile for new user
  if (data.user) {
    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    // Create workspace
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({ name: company, slug: `${slug}-${Date.now()}` })
      .select()
      .single();

    if (workspace) {
      // Create profile
      await supabase.from("profiles").insert({
        id: data.user.id,
        workspace_id: workspace.id,
        full_name: fullName,
        role: "admin",
      });
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
