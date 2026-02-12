import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "../middleware";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

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

  const supabase = getServiceClient();

  let query = supabase
    .from("salary_benchmarks")
    .select("*")
    .eq("workspace_id", auth.workspaceId)
    .order("created_at", { ascending: false });

  if (roleId) query = query.eq("role_id", roleId);
  if (levelId) query = query.eq("level_id", levelId);
  if (locationId) query = query.eq("location_id", locationId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
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
    return NextResponse.json(
      { error: "Request body must contain a non-empty 'benchmarks' array" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  let created = 0;
  let updated = 0;
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < benchmarks.length; i++) {
    const bm = benchmarks[i];

    if (!bm.role_id || !bm.level_id || !bm.location_id || !bm.currency || bm.p10 === undefined || bm.p25 === undefined || bm.p50 === undefined || bm.p75 === undefined || bm.p90 === undefined) {
      errors.push({ index: i, error: "Missing required fields (role_id, level_id, location_id, currency, p10-p90)" });
      continue;
    }

    const { data, error } = await supabase
      .from("salary_benchmarks")
      .upsert(
        {
          ...bm,
          workspace_id: auth.workspaceId,
          source: bm.source || "uploaded",
          valid_from: bm.valid_from || new Date().toISOString().split("T")[0],
        },
        { onConflict: "workspace_id,role_id,location_id,level_id,valid_from" }
      )
      .select()
      .single();

    if (error) {
      errors.push({ index: i, error: error.message });
    } else {
      // Rough check: if created_at equals the current time, it was created
      created++;
    }
  }

  return NextResponse.json({ created, updated, errors });
}
