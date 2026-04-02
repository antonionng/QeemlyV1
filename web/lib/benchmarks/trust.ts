export type BenchmarkMatchQuality = "exact" | "role_level_fallback";
export type BenchmarkMatchType =
  | "exact"
  | "location_fallback"
  | "global_role_level_fallback"
  | "adjacent_level_fallback"
  | "family_fallback"
  | "family_location_fallback";

export type BenchmarkTrustMetadata = {
  source: "market" | "uploaded" | "ai-estimated";
  provenance?: string | null;
  matchQuality?: BenchmarkMatchQuality | null;
  matchType?: BenchmarkMatchType | null;
  matchedBenchmarkId?: string | null;
  fallbackReason?: string | null;
  sampleSize?: number | null;
  confidence?: string | null;
  freshnessAt?: string | null;
  lastUpdated?: string | null;
  contributorCount?: number | null;
};

export type BenchmarkTrustSummary = {
  benchmarkedEmployees: number;
  marketBacked: number;
  workspaceBacked: number;
  exactMatches: number;
  fallbackMatches: number;
  freshestAt: string | null;
  primarySourceLabel: string;
};

type BenchmarkAwareEmployee = {
  hasBenchmark?: boolean;
  benchmarkContext?: BenchmarkTrustMetadata | null;
};

export function getBenchmarkSourceLabel(metadata: BenchmarkTrustMetadata | null | undefined): string {
  if (!metadata) return "No benchmark coverage";
  if (metadata.source === "uploaded") return "Company Overlay";
  if (metadata.source === "ai-estimated") return "Qeemly AI Benchmark";
  return "Qeemly Market Dataset";
}

export function getBenchmarkMatchLabel(matchQuality: BenchmarkMatchQuality | null | undefined): string {
  if (matchQuality === "role_level_fallback") return "Role and level match";
  return "Exact match";
}

export function getBenchmarkMatchTypeLabel(metadata: BenchmarkTrustMetadata | null | undefined): string {
  switch (metadata?.matchType) {
    case "location_fallback":
      return "Same-country market fallback";
    case "global_role_level_fallback":
      return "Cross-market role and level fallback";
    case "adjacent_level_fallback":
      return "Adjacent level fallback";
    case "family_fallback":
      return "Job family fallback";
    case "family_location_fallback":
      return "Job family and market fallback";
    default:
      return getBenchmarkMatchLabel(metadata?.matchQuality);
  }
}

export function buildBenchmarkTrustLabels(metadata: BenchmarkTrustMetadata | null | undefined) {
  if (!metadata) return null;

  const freshnessSource = metadata.freshnessAt || metadata.lastUpdated || null;

  return {
    sourceLabel: getBenchmarkSourceLabel(metadata),
    matchLabel: getBenchmarkMatchTypeLabel(metadata),
    confidenceLabel: metadata.confidence ? `${toTitleCase(metadata.confidence)} confidence` : null,
    freshnessLabel: freshnessSource ? `Updated ${formatTrustDate(freshnessSource)}` : null,
    sampleLabel:
      typeof metadata.sampleSize === "number" && metadata.sampleSize > 0
        ? `Sample size ${metadata.sampleSize}`
        : null,
  };
}

export function summarizeBenchmarkTrust(employees: BenchmarkAwareEmployee[]): BenchmarkTrustSummary {
  const benchmarkedEmployees = employees.filter((employee) => employee.hasBenchmark && employee.benchmarkContext);
  if (benchmarkedEmployees.length === 0) {
    return {
      benchmarkedEmployees: 0,
      marketBacked: 0,
      workspaceBacked: 0,
      exactMatches: 0,
      fallbackMatches: 0,
      freshestAt: null,
      primarySourceLabel: "No benchmark coverage",
    };
  }

  const sourceCounts = new Map<string, number>();
  let freshestAt: string | null = null;
  let marketBacked = 0;
  let workspaceBacked = 0;
  let exactMatches = 0;
  let fallbackMatches = 0;

  for (const employee of benchmarkedEmployees) {
    const metadata = employee.benchmarkContext!;
    const sourceLabel = getBenchmarkSourceLabel(metadata);
    sourceCounts.set(sourceLabel, (sourceCounts.get(sourceLabel) ?? 0) + 1);

    if (metadata.source === "market" || metadata.source === "ai-estimated") marketBacked += 1;
    if (metadata.source === "uploaded") workspaceBacked += 1;
    if (metadata.matchQuality === "role_level_fallback") fallbackMatches += 1;
    else exactMatches += 1;

    const candidate = metadata.freshnessAt || metadata.lastUpdated || null;
    if (candidate && (!freshestAt || new Date(candidate).getTime() > new Date(freshestAt).getTime())) {
      freshestAt = candidate;
    }
  }

  return {
    benchmarkedEmployees: benchmarkedEmployees.length,
    marketBacked,
    workspaceBacked,
    exactMatches,
    fallbackMatches,
    freshestAt,
    primarySourceLabel:
      [...sourceCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      "No benchmark coverage",
  };
}

function toTitleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatTrustDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
