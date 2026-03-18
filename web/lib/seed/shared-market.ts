import { hasAdapterForSource } from "@/lib/ingestion/source-registry";

export type SharedMarketSource = {
  slug: string;
};

const EXCLUDED_DEFAULT_SHARED_MARKET_SOURCE_SLUGS = new Set([
  "worldbank_gcc",
  "wb_mena_gdp_per_capita",
  "bls_oes_usa",
  "jordan_dos_labor",
  "uae_fcsc_workforce_comp",
  "uae_fcsc_public_admin_paid",
  "uae_fcsc_gov_compensation",
  "saudi_gastat_labor",
  "sample_gcc_market",
  "gulf_talent_2024",
]);

export function normalizeRequestedSourceSlugs(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const slugs = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return slugs.length > 0 ? [...new Set(slugs)] : null;
}

export function getDefaultSharedMarketSourceSlugs(
  sources: ReadonlyArray<SharedMarketSource>,
): string[] {
  return [
    ...new Set(
      sources
        .map((source) => source.slug.trim())
        .filter(Boolean)
        .filter((slug) => hasAdapterForSource(slug))
        .filter((slug) => !EXCLUDED_DEFAULT_SHARED_MARKET_SOURCE_SLUGS.has(slug)),
    ),
  ];
}
