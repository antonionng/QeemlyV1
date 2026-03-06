import { NextRequest, NextResponse } from "next/server";
import { adminRouteErrorResponse } from "@/lib/admin/api-client";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);
    const roleId = searchParams.get("role_id") || undefined;
    const locationId = searchParams.get("location_id") || undefined;
    const levelId = searchParams.get("level_id") || undefined;
    const source = searchParams.get("source") || undefined;

    const supabase = createServiceClient();
    const rows = await fetchMarketBenchmarks(supabase);
    const filtered = rows.filter((row) => {
      if (roleId && row.role_id !== roleId) return false;
      if (locationId && row.location_id !== locationId) return false;
      if (levelId && row.level_id !== levelId) return false;
      if (source && row.source !== source) return false;
      return true;
    });

    const start = page * limit;
    const end = start + limit;
    const paged = filtered.slice(start, end).map((row, idx) => ({
      id: `${row.role_id}::${row.location_id}::${row.level_id}::${start + idx}`,
      workspace_id: null,
      role_id: row.role_id,
      location_id: row.location_id,
      level_id: row.level_id,
      currency: row.currency,
      p10: row.p10,
      p25: row.p25,
      p50: row.p50,
      p75: row.p75,
      p90: row.p90,
      sample_size: row.sample_size,
      source: row.source,
      confidence: row.sample_size != null && row.sample_size >= 30 ? "high" : "medium",
      valid_from: null,
      created_at: null,
    }));

    return NextResponse.json({
      data: paged,
      total: filtered.length,
      page,
      limit,
    });
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
