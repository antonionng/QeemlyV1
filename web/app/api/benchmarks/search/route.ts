import { NextRequest, NextResponse } from "next/server";
import { findMarketBenchmark } from "@/lib/benchmarks/platform-market";
import { readMarketDataWithFallback } from "@/lib/benchmarks/market-read";
import { getConfidenceFromSampleSize, type DbBenchmark } from "@/lib/benchmarks/data-service";
import { normalizeBenchmarkPercentilesToAnnual } from "@/lib/benchmarks/pay-period";
import type { Currency, SalaryBenchmark } from "@/lib/dashboard/dummy-data";
import { LOCATIONS } from "@/lib/dashboard/dummy-data";
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
  const industry = searchParams.get("industry");
  const companySize = searchParams.get("companySize");

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

  try {
    const marketBenchmark = await readMarketDataWithFallback({
      sessionClient: supabase,
      diagnostics: diagnostics.market,
      read: (marketClient) =>
        findMarketBenchmark(marketClient, roleId, locationId, levelId, {
          industry,
          companySize,
        }),
    });
    if (marketBenchmark) {
      return NextResponse.json({
        benchmark: transformMarketBenchmark(marketBenchmark, { industry, companySize }),
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

function normalizeFilterValue(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function transformMarketBenchmark(marketBenchmark: {
  role_id: string;
  location_id: string;
  level_id: string;
  currency: string;
  pay_period?: "monthly" | "annual" | null;
  industry?: string | null;
  company_size?: string | null;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sample_size: number | null;
}, filters: { industry?: string | null; companySize?: string | null } = {}): SalaryBenchmark {
  const location = LOCATIONS.find((entry) => entry.id === marketBenchmark.location_id);
  const currency = (location?.currency || marketBenchmark.currency || "AED") as Currency;
  const requestedIndustry = normalizeFilterValue(filters.industry);
  const requestedCompanySize = normalizeFilterValue(filters.companySize);
  const matchedIndustry = normalizeFilterValue(marketBenchmark.industry);
  const matchedCompanySize = normalizeFilterValue(marketBenchmark.company_size);
  const sampleSize = marketBenchmark.sample_size || 0;
  const normalized = normalizeBenchmarkPercentilesToAnnual(
    {
      p10: marketBenchmark.p10,
      p25: marketBenchmark.p25,
      p50: marketBenchmark.p50,
      p75: marketBenchmark.p75,
      p90: marketBenchmark.p90,
    },
    marketBenchmark.pay_period,
  );

  return {
    roleId: marketBenchmark.role_id,
    locationId: marketBenchmark.location_id,
    levelId: marketBenchmark.level_id,
    currency,
    payPeriod: normalized.payPeriod,
    sourcePayPeriod: normalized.sourcePayPeriod,
    percentiles: normalized.percentiles,
    sampleSize,
    confidence: getConfidenceFromSampleSize(sampleSize),
    lastUpdated: new Date().toISOString(),
    momChange: 0,
    yoyChange: 0,
    trend: [],
    benchmarkSource: "market",
    benchmarkSegmentation: {
      requestedIndustry,
      requestedCompanySize,
      matchedIndustry,
      matchedCompanySize,
      isSegmented: Boolean(matchedIndustry || matchedCompanySize),
      isFallback:
        (!!requestedIndustry && requestedIndustry !== matchedIndustry) ||
        (!!requestedCompanySize && requestedCompanySize !== matchedCompanySize),
    },
  };
}

function transformDbBenchmark(dbBenchmark: DbBenchmark): SalaryBenchmark {
  const location = LOCATIONS.find((entry) => entry.id === dbBenchmark.location_id);
  const currency = (location?.currency || dbBenchmark.currency || "AED") as Currency;
  const normalized = normalizeBenchmarkPercentilesToAnnual(
    {
      p10: Number(dbBenchmark.p10),
      p25: Number(dbBenchmark.p25),
      p50: Number(dbBenchmark.p50),
      p75: Number(dbBenchmark.p75),
      p90: Number(dbBenchmark.p90),
    },
    dbBenchmark.pay_period,
  );

  return {
    roleId: dbBenchmark.role_id,
    locationId: dbBenchmark.location_id,
    levelId: dbBenchmark.level_id,
    currency,
    payPeriod: normalized.payPeriod,
    sourcePayPeriod: normalized.sourcePayPeriod,
    percentiles: normalized.percentiles,
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
