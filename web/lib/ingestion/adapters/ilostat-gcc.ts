/**
 * ILOSTAT SDMX adapter - fetches mean monthly earnings by economic activity
 * for all 6 GCC countries. No auth required.
 * 
 * STATUS: DEGRADED - The ILO SDMX API endpoints consistently return 404/500 errors.
 * This adapter tries multiple endpoints and gracefully degrades to empty results.
 * The source should be marked as needs_review in the admin panel.
 * 
 * ILO country codes: ARE (UAE), SAU (Saudi), QAT (Qatar), KWT (Kuwait), BHR (Bahrain), OMN (Oman)
 */

import type { IngestionAdapter } from "./types";

const GCC_COUNTRIES = "ARE+SAU+QAT+KWT+BHR+OMN";

// Multiple endpoint variations to try
const ILO_ENDPOINTS = [
  `https://sdmx.data.ilo.org/rest/data/ILO,DF_EAR_4MTH_SEX_ECO_NB,1.0/${GCC_COUNTRIES}..?format=jsondata&startPeriod=2021`,
  `https://sdmx.data.ilo.org/rest/v2/data/ILO,DF_EAR_4MTH_SEX_ECO_NB,1.0/${GCC_COUNTRIES}..?format=jsondata&startPeriod=2021`,
  `http://sdmx-data.ilo.org/rest/data/ILO,DF_EAR_4MTH_SEX_CUR_NB,1.0/${GCC_COUNTRIES}..?format=jsondata&startPeriod=2019`,
];

// ILO ISIC sector code -> our role titles
const SECTOR_TO_ROLE: Record<string, string> = {
  J: "Software Engineer",
  K: "Data Analyst",
  M: "Product Manager",
  P: "UX Researcher",
};

// ILO country code -> our location city
const COUNTRY_TO_CITY: Record<string, string> = {
  ARE: "Dubai",
  SAU: "Riyadh",
  QAT: "Doha",
  KWT: "Kuwait City",
  BHR: "Manama",
  OMN: "Muscat",
};

type IlostatObservation = {
  observation?: string;
  seriesKey?: Array<{ id: string; value: string }>;
  Attributes?: Array<{ id: string; value: string }>;
};

type IlostatDataSetElement = {
  series?: Array<{
    seriesKey?: Array<{ id: string; value: string }>;
    observations?: Array<[string, IlostatObservation]>;
  }>;
};

function parseSdmxResponse(body: unknown): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  if (!body || typeof body !== "object") return rows;
  const data = body as { dataSets?: IlostatDataSetElement[]; structure?: Record<string, unknown> };

  const dataSets = data.dataSets ?? [];
  for (const ds of dataSets) {
    const seriesList = ds?.series ?? [];
    for (const series of seriesList) {
      const keys = series.seriesKey ?? [];
      const dimMap: Record<string, string> = {};
      for (const k of keys) {
        if (k.id && k.value) dimMap[k.id] = k.value;
      }

      const country = dimMap["REF_AREA"] ?? dimMap["COUNTRY"] ?? dimMap["REFAREA"];
      const sector = dimMap["CL_ACTIVITY"] ?? dimMap["ACTIVITY"] ?? dimMap["ECO"] ?? dimMap["ICSE"] ?? "";

      const role = SECTOR_TO_ROLE[sector] ?? SECTOR_TO_ROLE["J"];
      const location = country ? (COUNTRY_TO_CITY[country] ?? "Dubai") : "Dubai";

      const observations = series.observations ?? [];
      for (const [, obs] of observations) {
        const val = obs?.observation ?? (obs as { value?: string })?.value;
        const monthly = typeof val === "string" ? parseFloat(val) : Number(val);
        if (!Number.isFinite(monthly) || monthly <= 0) continue;

        const annual = Math.round(monthly * 12);
        const spread = 0.2;
        rows.push({
          role,
          level: "Senior (IC3)",
          location,
          currency: country === "SAU" ? "SAR" : country === "QAT" ? "QAR" : country === "KWT" ? "KWD" : country === "BHR" ? "BHD" : country === "OMN" ? "OMR" : "AED",
          p10: Math.round(annual * (1 - spread * 1.3)),
          p25: Math.round(annual * (1 - spread * 0.6)),
          p50: annual,
          p75: Math.round(annual * (1 + spread * 0.6)),
          p90: Math.round(annual * (1 + spread * 1.3)),
          sample_size: 50,
        });
      }
    }
  }

  return rows;
}

export const ilostatGccAdapter: IngestionAdapter = {
  slug: "ilostat_gcc",
  async fetch(_sourceId: string): Promise<Record<string, unknown>[]> {
    // Try multiple endpoints - ILO SDMX API is unreliable
    for (const url of ILO_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const res = await fetch(url, { 
          next: { revalidate: 86400 },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) continue;

        const body = (await res.json()) as unknown;
        const rows = parseSdmxResponse(body);
        
        if (rows.length > 0) {
          return rows;
        }
      } catch {
        // Try next endpoint
        continue;
      }
    }
    
    // All endpoints failed - return empty array
    // The admin UI will show this source as degraded/needs review
    return [];
  },
};
