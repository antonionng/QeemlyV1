import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";
import { fetchMarketBenchmarks, type MarketBenchmark } from "@/lib/benchmarks/platform-market";
import { createServiceClient } from "@/lib/supabase/service";

export type ExpectedBenchmarkTriple = {
  roleId: string;
  levelId: string;
  locationId: string;
  key: string;
};

export type PublishedBenchmarkCoverageSummary = {
  supportedExactTriples: number;
  coveredExactTriples: number;
  officialCoveredExactTriples: number;
  proxyBackedExactTriples: number;
  missingExactTriples: number;
  coveragePercent: number;
  missingExamples: string[];
};

export type MarketSourceCoverageSummary = {
  sourceSlug: string;
  exactTriples: number;
  coveragePercent: number;
  sampleTriples: string[];
};

export type MissingCoverageGroup = {
  label: string;
  missingExactTriples: number;
};

export type MissingBenchmarkCoverageGroups = {
  byRoleFamily: MissingCoverageGroup[];
  byCountry: MissingCoverageGroup[];
};

export type MissingBenchmarkTriple = {
  key: string;
  roleTitle: string;
  levelName: string;
  locationLabel: string;
};

export type PublishedContributionMixSummary = {
  rowsWithEmployeeSupport: number;
  rowsWithUploadedSupport: number;
  rowsWithAdminSupport: number;
};

const MAX_MISSING_EXAMPLES = 25;

function buildTripleKey(roleId: string, levelId: string, locationId: string) {
  return `${roleId}::${levelId}::${locationId}`;
}

export function buildExpectedBenchmarkTriples(): ExpectedBenchmarkTriple[] {
  return ROLES.flatMap((role) =>
    LEVELS.flatMap((level) =>
      LOCATIONS.map((location) => ({
        roleId: role.id,
        levelId: level.id,
        locationId: location.id,
        key: buildTripleKey(role.id, level.id, location.id),
      })),
    ),
  );
}

export function summarizePublishedBenchmarkCoverage(
  rows: Array<Pick<MarketBenchmark, "role_id" | "level_id" | "location_id" | "market_source_tier">>,
): PublishedBenchmarkCoverageSummary {
  const expectedTriples = buildExpectedBenchmarkTriples();
  const coveredKeys = new Set(rows.map((row) => buildTripleKey(row.role_id, row.level_id, row.location_id)));
  const officialCoveredKeys = new Set(
    rows
      .filter((row) => row.market_source_tier === "official")
      .map((row) => buildTripleKey(row.role_id, row.level_id, row.location_id)),
  );
  const proxyBackedKeys = new Set(
    rows
      .filter((row) => row.market_source_tier === "proxy" || row.market_source_tier === "blended")
      .map((row) => buildTripleKey(row.role_id, row.level_id, row.location_id)),
  );
  const missingExamples = expectedTriples
    .filter((triple) => !coveredKeys.has(triple.key))
    .slice(0, MAX_MISSING_EXAMPLES)
    .map((triple) => triple.key);
  const coveredExactTriples = expectedTriples.filter((triple) => coveredKeys.has(triple.key)).length;
  const officialCoveredExactTriples = expectedTriples.filter((triple) => officialCoveredKeys.has(triple.key)).length;
  const proxyBackedExactTriples = expectedTriples.filter((triple) => proxyBackedKeys.has(triple.key)).length;
  const supportedExactTriples = expectedTriples.length;
  const missingExactTriples = supportedExactTriples - coveredExactTriples;

  return {
    supportedExactTriples,
    coveredExactTriples,
    officialCoveredExactTriples,
    proxyBackedExactTriples,
    missingExactTriples,
    coveragePercent:
      supportedExactTriples === 0 ? 0 : Number(((coveredExactTriples / supportedExactTriples) * 100).toFixed(2)),
    missingExamples,
  };
}

export function summarizeMarketSourceCoverage(
  rows: Array<
    Pick<MarketBenchmark, "role_id" | "level_id" | "location_id"> & {
      market_source_slug?: string | null;
    }
  >,
): MarketSourceCoverageSummary[] {
  const supportedExactTriples = buildExpectedBenchmarkTriples().length;
  const grouped = new Map<string, Set<string>>();

  for (const row of rows) {
    const sourceSlug = row.market_source_slug?.trim();
    if (!sourceSlug) continue;
    const key = buildTripleKey(row.role_id, row.level_id, row.location_id);
    const keys = grouped.get(sourceSlug) ?? new Set<string>();
    keys.add(key);
    grouped.set(sourceSlug, keys);
  }

  return [...grouped.entries()]
    .map(([sourceSlug, exactKeys]) => {
      const sampleTriples = [...exactKeys].slice(0, MAX_MISSING_EXAMPLES);
      const exactTriples = exactKeys.size;
      return {
        sourceSlug,
        exactTriples,
        coveragePercent:
          supportedExactTriples === 0 ? 0 : Number(((exactTriples / supportedExactTriples) * 100).toFixed(2)),
        sampleTriples,
      } satisfies MarketSourceCoverageSummary;
    })
    .sort((left, right) => right.exactTriples - left.exactTriples || left.sourceSlug.localeCompare(right.sourceSlug));
}

export function summarizeMissingBenchmarkCoverageGroups(
  rows: Array<Pick<MarketBenchmark, "role_id" | "level_id" | "location_id">>,
): MissingBenchmarkCoverageGroups {
  const coveredKeys = new Set(rows.map((row) => buildTripleKey(row.role_id, row.level_id, row.location_id)));
  const roleFamilyCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const rolesById = new Map(ROLES.map((role) => [role.id, role]));
  const locationsById = new Map(LOCATIONS.map((location) => [location.id, location]));

  for (const triple of buildExpectedBenchmarkTriples()) {
    if (coveredKeys.has(triple.key)) continue;

    const role = rolesById.get(triple.roleId);
    const location = locationsById.get(triple.locationId);
    const roleFamily = role?.family ?? triple.roleId;
    const country = location?.country ?? triple.locationId;

    roleFamilyCounts.set(roleFamily, (roleFamilyCounts.get(roleFamily) ?? 0) + 1);
    countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
  }

  const toSortedGroups = (counts: Map<string, number>) =>
    [...counts.entries()]
      .map(([label, missingExactTriples]) => ({ label, missingExactTriples }))
      .sort((left, right) => right.missingExactTriples - left.missingExactTriples || left.label.localeCompare(right.label));

  return {
    byRoleFamily: toSortedGroups(roleFamilyCounts),
    byCountry: toSortedGroups(countryCounts),
  };
}

export function summarizeTopMissingBenchmarkTriples(
  rows: Array<Pick<MarketBenchmark, "role_id" | "level_id" | "location_id">>,
  limit: number = 10,
): MissingBenchmarkTriple[] {
  const coveredKeys = new Set(rows.map((row) => buildTripleKey(row.role_id, row.level_id, row.location_id)));
  const rolesById = new Map(ROLES.map((role) => [role.id, role]));
  const levelsById = new Map(LEVELS.map((level) => [level.id, level]));
  const locationsById = new Map(LOCATIONS.map((location) => [location.id, location]));

  return buildExpectedBenchmarkTriples()
    .filter((triple) => !coveredKeys.has(triple.key))
    .slice(0, limit)
    .map((triple) => {
      const role = rolesById.get(triple.roleId);
      const level = levelsById.get(triple.levelId);
      const location = locationsById.get(triple.locationId);
      return {
        key: triple.key,
        roleTitle: role?.title ?? triple.roleId,
        levelName: level?.name ?? triple.levelId,
        locationLabel: location ? `${location.city}, ${location.country}` : triple.locationId,
      } satisfies MissingBenchmarkTriple;
    });
}

export function summarizePublishedContributionMix(
  rows: Array<Pick<MarketBenchmark, "source_breakdown">>,
): PublishedContributionMixSummary {
  return rows.reduce(
    (summary, row) => ({
      rowsWithEmployeeSupport:
        summary.rowsWithEmployeeSupport + ((row.source_breakdown?.employee ?? 0) > 0 ? 1 : 0),
      rowsWithUploadedSupport:
        summary.rowsWithUploadedSupport + ((row.source_breakdown?.uploaded ?? 0) > 0 ? 1 : 0),
      rowsWithAdminSupport:
        summary.rowsWithAdminSupport + ((row.source_breakdown?.admin ?? 0) > 0 ? 1 : 0),
    }),
    {
      rowsWithEmployeeSupport: 0,
      rowsWithUploadedSupport: 0,
      rowsWithAdminSupport: 0,
    } satisfies PublishedContributionMixSummary,
  );
}

export async function getPublishedBenchmarkCoverageSummary(): Promise<PublishedBenchmarkCoverageSummary> {
  const supabase = createServiceClient();
  const publishedRows = await fetchMarketBenchmarks(supabase);
  return summarizePublishedBenchmarkCoverage(publishedRows);
}

export async function getPublishedContributionMixSummary(): Promise<PublishedContributionMixSummary> {
  const supabase = createServiceClient();
  const publishedRows = await fetchMarketBenchmarks(supabase);
  return summarizePublishedContributionMix(publishedRows);
}

export async function getMissingBenchmarkCoverageGroups(): Promise<MissingBenchmarkCoverageGroups> {
  const supabase = createServiceClient();
  const publishedRows = await fetchMarketBenchmarks(supabase);
  return summarizeMissingBenchmarkCoverageGroups(publishedRows);
}

export async function getTopMissingBenchmarkTriples(
  limit: number = 10,
): Promise<MissingBenchmarkTriple[]> {
  const supabase = createServiceClient();
  const publishedRows = await fetchMarketBenchmarks(supabase);
  return summarizeTopMissingBenchmarkTriples(publishedRows, limit);
}

export async function getMarketSourceCoverageSummary(
  sourceSlugs?: string[],
): Promise<MarketSourceCoverageSummary[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from("salary_benchmarks")
    .select("role_id, level_id, location_id, market_source_slug")
    .eq("source", "market");

  if (sourceSlugs && sourceSlugs.length > 0) {
    query = query.in("market_source_slug", sourceSlugs);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return summarizeMarketSourceCoverage(
    ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      role_id: String(row.role_id),
      level_id: String(row.level_id),
      location_id: String(row.location_id),
      market_source_slug: typeof row.market_source_slug === "string" ? row.market_source_slug : null,
    })),
  );
}
