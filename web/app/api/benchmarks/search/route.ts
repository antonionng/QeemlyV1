import { NextRequest, NextResponse } from "next/server";
import { findMarketBenchmark } from "@/lib/benchmarks/platform-market";
import type { DbBenchmark } from "@/lib/benchmarks/data-service";
import type { Currency, SalaryBenchmark } from "@/lib/dashboard/dummy-data";
import { LOCATIONS } from "@/lib/dashboard/dummy-data";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get("roleId");
  const locationId = searchParams.get("locationId");
  const levelId = searchParams.get("levelId");

  if (!roleId || !locationId || !levelId) {
    return NextResponse.json(
      { error: "roleId, locationId, and levelId are required." },
      { status: 400 },
    );
  }

  const diagnostics = {
    market: {
      readMode: "session" as "service" | "session",
      clientWarning: null as string | null,
      error: null as string | null,
    },
  };

  let marketClient: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createServiceClient> =
    supabase;

  try {
    marketClient = createServiceClient();
    diagnostics.market.readMode = "service";
  } catch (error) {
    diagnostics.market.clientWarning = getErrorMessage(error);
  }

  try {
    const marketBenchmark = await findMarketBenchmark(marketClient, roleId, locationId, levelId);
    if (marketBenchmark) {
      return NextResponse.json({
        benchmark: transformMarketBenchmark(marketBenchmark),
        diagnostics,
      });
    }
  } catch (error) {
    diagnostics.market.error = getErrorMessage(error);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) {
    return NextResponse.json({ benchmark: null, diagnostics });
  }

  const { data: benchmarks, error: benchmarkError } = await supabase
    .from("salary_benchmarks")
    .select("*")
    .eq("workspace_id", profile.workspace_id)
    .eq("role_id", roleId)
    .eq("location_id", locationId)
    .eq("level_id", levelId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (benchmarkError) {
    return NextResponse.json(
      { error: benchmarkError.message, diagnostics },
      { status: 500 },
    );
  }

  const benchmark = benchmarks?.[0] ? transformDbBenchmark(benchmarks[0] as DbBenchmark) : null;
  return NextResponse.json({ benchmark, diagnostics });
}

function transformMarketBenchmark(marketBenchmark: {
  role_id: string;
  location_id: string;
  level_id: string;
  currency: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sample_size: number | null;
}): SalaryBenchmark {
  const location = LOCATIONS.find((entry) => entry.id === marketBenchmark.location_id);
  const currency = (location?.currency || marketBenchmark.currency || "AED") as Currency;

  return {
    roleId: marketBenchmark.role_id,
    locationId: marketBenchmark.location_id,
    levelId: marketBenchmark.level_id,
    currency,
    percentiles: {
      p10: marketBenchmark.p10,
      p25: marketBenchmark.p25,
      p50: marketBenchmark.p50,
      p75: marketBenchmark.p75,
      p90: marketBenchmark.p90,
    },
    sampleSize: marketBenchmark.sample_size || 0,
    confidence: "High",
    lastUpdated: new Date().toISOString(),
    momChange: 0,
    yoyChange: 0,
    trend: [],
    benchmarkSource: "market",
  };
}

function transformDbBenchmark(dbBenchmark: DbBenchmark): SalaryBenchmark {
  const location = LOCATIONS.find((entry) => entry.id === dbBenchmark.location_id);
  const currency = (location?.currency || dbBenchmark.currency || "AED") as Currency;

  return {
    roleId: dbBenchmark.role_id,
    locationId: dbBenchmark.location_id,
    levelId: dbBenchmark.level_id,
    currency,
    percentiles: {
      p10: Number(dbBenchmark.p10),
      p25: Number(dbBenchmark.p25),
      p50: Number(dbBenchmark.p50),
      p75: Number(dbBenchmark.p75),
      p90: Number(dbBenchmark.p90),
    },
    sampleSize: dbBenchmark.sample_size || 0,
    confidence: (dbBenchmark.confidence || "medium") as "High" | "Medium" | "Low",
    lastUpdated: dbBenchmark.created_at,
    momChange: 0,
    yoyChange: 0,
    trend: [],
    benchmarkSource: "uploaded",
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
