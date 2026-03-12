import { NextResponse } from "next/server";
import { adminErrorResponse, adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { classifyResearchAsset } from "@/lib/admin/workbench";
import { createServiceClient } from "@/lib/supabase/service";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function buildStoragePath(fileName: string) {
  const safeName = sanitizeFileName(fileName);
  return `uploads/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`;
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("admin_market_research_uploads")
      .select(
        "id, file_name, file_path, file_size, mime_type, file_kind, ingest_queue, ingestion_status, ingestion_notes, uploaded_by, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    throwIfAdminQueryError(error, "Failed to load admin inbox uploads");
    return NextResponse.json(data ?? []);
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return adminErrorResponse("A file upload is required", {
        status: 400,
        detail: "Submit a multipart form with a file field named 'file'.",
      });
    }

    const classification = classifyResearchAsset(fileEntry.name);
    const filePath = buildStoragePath(fileEntry.name);
    const supabase = createServiceClient();

    const { error: uploadError } = await supabase.storage.from("admin-inbox").upload(filePath, fileEntry, {
      upsert: false,
      contentType: fileEntry.type || undefined,
    });

    throwIfAdminQueryError(uploadError, "Failed to upload admin inbox file");

    const { data, error } = await supabase
      .from("admin_market_research_uploads")
      .insert({
        file_name: fileEntry.name,
        file_path: filePath,
        file_size: fileEntry.size,
        mime_type: fileEntry.type || null,
        file_kind: classification.kind,
        ingest_queue: classification.queue,
        ingestion_status: "uploaded",
        ingestion_notes: null,
        uploaded_by: auth.user.id,
      })
      .select(
        "id, file_name, file_path, file_size, mime_type, file_kind, ingest_queue, ingestion_status, ingestion_notes, uploaded_by, created_at, updated_at",
      )
      .single();

    throwIfAdminQueryError(error, "Failed to create admin inbox upload record");
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof TypeError) {
      return adminErrorResponse("Invalid upload payload", {
        status: 400,
        detail: error.message,
      });
    }
    return adminRouteErrorResponse(error);
  }
}
