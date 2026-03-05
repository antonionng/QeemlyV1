import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

/**
 * POST /api/settings/logo
 * Upload company logo to Supabase Storage
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's profile to find workspace_id and check admin role
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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ 
      error: "Invalid file type. Allowed: PNG, JPG, WebP, SVG" 
    }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ 
      error: "File too large. Maximum size is 2MB" 
    }, { status: 400 });
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "png";
  const fileName = `${profile.workspace_id}/logo-${Date.now()}.${ext}`;

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Supabase Storage (company-logos bucket)
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("company-logos")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json({ 
      error: "Failed to upload file: " + uploadError.message 
    }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("company-logos")
    .getPublicUrl(uploadData.path);

  const logoUrl = urlData.publicUrl;

  // Update workspace_settings with the logo URL
  const { data: existingSettings } = await supabase
    .from("workspace_settings")
    .select("id")
    .eq("workspace_id", profile.workspace_id)
    .single();

  if (existingSettings) {
    await supabase
      .from("workspace_settings")
      .update({ 
        company_logo: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", profile.workspace_id);
  } else {
    await supabase
      .from("workspace_settings")
      .insert({
        workspace_id: profile.workspace_id,
        company_logo: logoUrl,
      });
  }

  return NextResponse.json({ 
    success: true, 
    logo_url: logoUrl,
  });
}

/**
 * DELETE /api/settings/logo
 * Remove company logo
 */
export async function DELETE() {
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

  // Update settings to remove logo
  await supabase
    .from("workspace_settings")
    .update({ 
      company_logo: null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", profile.workspace_id);

  return NextResponse.json({ success: true });
}
