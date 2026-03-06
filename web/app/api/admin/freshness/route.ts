import { NextResponse } from "next/server";
import { adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("data_freshness_metrics")
      .select(`
        id,
        workspace_id,
        source_id,
        metric_type,
        last_updated_at,
        record_count,
        confidence,
        computed_at,
        ingestion_sources(slug, name)
      `)
      .order("last_updated_at", { ascending: false })
      .limit(100);

    throwIfAdminQueryError(error, "Failed to load freshness metrics");
    return NextResponse.json(data ?? []);
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
