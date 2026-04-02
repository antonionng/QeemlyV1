import { findMarketBenchmark } from "@/lib/benchmarks/platform-market";
import { readMarketDataWithFallback } from "@/lib/benchmarks/market-read";
import {
  getAiBenchmarkAdvisoryLight,
  getAiBenchmarkForLevelLight,
} from "@/lib/benchmarks/ai-estimate";
import { getConfidenceFromSampleSize, type DbBenchmark } from "@/lib/benchmarks/data-service";
import { normalizeBenchmarkPercentilesToAnnual } from "@/lib/benchmarks/pay-period";
import type { Currency, SalaryBenchmark } from "@/lib/dashboard/dummy-data";
import { LOCATIONS } from "@/lib/dashboard/dummy-data";

type MarketDiagnostics = {
  readMode: "service" | "session";
  clientWarning: string | null;
  error: string | null;
};

type AiDiagnostics = {
  called: boolean;
  error: string | null;
};

type BenchmarkLookupSelectQuery = {
  eq: (column: string, value: unknown) => BenchmarkLookupSelectQuery;
  single: () => Promise<{ data: { workspace_id?: string | null } | null }>;
  order: (
    column: string,
    options: { ascending: boolean },
  ) => {
    limit: (
      value: number,
    ) => Promise<{ data: Array<Record<string, unknown>> | null; error: unknown }>;
  };
};

export type BenchmarkLookupClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: unknown;
    }>;
  };
  from: (table: string) => {
    select: (columns: string) => BenchmarkLookupSelectQuery;
  };
};

export type CanonicalBenchmarkDiagnostics = {
  market: MarketDiagnostics;
  ai: AiDiagnostics;
};

export type CanonicalBenchmarkLookupResult = {
  benchmark: SalaryBenchmark | null;
  aiSummary: string | null;
};

function normalizeFilterValue(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function buildAiBenchmark(
  aiEstimate: {
    levelId: string;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  } | null,
  roleId: string,
  locationId: string,
  filters: { industry?: string | null; companySize?: string | null } = {},
): SalaryBenchmark | null {
  if (!aiEstimate) return null;

  const location = LOCATIONS.find((entry) => entry.id === locationId);
  const requestedIndustry = normalizeFilterValue(filters.industry);
  const requestedCompanySize = normalizeFilterValue(filters.companySize);
  const currency = (location?.currency || "AED") as Currency;

  return {
    roleId,
    locationId,
    levelId: aiEstimate.levelId,
    currency,
    payPeriod: "annual",
    sourcePayPeriod: "annual",
    percentiles: {
      p10: aiEstimate.p10,
      p25: aiEstimate.p25,
      p50: aiEstimate.p50,
      p75: aiEstimate.p75,
      p90: aiEstimate.p90,
    },
    sampleSize: 0,
    confidence: "Medium",
    lastUpdated: new Date().toISOString(),
    momChange: 0,
    yoyChange: 0,
    trend: [],
    benchmarkSource: "ai-estimated",
    benchmarkSegmentation: {
      requestedIndustry,
      requestedCompanySize,
      matchedIndustry: requestedIndustry,
      matchedCompanySize: requestedCompanySize,
      isSegmented: Boolean(requestedIndustry || requestedCompanySize),
      isFallback: false,
    },
  };
}

export async function resolveCanonicalBenchmarkLookup(
  supabase: BenchmarkLookupClient,
  roleId: string,
  locationId: string,
  levelId: string,
  industry: string | null,
  companySize: string | null,
  diagnostics: CanonicalBenchmarkDiagnostics,
): Promise<CanonicalBenchmarkLookupResult> {
  diagnostics.ai.called = true;

  const [marketResult, aiResult] = await Promise.allSettled([
    resolveBenchmarkLookup(
      supabase,
      roleId,
      locationId,
      levelId,
      industry,
      companySize,
      { market: diagnostics.market },
    ),
    getAiBenchmarkForLevelLight(roleId, locationId, levelId, {
      industry,
      companySize,
    }),
  ]);

  const marketBenchmark = marketResult.status === "fulfilled" ? marketResult.value : null;

  if (aiResult.status === "rejected") {
    diagnostics.ai.error = getErrorMessage(aiResult.reason);
    return {
      benchmark: marketBenchmark,
      aiSummary: null,
    };
  }

  const aiBenchmark = buildAiBenchmark(aiResult.value?.level ?? null, roleId, locationId, {
    industry,
    companySize,
  });

  return {
    benchmark: aiBenchmark ?? marketBenchmark,
    aiSummary: aiResult.value?.advisory.summary ?? null,
  };
}

export async function resolveCanonicalBenchmarkLookupBatch(
  supabase: BenchmarkLookupClient,
  entries: Array<{
    roleId: string;
    locationId: string;
    levelId: string;
    industry?: string | null;
    companySize?: string | null;
  }>,
): Promise<Record<string, SalaryBenchmark | null>> {
  const aiLookup = new Map<string, Awaited<ReturnType<typeof getAiBenchmarkAdvisoryLight>>>();
  const aiGroupErrors = new Map<string, string>();
  const aiGroupKeys = new Map<string, string>();

  const groupedEntries = new Map<string, typeof entries>();
  for (const entry of entries) {
    const groupKey = [
      entry.roleId,
      entry.locationId,
      entry.industry ?? "",
      entry.companySize ?? "",
    ].join("::");
    aiGroupKeys.set(
      [entry.roleId, entry.locationId, entry.levelId, entry.industry ?? "", entry.companySize ?? ""].join("::"),
      groupKey,
    );
    const current = groupedEntries.get(groupKey) ?? [];
    current.push(entry);
    groupedEntries.set(groupKey, current);
  }

  await Promise.all(
    [...groupedEntries.entries()].map(async ([groupKey, groupEntries]) => {
      const [firstEntry] = groupEntries;
      try {
        const advisory = await getAiBenchmarkAdvisoryLight(
          firstEntry.roleId,
          firstEntry.locationId,
          firstEntry.industry ?? null,
          firstEntry.companySize ?? null,
        );
        aiLookup.set(groupKey, advisory);
      } catch (error) {
        aiGroupErrors.set(groupKey, getErrorMessage(error));
      }
    }),
  );

  const results = await Promise.all(
    entries.map(async (entry) => {
      const entryKey = [
        entry.roleId,
        entry.locationId,
        entry.levelId,
        entry.industry ?? "",
        entry.companySize ?? "",
      ].join("::");
      const groupKey = aiGroupKeys.get(entryKey);
      const aiAdvisory = groupKey ? aiLookup.get(groupKey) ?? null : null;
      const aiLevel = aiAdvisory?.levels.find((level) => level.levelId === entry.levelId) ?? null;

      if (aiLevel) {
        return [entryKey, buildAiBenchmark(aiLevel, entry.roleId, entry.locationId, entry)] as const;
      }

      const diagnostics: CanonicalBenchmarkDiagnostics = {
        market: {
          readMode: "session",
          clientWarning: groupKey ? aiGroupErrors.get(groupKey) ?? null : null,
          error: null,
        },
        ai: {
          called: true,
          error: groupKey ? aiGroupErrors.get(groupKey) ?? null : null,
        },
      };

      const fallback = await resolveBenchmarkLookup(
        supabase,
        entry.roleId,
        entry.locationId,
        entry.levelId,
        entry.industry ?? null,
        entry.companySize ?? null,
        { market: diagnostics.market },
      );
      return [entryKey, fallback] as const;
    }),
  );

  return Object.fromEntries(results);
}

export async function resolveBenchmarkLookup(
  supabase: BenchmarkLookupClient,
  roleId: string,
  locationId: string,
  levelId: string,
  industry: string | null,
  companySize: string | null,
  diagnostics: { market: MarketDiagnostics },
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profileQuery = supabase.from("profiles").select("workspace_id").eq("id", user.id);
  const { data: profile } = await profileQuery.single();

  if (!profile?.workspace_id) return null;

  const benchmarkQuery = supabase
    .from("salary_benchmarks")
    .select("*")
    .eq("workspace_id", profile.workspace_id)
    .eq("role_id", roleId)
    .eq("location_id", locationId)
    .eq("level_id", levelId);
  const { data: benchmarks, error: benchmarkError } = await benchmarkQuery
    .order("created_at", { ascending: false })
    .limit(1);

  if (benchmarkError || !benchmarks?.[0]) return null;

  return transformDbBenchmark(benchmarks[0] as DbBenchmark);
}

export function transformMarketBenchmark(
  marketBenchmark: {
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
  },
  filters: { industry?: string | null; companySize?: string | null } = {},
): SalaryBenchmark {
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

export function transformDbBenchmark(dbBenchmark: DbBenchmark): SalaryBenchmark {
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
