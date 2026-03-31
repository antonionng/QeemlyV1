import { NextRequest, NextResponse } from "next/server";
import { findMarketBenchmark } from "@/lib/benchmarks/platform-market";
import { readMarketDataWithFallback } from "@/lib/benchmarks/market-read";
import { getConfidenceFromSampleSize, type DbBenchmark } from "@/lib/benchmarks/data-service";
import type { BenchmarkDetailAiBriefing } from "@/lib/benchmarks/detail-ai";
import { normalizeBenchmarkPercentilesToAnnual } from "@/lib/benchmarks/pay-period";
import { getAiBenchmarkForLevel, type AiLevelEstimate } from "@/lib/benchmarks/ai-estimate";
import type { Currency, SalaryBenchmark } from "@/lib/dashboard/dummy-data";
import { LOCATIONS } from "@/lib/dashboard/dummy-data";
import { createClient } from "@/lib/supabase/server";

export type AiAdvisoryPayload = {
  levelEstimate: AiLevelEstimate;
  reasoning: string;
  marketContext: string;
  confidenceNote: string;
  industryInsight: string | null;
  companySizeInsight: string | null;
  detailBriefing: AiDetailBriefing;
};

export type AiInsights = {
  reasoning: string;
  marketContext: string;
  confidenceNote: string;
  industryInsight: string | null;
  companySizeInsight: string | null;
};

export type AiDetailBriefing = BenchmarkDetailAiBriefing;

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
    ai: {
      called: false,
      error: null as string | null,
    },
  };

  // Run market lookup and AI advisory in parallel
  const [marketResult, aiResult] = await Promise.allSettled([
    resolveMarketBenchmark(supabase, roleId, locationId, levelId, industry, companySize, diagnostics),
    resolveAiAdvisory(roleId, locationId, levelId, industry, companySize, diagnostics),
  ]);

  const marketBenchmark = marketResult.status === "fulfilled" ? marketResult.value : null;
  const aiAdvisory = aiResult.status === "fulfilled" ? aiResult.value : null;

  const marketIsWeak = !marketBenchmark
    || marketBenchmark.confidence === "Low"
    || (marketBenchmark.sampleSize ?? 0) < 5;

  // When market data is missing or weak, promote AI advisory to the primary
  // benchmark so the UI feels unified rather than showing two separate sources.
  const shouldPromoteAi = marketIsWeak && aiAdvisory !== null;
  const primaryBenchmark = shouldPromoteAi
    ? buildAiBenchmark(aiAdvisory, roleId, locationId, levelId)
    : (marketBenchmark ?? buildAiBenchmark(aiAdvisory, roleId, locationId, levelId));

  // Only attach the AI advisory panel when market data is strong enough to
  // stand on its own; otherwise the AI data already IS the primary display.
  const aiAdvisoryPanel = shouldPromoteAi ? null : aiAdvisory;

  // Always pass AI insights for the summary, regardless of whether AI is
  // primary or supplementary.
  const aiInsights: AiInsights | null = aiAdvisory
    ? {
        reasoning: aiAdvisory.reasoning,
        marketContext: aiAdvisory.marketContext,
        confidenceNote: aiAdvisory.confidenceNote,
        industryInsight: aiAdvisory.industryInsight,
        companySizeInsight: aiAdvisory.companySizeInsight,
      }
    : null;
  const aiDetailBriefing: AiDetailBriefing | null = aiAdvisory?.detailBriefing ?? null;

  return NextResponse.json({
    benchmark: primaryBenchmark,
    aiAdvisory: aiAdvisoryPanel,
    aiInsights,
    aiDetailBriefing,
    diagnostics,
  });
}

async function resolveMarketBenchmark(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roleId: string,
  locationId: string,
  levelId: string,
  industry: string | null,
  companySize: string | null,
  diagnostics: { market: { readMode: "service" | "session"; clientWarning: string | null; error: string | null } },
): Promise<SalaryBenchmark | null> {
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
      return transformMarketBenchmark(marketBenchmark, { industry, companySize });
    }
  } catch (error) {
    diagnostics.market.error = getErrorMessage(error);
  }

  // Workspace bands fallback
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.workspace_id) return null;

  const { data: benchmarks, error: benchmarkError } = await supabase
    .from("salary_benchmarks")
    .select("*")
    .eq("workspace_id", profile.workspace_id)
    .eq("role_id", roleId)
    .eq("location_id", locationId)
    .eq("level_id", levelId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (benchmarkError || !benchmarks?.[0]) return null;

  return transformDbBenchmark(benchmarks[0] as DbBenchmark);
}

async function resolveAiAdvisory(
  roleId: string,
  locationId: string,
  levelId: string,
  industry: string | null,
  companySize: string | null,
  diagnostics: { ai: { called: boolean; error: string | null } },
): Promise<AiAdvisoryPayload | null> {
  diagnostics.ai.called = true;
  try {
    const result = await getAiBenchmarkForLevel(roleId, locationId, levelId, {
      industry,
      companySize,
    });
    if (!result) return null;

    return {
      levelEstimate: result.level,
      reasoning: result.advisory.reasoning,
      marketContext: result.advisory.marketContext,
      confidenceNote: result.advisory.confidenceNote,
      industryInsight: result.advisory.industryInsight,
      companySizeInsight: result.advisory.companySizeInsight,
      detailBriefing: result.advisory.detailBriefing,
    };
  } catch (error) {
    diagnostics.ai.error = getErrorMessage(error);
    return null;
  }
}

function buildAiBenchmark(
  aiAdvisory: AiAdvisoryPayload | null,
  roleId: string,
  locationId: string,
  levelId: string,
): SalaryBenchmark | null {
  if (!aiAdvisory) return null;

  const location = LOCATIONS.find((entry) => entry.id === locationId);
  const currency = (location?.currency || "AED") as Currency;
  const est = aiAdvisory.levelEstimate;

  return {
    roleId,
    locationId,
    levelId,
    currency,
    payPeriod: "annual",
    sourcePayPeriod: "annual",
    percentiles: {
      p10: est.p10,
      p25: est.p25,
      p50: est.p50,
      p75: est.p75,
      p90: est.p90,
    },
    sampleSize: 0,
    confidence: "Medium",
    lastUpdated: new Date().toISOString(),
    momChange: 0,
    yoyChange: 0,
    trend: [],
    benchmarkSource: "ai-estimated",
  };
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
