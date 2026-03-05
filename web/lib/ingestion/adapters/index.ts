/**
 * Ingestion adapters - one per source type.
 * Each adapter implements fetch(sourceId) -> raw rows.
 */

import type { IngestionAdapter } from "./types";
import { ilostatGccAdapter } from "./ilostat-gcc";
import { kapsarcSaudiAdapter } from "./kapsarc-saudi";
import { qatarWagesAdapter } from "./qatar-wages";
import { bahrainCompensationAdapter } from "./bahrain-compensation";
import { worldbankGccAdapter } from "./worldbank-gcc";
import { blsUsaAdapter } from "./bls-usa";
import { uaeFcscWorkforceCompAdapter } from "./uae-fcsc-workforce-comp";
import { uaeFcscPublicAdminPaidAdapter } from "./uae-fcsc-public-admin-paid";
import { uaeFcscGovCompensationAdapter } from "./uae-fcsc-gov-compensation";
import { omanNcsiWagesAdapter } from "./oman-ncsi-wages";
import { omanLabourPrivateAdapter } from "./oman-labour-private";
import { omanLabourPublicAdapter } from "./oman-labour-public";
import { qatarLaborForceSectorAdapter } from "./qatar-labor-force-sector";
import { qatarInactivePopulationAdapter } from "./qatar-inactive-population";
import { bahrainLmraWorkPermitsAdapter } from "./bahrain-lmra-work-permits";
import { bahrainLaborMarketAdapter } from "./bahrain-labor-market";
import { kuwaitOpenLaborAdapter } from "./kuwait-open-labor";
import { saudiGastatLaborAdapter } from "./saudi-gastat-labor";
import { jordanDosLaborAdapter } from "./jordan-dos-labor";
import { wbGccUnemploymentAdapter } from "./wb-gcc-unemployment";
import { wbGccWageWorkersAdapter } from "./wb-gcc-wage-workers";
import { wbGccGdpPerCapitaAdapter } from "./wb-gcc-gdp-per-capita";
import { wbMenaGdpPerCapitaAdapter } from "./wb-mena-gdp-per-capita";
import { wbGccLaborParticipationAdapter } from "./wb-gcc-labor-participation";
import { wbGccEmployedServicesAdapter } from "./wb-gcc-employed-services";
import { wbGccEmployedIndustryAdapter } from "./wb-gcc-employed-industry";

const adapters: Record<string, IngestionAdapter> = {
  // Live government APIs - GCC
  kapsarc_saudi: kapsarcSaudiAdapter,
  qatar_wages: qatarWagesAdapter,
  bahrain_compensation: bahrainCompensationAdapter,
  uae_fcsc_workforce_comp: uaeFcscWorkforceCompAdapter,
  uae_fcsc_public_admin_paid: uaeFcscPublicAdminPaidAdapter,
  uae_fcsc_gov_compensation: uaeFcscGovCompensationAdapter,
  oman_ncsi_wages: omanNcsiWagesAdapter,
  oman_labour_private: omanLabourPrivateAdapter,
  oman_labour_public: omanLabourPublicAdapter,
  qatar_labor_force_sector: qatarLaborForceSectorAdapter,
  qatar_inactive_population: qatarInactivePopulationAdapter,
  bahrain_lmra_work_permits: bahrainLmraWorkPermitsAdapter,
  bahrain_labor_market: bahrainLaborMarketAdapter,
  kuwait_open_labor: kuwaitOpenLaborAdapter,
  saudi_gastat_labor: saudiGastatLaborAdapter,
  jordan_dos_labor: jordanDosLaborAdapter,
  // Live international APIs
  worldbank_gcc: worldbankGccAdapter,
  bls_oes_usa: blsUsaAdapter,
  wb_gcc_unemployment: wbGccUnemploymentAdapter,
  wb_gcc_wage_workers: wbGccWageWorkersAdapter,
  wb_gcc_gdp_per_capita: wbGccGdpPerCapitaAdapter,
  wb_mena_gdp_per_capita: wbMenaGdpPerCapitaAdapter,
  wb_gcc_labor_participation: wbGccLaborParticipationAdapter,
  wb_gcc_employed_services: wbGccEmployedServicesAdapter,
  wb_gcc_employed_industry: wbGccEmployedIndustryAdapter,
  // Degraded - ILO SDMX API unreliable
  ilostat_gcc: ilostatGccAdapter,
};

export function getIngestorForSource(sourceSlug: string): IngestionAdapter | null {
  return adapters[sourceSlug] ?? null;
}

export function getAllAdapterSlugs(): string[] {
  return Object.keys(adapters);
}
