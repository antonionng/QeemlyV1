// Data service layer for benchmarks
// Market benchmarks (Qeemly data pool) are the primary source.
// Workspace benchmarks (company pay bands) are supplementary.

import { createClient } from "@/lib/supabase/client";
import type { SalaryBenchmark, Currency } from "@/lib/dashboard/dummy-data";
import { LOCATIONS } from "@/lib/dashboard/dummy-data";
import { fetchMarketBenchmarks, type MarketBenchmark } from "@/lib/benchmarks/platform-market";

let hasDbBenchmarksCache: boolean | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000;

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

function transformMarketBenchmark(mb: MarketBenchmark): SalaryBenchmark {
  const location = LOCATIONS.find(l => l.id === mb.location_id);
  const currency = (location?.currency || mb.currency || "AED") as Currency;

  return {
    roleId: mb.role_id,
    locationId: mb.location_id,
    levelId: mb.level_id,
    currency,
    percentiles: {
      p10: mb.p10,
      p25: mb.p25,
      p50: mb.p50,
      p75: mb.p75,
      p90: mb.p90,
    },
    sampleSize: mb.sample_size || 0,
    confidence: "High" as const,
    lastUpdated: new Date().toISOString(),
    momChange: 0,
    yoyChange: 0,
    trend: [],
    benchmarkSource: "market",
  };
}

function transformDbBenchmark(db: DbBenchmark): SalaryBenchmark {
  const location = LOCATIONS.find(l => l.id === db.location_id);
  const currency = (location?.currency || db.currency || "AED") as Currency;
  
  return {
    roleId: db.role_id,
    locationId: db.location_id,
    levelId: db.level_id,
    currency,
    percentiles: {
      p10: Number(db.p10),
      p25: Number(db.p25),
      p50: Number(db.p50),
      p75: Number(db.p75),
      p90: Number(db.p90),
    },
    sampleSize: db.sample_size || 0,
    confidence: (db.confidence || "medium") as "High" | "Medium" | "Low",
    lastUpdated: db.created_at,
    momChange: 0,
    yoyChange: 0,
    trend: [],
    benchmarkSource: "uploaded",
  };
}

/**
 * Get benchmark for a specific role/location/level combination.
 * Market data is checked first, then workspace bands.
 */
export async function getBenchmark(
  roleId: string,
  locationId: string,
  levelId: string
): Promise<SalaryBenchmark | null> {
  const supabase = createClient();

  // Market data first (the product)
  try {
    const marketData = await fetchMarketBenchmarks(supabase);
    const marketMatch = marketData.find(
      (b) => b.role_id === roleId && b.location_id === locationId && b.level_id === levelId
    );
    if (marketMatch) return transformMarketBenchmark(marketMatch);
  } catch {
    // Continue to workspace lookup
  }

  // Workspace bands second
  const dbBenchmarks = await fetchDbBenchmarks();
  const match = dbBenchmarks.find(
    (b) => b.role_id === roleId && b.location_id === locationId && b.level_id === levelId
  );
  return match ? transformDbBenchmark(match) : null;
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
