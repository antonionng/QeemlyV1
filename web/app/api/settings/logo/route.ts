import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
const DEFAULT_LOGO_BUCKET = "company-logos";
const FALLBACK_LOGO_BUCKET = "avatars";

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

  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  // Check admin access for logo updates
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!wsContext.context.is_super_admin && profile?.role !== "admin") {
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
  const workspaceFileName = `${wsContext.context.workspace_id}/logo-${Date.now()}.${ext}`;
  const userFileName = `${user.id}/logo-${Date.now()}.${ext}`;

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const preferredBucket = process.env.SUPABASE_LOGO_BUCKET || DEFAULT_LOGO_BUCKET;
  const candidateBuckets = [preferredBucket, FALLBACK_LOGO_BUCKET].filter(
    (bucket, index, all) => all.indexOf(bucket) === index
  );

  let activeBucket: string | null = null;
  let activePath: string | null = null;
  let uploadData: { path: string } | null = null;
  let lastUploadError: Error | null = null;

  // Probe by upload; avatars policy expects first folder segment to be auth.uid.
  for (const bucket of candidateBuckets) {
    const targetPath = bucket === FALLBACK_LOGO_BUCKET ? userFileName : workspaceFileName;
    const { data, error } = await supabase.storage.from(bucket).upload(targetPath, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (!error && data) {
      activeBucket = bucket;
      activePath = targetPath;
      uploadData = data;
      break;
    }

    lastUploadError = error;
    const message = (error?.message || "").toLowerCase();
    const isMissingBucket = message.includes("bucket") && message.includes("not found");
    const isRlsOrPermissionIssue =
      message.includes("row-level security") ||
      message.includes("not allowed") ||
      message.includes("unauthorized");
    const shouldTryNextBucket = isMissingBucket || (bucket !== FALLBACK_LOGO_BUCKET && isRlsOrPermissionIssue);

    if (!shouldTryNextBucket) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file: " + (error?.message || "Unknown upload error") },
        { status: 500 }
      );
    }
  }

  if (!activeBucket || !activePath || !uploadData) {
    // Local/dev setups often lack storage buckets or permissive storage policies.
    // Fall back to storing a data URL in settings so users can still set a logo.
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    const { data: existingSettings } = await supabase
      .from("workspace_settings")
      .select("id")
      .eq("workspace_id", wsContext.context.workspace_id)
      .single();

    if (existingSettings) {
      const { error: persistError } = await supabase
        .from("workspace_settings")
        .update({
          company_logo: dataUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", wsContext.context.workspace_id);
      if (persistError) {
        console.error("Failed to persist fallback logo URL:", persistError);
        return NextResponse.json(
          { error: "Logo uploaded but failed to save settings: " + persistError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: persistError } = await supabase.from("workspace_settings").insert({
        workspace_id: wsContext.context.workspace_id,
        company_logo: dataUrl,
      });
      if (persistError) {
        console.error("Failed to persist fallback logo URL:", persistError);
        return NextResponse.json(
          { error: "Logo uploaded but failed to save settings: " + persistError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      logo_url: dataUrl,
      storage_fallback: true,
      warning:
        "Stored logo directly in workspace settings because storage bucket/policy is unavailable.",
      details: lastUploadError?.message || null,
    });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(activeBucket)
    .getPublicUrl(activePath);

  const logoUrl = urlData.publicUrl;

  // Update workspace_settings with the logo URL
  const { data: existingSettings } = await supabase
    .from("workspace_settings")
    .select("id")
    .eq("workspace_id", wsContext.context.workspace_id)
    .single();

  if (existingSettings) {
    const { error: persistError } = await supabase
      .from("workspace_settings")
      .update({ 
        company_logo: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", wsContext.context.workspace_id);
    if (persistError) {
      console.error("Failed to persist logo URL:", persistError);
      return NextResponse.json(
        { error: "Logo uploaded but failed to save settings: " + persistError.message },
        { status: 500 }
      );
    }
  } else {
    const { error: persistError } = await supabase
      .from("workspace_settings")
      .insert({
        workspace_id: wsContext.context.workspace_id,
        company_logo: logoUrl,
      });
    if (persistError) {
      console.error("Failed to persist logo URL:", persistError);
      return NextResponse.json(
        { error: "Logo uploaded but failed to save settings: " + persistError.message },
        { status: 500 }
      );
    }
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

  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!wsContext.context.is_super_admin && profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Update settings to remove logo
  await supabase
    .from("workspace_settings")
    .update({ 
      company_logo: null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", wsContext.context.workspace_id);

  return NextResponse.json({ success: true });
}
