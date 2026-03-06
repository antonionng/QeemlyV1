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
      .from("ingestion_jobs")
      .select("id, status, source_id, records_created, records_updated, records_failed, created_at, completed_at, error_message")
      .order("created_at", { ascending: false })
      .limit(50);

    throwIfAdminQueryError(error, "Failed to load ingestion jobs");
    return NextResponse.json(data ?? []);
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
