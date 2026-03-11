import type { MarketBenchmark } from "@/lib/benchmarks/platform-market";

export const MARKET_CONTRIBUTOR_THRESHOLD = 3;
export const MARKET_STALE_THRESHOLD_DAYS = 30;

export type MarketDiagnostics = {
  readMode: "service" | "session";
  clientWarning: string | null;
  error: string | null;
  warning: string | null;
  hasServiceRoleKey: boolean;
  hasPlatformWorkspaceId: boolean;
};

export type WorkspaceOverlaySummary = {
  count: number;
  uniqueRoles: number;
  uniqueLocations: number;
  sources: string[];
};

export type MarketInsightStatus = "ready" | "empty" | "error";
export type MarketCoverageStrength = "strong" | "developing" | "thin";
export type MarketFreshnessStatus = "fresh" | "mixed" | "stale";
export type MarketRowConfidence = "high" | "moderate" | "use-caution";

export type MarketInsightsResponse = {
  status: MarketInsightStatus;
  summary: {
    benchmarkCount: number;
    uniqueRoles: number;
    uniqueLocations: number;
    uniqueLevels: number;
    contributorQualifiedRows: number;
    lowConfidenceRows: number;
    coverageStrength: MarketCoverageStrength;
  };
  freshness: {
    latest: string | null;
    staleRows: number;
    staleThresholdDays: number;
    freshnessStatus: MarketFreshnessStatus;
  };
  hero: {
    title: string;
    summary: string;
    recommendedAction: string;
  };
  coverage: {
    topRoles: Array<{
      roleId: string;
      benchmarkCount: number;
      locationCount: number;
      levelCount: number;
      contributorQualifiedCount: number;
    }>;
    topLocations: Array<{
      locationId: string;
      benchmarkCount: number;
      roleCount: number;
      levelCount: number;
      contributorQualifiedCount: number;
    }>;
    topLevels: Array<{
      levelId: string;
      benchmarkCount: number;
      roleCount: number;
      locationCount: number;
      contributorQualifiedCount: number;
    }>;
    sourceMix: Array<{
      sourceType: string;
      contributionCount: number;
      rowCount: number;
    }>;
    lowDensityRows: Array<{
      roleId: string;
      locationId: string;
      levelId: string;
      contributorCount: number;
      sampleSize: number | null;
      provenance: MarketBenchmark["provenance"] | null;
      freshnessAt: string | null;
      confidence: MarketRowConfidence;
    }>;
  };
  drilldowns: {
    rows: Array<{
      roleId: string;
      locationId: string;
      levelId: string;
      currency: string;
      p25: number;
      p50: number;
      p75: number;
      contributorCount: number;
      sampleSize: number | null;
      provenance: MarketBenchmark["provenance"] | null;
      freshnessAt: string | null;
      confidence: MarketRowConfidence;
    }>;
  };
  workspaceOverlay: WorkspaceOverlaySummary;
  diagnostics: {
    market: MarketDiagnostics;
  };
};

export function buildMarketInsightsResponse({
  marketRows,
  workspaceOverlay,
  diagnostics,
  now = new Date(),
}: {
  marketRows: MarketBenchmark[];
  workspaceOverlay: WorkspaceOverlaySummary;
  diagnostics: { market: MarketDiagnostics };
  now?: Date;
}): MarketInsightsResponse {
  const uniqueRoles = new Set<string>();
  const uniqueLocations = new Set<string>();
  const uniqueLevels = new Set<string>();
  const topRoles = new Map<
    string,
    {
      roleId: string;
      benchmarkCount: number;
      locations: Set<string>;
      levels: Set<string>;
      contributorQualifiedCount: number;
    }
  >();
  const topLocations = new Map<
    string,
    {
      locationId: string;
      benchmarkCount: number;
      roles: Set<string>;
      levels: Set<string>;
      contributorQualifiedCount: number;
    }
  >();
  const topLevels = new Map<
    string,
    {
      levelId: string;
      benchmarkCount: number;
      roles: Set<string>;
      locations: Set<string>;
      contributorQualifiedCount: number;
    }
  >();
  const sourceMix = new Map<
    string,
    {
      sourceType: string;
      contributionCount: number;
      rowCount: number;
    }
  >();
  const lowDensityRows: MarketInsightsResponse["coverage"]["lowDensityRows"] = [];

  let contributorQualifiedRows = 0;
  let staleRows = 0;
  let latestFreshnessAt: string | null = null;
  const staleCutoffMs = now.getTime() - MARKET_STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

  for (const row of marketRows) {
    uniqueRoles.add(row.role_id);
    uniqueLocations.add(row.location_id);
    uniqueLevels.add(row.level_id);

    const contributorCount = row.contributor_count ?? 0;
    const isContributorQualified = contributorCount >= MARKET_CONTRIBUTOR_THRESHOLD;
    const freshnessAt = row.freshness_at ?? null;
    const confidence = getMarketRowConfidence({
      contributorCount,
      freshnessAt,
      staleCutoffMs,
    });

    if (isContributorQualified) contributorQualifiedRows += 1;
    else {
      lowDensityRows.push({
        roleId: row.role_id,
        locationId: row.location_id,
        levelId: row.level_id,
        contributorCount,
        sampleSize: row.sample_size ?? null,
        provenance: row.provenance ?? null,
        freshnessAt,
        confidence,
      });
    }

    if (freshnessAt) {
      const freshnessMs = new Date(freshnessAt).getTime();
      if (!Number.isNaN(freshnessMs)) {
        if (!latestFreshnessAt || freshnessMs > new Date(latestFreshnessAt).getTime()) {
          latestFreshnessAt = new Date(freshnessMs).toISOString();
        }
        if (freshnessMs < staleCutoffMs) staleRows += 1;
      }
    }

    const roleEntry = topRoles.get(row.role_id) ?? {
      roleId: row.role_id,
      benchmarkCount: 0,
      locations: new Set<string>(),
      levels: new Set<string>(),
      contributorQualifiedCount: 0,
    };
    roleEntry.benchmarkCount += 1;
    roleEntry.locations.add(row.location_id);
    roleEntry.levels.add(row.level_id);
    if (isContributorQualified) roleEntry.contributorQualifiedCount += 1;
    topRoles.set(row.role_id, roleEntry);

    const locationEntry = topLocations.get(row.location_id) ?? {
      locationId: row.location_id,
      benchmarkCount: 0,
      roles: new Set<string>(),
      levels: new Set<string>(),
      contributorQualifiedCount: 0,
    };
    locationEntry.benchmarkCount += 1;
    locationEntry.roles.add(row.role_id);
    locationEntry.levels.add(row.level_id);
    if (isContributorQualified) locationEntry.contributorQualifiedCount += 1;
    topLocations.set(row.location_id, locationEntry);

    const levelEntry = topLevels.get(row.level_id) ?? {
      levelId: row.level_id,
      benchmarkCount: 0,
      roles: new Set<string>(),
      locations: new Set<string>(),
      contributorQualifiedCount: 0,
    };
    levelEntry.benchmarkCount += 1;
    levelEntry.roles.add(row.role_id);
    levelEntry.locations.add(row.location_id);
    if (isContributorQualified) levelEntry.contributorQualifiedCount += 1;
    topLevels.set(row.level_id, levelEntry);

    for (const [sourceType, count] of Object.entries(getSourceBreakdown(row))) {
      const entry = sourceMix.get(sourceType) ?? {
        sourceType,
        contributionCount: 0,
        rowCount: 0,
      };
      entry.contributionCount += count;
      entry.rowCount += 1;
      sourceMix.set(sourceType, entry);
    }
  }

  const benchmarkCount = marketRows.length;
  const lowConfidenceRows = benchmarkCount - contributorQualifiedRows;
  const coverageStrength = getCoverageStrength(contributorQualifiedRows, benchmarkCount);
  const freshnessStatus = getFreshnessStatus(staleRows, benchmarkCount);
  const status: MarketInsightStatus =
    diagnostics.market.error ? "error" : benchmarkCount === 0 ? "empty" : "ready";

  return {
    status,
    summary: {
      benchmarkCount,
      uniqueRoles: uniqueRoles.size,
      uniqueLocations: uniqueLocations.size,
      uniqueLevels: uniqueLevels.size,
      contributorQualifiedRows,
      lowConfidenceRows,
      coverageStrength,
    },
    freshness: {
      latest: latestFreshnessAt,
      staleRows,
      staleThresholdDays: MARKET_STALE_THRESHOLD_DAYS,
      freshnessStatus,
    },
    hero: buildHeroSummary({
      benchmarkCount,
      uniqueRoles: uniqueRoles.size,
      uniqueLocations: uniqueLocations.size,
      contributorQualifiedRows,
      staleRows,
      coverageStrength,
      freshnessStatus,
    }),
    coverage: {
      topRoles: Array.from(topRoles.values())
        .map((entry) => ({
          roleId: entry.roleId,
          benchmarkCount: entry.benchmarkCount,
          locationCount: entry.locations.size,
          levelCount: entry.levels.size,
          contributorQualifiedCount: entry.contributorQualifiedCount,
        }))
        .sort((left, right) =>
          right.benchmarkCount - left.benchmarkCount || left.roleId.localeCompare(right.roleId),
        )
        .slice(0, 5),
      topLocations: Array.from(topLocations.values())
        .map((entry) => ({
          locationId: entry.locationId,
          benchmarkCount: entry.benchmarkCount,
          roleCount: entry.roles.size,
          levelCount: entry.levels.size,
          contributorQualifiedCount: entry.contributorQualifiedCount,
        }))
        .sort((left, right) =>
          right.benchmarkCount - left.benchmarkCount || left.locationId.localeCompare(right.locationId),
        )
        .slice(0, 5),
      topLevels: Array.from(topLevels.values())
        .map((entry) => ({
          levelId: entry.levelId,
          benchmarkCount: entry.benchmarkCount,
          roleCount: entry.roles.size,
          locationCount: entry.locations.size,
          contributorQualifiedCount: entry.contributorQualifiedCount,
        }))
        .sort((left, right) =>
          right.benchmarkCount - left.benchmarkCount || left.levelId.localeCompare(right.levelId),
        )
        .slice(0, 5),
      sourceMix: Array.from(sourceMix.values()).sort(
        (left, right) =>
          right.contributionCount - left.contributionCount ||
          right.rowCount - left.rowCount ||
          left.sourceType.localeCompare(right.sourceType),
      ),
      lowDensityRows: lowDensityRows
        .sort(
          (left, right) =>
            left.contributorCount - right.contributorCount ||
            (left.freshnessAt ?? "").localeCompare(right.freshnessAt ?? "") ||
            left.roleId.localeCompare(right.roleId),
        )
        .slice(0, 10),
    },
    drilldowns: {
      rows: marketRows
        .map((row) => ({
          roleId: row.role_id,
          locationId: row.location_id,
          levelId: row.level_id,
          currency: row.currency,
          p25: row.p25,
          p50: row.p50,
          p75: row.p75,
          contributorCount: row.contributor_count ?? 0,
          sampleSize: row.sample_size ?? null,
          provenance: row.provenance ?? null,
          freshnessAt: row.freshness_at ?? null,
          confidence: getMarketRowConfidence({
            contributorCount: row.contributor_count ?? 0,
            freshnessAt: row.freshness_at ?? null,
            staleCutoffMs,
          }),
        }))
        .sort(
          (left, right) =>
            right.contributorCount - left.contributorCount ||
            (right.freshnessAt ?? "").localeCompare(left.freshnessAt ?? "") ||
            right.p50 - left.p50,
        )
        .slice(0, 25),
    },
    workspaceOverlay,
    diagnostics,
  };
}

function getCoverageStrength(
  contributorQualifiedRows: number,
  benchmarkCount: number,
): MarketCoverageStrength {
  const qualifiedShare = benchmarkCount > 0 ? contributorQualifiedRows / benchmarkCount : 0;
  if (qualifiedShare >= 0.75) return "strong";
  if (qualifiedShare >= 0.45) return "developing";
  return "thin";
}

function getFreshnessStatus(staleRows: number, benchmarkCount: number): MarketFreshnessStatus {
  if (benchmarkCount === 0 || staleRows === 0) return "fresh";
  if (staleRows > benchmarkCount / 2) return "stale";
  return "mixed";
}

function getMarketRowConfidence({
  contributorCount,
  freshnessAt,
  staleCutoffMs,
}: {
  contributorCount: number;
  freshnessAt: string | null;
  staleCutoffMs: number;
}): MarketRowConfidence {
  if (contributorCount >= MARKET_CONTRIBUTOR_THRESHOLD) {
    if (!freshnessAt) return "high";
    const freshnessMs = new Date(freshnessAt).getTime();
    if (Number.isNaN(freshnessMs) || freshnessMs >= staleCutoffMs) return "high";
    return "moderate";
  }
  if (contributorCount >= 2) return "moderate";
  return "use-caution";
}

function buildHeroSummary({
  benchmarkCount,
  uniqueRoles,
  uniqueLocations,
  contributorQualifiedRows,
  staleRows,
  coverageStrength,
  freshnessStatus,
}: {
  benchmarkCount: number;
  uniqueRoles: number;
  uniqueLocations: number;
  contributorQualifiedRows: number;
  staleRows: number;
  coverageStrength: MarketCoverageStrength;
  freshnessStatus: MarketFreshnessStatus;
}) {
  if (benchmarkCount === 0) {
    return {
      title: "Market data is not ready yet.",
      summary:
        "Qeemly has not surfaced visible market cohorts for this workspace yet, so there is not enough coverage to benchmark against the platform dataset.",
      recommendedAction: "Rebuild the market dataset, then return to review coverage and freshness.",
    };
  }

  const freshnessPhrase =
    freshnessStatus === "fresh"
      ? "fresh"
      : freshnessStatus === "mixed"
        ? "broad, but freshness needs attention"
        : "available, but freshness is now a risk";

  return {
    title: `Market coverage is ${coverageStrength}, and the dataset is ${freshnessPhrase}.`,
    summary: `The visible Qeemly market dataset covers ${formatCount(uniqueRoles, "role")} across ${formatCount(uniqueLocations, "location")}, with ${formatCount(contributorQualifiedRows, "cohort")} meeting the contributor threshold.`,
    recommendedAction:
      staleRows > 0
        ? "Review stale cohorts, then drill into pricing for your priority roles."
        : "Open Benchmarking to price priority roles against the strongest market cohorts.",
  };
}

function formatCount(value: number, noun: string): string {
  return `${value} ${value === 1 ? noun : `${noun}s`}`;
}

function getSourceBreakdown(row: MarketBenchmark): Record<string, number> {
  if (row.source_breakdown && Object.keys(row.source_breakdown).length > 0) {
    return row.source_breakdown;
  }

  const fallbackSource = row.provenance ?? "unknown";
  return {
    [fallbackSource]: Math.max(1, row.contributor_count ?? row.sample_size ?? 1),
  };
}
