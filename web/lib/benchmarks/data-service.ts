// Data service layer for benchmarks
// Provides database-backed data with fallback to localStorage/generated data

import { createClient } from "@/lib/supabase/client";
import type { SalaryBenchmark, Currency } from "@/lib/dashboard/dummy-data";
import { generateBenchmark, LOCATIONS, LEVELS, ROLES } from "@/lib/dashboard/dummy-data";

// Cache for database benchmark count check
let hasDbBenchmarksCache: boolean | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds

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
 * Check if the workspace has benchmarks in the database
 */
export async function hasDbBenchmarks(): Promise<boolean> {
  // Return cached value if still valid
  if (hasDbBenchmarksCache !== null && Date.now() - cacheTimestamp < CACHE_TTL) {
    return hasDbBenchmarksCache;
  }

  try {
    const supabase = createClient();
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

/**
 * Invalidate the cache (call after upload)
 */
export function invalidateBenchmarkCache() {
  hasDbBenchmarksCache = null;
  cacheTimestamp = 0;
}

/**
 * Fetch benchmarks from database
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

/**
 * Get benchmark for a specific role/location/level combination
 * Checks database first, then falls back to generated data
 */
export async function getBenchmark(
  roleId: string,
  locationId: string,
  levelId: string
): Promise<SalaryBenchmark> {
  const hasDb = await hasDbBenchmarks();
  
  if (hasDb) {
    const dbBenchmarks = await fetchDbBenchmarks();
    const match = dbBenchmarks.find(
      b => b.role_id === roleId && 
           b.location_id === locationId && 
           b.level_id === levelId
    );
    
    if (match) {
      return transformDbBenchmark(match);
    }
  }
  
  // Fall back to generated benchmark
  return generateBenchmark(roleId, locationId, levelId);
}

/**
 * Transform database benchmark to SalaryBenchmark type
 */
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
    trend: [], // Would need historical data for trends
  };
}

/**
 * Get all benchmarks from database (for building lookup map)
 */
export async function getAllDbBenchmarks(): Promise<Map<string, SalaryBenchmark>> {
  const benchmarkMap = new Map<string, SalaryBenchmark>();
  
  const hasDb = await hasDbBenchmarks();
  if (!hasDb) return benchmarkMap;
  
  const dbBenchmarks = await fetchDbBenchmarks();
  
  for (const db of dbBenchmarks) {
    const key = `${db.role_id}::${db.location_id}::${db.level_id}`;
    benchmarkMap.set(key, transformDbBenchmark(db));
  }
  
  return benchmarkMap;
}
