"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClientError, toClientErrorBody } from "@/lib/errors/client-safe";
import { serverActionError } from "@/lib/errors/http";

const SIGNUP_RECOVERY_ERROR =
  "We created your account but could not finish setting up your workspace. Please try again or contact support.";

function getAuthErrorMessage(value: unknown) {
  return value instanceof Error ? value.message : String(value ?? "");
}

function mapLoginAuthError(error: unknown) {
  const message = getAuthErrorMessage(error).toLowerCase();

  if (message.includes("invalid login credentials")) {
    return toClientErrorBody(
      createClientError({
        code: "invalid_credentials",
        message: "Please check your email address and password, then try again.",
        action: "Update the highlighted fields and try again.",
        fields: {
          email: "Check your email address and try again.",
          password: "Check your password and try again.",
        },
      }),
    );
  }

  return serverActionError(error, {
    defaultMessage: "We could not sign you in right now. Please try again.",
  });
}

function mapSignupAuthError(error: unknown) {
  const message = getAuthErrorMessage(error).toLowerCase();

  if (message.includes("already registered")) {
    return toClientErrorBody(
      createClientError({
        code: "email_in_use",
        message: "Please correct the highlighted fields and try again.",
        action: "Use a different email address and try again.",
        fields: {
          email: "Email is already in use. Use a different email address.",
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

  if (message.includes("email") && message.includes("valid")) {
    return toClientErrorBody(
      createClientError({
        code: "invalid_email",
        message: "Please correct the highlighted fields and try again.",
        action: "Enter a valid email address and try again.",
        fields: {
          email: "Enter a valid email address.",
        },
      }),
    );
  }

  return serverActionError(error, {
    defaultMessage: "We could not create your account right now. Please try again.",
  });
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return mapLoginAuthError(error);
  }

  // Determine redirect based on role
  let dest = "/dashboard";
  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      return {
        error: "Your account setup is incomplete. Please contact support before continuing.",
      };
    }

    if (profile?.role === "employee") {
      dest = "/dashboard/me";
    }
  }

  revalidatePath("/", "layout");
  redirect(dest);
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
    return mapSignupAuthError(error);
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

    if (wsError || !workspace) {
      return { error: SIGNUP_RECOVERY_ERROR };
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      workspace_id: workspace.id,
      full_name: fullName,
      role: "admin",
    });

    if (profileError) {
      await supabase.from("workspaces").delete().eq("id", workspace.id);
      return { error: SIGNUP_RECOVERY_ERROR };
    }
  } else {
    return { error: "We could not create your account. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
