import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";
import type { BenchmarkMatchQuality } from "@/lib/benchmarks/trust";

export type BenchmarkResolverRow = {
  id?: string | null;
  role_id: string;
  level_id: string;
  location_id: string;
  p50?: number | null;
  [key: string]: unknown;
};

export type BenchmarkResolverSource = "market" | "uploaded" | "ai-estimated";

export type BenchmarkResolverMatchType =
  | "exact"
  | "location_fallback"
  | "global_role_level_fallback"
  | "adjacent_level_fallback"
  | "family_fallback"
  | "family_location_fallback"
  | "none";

export type BenchmarkResolverResult<Row extends BenchmarkResolverRow = BenchmarkResolverRow> = {
  row: Row | null;
  source: BenchmarkResolverSource | null;
  matchQuality: BenchmarkMatchQuality | "none";
  matchType: BenchmarkResolverMatchType;
  matchedBenchmarkId: string | null;
  fallbackReason: string | null;
};

type ResolveArgs<Row extends BenchmarkResolverRow> = {
  employee: {
    roleId: string | null | undefined;
    levelId: string | null | undefined;
    locationId: string | null | undefined;
  };
  marketBenchmarks: Row[];
  workspaceBenchmarks: Row[];
};

const roleFamilyById = new Map(ROLES.map((role) => [role.id, role.family]));
const roleIdsByFamily = new Map<string, string[]>();
for (const role of ROLES) {
  const existing = roleIdsByFamily.get(role.family) ?? [];
  existing.push(role.id);
  roleIdsByFamily.set(role.family, existing);
}

const locationById = new Map(LOCATIONS.map((location) => [location.id, location]));
const levelOrder = LEVELS.map((level) => level.id);

function getFallbackReason(matchType: Exclude<BenchmarkResolverMatchType, "exact" | "none">): string {
  switch (matchType) {
    case "location_fallback":
      return "Used the closest market benchmark from the same country.";
    case "global_role_level_fallback":
      return "Used the closest market benchmark for the same role and level from another market.";
    case "adjacent_level_fallback":
      return "Used the nearest benchmark level for the same role and location.";
    case "family_fallback":
      return "Used a benchmark from the same canonical job family.";
    case "family_location_fallback":
      return "Used a same-family benchmark from the closest market in the same country.";
  }
}

function buildKey(roleId: string, levelId: string, locationId: string) {
  return `${roleId}::${levelId}::${locationId}`;
}

function buildExactMap<Row extends BenchmarkResolverRow>(rows: Row[]) {
  const exactMap = new Map<string, Row>();
  for (const row of rows) {
    const key = buildKey(row.role_id, row.level_id, row.location_id);
    if (!exactMap.has(key)) {
      exactMap.set(key, row);
    }
  }
  return exactMap;
}

function getCountryLocationIds(locationId: string | null | undefined): string[] {
  if (!locationId) return [];
  const location = locationById.get(locationId);
  if (!location) return [];
  return LOCATIONS.filter((entry) => entry.country === location.country && entry.id !== locationId).map(
    (entry) => entry.id,
  );
}

function getAdjacentLevelIds(levelId: string | null | undefined): string[] {
  if (!levelId) return [];
  const index = levelOrder.indexOf(levelId);
  if (index === -1) return [];

  const candidates: Array<{ id: string; distance: number }> = [];
  for (let pointer = 0; pointer < levelOrder.length; pointer += 1) {
    if (pointer === index) continue;
    candidates.push({
      id: levelOrder[pointer],
      distance: Math.abs(pointer - index),
    });
  }

  return candidates.sort((left, right) => left.distance - right.distance).map((candidate) => candidate.id);
}

function getFamilyRoleIds(roleId: string | null | undefined): string[] {
  if (!roleId) return [];
  const family = roleFamilyById.get(roleId);
  if (!family) return [];
  return (roleIdsByFamily.get(family) ?? []).filter((candidate) => candidate !== roleId);
}

function selectCandidate<Row extends BenchmarkResolverRow>(
  exactMap: Map<string, Row>,
  candidates: Array<{ roleId: string; levelId: string; locationId: string }>,
): Row | null {
  for (const candidate of candidates) {
    const match = exactMap.get(buildKey(candidate.roleId, candidate.levelId, candidate.locationId));
    if (match) {
      return match;
    }
  }
  return null;
}

function resolveFromRows<Row extends BenchmarkResolverRow>(
  source: BenchmarkResolverSource,
  rows: Row[],
  employee: ResolveArgs<Row>["employee"],
): BenchmarkResolverResult<Row> | null {
  const { roleId, levelId, locationId } = employee;
  if (!roleId || !levelId || !locationId) return null;

  const exactMap = buildExactMap(rows);
  const exact = exactMap.get(buildKey(roleId, levelId, locationId));
  if (exact) {
    return {
      row: exact,
      source,
      matchQuality: "exact",
      matchType: "exact",
      matchedBenchmarkId: exact.id ? String(exact.id) : null,
      fallbackReason: null,
    };
  }

  const countryLocations = getCountryLocationIds(locationId);
  const sameCountry = selectCandidate(
    exactMap,
    countryLocations.map((candidateLocationId) => ({
      roleId,
      levelId,
      locationId: candidateLocationId,
    })),
  );
  if (sameCountry) {
    return {
      row: sameCountry,
      source,
      matchQuality: "role_level_fallback",
      matchType: "location_fallback",
      matchedBenchmarkId: sameCountry.id ? String(sameCountry.id) : null,
      fallbackReason: getFallbackReason("location_fallback"),
    };
  }

  const anyLocationMatch = selectCandidate(
    exactMap,
    rows
      .filter((row) => row.role_id === roleId && row.level_id === levelId && row.location_id !== locationId)
      .map((row) => ({
        roleId: row.role_id,
        levelId: row.level_id,
        locationId: row.location_id,
      })),
  );
  if (anyLocationMatch) {
    return {
      row: anyLocationMatch,
      source,
      matchQuality: "role_level_fallback",
      matchType: "global_role_level_fallback",
      matchedBenchmarkId: anyLocationMatch.id ? String(anyLocationMatch.id) : null,
      fallbackReason: getFallbackReason("global_role_level_fallback"),
    };
  }

  const adjacentLevels = getAdjacentLevelIds(levelId);
  const adjacentLevel = selectCandidate(
    exactMap,
    adjacentLevels.map((candidateLevelId) => ({
      roleId,
      levelId: candidateLevelId,
      locationId,
    })),
  );
  if (adjacentLevel) {
    return {
      row: adjacentLevel,
      source,
      matchQuality: "role_level_fallback",
      matchType: "adjacent_level_fallback",
      matchedBenchmarkId: adjacentLevel.id ? String(adjacentLevel.id) : null,
      fallbackReason: getFallbackReason("adjacent_level_fallback"),
    };
  }

  const familyRoleIds = getFamilyRoleIds(roleId);
  const familyMatch = selectCandidate(
    exactMap,
    familyRoleIds.map((candidateRoleId) => ({
      roleId: candidateRoleId,
      levelId,
      locationId,
    })),
  );
  if (familyMatch) {
    return {
      row: familyMatch,
      source,
      matchQuality: "role_level_fallback",
      matchType: "family_fallback",
      matchedBenchmarkId: familyMatch.id ? String(familyMatch.id) : null,
      fallbackReason: getFallbackReason("family_fallback"),
    };
  }

  const familyCountryMatch = selectCandidate(
    exactMap,
    familyRoleIds.flatMap((candidateRoleId) =>
      countryLocations.map((candidateLocationId) => ({
        roleId: candidateRoleId,
        levelId,
        locationId: candidateLocationId,
      })),
    ),
  );
  if (familyCountryMatch) {
    return {
      row: familyCountryMatch,
      source,
      matchQuality: "role_level_fallback",
      matchType: "family_location_fallback",
      matchedBenchmarkId: familyCountryMatch.id ? String(familyCountryMatch.id) : null,
      fallbackReason: getFallbackReason("family_location_fallback"),
    };
  }

  return null;
}

export function resolveBenchmarkForEmployee<Row extends BenchmarkResolverRow>(
  args: ResolveArgs<Row>,
): BenchmarkResolverResult<Row> {
  const aiRows = args.marketBenchmarks.filter(
    (row) => (row as { source?: string | null }).source === "ai-estimated",
  );
  const aiMatch = resolveFromRows("ai-estimated", aiRows, args.employee);
  if (aiMatch) return aiMatch;

  const marketMatch = resolveFromRows("market", args.marketBenchmarks, args.employee);
  if (marketMatch) return marketMatch;

  const workspaceMatch = resolveFromRows("uploaded", args.workspaceBenchmarks, args.employee);
  if (workspaceMatch) return workspaceMatch;

  return {
    row: null,
    source: null,
    matchQuality: "none",
    matchType: "none",
    matchedBenchmarkId: null,
    fallbackReason: null,
  };
}
