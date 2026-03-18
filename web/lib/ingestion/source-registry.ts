/**
 * Source Registry - Gates ingestion on approved market data sources.
 * Sources must be explicitly approved for commercial reuse.
 */

import { getIngestorForSource } from "./adapters";

/**
 * Slugs for which an ingest adapter exists. Used by cron/job-runner.
 */
export const REGISTERED_ADAPTER_SLUGS = [
  "sample_gcc_market",
  "gulf_talent_2024",
  // Live government APIs - GCC
  "kapsarc_saudi",
  "qatar_wages",
  "bahrain_compensation",
  "uae_fcsc_workforce_comp",
  "uae_fcsc_public_admin_paid",
  "uae_fcsc_gov_compensation",
  "oman_ncsi_wages",
  "oman_labour_private",
  "oman_labour_public",
  "qatar_labor_force_sector",
  "qatar_inactive_population",
  "bahrain_lmra_work_permits",
  "bahrain_labor_market",
  "kuwait_open_labor",
  "saudi_gastat_labor",
  "jordan_dos_labor",
  // Live international APIs
  "worldbank_gcc",
  "bls_oes_usa",
  "wb_gcc_unemployment",
  "wb_gcc_wage_workers",
  "wb_gcc_gdp_per_capita",
  "wb_mena_gdp_per_capita",
  "wb_gcc_labor_participation",
  "wb_gcc_employed_services",
  "wb_gcc_employed_industry",
  // Degraded - ILO SDMX API unreliable
  "ilostat_gcc",
] as const;

/**
 * Source health status for admin UI display
 */
export type SourceHealthStatus = "live" | "degraded" | "static" | "unknown";
export type IngestionSourceTier = "official" | "proxy";

/**
 * Get the health status of a source based on its slug
 */
export function getSourceHealthStatus(slug: string): SourceHealthStatus {
  const liveGovtSources = [
    "kapsarc_saudi",
    "qatar_wages",
    "bahrain_compensation",
    "oman_ncsi_wages",
    "oman_labour_private",
    "oman_labour_public",
    "qatar_labor_force_sector",
    "qatar_inactive_population",
    "bahrain_lmra_work_permits",
    "bahrain_labor_market",
    "kuwait_open_labor",
    "jordan_dos_labor",
  ];
  const liveIntlSources = [
    "sample_gcc_market",
    "gulf_talent_2024",
    "worldbank_gcc",
    "bls_oes_usa",
    "wb_gcc_unemployment",
    "wb_gcc_wage_workers",
    "wb_gcc_gdp_per_capita",
    "wb_mena_gdp_per_capita",
    "wb_gcc_labor_participation",
    "wb_gcc_employed_services",
    "wb_gcc_employed_industry",
  ];
  const degradedSources = [
    "ilostat_gcc",
    "uae_fcsc_workforce_comp",
    "uae_fcsc_public_admin_paid",
    "uae_fcsc_gov_compensation",
    "saudi_gastat_labor",
  ];

  if (liveGovtSources.includes(slug) || liveIntlSources.includes(slug)) return "live";
  if (degradedSources.includes(slug)) return "degraded";
  return "unknown";
}

export function getSourceTier(slug: string): IngestionSourceTier {
  const officialSources = [
    "kapsarc_saudi",
    "qatar_wages",
    "bahrain_compensation",
    "uae_fcsc_workforce_comp",
    "uae_fcsc_public_admin_paid",
    "uae_fcsc_gov_compensation",
    "oman_ncsi_wages",
    "oman_labour_private",
    "oman_labour_public",
    "qatar_labor_force_sector",
    "qatar_inactive_population",
    "bahrain_lmra_work_permits",
    "bahrain_labor_market",
    "kuwait_open_labor",
    "saudi_gastat_labor",
    "jordan_dos_labor",
  ];

  return officialSources.includes(slug) ? "official" : "proxy";
}

export function hasAdapterForSource(slug: string): boolean {
  return getIngestorForSource(slug) != null;
}

export type IngestionSourceCategory = "market" | "survey" | "partner" | "govt";

export type IngestionSource = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: IngestionSourceCategory;
  regions: string[];
  license_url: string | null;
  terms_summary: string | null;
  approved_for_commercial: boolean;
  needs_review: boolean;
  update_cadence: "realtime" | "hourly" | "daily" | "weekly" | "manual";
  expected_fields: string[];
  enabled: boolean;
  tier?: IngestionSourceTier;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/**
 * Check if a source is allowed for ingestion.
 * Only enabled + approved_for_commercial sources pass.
 */
export function isSourceAllowedForIngestion(source: IngestionSource): boolean {
  if (!source.enabled) return false;
  if (source.needs_review) return false;
  if (!source.approved_for_commercial) return false;
  return true;
}

/**
 * Expected field names for benchmark normalization.
 */
export const BENCHMARK_EXPECTED_FIELDS = [
  "role",
  "level",
  "location",
  "currency",
  "p10",
  "p25",
  "p50",
  "p75",
  "p90",
  "sample_size",
] as const;
