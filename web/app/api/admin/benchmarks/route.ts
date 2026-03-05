import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);
  const roleId = searchParams.get("role_id") || undefined;
  const locationId = searchParams.get("location_id") || undefined;
  const levelId = searchParams.get("level_id") || undefined;
  const source = searchParams.get("source") || undefined;

  const supabase = createServiceClient();
  let query = supabase
    .from("salary_benchmarks")
    .select("id, workspace_id, role_id, location_id, level_id, currency, p10, p25, p50, p75, p90, sample_size, source, confidence, valid_from, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (roleId) query = query.eq("role_id", roleId);
  if (locationId) query = query.eq("location_id", locationId);
  if (levelId) query = query.eq("level_id", levelId);
  if (source) query = query.eq("source", source);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
