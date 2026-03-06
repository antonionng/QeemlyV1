import { NextResponse } from "next/server";
import { adminRouteErrorResponse } from "@/lib/admin/api-client";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const supabase = createServiceClient();
    const data = await fetchMarketBenchmarks(supabase);

    const roles = Array.from(new Set(data.map((d) => d.role_id).filter(Boolean))).sort();
    const locations = Array.from(new Set(data.map((d) => d.location_id).filter(Boolean))).sort();
    const levels = Array.from(new Set(data.map((d) => d.level_id).filter(Boolean))).sort();
    const sources = Array.from(new Set(data.map((d) => d.source).filter(Boolean))).sort();

    return NextResponse.json({ roles, locations, levels, sources });
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
