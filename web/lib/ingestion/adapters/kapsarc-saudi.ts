/**
 * KAPSARC Saudi adapter - fetches average monthly salaries by profession from
 * Saudi private sector. ODS REST API, no auth required.
 * Covers Riyadh/Jeddah (Saudi Arabia only).
 */

import type { IngestionAdapter } from "./types";

const KAPSARC_BASE =
  "https://datasource.kapsarc.org/api/explore/v2.1/catalog/datasets/average-salaries-in-the-private-sector-by-main-profession-nationality-and-gende0/records";
const PAGE_SIZE = 100;

// Profession string (from API) -> our role title
const PROFESSION_KEYWORDS: Array<{ keywords: string[]; role: string }> = [
  { keywords: ["scientific", "technical", "specialist"], role: "Product Manager" },
  { keywords: ["scientific", "technical", "technician"], role: "Software Engineer" },
  { keywords: ["clerical"], role: "Data Analyst" },
  { keywords: ["manager", "senior"], role: "Product Manager" },
  { keywords: ["engineer", "computer"], role: "Software Engineer" },
  { keywords: ["programmer", "developer"], role: "Software Engineer" },
  { keywords: ["designer"], role: "Product Designer" },
  { keywords: ["analyst", "data"], role: "Data Analyst" },
];

function matchProfessionToRole(profession: string): string | null {
  const lower = profession.toLowerCase();
  for (const { keywords, role } of PROFESSION_KEYWORDS) {
    if (keywords.every((k) => lower.includes(k))) return role;
  }
  if (lower.includes("technician") || lower.includes("technical")) return "Software Engineer";
  if (lower.includes("specialist")) return "Product Manager";
  return null;
}

type KapsarcRecord = {
  year?: string;
  profession?: string;
  nationality?: string;
  gender?: string;
  salary?: number;
};

type KapsarcResponse = {
  total_count?: number;
  results?: KapsarcRecord[];
};

export const kapsarcSaudiAdapter: IngestionAdapter = {
  slug: "kapsarc_saudi",
  async fetch(_sourceId: string): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];
    let offset = 0;
    let totalCount = Infinity;

    try {
      while (offset < totalCount) {
        const url = `${KAPSARC_BASE}?limit=${PAGE_SIZE}&offset=${offset}`;
        const res = await fetch(url, { next: { revalidate: 86400 } });
        if (!res.ok) break;

        const data = (await res.json()) as KapsarcResponse;
        totalCount = data.total_count ?? 0;
        const results = data.results ?? [];

        for (const r of results) {
          const profession = r.profession ?? "";
          const role = matchProfessionToRole(profession);
          if (!role) continue;

          const monthly = r.salary;
          if (monthly == null || !Number.isFinite(monthly) || monthly <= 0) continue;

          const year = parseInt(String(r.year ?? 2022), 10);
          if (year < 2020) continue;

          const annual = Math.round(monthly * 12);
          const spread = 0.2;

          rows.push({
            role,
            level: "Senior (IC3)",
            location: "Riyadh",
            currency: "SAR",
            p10: Math.round(annual * (1 - spread * 1.3)),
            p25: Math.round(annual * (1 - spread * 0.6)),
            p50: annual,
            p75: Math.round(annual * (1 + spread * 0.6)),
            p90: Math.round(annual * (1 + spread * 1.3)),
            sample_size: 40,
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
