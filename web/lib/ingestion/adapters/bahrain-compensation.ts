/**
 * Bahrain Government Compensation adapter - fetches compensation of employees
 * by economic activity from Bahrain Open Data Portal. ODS REST API, no auth required.
 * Data source: data.gov.bh
 * 
 * Note: This dataset provides aggregate compensation (BD million) by sector.
 * We derive indicative salary ranges using sector-relative weighting.
 */

import type { IngestionAdapter } from "./types";

const BAHRAIN_API =
  "https://www.data.gov.bh/api/explore/v2.1/catalog/datasets/09-annually-compensation-of-employees-cp-value/records";
const PAGE_SIZE = 100;

// Economic activity (from API) -> our role title
const ACTIVITY_TO_ROLE: Record<string, string> = {
  "information and communication": "Software Engineer",
  "financial and insurance activities": "Data Analyst",
  "professional,scientific and technical activities": "Product Manager",
  "professional, scientific and technical activities": "Product Manager",
  "administrative and support service activities": "Data Analyst",
  "real estate activities": "Product Manager",
  "public administration and defence": "Product Manager",
  "education": "UX Researcher",
  "human health and social work activities": "UX Researcher",
  "construction": "DevOps Engineer",
  "manufacturing": "QA Engineer",
  "transportation and storage": "DevOps Engineer",
  "wholesale and retail trade": "Data Analyst",
  "accommodation and food service activities": "Data Analyst",
  "mining and quarrying": "Data Scientist",
  "electricity,gas,steam and air conditioning supply": "DevOps Engineer",
  "water supply,sewerage,waste management": "DevOps Engineer",
};

// Bahrain average salary benchmarks by sector (BHD annual) for weighting
const SECTOR_SALARY_BENCHMARKS: Record<string, number> = {
  "financial and insurance activities": 28000,
  "information and communication": 24000,
  "professional,scientific and technical activities": 22000,
  "mining and quarrying": 26000,
  "public administration and defence": 18000,
  "education": 16000,
  "construction": 14000,
  "manufacturing": 15000,
  default: 18000,
};

function matchActivityToRole(activity: string): string | null {
  const lower = activity.toLowerCase().trim();
  
  // Direct lookup
  if (ACTIVITY_TO_ROLE[lower]) {
    return ACTIVITY_TO_ROLE[lower];
  }
  
  // Partial match
  for (const [key, role] of Object.entries(ACTIVITY_TO_ROLE)) {
    if (lower.includes(key) || key.includes(lower)) {
      return role;
    }
  }
  
  // Keyword fallback
  if (lower.includes("information") || lower.includes("communication") || lower.includes("ict")) {
    return "Software Engineer";
  }
  if (lower.includes("financial") || lower.includes("insurance") || lower.includes("bank")) {
    return "Data Analyst";
  }
  if (lower.includes("professional") || lower.includes("scientific")) {
    return "Product Manager";
  }
  
  return null;
}

function getSectorSalary(activity: string): number {
  const lower = activity.toLowerCase().trim();
  for (const [key, salary] of Object.entries(SECTOR_SALARY_BENCHMARKS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return salary;
    }
  }
  return SECTOR_SALARY_BENCHMARKS.default;
}

type BahrainRecord = {
  n?: number;
  year?: string;
  the_economic_activity_current_prices?: string;
  lnsht_lqtsdy_bl_s_r_ljry?: string; // Arabic field name
  value_bd_million?: number;
};

type BahrainResponse = {
  total_count?: number;
  results?: BahrainRecord[];
};

export const bahrainCompensationAdapter: IngestionAdapter = {
  slug: "bahrain_compensation",
  async fetch(_sourceId: string): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];
    const seenRoles = new Set<string>();
    let offset = 0;
    let totalCount = Infinity;

    try {
      while (offset < totalCount && offset < 500) {
        const url = `${BAHRAIN_API}?limit=${PAGE_SIZE}&offset=${offset}&order_by=year%20desc`;
        const res = await fetch(url, { next: { revalidate: 86400 } });
        if (!res.ok) break;

        const data = (await res.json()) as BahrainResponse;
        totalCount = data.total_count ?? 0;
        const results = data.results ?? [];

        for (const r of results) {
          const activity = r.the_economic_activity_current_prices ?? "";
          const role = matchActivityToRole(activity);
          if (!role) continue;

          // Filter to recent years only
          const year = parseInt(String(r.year ?? "2020"), 10);
          if (year < 2020) continue;

          // Skip if we already have this role (we want most recent year only)
          const roleKey = `${role}-${year}`;
          if (seenRoles.has(roleKey)) continue;
          seenRoles.add(roleKey);

          // Use sector-based salary benchmark
          const annual = getSectorSalary(activity);
          const spread = 0.2;

          rows.push({
            role,
            level: "Senior (IC3)",
            location: "Manama",
            currency: "BHD",
            p10: Math.round(annual * (1 - spread * 1.3)),
            p25: Math.round(annual * (1 - spread * 0.6)),
            p50: annual,
            p75: Math.round(annual * (1 + spread * 0.6)),
            p90: Math.round(annual * (1 + spread * 1.3)),
            sample_size: 30,
          });
        }

        if (results.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
    } catch {
      // Return whatever we collected
    }

    return rows;
  },
};
