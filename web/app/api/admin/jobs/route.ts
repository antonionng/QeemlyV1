import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("ingestion_jobs")
    .select("id, status, source_id, records_created, records_updated, records_failed, created_at, completed_at, error_message")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json(data ?? []);
}
