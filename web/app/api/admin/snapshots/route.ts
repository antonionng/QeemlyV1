import { NextRequest, NextResponse } from "next/server";
import { adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);
    const sourceId = searchParams.get("source_id");

    const supabase = createServiceClient();
    let query = supabase
      .from("raw_source_snapshots")
      .select(`
        id,
        source_id,
        workspace_id,
        fetched_at,
        schema_version,
        checksum,
        row_count,
        storage_path,
        sample_preview,
        created_at,
        ingestion_sources(slug, name)
      `)
      .order("fetched_at", { ascending: false })
      .limit(limit);

    if (sourceId) {
      query = query.eq("source_id", sourceId);
    }

    const { data, error } = await query;
    throwIfAdminQueryError(error, "Failed to load raw snapshots");
    return NextResponse.json(data ?? []);
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
