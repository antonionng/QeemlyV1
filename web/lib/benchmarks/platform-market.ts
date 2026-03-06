/**
 * Platform market benchmark accessor.
 *
 * The Qeemly data pool is the product. This module provides access to the
 * platform-level market benchmarks that every tenant should see. It is NOT a
 * fallback — it is the primary benchmark source.
 *
 * Data sources (in priority order):
 *  1. public_benchmark_snapshots  (is_public = true)
 *  2. salary_benchmarks where source = 'market' under PLATFORM_WORKSPACE_ID
 */

export type MarketBenchmark = {
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
  source: "market";
};

type QueryRow = Record<string, unknown>;

type SupabaseQueryBuilder = {
  select: (columns: string) => SupabaseQuery;
};

type SupabaseQuery = {
  eq: (column: string, value: unknown) => SupabaseQuery;
  order: (column: string, options: { ascending: boolean }) => SupabaseQuery;
  range: (start: number, end: number) => Promise<{
    data: QueryRow[] | null;
    error?: { message?: string } | null;
  }>;
};

type SupabaseRangeQuery = {
  range: (start: number, end: number) => Promise<{
    data: QueryRow[] | null;
    error?: { message?: string } | null;
  }>;
};

type SupabaseLike = {
  from: (table: string) => unknown;
};

let cachedMarketBenchmarks: MarketBenchmark[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds
const PAGE_SIZE = 1000;

/**
 * Fetch all platform market benchmarks.
 * Accepts any Supabase client (server, client, or service) so callers in
 * different contexts can reuse this.
 */
export async function fetchMarketBenchmarks(supabase: SupabaseLike): Promise<MarketBenchmark[]> {
  if (cachedMarketBenchmarks && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedMarketBenchmarks;
  }

  const benchmarks = await fetchFromPublicSnapshots(supabase);
  if (benchmarks.length > 0) {
    cachedMarketBenchmarks = benchmarks;
    cacheTimestamp = Date.now();
    return benchmarks;
  }

  const platformBenchmarks = await fetchFromPlatformWorkspace(supabase);
  cachedMarketBenchmarks = platformBenchmarks;
  cacheTimestamp = Date.now();
  return platformBenchmarks;
}

/**
 * Find a single market benchmark for a role/location/level combo.
 * Returns the exact match, or null if not available.
 */
export async function findMarketBenchmark(
  supabase: SupabaseLike,
  roleId: string,
  locationId: string,
  levelId: string
): Promise<MarketBenchmark | null> {
  const all = await fetchMarketBenchmarks(supabase);
  return (
    all.find(
      (b) => b.role_id === roleId && b.location_id === locationId && b.level_id === levelId
    ) ?? null
  );
}

/**
 * Build a lookup map keyed by "role_id::location_id::level_id".
 */
export async function buildMarketBenchmarkMap(
  supabase: SupabaseLike
): Promise<Map<string, MarketBenchmark>> {
  const all = await fetchMarketBenchmarks(supabase);
  const map = new Map<string, MarketBenchmark>();
  for (const b of all) {
    map.set(`${b.role_id}::${b.location_id}::${b.level_id}`, b);
  }
  return map;
}

export function invalidateMarketBenchmarkCache() {
  cachedMarketBenchmarks = null;
  cacheTimestamp = 0;
}

function isSupabaseQueryBuilder(value: unknown): value is SupabaseQueryBuilder {
  if (!value || typeof value !== "object") return false;

  return typeof (value as Record<string, unknown>).select === "function";
}

function isSupabaseQuery(value: unknown): value is SupabaseQuery {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return ["eq", "order", "range"].every((key) => typeof candidate[key] === "function");
}

function isSupabaseRangeQuery(value: unknown): value is SupabaseRangeQuery {
  if (!value || typeof value !== "object") return false;

  return typeof (value as Record<string, unknown>).range === "function";
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function fetchFromPublicSnapshots(supabase: SupabaseLike): Promise<MarketBenchmark[]> {
  const data = await fetchAllRows(supabase, "public_benchmark_snapshots", (query) =>
    query
      .select("role_id,location_id,level_id,currency,p25,p50,p75")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
  );

  if (!data || data.length === 0) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    role_id: String(row.role_id),
    location_id: String(row.location_id),
    level_id: String(row.level_id),
    currency: String(row.currency),
    p10: estimateP10(Number(row.p25)),
    p25: Number(row.p25),
    p50: Number(row.p50),
    p75: Number(row.p75),
    p90: estimateP90(Number(row.p75)),
    sample_size: null,
    source: "market" as const,
  }));
}

async function fetchFromPlatformWorkspace(supabase: SupabaseLike): Promise<MarketBenchmark[]> {
  const platformWsId = process.env.PLATFORM_WORKSPACE_ID;
  if (!platformWsId) return [];

  const data = await fetchAllRows(supabase, "salary_benchmarks", (query) =>
    query
      .select("role_id,location_id,level_id,currency,p10,p25,p50,p75,p90,sample_size")
      .eq("workspace_id", platformWsId)
      .eq("source", "market")
      .order("valid_from", { ascending: false })
  );

  if (!data || data.length === 0) return [];

  const seen = new Set<string>();
  const results: MarketBenchmark[] = [];
  for (const row of data as Array<Record<string, unknown>>) {
    const key = `${row.role_id}::${row.location_id}::${row.level_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      role_id: String(row.role_id),
      location_id: String(row.location_id),
      level_id: String(row.level_id),
      currency: String(row.currency),
      p10: Number(row.p10),
      p25: Number(row.p25),
      p50: Number(row.p50),
      p75: Number(row.p75),
      p90: Number(row.p90),
      sample_size: row.sample_size != null ? Number(row.sample_size) : null,
      source: "market",
    });
  }
  return results;
}

/**
 * public_benchmark_snapshots only stores p25/p50/p75.
 * Estimate p10 and p90 using a symmetric spread from p25/p75.
 */
function estimateP10(p25: number): number {
  return Math.round(p25 * 0.88);
}

function estimateP90(p75: number): number {
  return Math.round(p75 * 1.12);
}

async function fetchAllRows(
  client: SupabaseLike,
  table: string,
  buildQuery: (query: SupabaseQueryBuilder) => SupabaseQuery
): Promise<QueryRow[]> {
  const rows: QueryRow[] = [];
  let start = 0;

  while (true) {
    const end = start + PAGE_SIZE - 1;
    const query = client.from(table);
    if (!isSupabaseQueryBuilder(query)) {
      throw new Error(`Unsupported Supabase query client for table: ${table}`);
    }
    const builtQuery = buildQuery(query);
    if (!isSupabaseRangeQuery(builtQuery)) {
      throw new Error(`Unsupported Supabase query chain for table: ${table}`);
    }
    const { data, error } = await builtQuery.range(start, end);
    if (error) {
      throw new Error(error.message || `Failed to fetch rows from ${table}`);
    }
    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return rows;
    }

    start += PAGE_SIZE;
  }
}
