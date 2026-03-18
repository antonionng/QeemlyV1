import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";
import { createServiceClient } from "@/lib/supabase/service";
import { isSourceAllowedForIngestion, type IngestionSource } from "@/lib/ingestion/source-registry";

export type MarketPoolSourceType = "employee" | "uploaded" | "admin";

export type MarketPoolObservation = {
  workspaceId: string;
  contributorKey?: string;
  role_id: string;
  location_id: string;
  level_id: string;
  currency: string;
  industry?: string | null;
  company_size?: string | null;
  value: number;
  sourceType: MarketPoolSourceType;
  marketSourceTier?: "official" | "proxy";
};

export type PlatformMarketPoolRow = {
  role_id: string;
  location_id: string;
  level_id: string;
  currency: string;
  industry: string | null;
  company_size: string | null;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sample_size: number;
  contributor_count: number;
  provenance: "employee" | "uploaded" | "admin" | "blended";
  market_source_tier?: "official" | "proxy" | "blended" | null;
  source_breakdown: Record<MarketPoolSourceType, number>;
  valid_from: string;
  freshness_at: string;
};

type PublicBenchmarkSnapshotRow = {
  workspace_id: null;
  role_id: string;
  role_label: string;
  location_id: string;
  location_label: string;
  level_id: string;
  level_label: string;
  industry: string | null;
  company_size: string | null;
  currency: string;
  p25: number;
  p50: number;
  p75: number;
  submissions_this_week: number;
  mom_delta_p25: string;
  mom_delta_p50: string;
  mom_delta_p75: string;
  trend_delta: string;
  is_public: true;
  updated_at: string;
  market_source_tier?: "official" | "proxy" | "blended" | null;
};

type AggregateOptions = {
  minimumContributors?: number;
  effectiveDate?: string;
  refreshedAt?: string;
};

type EmployeeRow = {
  workspace_id: string;
  role_id: string | null;
  location_id: string | null;
  level_id: string | null;
  base_salary: number | null;
  bonus: number | null;
  equity: number | null;
  currency: string | null;
  status: string | null;
};

type SalaryBenchmarkRow = {
  workspace_id: string;
  role_id: string | null;
  location_id: string | null;
  level_id: string | null;
  industry: string | null;
  company_size: string | null;
  p50: number | null;
  currency: string | null;
  source: string | null;
  market_source_slug?: string | null;
  market_source_tier?: "official" | "proxy" | null;
};

type WorkspaceSettingsRow = {
  workspace_id: string;
  industry: string | null;
  company_size: string | null;
};

type SupabaseMutationResult = {
  error?: { message?: string } | null;
};

type SupabaseLike = {
  from: (table: string) => unknown;
  rpc?: (fn: string, args?: Record<string, unknown>) => Promise<SupabaseMutationResult>;
};

const DEFAULT_MINIMUM_CONTRIBUTORS = 3;

export function getMarketPoolMinimumContributors(
  env: Record<string, string | undefined> = process.env,
): number {
  return env.QEEMLY_ENABLE_DEMO_MARKET_BOOTSTRAP === "true" ? 1 : DEFAULT_MINIMUM_CONTRIBUTORS;
}

function getPercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const rawIndex = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  const boundedIndex = Math.max(0, Math.min(sortedValues.length - 1, rawIndex));
  return Math.round(sortedValues[boundedIndex]);
}

function normalizeObservationValue(observation: MarketPoolObservation): number | null {
  if (!Number.isFinite(observation.value) || observation.value <= 0) return null;
  return Math.round(observation.value);
}

function normalizeSegmentValue(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getProvenance(sourceBreakdown: Record<MarketPoolSourceType, number>) {
  const activeSources = Object.entries(sourceBreakdown).filter(([, count]) => count > 0);
  if (activeSources.length !== 1) return "blended" as const;
  return activeSources[0][0] as "employee" | "uploaded" | "admin";
}

export function aggregateMarketPoolObservations(
  observations: MarketPoolObservation[],
  options: AggregateOptions = {},
): PlatformMarketPoolRow[] {
  const minimumContributors = options.minimumContributors ?? DEFAULT_MINIMUM_CONTRIBUTORS;
  const effectiveDate = options.effectiveDate ?? new Date().toISOString().slice(0, 10);
  const refreshedAt = options.refreshedAt ?? new Date().toISOString();
  const grouped = new Map<string, MarketPoolObservation[]>();

  for (const observation of observations) {
    const value = normalizeObservationValue(observation);
    if (value == null) continue;
    if (!observation.role_id || !observation.location_id || !observation.level_id || !observation.currency) continue;
    const normalizedObservation = {
      ...observation,
      value,
      industry: normalizeSegmentValue(observation.industry),
      company_size: normalizeSegmentValue(observation.company_size),
    };
    const keyVariants = new Set(
      [
        [null, null],
        normalizedObservation.industry ? [normalizedObservation.industry, null] : null,
        normalizedObservation.company_size ? [null, normalizedObservation.company_size] : null,
        normalizedObservation.industry || normalizedObservation.company_size
          ? [normalizedObservation.industry, normalizedObservation.company_size]
          : null,
      ]
        .filter((entry): entry is [string | null, string | null] => entry != null)
        .map(([industry, companySize]) =>
          [
            normalizedObservation.role_id,
            normalizedObservation.location_id,
            normalizedObservation.level_id,
            normalizedObservation.currency,
            industry ?? "",
            companySize ?? "",
          ].join("::"),
        ),
    );

    for (const key of keyVariants) {
      grouped.set(key, [...(grouped.get(key) ?? []), normalizedObservation]);
    }
  }

  return [...grouped.entries()]
    .flatMap(([key, cohort]) => {
      const effectiveCohort = selectPreferredMarketTierCohort(cohort, minimumContributors);
      const values = effectiveCohort.map((row) => row.value).sort((a, b) => a - b);
      const contributors = new Set(
        effectiveCohort.map((row) => row.contributorKey || `${row.sourceType}:${row.workspaceId}`),
      );
      if (contributors.size < minimumContributors) return [];

      const [role_id, location_id, level_id, currency, industry, company_size] = key.split("::");
      const source_breakdown: Record<MarketPoolSourceType, number> = {
        employee: 0,
        uploaded: 0,
        admin: 0,
      };
      for (const row of effectiveCohort) {
        source_breakdown[row.sourceType] += 1;
      }

      return [
        {
          role_id,
          location_id,
          level_id,
          currency,
          industry: industry || null,
          company_size: company_size || null,
          p10: getPercentile(values, 10),
          p25: getPercentile(values, 25),
          p50: getPercentile(values, 50),
          p75: getPercentile(values, 75),
          p90: getPercentile(values, 90),
          sample_size: values.length,
          contributor_count: contributors.size,
          provenance: getProvenance(source_breakdown),
          market_source_tier: resolveEffectiveMarketSourceTier(effectiveCohort),
          source_breakdown,
          valid_from: effectiveDate,
          freshness_at: refreshedAt,
        } satisfies PlatformMarketPoolRow,
      ];
    });
}

function toEmployeeObservation(
  row: EmployeeRow,
  workspaceSettingsById: Map<string, WorkspaceSettingsRow>,
): MarketPoolObservation | null {
  if (row.status && row.status !== "active") return null;
  if (!row.workspace_id || !row.role_id || !row.location_id || !row.level_id) return null;
  const totalCashComp = Number(row.base_salary ?? 0) + Number(row.bonus ?? 0) + Number(row.equity ?? 0);
  if (!Number.isFinite(totalCashComp) || totalCashComp <= 0) return null;
  const workspaceSettings = workspaceSettingsById.get(row.workspace_id);
  return {
    workspaceId: row.workspace_id,
    contributorKey: `employee:${row.workspace_id}`,
    role_id: row.role_id,
    location_id: row.location_id,
    level_id: row.level_id,
    currency: row.currency || "AED",
    industry: workspaceSettings?.industry || null,
    company_size: workspaceSettings?.company_size || null,
    value: totalCashComp,
    sourceType: "employee",
  };
}

function toUploadedObservation(
  row: SalaryBenchmarkRow,
  workspaceSettingsById: Map<string, WorkspaceSettingsRow>,
): MarketPoolObservation | null {
  if (row.source !== "uploaded") return null;
  if (!row.workspace_id || !row.role_id || !row.location_id || !row.level_id) return null;
  const midpoint = Number(row.p50 ?? 0);
  if (!Number.isFinite(midpoint) || midpoint <= 0) return null;
  const workspaceSettings = workspaceSettingsById.get(row.workspace_id);
  return {
    workspaceId: row.workspace_id,
    contributorKey: `uploaded:${row.workspace_id}`,
    role_id: row.role_id,
    location_id: row.location_id,
    level_id: row.level_id,
    currency: row.currency || "AED",
    industry: row.industry || workspaceSettings?.industry || null,
    company_size: row.company_size || workspaceSettings?.company_size || null,
    value: midpoint,
    sourceType: "uploaded",
  };
}

function toAdminObservation(
  row: SalaryBenchmarkRow,
  ingestionSourcesBySlug: Map<string, IngestionSource>,
): MarketPoolObservation | null {
  if (row.source !== "market") return null;
  if (!row.workspace_id || !row.role_id || !row.location_id || !row.level_id) return null;
  if (row.market_source_slug) {
    const source = ingestionSourcesBySlug.get(row.market_source_slug);
    if (source && !isSourceAllowedForIngestion(source)) return null;
  }
  const midpoint = Number(row.p50 ?? 0);
  if (!Number.isFinite(midpoint) || midpoint <= 0) return null;
  return {
    workspaceId: row.workspace_id,
    contributorKey: row.market_source_slug
      ? `admin:${row.market_source_slug}`
      : `admin:${row.workspace_id}`,
    role_id: row.role_id,
    location_id: row.location_id,
    level_id: row.level_id,
    currency: row.currency || "AED",
    industry: row.industry || null,
    company_size: row.company_size || null,
    value: midpoint,
    sourceType: "admin",
    marketSourceTier: row.market_source_tier ?? undefined,
  };
}

function labelForRole(roleId: string): string {
  return ROLES.find((role) => role.id === roleId)?.title ?? roleId;
}

function labelForLocation(locationId: string): string {
  return LOCATIONS.find((location) => location.id === locationId)?.city ?? locationId;
}

function labelForLevel(levelId: string): string {
  return LEVELS.find((level) => level.id === levelId)?.name ?? levelId;
}

export async function refreshPlatformMarketPool(): Promise<{ rowCount: number }> {
  const supabase = createServiceClient();
  const effectiveDate = new Date().toISOString().slice(0, 10);
  const refreshedAt = new Date().toISOString();

  const [
    { data: employees, error: employeesError },
    { data: benchmarks, error: benchmarksError },
    { data: workspaceSettings, error: workspaceSettingsError },
    { data: ingestionSources, error: ingestionSourcesError },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("workspace_id, role_id, location_id, level_id, base_salary, bonus, equity, currency, status"),
    supabase
      .from("salary_benchmarks")
      .select(
        "workspace_id, role_id, location_id, level_id, industry, company_size, p50, currency, source, market_source_slug, market_source_tier",
      ),
    supabase
      .from("workspace_settings")
      .select("workspace_id, industry, company_size"),
    supabase
      .from("ingestion_sources")
      .select("slug, enabled, approved_for_commercial, needs_review, tier"),
  ]);

  if (employeesError) throw new Error(employeesError.message);
  if (benchmarksError) throw new Error(benchmarksError.message);
  if (workspaceSettingsError) throw new Error(workspaceSettingsError.message);
  if (ingestionSourcesError) throw new Error(ingestionSourcesError.message);

  const workspaceSettingsById = new Map(
    ((workspaceSettings ?? []) as WorkspaceSettingsRow[]).map((row) => [row.workspace_id, row]),
  );
  const ingestionSourcesBySlug = new Map(
    ((ingestionSources ?? []) as IngestionSource[]).map((row) => [row.slug, row]),
  );

  const observations = [
    ...((employees ?? []) as EmployeeRow[]).map((row) =>
      toEmployeeObservation(row, workspaceSettingsById),
    ),
    ...((benchmarks ?? []) as SalaryBenchmarkRow[]).map((row) =>
      toUploadedObservation(row, workspaceSettingsById),
    ),
    ...((benchmarks ?? []) as SalaryBenchmarkRow[]).map((row) =>
      toAdminObservation(row, ingestionSourcesBySlug),
    ),
  ].filter((row): row is MarketPoolObservation => row != null);

  const pooledRows = aggregateMarketPoolObservations(observations, {
    minimumContributors: getMarketPoolMinimumContributors(),
    effectiveDate,
    refreshedAt,
  });

  const snapshotRows = pooledRows.map((row) =>
    buildPublicBenchmarkSnapshotRow(row, refreshedAt),
  );

  await stagePlatformMarketRefresh(supabase as unknown as SupabaseLike, pooledRows, snapshotRows);
  await swapStagedPlatformMarketRefresh(supabase as unknown as SupabaseLike);

  return { rowCount: pooledRows.length };
}

function buildPublicBenchmarkSnapshotRow(
  row: PlatformMarketPoolRow,
  refreshedAt: string,
): PublicBenchmarkSnapshotRow {
  return {
    workspace_id: null,
    role_id: row.role_id,
    role_label: labelForRole(row.role_id),
    location_id: row.location_id,
    location_label: labelForLocation(row.location_id),
    level_id: row.level_id,
    level_label: labelForLevel(row.level_id),
    industry: row.industry,
    company_size: row.company_size,
    currency: row.currency,
    p25: row.p25,
    p50: row.p50,
    p75: row.p75,
    submissions_this_week: row.contributor_count,
    mom_delta_p25: "0%",
    mom_delta_p50: "0%",
    mom_delta_p75: "0%",
    trend_delta: "0%",
    is_public: true,
    updated_at: refreshedAt,
    market_source_tier: row.market_source_tier ?? null,
  };
}

function selectPreferredMarketTierCohort(
  cohort: MarketPoolObservation[],
  minimumContributors: number,
): MarketPoolObservation[] {
  const nonMarketRows = cohort.filter((row) => row.sourceType !== "admin");
  const officialMarketRows = cohort.filter(
    (row) => row.sourceType === "admin" && row.marketSourceTier === "official",
  );
  const proxyMarketRows = cohort.filter(
    (row) => row.sourceType === "admin" && row.marketSourceTier === "proxy",
  );

  const officialCandidate = [...nonMarketRows, ...officialMarketRows];
  if (
    officialMarketRows.length > 0 &&
    countDistinctContributors(officialCandidate) >= minimumContributors
  ) {
    return officialCandidate;
  }

  const proxyCandidate = [...nonMarketRows, ...proxyMarketRows];
  if (
    proxyMarketRows.length > 0 &&
    countDistinctContributors(proxyCandidate) >= minimumContributors
  ) {
    return proxyCandidate;
  }

  const blendedCandidate = [...nonMarketRows, ...officialMarketRows, ...proxyMarketRows];
  if (
    officialMarketRows.length > 0 &&
    proxyMarketRows.length > 0 &&
    countDistinctContributors(blendedCandidate) >= minimumContributors
  ) {
    return blendedCandidate;
  }

  return cohort;
}

function countDistinctContributors(cohort: MarketPoolObservation[]): number {
  return new Set(cohort.map((row) => row.contributorKey || `${row.sourceType}:${row.workspaceId}`)).size;
}

function resolveEffectiveMarketSourceTier(
  cohort: MarketPoolObservation[],
): "official" | "proxy" | "blended" | null {
  const tiers = new Set(
    cohort
      .filter((row) => row.sourceType === "admin" && row.marketSourceTier)
      .map((row) => row.marketSourceTier),
  );
  if (tiers.has("official") && tiers.has("proxy")) return "blended";
  if (tiers.has("official")) return "official";
  if (tiers.has("proxy")) return "proxy";
  return null;
}

async function stagePlatformMarketRefresh(
  supabase: SupabaseLike,
  pooledRows: PlatformMarketPoolRow[],
  snapshotRows: PublicBenchmarkSnapshotRow[],
) {
  const { error: platformStageDeleteError } = await deleteAllRows(
    supabase,
    "platform_market_benchmarks_staging",
    "valid_from",
    "1900-01-01",
  );
  if (platformStageDeleteError) {
    throw new Error(platformStageDeleteError.message ?? "Failed to clear platform market staging rows");
  }

  if (pooledRows.length > 0) {
    const { error: platformStageInsertError } = await insertRows(
      supabase,
      "platform_market_benchmarks_staging",
      pooledRows,
    );
    if (platformStageInsertError) {
      throw new Error(platformStageInsertError.message ?? "Failed to stage platform market rows");
    }
  }

  const { error: snapshotsStageDeleteError } = await deleteAllRows(
    supabase,
    "public_benchmark_snapshots_staging",
    "updated_at",
    "1900-01-01T00:00:00.000Z",
  );
  if (snapshotsStageDeleteError) {
    throw new Error(snapshotsStageDeleteError.message ?? "Failed to clear public snapshot staging rows");
  }

  if (snapshotRows.length > 0) {
    const { error: snapshotsStageInsertError } = await insertRows(
      supabase,
      "public_benchmark_snapshots_staging",
      snapshotRows,
    );
    if (snapshotsStageInsertError) {
      throw new Error(snapshotsStageInsertError.message ?? "Failed to stage public snapshot rows");
    }
  }
}

async function swapStagedPlatformMarketRefresh(supabase: SupabaseLike) {
  if (typeof supabase.rpc !== "function") {
    throw new Error("Supabase client does not support RPC swaps for platform market refresh.");
  }
  const { error } = await supabase.rpc("swap_platform_market_refresh_staging");
  if (error) {
    throw new Error(error.message ?? "Failed to swap staged platform market refresh rows");
  }
}

async function deleteAllRows(
  supabase: SupabaseLike,
  table: string,
  column: string,
  minimumValue: string,
): Promise<SupabaseMutationResult> {
  const query = supabase.from(table);
  if (!query || typeof query !== "object" || typeof (query as { delete?: unknown }).delete !== "function") {
    throw new Error(`Unsupported Supabase delete client for table: ${table}`);
  }

  const deleteQuery = (query as { delete: () => { gte?: (c: string, v: string) => Promise<SupabaseMutationResult> } })
    .delete();
  if (!deleteQuery || typeof deleteQuery.gte !== "function") {
    throw new Error(`Unsupported Supabase delete chain for table: ${table}`);
  }

  return deleteQuery.gte(column, minimumValue);
}

async function insertRows<T extends Record<string, unknown>>(
  supabase: SupabaseLike,
  table: string,
  rows: T[],
): Promise<SupabaseMutationResult> {
  const query = supabase.from(table);
  if (!query || typeof query !== "object" || typeof (query as { insert?: unknown }).insert !== "function") {
    throw new Error(`Unsupported Supabase insert client for table: ${table}`);
  }

  return (query as { insert: (values: T[]) => Promise<SupabaseMutationResult> }).insert(rows);
}
