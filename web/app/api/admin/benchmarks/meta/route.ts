import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("salary_benchmarks")
    .select("role_id, location_id, level_id, source")
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const roles = Array.from(new Set((data ?? []).map((d) => d.role_id).filter(Boolean))).sort();
  const locations = Array.from(
    new Set((data ?? []).map((d) => d.location_id).filter(Boolean))
  ).sort();
  const levels = Array.from(new Set((data ?? []).map((d) => d.level_id).filter(Boolean))).sort();
  const sources = Array.from(new Set((data ?? []).map((d) => d.source).filter(Boolean))).sort();

  return NextResponse.json({ roles, locations, levels, sources });
}
