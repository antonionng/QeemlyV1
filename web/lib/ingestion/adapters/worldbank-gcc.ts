/**
 * World Bank GCC Macro Indicators adapter - fetches economic context data
 * for all 6 GCC countries. No auth required.
 * 
 * Indicators:
 * - NY.GDP.PCAP.CD: GDP per capita (current US$)
 * - SL.UEM.TOTL.ZS: Unemployment rate (% of total labor force)
 * - SL.TLF.TOTL.IN: Labor force total
 * - SL.EMP.WORK.ZS: Wage and salaried workers (% of total employment)
 * 
 * Note: This is macro context data, not salary benchmarks. Output is marked
 * with a special flag for the normalizer to handle appropriately.
 */

import type { IngestionAdapter } from "./types";

const WB_BASE = "https://api.worldbank.org/v2";
const GCC_COUNTRIES = "QAT;BHR;OMN;SAU;ARE;KWT";

const INDICATORS = [
  { id: "NY.GDP.PCAP.CD", name: "GDP per capita (USD)" },
  { id: "SL.UEM.TOTL.ZS", name: "Unemployment rate (%)" },
  { id: "SL.TLF.TOTL.IN", name: "Labor force total" },
  { id: "SL.EMP.WORK.ZS", name: "Wage workers (%)" },
];

const COUNTRY_TO_LOCATION: Record<string, string> = {
  ARE: "Dubai",
  SAU: "Riyadh",
  QAT: "Doha",
  KWT: "Kuwait City",
  BHR: "Manama",
  OMN: "Muscat",
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  ARE: "AED",
  SAU: "SAR",
  QAT: "QAR",
  KWT: "KWD",
  BHR: "BHD",
  OMN: "OMR",
};

type WBDataPoint = {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
};

type WBResponse = [
  { page: number; pages: number; per_page: number; total: number },
  WBDataPoint[] | null
];

export const worldbankGccAdapter: IngestionAdapter = {
  slug: "worldbank_gcc",
  async fetch(_sourceId: string): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];

    try {
      for (const indicator of INDICATORS) {
        const url = `${WB_BASE}/country/${GCC_COUNTRIES}/indicator/${indicator.id}?format=json&mrnev=3&per_page=100`;
        const res = await fetch(url, { next: { revalidate: 86400 } });
        if (!res.ok) continue;

        const data = (await res.json()) as WBResponse;
        const dataPoints = data[1] ?? [];

        for (const dp of dataPoints) {
          if (dp.value === null) continue;

          const location = COUNTRY_TO_LOCATION[dp.countryiso3code] ?? "Dubai";
          const currency = COUNTRY_TO_CURRENCY[dp.countryiso3code] ?? "USD";

          rows.push({
            role: "__macro_indicator__",
            level: "__macro__",
            location,
            currency,
            indicator_id: indicator.id,
            indicator_name: indicator.name,
            country: dp.country.value,
            country_code: dp.countryiso3code,
            year: dp.date,
            value: dp.value,
            p10: 0,
            p25: 0,
            p50: 0,
            p75: 0,
            p90: 0,
            sample_size: null,
            is_macro_data: true,
          });
        }
      }
    } catch {
      // Return whatever we collected
    }

    return rows;
  },
};
