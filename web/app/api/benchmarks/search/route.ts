import { NextRequest, NextResponse } from "next/server";
import { getAiBenchmarkForLevelLight, type AiLevelEstimate } from "@/lib/benchmarks/ai-estimate";
import type { Currency, SalaryBenchmark } from "@/lib/dashboard/dummy-data";
import { LOCATIONS } from "@/lib/dashboard/dummy-data";
import {
  resolveBenchmarkLookup,
  type BenchmarkLookupClient,
} from "@/lib/benchmarks/lookup-service";
import { createClient } from "@/lib/supabase/server";

export type AiAdvisoryPayload = {
  levelEstimate: AiLevelEstimate;
  summary: string;
};

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
      durationMs: null as number | null,
    },
    ai: {
      called: false,
      error: null as string | null,
      durationMs: null as number | null,
    },
    request: {
      totalDurationMs: null as number | null,
    },
  };

  const requestStartedAt = Date.now();

  // Run market lookup and AI advisory in parallel
  const [marketResult, aiResult] = await Promise.allSettled([
    (async () => {
      const startedAt = Date.now();
      try {
        return await resolveMarketBenchmark(
          supabase,
          roleId,
          locationId,
          levelId,
          industry,
          companySize,
          diagnostics,
        );
      } finally {
        diagnostics.market.durationMs = Date.now() - startedAt;
      }
    })(),
    (async () => {
      const startedAt = Date.now();
      try {
        return await resolveAiAdvisory(
          roleId,
          locationId,
          levelId,
          industry,
          companySize,
          diagnostics,
        );
      } finally {
        diagnostics.ai.durationMs = Date.now() - startedAt;
      }
    })(),
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
  const aiSummary = aiAdvisory?.summary ?? null;
  diagnostics.request.totalDurationMs = Date.now() - requestStartedAt;

  return NextResponse.json({
    benchmark: primaryBenchmark,
    aiSummary,
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
  return resolveBenchmarkLookup(
    supabase as unknown as BenchmarkLookupClient,
    roleId,
    locationId,
    levelId,
    industry,
    companySize,
    diagnostics,
  );
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
    const result = await getAiBenchmarkForLevelLight(roleId, locationId, levelId, {
      industry,
      companySize,
    });
    if (!result) return null;

    return {
      levelEstimate: result.level,
      summary: result.advisory.summary,
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
