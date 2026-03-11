import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";
import { createServiceClient } from "@/lib/supabase/service";

export type MarketPoolSourceType = "employee" | "uploaded" | "admin";

export type MarketPoolObservation = {
  workspaceId: string;
  role_id: string;
  location_id: string;
  level_id: string;
  currency: string;
  industry?: string | null;
  company_size?: string | null;
  value: number;
  sourceType: MarketPoolSourceType;
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
  source_breakdown: Record<MarketPoolSourceType, number>;
  valid_from: string;
  freshness_at: string;
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
};

type WorkspaceSettingsRow = {
  workspace_id: string;
  industry: string | null;
  company_size: string | null;
};

const DEFAULT_MINIMUM_CONTRIBUTORS = 3;

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
    .map(([key, cohort]) => {
      const values = cohort.map((row) => row.value).sort((a, b) => a - b);
      const contributors = new Set(cohort.map((row) => row.workspaceId));
      if (contributors.size < minimumContributors) return null;

      const [role_id, location_id, level_id, currency, industry, company_size] = key.split("::");
      const source_breakdown: Record<MarketPoolSourceType, number> = {
        employee: 0,
        uploaded: 0,
        admin: 0,
      };
      for (const row of cohort) {
        source_breakdown[row.sourceType] += 1;
      }

      return {
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
        source_breakdown,
        valid_from: effectiveDate,
        freshness_at: refreshedAt,
      } satisfies PlatformMarketPoolRow;
    })
    .filter((row): row is PlatformMarketPoolRow => row != null);
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

function toAdminObservation(row: SalaryBenchmarkRow): MarketPoolObservation | null {
  if (row.source !== "market") return null;
  if (!row.workspace_id || !row.role_id || !row.location_id || !row.level_id) return null;
  const midpoint = Number(row.p50 ?? 0);
  if (!Number.isFinite(midpoint) || midpoint <= 0) return null;
  return {
    workspaceId: row.workspace_id,
    role_id: row.role_id,
    location_id: row.location_id,
    level_id: row.level_id,
    currency: row.currency || "AED",
    industry: row.industry || null,
    company_size: row.company_size || null,
    value: midpoint,
    sourceType: "admin",
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
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("workspace_id, role_id, location_id, level_id, base_salary, bonus, equity, currency, status"),
    supabase
      .from("salary_benchmarks")
      .select("workspace_id, role_id, location_id, level_id, industry, company_size, p50, currency, source"),
    supabase
      .from("workspace_settings")
      .select("workspace_id, industry, company_size"),
  ]);

  if (employeesError) throw new Error(employeesError.message);
  if (benchmarksError) throw new Error(benchmarksError.message);
  if (workspaceSettingsError) throw new Error(workspaceSettingsError.message);

  const workspaceSettingsById = new Map(
    ((workspaceSettings ?? []) as WorkspaceSettingsRow[]).map((row) => [row.workspace_id, row]),
  );

  const observations = [
    ...((employees ?? []) as EmployeeRow[]).map((row) =>
      toEmployeeObservation(row, workspaceSettingsById),
    ),
    ...((benchmarks ?? []) as SalaryBenchmarkRow[]).map((row) =>
      toUploadedObservation(row, workspaceSettingsById),
    ),
    ...((benchmarks ?? []) as SalaryBenchmarkRow[]).map(toAdminObservation),
  ].filter((row): row is MarketPoolObservation => row != null);

  const pooledRows = aggregateMarketPoolObservations(observations, {
    minimumContributors: DEFAULT_MINIMUM_CONTRIBUTORS,
    effectiveDate,
    refreshedAt,
  });

  await supabase.from("platform_market_benchmarks").delete().gte("valid_from", "1900-01-01");

  if (pooledRows.length > 0) {
    await supabase.from("platform_market_benchmarks").insert(pooledRows);
  }

  await supabase.from("public_benchmark_snapshots").delete().eq("workspace_id", null);

  if (pooledRows.length > 0) {
    await supabase.from("public_benchmark_snapshots").insert(
      pooledRows.map((row) => ({
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
      })),
    );
  }

  return { rowCount: pooledRows.length };
}
