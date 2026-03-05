import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/benchmarks/stats
 * Get benchmark data statistics for the current workspace
 */
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's workspace
  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) {
    return NextResponse.json({ 
      total: 0,
      uniqueRoles: 0,
      uniqueLocations: 0,
      sources: [],
      lastUpdated: null,
      hasRealData: false,
    });
  }

  // Get benchmark statistics
  const { data: benchmarks, error: benchmarkError } = await supabase
    .from("salary_benchmarks")
    .select("id, role_id, location_id, source, updated_at")
    .eq("workspace_id", profile.workspace_id);

  if (benchmarkError) {
    return NextResponse.json({ error: benchmarkError.message }, { status: 500 });
  }

  const total = benchmarks?.length || 0;
  const uniqueRoles = new Set(benchmarks?.map(b => b.role_id) || []).size;
  const uniqueLocations = new Set(benchmarks?.map(b => b.location_id) || []).size;
  const sources = [...new Set(benchmarks?.map(b => b.source) || [])];
  
  const lastUpdated = benchmarks?.length 
    ? benchmarks.reduce((latest, b) => {
        const date = new Date(b.updated_at);
        return date > latest ? date : latest;
      }, new Date(0)).toISOString()
    : null;

  return NextResponse.json({
    total,
    uniqueRoles,
    uniqueLocations,
    sources,
    lastUpdated,
    hasRealData: total > 0,
  });
}
