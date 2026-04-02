// Data service layer for benchmarks
// Market benchmarks (Qeemly data pool) are the primary source.
// Workspace benchmarks (company pay bands) are supplementary.

import { createClient } from "@/lib/supabase/client";
import type {
  BenchmarkDetailAiBriefing,
  BenchmarkDetailSupportData,
} from "@/lib/benchmarks/detail-ai";
import type { SalaryBenchmark, Currency } from "@/lib/dashboard/dummy-data";
import { COMPANY_SIZES, INDUSTRIES, LEVELS, LOCATIONS } from "@/lib/dashboard/dummy-data";
import {
  fetchMarketBenchmarks,
  findMarketBenchmark,
  type MarketBenchmark,
} from "@/lib/benchmarks/platform-market";
import { normalizeBenchmarkPercentilesToAnnual } from "@/lib/benchmarks/pay-period";

export type BenchmarkLookupFilters = {
  industry?: string | null;
  companySize?: string | null;
};

export type BenchmarkLookupEntry = {
  roleId: string;
  locationId: string;
  levelId: string;
  industry?: string | null;
  companySize?: string | null;
};

function normalizeFilterValue(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function buildBenchmarkSegmentation(
  matched: { industry?: string | null; company_size?: string | null },
  filters: BenchmarkLookupFilters = {},
) {
  const requestedIndustry = normalizeFilterValue(filters.industry);
  const requestedCompanySize = normalizeFilterValue(filters.companySize);
  const matchedIndustry = normalizeFilterValue(matched.industry);
  const matchedCompanySize = normalizeFilterValue(matched.company_size);

  return {
    requestedIndustry,
    requestedCompanySize,
    matchedIndustry,
    matchedCompanySize,
    isSegmented: Boolean(matchedIndustry || matchedCompanySize),
    isFallback:
      (!!requestedIndustry && requestedIndustry !== matchedIndustry) ||
      (!!requestedCompanySize && requestedCompanySize !== matchedCompanySize),
  };
}

export function getConfidenceFromSampleSize(sampleSize: number): "High" | "Medium" | "Low" {
  if (sampleSize >= 20) return "High";
  if (sampleSize >= 8) return "Medium";
  return "Low";
}

let hasDbBenchmarksCache: boolean | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000;
const briefingRequests = new Map<string, Promise<BenchmarkDetailAiBriefing | null>>();
const detailSupportRequests = new Map<string, Promise<BenchmarkDetailSupportData>>();

export type DbBenchmark = {
  id: string;
  workspace_id: string;
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
  source: string;
  confidence: string;
  pay_period?: "monthly" | "annual" | null;
  industry?: string | null;
  company_size?: string | null;
  valid_from: string;
  created_at: string;
};

/**
 * Check if benchmarks are available (market OR workspace).
 * Returns true if the Qeemly market pool has data OR the workspace has uploaded bands.
 */
export async function hasDbBenchmarks(): Promise<boolean> {
  if (hasDbBenchmarksCache !== null && Date.now() - cacheTimestamp < CACHE_TTL) {
    return hasDbBenchmarksCache;
  }

  try {
    const supabase = createClient();

    // Market data is always the primary check
    const marketData = await fetchMarketBenchmarks(supabase);
    if (marketData.length > 0) {
      hasDbBenchmarksCache = true;
      cacheTimestamp = Date.now();
      return true;
    }

    // Fall through to workspace check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      hasDbBenchmarksCache = false;
      cacheTimestamp = Date.now();
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      hasDbBenchmarksCache = false;
      cacheTimestamp = Date.now();
      return false;
    }

    const { count } = await supabase
      .from("salary_benchmarks")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", profile.workspace_id);

    hasDbBenchmarksCache = (count || 0) > 0;
    cacheTimestamp = Date.now();
    return hasDbBenchmarksCache;
  } catch {
    hasDbBenchmarksCache = false;
    cacheTimestamp = Date.now();
    return false;
  }
}

export function invalidateBenchmarkCache() {
  hasDbBenchmarksCache = null;
  cacheTimestamp = 0;
}

/**
 * Fetch workspace benchmarks (company pay bands) from database.
 */
export async function fetchDbBenchmarks(): Promise<DbBenchmark[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) return [];

    const { data: benchmarks } = await supabase
      .from("salary_benchmarks")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .order("created_at", { ascending: false });

    return benchmarks || [];
  } catch {
    return [];
  }
}

function transformMarketBenchmark(
  mb: MarketBenchmark,
  filters: BenchmarkLookupFilters = {},
): SalaryBenchmark {
  const location = LOCATIONS.find(l => l.id === mb.location_id);
  const currency = (location?.currency || mb.currency || "AED") as Currency;
  const sampleSize = Number(mb.sample_size) || 0;
  const confidence = getConfidenceFromSampleSize(sampleSize);
  const normalized = normalizeBenchmarkPercentilesToAnnual(
    {
      p10: mb.p10,
      p25: mb.p25,
      p50: mb.p50,
      p75: mb.p75,
      p90: mb.p90,
    },
    mb.pay_period,
  );

  return {
    roleId: mb.role_id,
    locationId: mb.location_id,
    levelId: mb.level_id,
    currency,
    payPeriod: normalized.payPeriod,
    sourcePayPeriod: normalized.sourcePayPeriod,
    percentiles: normalized.percentiles,
    sampleSize,
    confidence,
    lastUpdated: mb.freshness_at || new Date().toISOString(),
    momChange: 0,
    yoyChange: 0,
    trend: [],
    benchmarkSource: "market",
    benchmarkTrust: {
      source: "market",
      provenance: mb.provenance || null,
      sampleSize,
      confidence,
      freshnessAt: mb.freshness_at || null,
      contributorCount: mb.contributor_count || null,
    },
    benchmarkSegmentation: buildBenchmarkSegmentation(mb, filters),
  };
}

function transformDbBenchmark(db: DbBenchmark): SalaryBenchmark {
  const location = LOCATIONS.find(l => l.id === db.location_id);
  const currency = (location?.currency || db.currency || "AED") as Currency;
  const confidence = (db.confidence || "medium") as "High" | "Medium" | "Low";
  const normalized = normalizeBenchmarkPercentilesToAnnual(
    {
      p10: Number(db.p10),
      p25: Number(db.p25),
      p50: Number(db.p50),
      p75: Number(db.p75),
      p90: Number(db.p90),
    },
    db.pay_period,
  );
  
  return {
    roleId: db.role_id,
    locationId: db.location_id,
    levelId: db.level_id,
    currency,
    payPeriod: normalized.payPeriod,
    sourcePayPeriod: normalized.sourcePayPeriod,
    percentiles: normalized.percentiles,
    sampleSize: db.sample_size || 0,
    confidence,
    lastUpdated: db.created_at,
    momChange: 0,
    yoyChange: 0,
    trend: [],
    benchmarkSource: "uploaded",
    benchmarkTrust: {
      source: "uploaded",
      provenance: "uploaded",
      sampleSize: db.sample_size || 0,
      confidence,
      lastUpdated: db.created_at,
    },
  };
}

/**
 * Get benchmark for a specific role/location/level combination.
 * Market data is checked first, then workspace bands.
 */
export type AiAdvisoryPayload = {
  levelEstimate: {
    levelId: string;
    levelName: string;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  summary: string;
};

export type EnrichedBenchmarkResult = {
  benchmark: SalaryBenchmark | null;
  aiSummary: string | null;
};

export function makeBenchmarkLookupKey(entry: BenchmarkLookupEntry): string {
  return [
    entry.roleId,
    entry.locationId,
    entry.levelId,
    entry.industry ?? "",
    entry.companySize ?? "",
  ].join("::");
}

/**
 * Get benchmark for a specific role/location/level combination.
 * Market data is checked first, then workspace bands.
 * Returns the AI advisory alongside market data when available.
 */
export async function getBenchmarkEnriched(
  roleId: string,
  locationId: string,
  levelId: string,
  filters: BenchmarkLookupFilters = {},
): Promise<EnrichedBenchmarkResult> {
  try {
    const params = new URLSearchParams({ roleId, locationId, levelId });
    if (filters.industry) params.set("industry", filters.industry);
    if (filters.companySize) params.set("companySize", filters.companySize);
    const response = await fetch(`/api/benchmarks/search?${params.toString()}`, {
      cache: "no-store",
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        benchmark: SalaryBenchmark | null;
        aiSummary: string | null;
      };
      return {
        benchmark: payload.benchmark ?? null,
        aiSummary: payload.aiSummary ?? null,
      };
    }
  } catch {
    // Fall back to direct reads if the API is unavailable in the current context.
  }

  const supabase = createClient();

  // Market data first (the product)
  try {
    const marketMatch = await findMarketBenchmark(supabase, roleId, locationId, levelId, filters);
    if (marketMatch) {
      return {
        benchmark: transformMarketBenchmark(marketMatch, filters),
        aiSummary: null,
      };
    }
  } catch {
    // Continue to workspace lookup
  }

  // Workspace bands second
  const dbBenchmarks = await fetchDbBenchmarks();
  const match = dbBenchmarks.find(
    (b) => b.role_id === roleId && b.location_id === locationId && b.level_id === levelId
  );
  return {
    benchmark: match ? transformDbBenchmark(match) : null,
    aiSummary: null,
  };
}

export async function fetchAiBriefing(
  roleId: string,
  locationId: string,
  levelId: string,
  filters: BenchmarkLookupFilters = {},
): Promise<BenchmarkDetailAiBriefing | null> {
  const params = new URLSearchParams({ roleId, locationId, levelId });
  if (filters.industry) params.set("industry", filters.industry);
  if (filters.companySize) params.set("companySize", filters.companySize);
  const requestUrl = `/api/benchmarks/briefing?${params.toString()}`;
  const inFlightKey = params.toString();

  const existingRequest = briefingRequests.get(inFlightKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      const response = await fetch(requestUrl, {
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as {
        detailBriefing: BenchmarkDetailAiBriefing | null;
      };

      return payload.detailBriefing ?? null;
    } catch {
      return null;
    } finally {
      briefingRequests.delete(inFlightKey);
    }
  })();

  briefingRequests.set(inFlightKey, request);
  return request;
}

export async function fetchBenchmarkDetailSupportData(args: {
  roleId: string;
  locationId: string;
  levelId: string;
  industry: string | null;
  companySize: string | null;
}): Promise<BenchmarkDetailSupportData> {
  const inFlightKey = JSON.stringify(args);
  const existingRequest = detailSupportRequests.get(inFlightKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      const currentLevelIndex = LEVELS.findIndex((entry) => entry.id === args.levelId);
      const adjacentLevels = LEVELS.slice(
        Math.max(0, currentLevelIndex - 1),
        Math.min(LEVELS.length, currentLevelIndex + 2),
      );
      const levelTableLevels = LEVELS.filter((entry) => entry.category === "IC" || entry.category === "Manager").slice(
        0,
        6,
      );
      const levelTableLocationId =
        args.locationId === "london" || args.locationId === "manchester" ? "dubai" : args.locationId;
      const industriesToLoad = [args.industry, ...INDUSTRIES.filter((entry) => entry !== args.industry)]
        .filter((entry): entry is string => Boolean(entry))
        .slice(0, 5);
      const companySizesToLoad = [args.companySize, ...COMPANY_SIZES.filter((entry) => entry !== args.companySize)]
        .filter((entry): entry is string => Boolean(entry))
        .slice(0, 5);

      const uniqueEntries = new Map<string, BenchmarkLookupEntry>();
      const addEntry = (entry: BenchmarkLookupEntry) => {
        uniqueEntries.set(makeBenchmarkLookupKey(entry), entry);
      };

      for (const level of levelTableLevels) {
        addEntry({
          roleId: args.roleId,
          locationId: levelTableLocationId,
          levelId: level.id,
          industry: args.industry,
          companySize: args.companySize,
        });
      }

      for (const level of adjacentLevels) {
        addEntry({
          roleId: args.roleId,
          locationId: args.locationId,
          levelId: level.id,
          industry: args.industry,
          companySize: args.companySize,
        });
      }

      for (const industry of industriesToLoad) {
        addEntry({
          roleId: args.roleId,
          locationId: args.locationId,
          levelId: args.levelId,
          industry,
          companySize: args.companySize,
        });
      }

      for (const companySize of companySizesToLoad) {
        addEntry({
          roleId: args.roleId,
          locationId: args.locationId,
          levelId: args.levelId,
          industry: args.industry,
          companySize,
        });
      }

      for (const location of LOCATIONS) {
        addEntry({
          roleId: args.roleId,
          locationId: location.id,
          levelId: args.levelId,
          industry: args.industry,
          companySize: args.companySize,
        });
      }

      const batchResults = await getBenchmarksBatch([...uniqueEntries.values()]);

      const levelTableBenchmarks = Object.fromEntries(
        levelTableLevels
          .map((level) => {
            const benchmark = batchResults[
              makeBenchmarkLookupKey({
                roleId: args.roleId,
                locationId: levelTableLocationId,
                levelId: level.id,
                industry: args.industry,
                companySize: args.companySize,
              })
            ];
            return benchmark ? [level.id, benchmark] : null;
          })
          .filter(Boolean) as Array<[string, SalaryBenchmark]>,
      );

      const offerBuilderBenchmarks = Object.fromEntries(
        adjacentLevels
          .map((level) => {
            const benchmark = batchResults[
              makeBenchmarkLookupKey({
                roleId: args.roleId,
                locationId: args.locationId,
                levelId: level.id,
                industry: args.industry,
                companySize: args.companySize,
              })
            ];
            return benchmark ? [level.id, benchmark] : null;
          })
          .filter(Boolean) as Array<[string, SalaryBenchmark]>,
      );

      const industryEntries = industriesToLoad.map((industry) => {
        const benchmark = batchResults[
          makeBenchmarkLookupKey({
            roleId: args.roleId,
            locationId: args.locationId,
            levelId: args.levelId,
            industry,
            companySize: args.companySize,
          })
        ];
        if (!benchmark) return null;
        if (
          benchmark.benchmarkSegmentation?.matchedIndustry &&
          benchmark.benchmarkSegmentation.matchedIndustry === industry
        ) {
          return { industry, benchmark, fallback: false };
        }
        if (benchmark.benchmarkSegmentation?.isFallback) {
          return { industry, benchmark, fallback: true };
        }
        return null;
      });
      const industryBenchmarks: Record<string, SalaryBenchmark> = {};
      let industryFallbackBenchmark: SalaryBenchmark | null = null;
      for (const entry of industryEntries) {
        if (!entry) continue;
        if (entry.fallback) {
          industryFallbackBenchmark ??= entry.benchmark;
        } else {
          industryBenchmarks[entry.industry] = entry.benchmark;
        }
      }

      const companySizeEntries = companySizesToLoad.map((companySize) => {
        const benchmark = batchResults[
          makeBenchmarkLookupKey({
            roleId: args.roleId,
            locationId: args.locationId,
            levelId: args.levelId,
            industry: args.industry,
            companySize,
          })
        ];
        if (!benchmark) return null;
        if (
          benchmark.benchmarkSegmentation?.matchedCompanySize &&
          benchmark.benchmarkSegmentation.matchedCompanySize === companySize
        ) {
          return { companySize, benchmark, fallback: false };
        }
        if (benchmark.benchmarkSegmentation?.isFallback) {
          return { companySize, benchmark, fallback: true };
        }
        return null;
      });
      const companySizeBenchmarks: Record<string, SalaryBenchmark> = {};
      let companySizeFallbackBenchmark: SalaryBenchmark | null = null;
      for (const entry of companySizeEntries) {
        if (!entry) continue;
        if (entry.fallback) {
          companySizeFallbackBenchmark ??= entry.benchmark;
        } else {
          companySizeBenchmarks[entry.companySize] = entry.benchmark;
        }
      }

      const geoBenchmarksByLocation = Object.fromEntries(
        LOCATIONS.map((location) => {
          const benchmark = batchResults[
            makeBenchmarkLookupKey({
              roleId: args.roleId,
              locationId: location.id,
              levelId: args.levelId,
              industry: args.industry,
              companySize: args.companySize,
            })
          ];
          return benchmark ? [location.id, benchmark] : null;
        }).filter(Boolean) as Array<[string, SalaryBenchmark]>,
      );

      return {
        levelTableBenchmarks,
        offerBuilderBenchmarks,
        industryBenchmarks,
        industryFallbackBenchmark,
        companySizeBenchmarks,
        companySizeFallbackBenchmark,
        geoBenchmarksByLocation,
      };
    } finally {
      detailSupportRequests.delete(inFlightKey);
    }
  })();

  detailSupportRequests.set(inFlightKey, request);
  return request;
}

export async function getBenchmark(
  roleId: string,
  locationId: string,
  levelId: string,
  filters: BenchmarkLookupFilters = {},
): Promise<SalaryBenchmark | null> {
  try {
    const params = new URLSearchParams({ roleId, locationId, levelId });
    if (filters.industry) params.set("industry", filters.industry);
    if (filters.companySize) params.set("companySize", filters.companySize);
    const response = await fetch(`/api/benchmarks/lookup?${params.toString()}`, {
      cache: "no-store",
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        benchmark: SalaryBenchmark | null;
      };
      if (payload.benchmark) {
        return payload.benchmark;
      }
    }
  } catch {
    // Fall back to direct reads if the API is unavailable in the current context.
  }

  const { benchmark } = await getBenchmarkEnriched(roleId, locationId, levelId, filters);
  return benchmark;
}

export async function getBenchmarksBatch(
  entries: BenchmarkLookupEntry[],
): Promise<Record<string, SalaryBenchmark | null>> {
  if (entries.length === 0) return {};

  try {
    const response = await fetch("/api/benchmarks/lookup-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ entries }),
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        benchmarks: Record<string, SalaryBenchmark | null>;
      };
      return payload.benchmarks ?? {};
    }
  } catch {
    // Fall back to per-entry reads if the batch API is unavailable.
  }

  const results = await Promise.all(
    entries.map(async (entry) => [
      makeBenchmarkLookupKey(entry),
      await getBenchmark(entry.roleId, entry.locationId, entry.levelId, {
        industry: entry.industry ?? null,
        companySize: entry.companySize ?? null,
      }),
    ] as const),
  );

  return Object.fromEntries(results);
}

/**
 * Get all benchmarks (market + workspace merged).
 * Market benchmarks are the primary layer; workspace bands fill gaps.
 */
export async function getAllDbBenchmarks(): Promise<Map<string, SalaryBenchmark>> {
  const benchmarkMap = new Map<string, SalaryBenchmark>();
  const supabase = createClient();

  // Layer 1: Market benchmarks (primary — the Qeemly data pool)
  try {
    const marketData = await fetchMarketBenchmarks(supabase);
    for (const mb of marketData) {
      const key = `${mb.role_id}::${mb.location_id}::${mb.level_id}`;
      benchmarkMap.set(key, transformMarketBenchmark(mb));
    }
  } catch {
    // Market data may not be available yet
  }

  // Layer 2: Workspace benchmarks (company pay bands — fill gaps only)
  const dbBenchmarks = await fetchDbBenchmarks();
  for (const db of dbBenchmarks) {
    const key = `${db.role_id}::${db.location_id}::${db.level_id}`;
    if (!benchmarkMap.has(key)) {
      benchmarkMap.set(key, transformDbBenchmark(db));
    }
  }
  
  return benchmarkMap;
}
