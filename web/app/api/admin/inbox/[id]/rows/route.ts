import { NextResponse } from "next/server";
import { adminErrorResponse, adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";

const REVIEW_ROW_SELECT =
  "id, upload_id, row_index, source_family, raw_text, role_title, function_name, employment_type, pay_period, currency, location_hint, level_hint, salary_2025_min, salary_2025_max, salary_2026_min, salary_2026_max, parse_confidence, review_status, review_notes, created_at, updated_at";

export async function GET(
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
    const { data, error } = await supabase
      .from("admin_market_research_pdf_rows")
      .select(REVIEW_ROW_SELECT)
      .eq("upload_id", id)
      .order("row_index");
    throwIfAdminQueryError(error, "Failed to load PDF review rows");
    return NextResponse.json(data ?? []);
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!id) {
    return adminErrorResponse("Upload ID is required", { status: 400 });
  }

  try {
    const body = (await request.json()) as {
      rowId?: string;
      changes?: Record<string, unknown>;
    };
    if (!body?.rowId || !body.changes || typeof body.changes !== "object") {
      return adminErrorResponse("rowId and changes are required", { status: 400 });
    }

    const allowedKeys = new Set([
      "role_title",
      "location_hint",
      "level_hint",
      "review_status",
      "review_notes",
    ]);
    const updatePayload = Object.fromEntries(
      Object.entries(body.changes).filter(([key]) => allowedKeys.has(key)),
    );

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("admin_market_research_pdf_rows")
      .update(updatePayload)
      .eq("id", body.rowId)
      .select(REVIEW_ROW_SELECT)
      .single();
    throwIfAdminQueryError(error, "Failed to update PDF review row");
    return NextResponse.json(data);
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
