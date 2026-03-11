/**
 * Platform market benchmark accessor.
 *
 * The Qeemly data pool is the product. This module provides access to the
 * platform-level market benchmarks that every tenant should see. It is NOT a
 * fallback — it is the primary benchmark source.
 *
 * Data sources (in priority order):
 *  1. platform_market_benchmarks (canonical pooled market rows)
 *  2. public_benchmark_snapshots (public mirror of the pooled rows)
 *  3. salary_benchmarks where source = 'market' under PLATFORM_WORKSPACE_ID
 */

export type MarketBenchmark = {
  role_id: string;
  location_id: string;
  level_id: string;
  currency: string;
  industry?: string | null;
  company_size?: string | null;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sample_size: number | null;
  source: "market";
  contributor_count?: number | null;
  provenance?: "employee" | "uploaded" | "admin" | "blended";
  freshness_at?: string | null;
  source_breakdown?: Record<string, number> | null;
};

export type MarketBenchmarkQuery = {
  industry?: string | null;
  companySize?: string | null;
  includeSegmented?: boolean;
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
export async function fetchMarketBenchmarks(
  supabase: SupabaseLike,
  query: MarketBenchmarkQuery = {},
): Promise<MarketBenchmark[]> {
  if (cachedMarketBenchmarks && Date.now() - cacheTimestamp < CACHE_TTL) {
    return filterMarketBenchmarks(cachedMarketBenchmarks, query);
  }

  const benchmarks = await fetchFromCanonicalPoolSafe(supabase);
  if (benchmarks.length > 0) {
    cachedMarketBenchmarks = benchmarks;
    cacheTimestamp = Date.now();
    return filterMarketBenchmarks(benchmarks, query);
  }

  const snapshotBenchmarks = await fetchFromPublicSnapshots(supabase);
  if (snapshotBenchmarks.length > 0) {
    cachedMarketBenchmarks = snapshotBenchmarks;
    cacheTimestamp = Date.now();
    return filterMarketBenchmarks(snapshotBenchmarks, query);
  }

  const platformBenchmarks = await fetchFromPlatformWorkspace(supabase);
  cachedMarketBenchmarks = platformBenchmarks;
  cacheTimestamp = Date.now();
  return filterMarketBenchmarks(platformBenchmarks, query);
}

/**
 * Find a single market benchmark for a role/location/level combo.
 * Returns the exact match, or null if not available.
 */
export async function findMarketBenchmark(
  supabase: SupabaseLike,
  roleId: string,
  locationId: string,
  levelId: string,
  query: MarketBenchmarkQuery = {},
): Promise<MarketBenchmark | null> {
  const all = await fetchMarketBenchmarks(supabase, { includeSegmented: true });
  return selectBestMarketBenchmark(
    all.filter((b) => b.role_id === roleId && b.location_id === locationId && b.level_id === levelId),
    query,
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

function normalizeSegmentValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function isBaseMarketBenchmark(row: MarketBenchmark): boolean {
  return !normalizeSegmentValue(row.industry) && !normalizeSegmentValue(row.company_size);
}

function filterMarketBenchmarks(
  rows: MarketBenchmark[],
  query: MarketBenchmarkQuery,
): MarketBenchmark[] {
  if (query.includeSegmented) return rows;
  return rows.filter(isBaseMarketBenchmark);
}

function selectBestMarketBenchmark(
  rows: MarketBenchmark[],
  query: MarketBenchmarkQuery,
): MarketBenchmark | null {
  const requestedIndustry = normalizeSegmentValue(query.industry);
  const requestedCompanySize = normalizeSegmentValue(query.companySize);
  if (rows.length === 0) return null;

  const exactCombined = rows.find(
    (row) =>
      normalizeSegmentValue(row.industry) === requestedIndustry &&
      normalizeSegmentValue(row.company_size) === requestedCompanySize &&
      (requestedIndustry || requestedCompanySize),
  );
  if (exactCombined) return exactCombined;

  const exactIndustry = requestedIndustry
    ? rows.find(
        (row) =>
          normalizeSegmentValue(row.industry) === requestedIndustry &&
          !normalizeSegmentValue(row.company_size),
      )
    : null;
  if (exactIndustry) return exactIndustry;

  const exactCompanySize = requestedCompanySize
    ? rows.find(
        (row) =>
          !normalizeSegmentValue(row.industry) &&
          normalizeSegmentValue(row.company_size) === requestedCompanySize,
      )
    : null;
  if (exactCompanySize) return exactCompanySize;

  return rows.find(isBaseMarketBenchmark) ?? rows[0] ?? null;
}

function isSupabaseQueryBuilder(value: unknown): value is SupabaseQueryBuilder {
  if (!value || typeof value !== "object") return false;

  return typeof (value as Record<string, unknown>).select === "function";
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
    industry: normalizeSegmentValue(row.industry),
    company_size: normalizeSegmentValue(row.company_size),
    p10: estimateP10(Number(row.p25)),
    p25: Number(row.p25),
    p50: Number(row.p50),
    p75: Number(row.p75),
    p90: estimateP90(Number(row.p75)),
    sample_size: null,
    source: "market" as const,
  }));
}

async function fetchFromCanonicalPool(supabase: SupabaseLike): Promise<MarketBenchmark[]> {
  const data = await fetchAllRows(supabase, "platform_market_benchmarks", (query) =>
    query
      .select(
        "role_id,location_id,level_id,currency,industry,company_size,p10,p25,p50,p75,p90,sample_size,contributor_count,provenance,freshness_at,source_breakdown",
      )
      .eq("is_public", true)
      .order("freshness_at", { ascending: false }),
  );

  if (!data || data.length === 0) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    role_id: String(row.role_id),
    location_id: String(row.location_id),
    level_id: String(row.level_id),
    currency: String(row.currency),
    industry: normalizeSegmentValue(row.industry),
    company_size: normalizeSegmentValue(row.company_size),
    p10: Number(row.p10),
    p25: Number(row.p25),
    p50: Number(row.p50),
    p75: Number(row.p75),
    p90: Number(row.p90),
    sample_size: row.sample_size != null ? Number(row.sample_size) : null,
    contributor_count: row.contributor_count != null ? Number(row.contributor_count) : null,
    provenance:
      row.provenance === "employee" ||
      row.provenance === "uploaded" ||
      row.provenance === "admin" ||
      row.provenance === "blended"
        ? row.provenance
        : undefined,
    freshness_at: row.freshness_at ? String(row.freshness_at) : null,
    source_breakdown:
      row.source_breakdown && typeof row.source_breakdown === "object"
        ? (row.source_breakdown as Record<string, number>)
        : null,
    source: "market" as const,
  }));
}

async function fetchFromCanonicalPoolSafe(supabase: SupabaseLike): Promise<MarketBenchmark[]> {
  try {
    return await fetchFromCanonicalPool(supabase);
  } catch {
    return [];
  }
}

async function fetchFromPlatformWorkspace(supabase: SupabaseLike): Promise<MarketBenchmark[]> {
  const platformWsId = process.env.PLATFORM_WORKSPACE_ID;
  if (!platformWsId) return [];

  const data = await fetchAllRows(supabase, "salary_benchmarks", (query) =>
    query
      .select("role_id,location_id,level_id,currency,industry,company_size,p10,p25,p50,p75,p90,sample_size")
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
      industry: normalizeSegmentValue(row.industry),
      company_size: normalizeSegmentValue(row.company_size),
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
