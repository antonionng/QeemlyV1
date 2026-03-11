import { NextResponse } from "next/server";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import {
  buildMarketInsightsResponse,
  type MarketDiagnostics,
  type WorkspaceOverlaySummary,
} from "@/lib/benchmarks/market-insights";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

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

  let marketSupabase: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createServiceClient> =
    supabase;

  try {
    marketSupabase = createServiceClient();
    diagnostics.market.readMode = "service";
  } catch (error) {
    diagnostics.market.clientWarning = getErrorMessage(error);
  }

  let marketRows: Awaited<ReturnType<typeof fetchMarketBenchmarks>> = [];
  try {
    marketRows = await fetchMarketBenchmarks(marketSupabase);
    if (marketRows.length === 0) {
      diagnostics.market.warning = "No market benchmark rows were returned from the platform market dataset.";
    }
  } catch (error) {
    diagnostics.market.error = getErrorMessage(error);
  }

  const workspaceOverlay = await loadWorkspaceOverlaySummary(supabase, profile?.workspace_id ?? null);

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
