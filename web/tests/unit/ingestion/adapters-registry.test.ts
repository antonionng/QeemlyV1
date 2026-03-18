import { describe, expect, it } from "vitest";
import { getAllAdapterSlugs } from "@/lib/ingestion/adapters";
import {
  REGISTERED_ADAPTER_SLUGS,
  getSourceTier,
  getSourceHealthStatus,
  hasAdapterForSource,
} from "@/lib/ingestion/source-registry";

const NEW_SOURCE_SLUGS = [
  "sample_gcc_market",
  "gulf_talent_2024",
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
  "wb_gcc_unemployment",
  "wb_gcc_wage_workers",
  "wb_gcc_gdp_per_capita",
  "wb_mena_gdp_per_capita",
  "wb_gcc_labor_participation",
  "wb_gcc_employed_services",
  "wb_gcc_employed_industry",
] as const;

describe("adapter registry coverage", () => {
  it("contains the 20 newly added live source slugs", () => {
    const slugs = getAllAdapterSlugs();
    for (const slug of NEW_SOURCE_SLUGS) {
      expect(slugs).toContain(slug);
    }
  });

  it("keeps source registry aligned with available adapters", () => {
    for (const slug of REGISTERED_ADAPTER_SLUGS) {
      expect(hasAdapterForSource(slug)).toBe(true);
    }
  });

  it("marks accessible source slugs as live and blocked UAE feeds as degraded", () => {
    for (const slug of NEW_SOURCE_SLUGS) {
      if (
        slug === "uae_fcsc_workforce_comp" ||
        slug === "uae_fcsc_public_admin_paid" ||
        slug === "uae_fcsc_gov_compensation" ||
        slug === "saudi_gastat_labor"
      ) {
        expect(getSourceHealthStatus(slug)).toBe("degraded");
      } else {
        expect(getSourceHealthStatus(slug)).toBe("live");
      }
    }
    expect(getSourceHealthStatus("ilostat_gcc")).toBe("degraded");
  });

  it("classifies GCC official sources separately from proxy gap-fill sources", () => {
    expect(getSourceTier("uae_fcsc_workforce_comp")).toBe("official");
    expect(getSourceTier("wb_gcc_wage_workers")).toBe("proxy");
    expect(getSourceTier("worldbank_gcc")).toBe("proxy");
  });
});
