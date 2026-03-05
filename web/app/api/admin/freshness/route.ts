import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const supabase = createServiceClient();
  const { data } = await supabase
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

  return NextResponse.json(data ?? []);
}
