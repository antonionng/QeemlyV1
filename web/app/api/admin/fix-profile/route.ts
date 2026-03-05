import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

/**
 * GET /api/admin/fix-profile
 * Diagnose current user's profile-workspace linking
 */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const supabase = createServiceClient();

  // Get current user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, workspace_id, full_name, avatar_url, role")
    .eq("id", auth.user.id)
    .single();

  // Get all workspaces for reference
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false });

  // Check if workspace_settings exists for profile's workspace
  let workspaceSettings = null;
  let workspace = null;
  if (profile?.workspace_id) {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", profile.workspace_id)
      .single();
    workspace = ws;

    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .single();
    workspaceSettings = settings;
  }

  // Check storage buckets
  const { data: buckets } = await supabase.storage.listBuckets();
  const hasCompanyLogosBucket = buckets?.some((b) => b.name === "company-logos");
  const hasAvatarsBucket = buckets?.some((b) => b.name === "avatars");

  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
    },
    profile: profile || null,
    profile_error: profileError?.message || null,
    workspace: workspace || null,
    workspace_settings: workspaceSettings || null,
    all_workspaces: workspaces || [],
    storage: {
      company_logos_bucket: hasCompanyLogosBucket,
      avatars_bucket: hasAvatarsBucket,
    },
    diagnosis: {
      has_profile: !!profile,
      has_workspace_id: !!profile?.workspace_id,
      workspace_exists: !!workspace,
      has_settings: !!workspaceSettings,
      needs_fix: !profile || !profile.workspace_id || !workspace,
    },
  });
}

/**
 * POST /api/admin/fix-profile
 * Fix profile-workspace linking for current user
 */
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const supabase = createServiceClient();
  const body = await request.json();
  const { workspace_id, create_settings } = body;

  if (!workspace_id) {
    return NextResponse.json({ error: "workspace_id required" }, { status: 400 });
  }

  // Verify workspace exists
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("id", workspace_id)
    .single();

  if (wsError || !workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", auth.user.id)
    .single();

  if (existingProfile) {
    // Update existing profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ workspace_id, role: "admin" })
      .eq("id", auth.user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    // Create new profile
    const { error: insertError } = await supabase.from("profiles").insert({
      id: auth.user.id,
      workspace_id,
      role: "admin",
      full_name: auth.user.email?.split("@")[0] || "Admin",
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // Optionally create workspace_settings if they don't exist
  if (create_settings) {
    const { data: existingSettings } = await supabase
      .from("workspace_settings")
      .select("id")
      .eq("workspace_id", workspace_id)
      .single();

    if (!existingSettings) {
      await supabase.from("workspace_settings").insert({
        workspace_id,
        company_name: workspace.name,
        is_configured: false,
      });
    }
  }

  // Also ensure storage buckets exist
  const { data: buckets } = await supabase.storage.listBuckets();
  const hasCompanyLogosBucket = buckets?.some((b) => b.name === "company-logos");
  const hasAvatarsBucket = buckets?.some((b) => b.name === "avatars");

  if (!hasCompanyLogosBucket) {
    await supabase.storage.createBucket("company-logos", { public: true });
  }
  if (!hasAvatarsBucket) {
    await supabase.storage.createBucket("avatars", { public: true });
  }

  return NextResponse.json({
    success: true,
    message: `Profile linked to workspace "${workspace.name}"`,
    workspace,
  });
}
