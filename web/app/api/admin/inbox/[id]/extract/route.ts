import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { adminErrorResponse, adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { extractTextFromPdfBuffer } from "@/lib/admin/research/pdf-text";
import { extractRobertWaltersReviewRows, ROBERT_WALTERS_SOURCE_FAMILY } from "@/lib/admin/research/pilot-workflow";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!id) {
    return adminErrorResponse("Upload ID is required", { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { data: upload, error: uploadError } = await supabase
      .from("admin_market_research_uploads")
      .select("id, file_name, file_path, file_kind, ingestion_status")
      .eq("id", id)
      .single();

    throwIfAdminQueryError(uploadError, "Failed to load admin inbox upload");

    if (!upload) {
      return adminErrorResponse("Upload not found", { status: 404 });
    }

    if (upload.file_kind !== "pdf") {
      return adminErrorResponse("Only PDF uploads can be extracted", { status: 400 });
    }

    const { data: pdfBlob, error: downloadError } = await supabase.storage
      .from("admin-inbox")
      .download(upload.file_path);
    throwIfAdminQueryError(downloadError, "Failed to download admin inbox PDF");
    if (!pdfBlob) {
      return adminErrorResponse("Failed to download admin inbox PDF", {
        status: 500,
        detail: "Supabase storage returned an empty PDF payload.",
      });
    }

    const buffer = Buffer.from(await pdfBlob.arrayBuffer());
    const text = await extractTextFromPdfBuffer(buffer);
    const rows = extractRobertWaltersReviewRows(text, id);

    if (rows.length === 0) {
      return adminErrorResponse("No Robert Walters benchmark rows found", {
        status: 422,
        detail: "The PDF text was parsed, but no salary rows matched the pilot layout.",
      });
    }

    const { error: deleteError } = await supabase
      .from("admin_market_research_pdf_rows")
      .delete()
      .eq("upload_id", id);
    throwIfAdminQueryError(deleteError, "Failed to clear previous PDF review rows");

    const { error: insertError } = await supabase
      .from("admin_market_research_pdf_rows")
      .insert(rows);
    throwIfAdminQueryError(insertError, "Failed to store extracted PDF review rows");

    const { error: updateError } = await supabase
      .from("admin_market_research_uploads")
      .update({
        ingestion_status: "reviewing",
        ingestion_notes: `Extracted ${rows.length} Robert Walters pilot rows.`,
      })
      .eq("id", id);
    throwIfAdminQueryError(updateError, "Failed to update upload extraction status");

    return NextResponse.json({
      ok: true,
      extractedCount: rows.length,
      sourceFamily: ROBERT_WALTERS_SOURCE_FAMILY,
    });
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
