import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";

/**
 * GET /api/benchmarks/stats
 * Returns both market (Qeemly data pool) and workspace (company bands) stats.
 */
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  // Market benchmarks (Qeemly data pool — always available)
  let marketBenchmarkCount = 0;
  let marketRoles = 0;
  let marketLocations = 0;
  try {
    const marketData = await fetchMarketBenchmarks(supabase);
    marketBenchmarkCount = marketData.length;
    marketRoles = new Set(marketData.map(b => b.role_id)).size;
    marketLocations = new Set(marketData.map(b => b.location_id)).size;
  } catch {
    // Market data may not be available yet
  }

  // Workspace benchmarks (company pay bands)
  let workspaceBenchmarkCount = 0;
  let workspaceRoles = 0;
  let workspaceLocations = 0;
  let workspaceSources: string[] = [];
  let lastUpdated: string | null = null;

  if (profile?.workspace_id) {
    const { data: benchmarks, error: benchmarkError } = await supabase
      .from("salary_benchmarks")
      .select("id, role_id, location_id, source, updated_at")
      .eq("workspace_id", profile.workspace_id);

    if (!benchmarkError && benchmarks) {
      workspaceBenchmarkCount = benchmarks.length;
      workspaceRoles = new Set(benchmarks.map(b => b.role_id)).size;
      workspaceLocations = new Set(benchmarks.map(b => b.location_id)).size;
      workspaceSources = [...new Set(benchmarks.map(b => b.source))];
      lastUpdated = benchmarks.length
        ? benchmarks.reduce((latest, b) => {
            const date = new Date(b.updated_at);
            return date > latest ? date : latest;
          }, new Date(0)).toISOString()
        : null;
    }
  }

  const total = marketBenchmarkCount + workspaceBenchmarkCount;

  return NextResponse.json({
    total,
    uniqueRoles: marketRoles + workspaceRoles,
    uniqueLocations: Math.max(marketLocations, workspaceLocations),
    sources: [...new Set(["market", ...workspaceSources])],
    lastUpdated,
    hasRealData: total > 0,
    market: {
      count: marketBenchmarkCount,
      uniqueRoles: marketRoles,
      uniqueLocations: marketLocations,
    },
    workspace: {
      count: workspaceBenchmarkCount,
      uniqueRoles: workspaceRoles,
      uniqueLocations: workspaceLocations,
      sources: workspaceSources,
    },
  });
}
