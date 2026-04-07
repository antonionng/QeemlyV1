import { NextResponse } from "next/server";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import {
  buildMarketInsightsResponse,
  type MarketDiagnostics,
  type WorkspaceOverlaySummary,
} from "@/lib/benchmarks/market-insights";
import { createClient } from "@/lib/supabase/server";
import { readMarketDataWithFallback } from "@/lib/benchmarks/market-read";
import { getWorkspaceContextOrError } from "@/lib/workspace-access";
import { toClientSafeError } from "@/lib/errors/client-safe";

export async function GET() {
  const supabase = await createClient();
  const workspaceContext = await getWorkspaceContextOrError();
  if (workspaceContext.error) {
    return workspaceContext.error;
  }

  const diagnostics: {
    market: MarketDiagnostics;
  } = {
    market: {
      readMode: "session",
      clientWarning: null as string | null,
      error: null as string | null,
      warning: null as string | null,
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasPlatformWorkspaceId: Boolean(process.env.PLATFORM_WORKSPACE_ID),
    },
  };

  let marketRows: Awaited<ReturnType<typeof fetchMarketBenchmarks>> = [];
  try {
    marketRows = await readMarketDataWithFallback({
      sessionClient: supabase,
      diagnostics: diagnostics.market,
      read: (marketClient) => fetchMarketBenchmarks(marketClient),
    });
    if (marketRows.length === 0) {
      diagnostics.market.warning = "No market benchmark rows were returned from the platform market dataset.";
    }
  } catch (error) {
    diagnostics.market.error = toClientSafeError(error, {
      defaultMessage: "Market benchmark data is temporarily unavailable.",
      action: "Refresh the page or try again in a few minutes.",
    }).message;
  }

  const workspaceOverlay = await loadWorkspaceOverlaySummary(supabase, workspaceContext.context.workspace_id);

  return NextResponse.json(
    buildMarketInsightsResponse({
      marketRows,
      workspaceOverlay,
      diagnostics,
    }),
  );
}

async function loadWorkspaceOverlaySummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string | null,
): Promise<WorkspaceOverlaySummary> {
  if (!workspaceId) {
    return {
      count: 0,
      uniqueRoles: 0,
      uniqueLocations: 0,
      sources: [],
    };
  }

  const { data: benchmarks, error } = await supabase
    .from("salary_benchmarks")
    .select("id, role_id, location_id, source, updated_at")
    .eq("workspace_id", workspaceId);

  if (error || !benchmarks) {
    return {
      count: 0,
      uniqueRoles: 0,
      uniqueLocations: 0,
      sources: [],
    };
  }

  return {
    count: benchmarks.length,
    uniqueRoles: new Set(benchmarks.map((benchmark) => benchmark.role_id)).size,
    uniqueLocations: new Set(benchmarks.map((benchmark) => benchmark.location_id)).size,
    sources: [...new Set(benchmarks.map((benchmark) => benchmark.source))],
  };
}
