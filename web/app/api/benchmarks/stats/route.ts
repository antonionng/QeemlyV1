import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import { readMarketDataWithFallback } from "@/lib/benchmarks/market-read";
import { getWorkspaceContextOrError } from "@/lib/workspace-access";
import { toClientSafeError } from "@/lib/errors/client-safe";

/**
 * GET /api/benchmarks/stats
 * Returns both market (Qeemly data pool) and workspace (company bands) stats.
 */
export async function GET() {
  const supabase = await createClient();

  const workspaceContext = await getWorkspaceContextOrError();
  if (workspaceContext.error) {
    return workspaceContext.error;
  }
  const { workspace_id } = workspaceContext.context;

  // Market benchmarks (Qeemly data pool — always available)
  let marketBenchmarkCount = 0;
  let marketRoles = 0;
  let marketLocations = 0;
  const combinedRoleIds = new Set<string>();
  const combinedLocationIds = new Set<string>();
  const diagnostics = {
    market: {
      readMode: "session" as "service" | "session",
      clientWarning: null as string | null,
      error: null as string | null,
      warning: null as string | null,
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasPlatformWorkspaceId: Boolean(process.env.PLATFORM_WORKSPACE_ID),
    },
  };

  try {
    const marketData = await readMarketDataWithFallback({
      sessionClient: supabase,
      diagnostics: diagnostics.market,
      read: (marketClient) => fetchMarketBenchmarks(marketClient),
    });
    marketBenchmarkCount = marketData.length;
    marketRoles = new Set(marketData.map(b => b.role_id)).size;
    marketLocations = new Set(marketData.map(b => b.location_id)).size;
    marketData.forEach((benchmark) => {
      combinedRoleIds.add(benchmark.role_id);
      combinedLocationIds.add(benchmark.location_id);
    });
    if (marketData.length === 0) {
      diagnostics.market.warning = "No published shared-market benchmark rows were returned from the market pool.";
    }
  } catch (error) {
    diagnostics.market.error = toClientSafeError(error, {
      defaultMessage: "Market benchmark data is temporarily unavailable.",
      action: "Refresh the page or try again in a few minutes.",
    }).message;
  }

  // Workspace benchmarks (company pay bands)
  let workspaceBenchmarkCount = 0;
  let workspaceRoles = 0;
  let workspaceLocations = 0;
  let workspaceSources: string[] = [];
  let lastUpdated: string | null = null;
  let latestMarketPublishedAt: string | null = null;

  const { data: publishEvents, error: publishEventsError } = await supabase
    .from("market_publish_events")
    .select("id, published_at")
    .eq("tenant_visible", true)
    .order("published_at", { ascending: false })
    .limit(1);

  if (!publishEventsError && publishEvents?.[0]?.published_at) {
    latestMarketPublishedAt = String(publishEvents[0].published_at);
  }

  if (workspace_id) {
    const { data: benchmarks, error: benchmarkError } = await supabase
      .from("salary_benchmarks")
      .select("id, role_id, location_id, source, updated_at")
      .eq("workspace_id", workspace_id);

    if (!benchmarkError && benchmarks) {
      workspaceBenchmarkCount = benchmarks.length;
      workspaceRoles = new Set(benchmarks.map(b => b.role_id)).size;
      workspaceLocations = new Set(benchmarks.map(b => b.location_id)).size;
      benchmarks.forEach((benchmark) => {
        combinedRoleIds.add(benchmark.role_id);
        combinedLocationIds.add(benchmark.location_id);
      });
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
  const marketIsVisibleSource = marketBenchmarkCount > 0 || workspaceSources.length === 0;
  if (marketIsVisibleSource && latestMarketPublishedAt) {
    lastUpdated = latestMarketPublishedAt;
  }

  return NextResponse.json({
    total,
    uniqueRoles: combinedRoleIds.size,
    uniqueLocations: combinedLocationIds.size,
    sources: [...new Set(["market", ...workspaceSources])],
    lastUpdated,
    hasRealData: total > 0,
    diagnostics,
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
