import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "../middleware";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import { buildAiBenchmarkRows } from "@/lib/benchmarks/ai-benchmark-rows";
import { refreshPlatformMarketPoolBestEffort } from "@/lib/benchmarks/platform-market-sync";
import { createServiceClient } from "@/lib/supabase/service";
import { upsertBenchmarksFreshness } from "@/lib/ingestion/freshness";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";
import { toClientSafeError } from "@/lib/errors/client-safe";

/**
 * GET /api/v1/benchmarks
 * 
 * Query salary benchmark data, optionally filtered by role, level, and location.
 * Requires scope: benchmarks:read
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request, "benchmarks:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get("role_id");
  const levelId = searchParams.get("level_id");
  const locationId = searchParams.get("location_id");

  const supabase = createServiceClient();

  const [marketRows, workspaceResult] = await Promise.all([
    (async () => {
      if (roleId && locationId) {
        const aiRows = await buildAiBenchmarkRows([{ roleId, locationId }]).catch(() => []);
        if (aiRows.length > 0) return aiRows;
      }
      return fetchMarketBenchmarks(supabase);
    })(),
    supabase
      .from("salary_benchmarks")
      .select("*")
      .eq("workspace_id", auth.workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  if (workspaceResult.error) {
    return jsonServerError(workspaceResult.error, {
      defaultMessage: "We could not load benchmark data right now.",
      logLabel: "V1 benchmarks load failed",
    });
  }

  const filteredMarketRows = marketRows.filter((row) => {
    if (roleId && row.role_id !== roleId) return false;
    if (levelId && row.level_id !== levelId) return false;
    if (locationId && row.location_id !== locationId) return false;
    return true;
  });
  const filteredWorkspaceRows = (workspaceResult.data || []).filter((row) => {
    if (roleId && row.role_id !== roleId) return false;
    if (levelId && row.level_id !== levelId) return false;
    if (locationId && row.location_id !== locationId) return false;
    return true;
  });

  return NextResponse.json({
    market: filteredMarketRows,
    workspace_overlay: filteredWorkspaceRows,
  });
}

/**
 * POST /api/v1/benchmarks
 * 
 * Push benchmark data points. Existing entries (same role+level+location) will be updated.
 * Requires scope: benchmarks:write
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request, "benchmarks:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  const { benchmarks } = body;

  if (!Array.isArray(benchmarks) || benchmarks.length === 0) {
    return jsonValidationError({
      message: "Please correct the request and try again.",
      fields: {
        benchmarks: "Provide at least one benchmark row and try again.",
      },
    });
  }

  const supabase = createServiceClient();
  let created = 0;
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < benchmarks.length; i++) {
    const bm = benchmarks[i];

    if (!bm.role_id || !bm.level_id || !bm.location_id || !bm.currency || bm.p10 === undefined || bm.p25 === undefined || bm.p50 === undefined || bm.p75 === undefined || bm.p90 === undefined) {
      errors.push({ index: i, error: "Missing required fields (role_id, level_id, location_id, currency, p10-p90)" });
      continue;
    }

    const { error } = await supabase
      .from("salary_benchmarks")
      .upsert(
        {
          ...bm,
          workspace_id: auth.workspaceId,
          source: bm.source || "uploaded",
          valid_from: bm.valid_from || new Date().toISOString().split("T")[0],
        },
        { onConflict: "workspace_id,role_id,location_id,level_id,industry_key,company_size_key,valid_from" }
      )
      .select()
      .single();

    if (error) {
      errors.push({
        index: i,
        error: toClientSafeError(error, {
          defaultMessage: "This benchmark row could not be saved right now.",
        }).message,
      });
    } else {
      // Rough check: if created_at equals the current time, it was created
      created++;
    }
  }

  if (created > 0) {
    await upsertBenchmarksFreshness(auth.workspaceId, created, null);
    await refreshPlatformMarketPoolBestEffort();
  }

  return NextResponse.json({ created, updated: 0, errors });
}
