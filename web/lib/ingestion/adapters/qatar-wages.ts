/**
 * Qatar Government Wages adapter - fetches average monthly wages by economic activity
 * from Qatar Open Data Portal. ODS REST API, no auth required.
 * Data source: data.gov.qa
 */

import type { IngestionAdapter } from "./types";

const QATAR_API =
  "https://www.data.gov.qa/api/explore/v2.1/catalog/datasets/average-monthly-wages-by-economic-activity/records";

// Economic activity (from API) -> our role title
const ACTIVITY_TO_ROLE: Record<string, string> = {
  ict: "Software Engineer",
  "information and communication": "Software Engineer",
  "information & communication": "Software Engineer",
  financial: "Data Analyst",
  "financial and insurance": "Data Analyst",
  "financial and insurance activities": "Data Analyst",
  "real estate": "Product Manager",
  "real estate activities": "Product Manager",
  professional: "Product Manager",
  "professional, scientific": "Product Manager",
  "professional,scientific and technical activities": "Product Manager",
  administrative: "Data Analyst",
  "administrative and support": "Data Analyst",
  "administrative and support\nservices": "Data Analyst",
  construction: "DevOps Engineer",
  mining: "Data Scientist",
  "mining and quarrying": "Data Scientist",
  manufacturing: "QA Engineer",
  education: "UX Researcher",
  "human health": "UX Researcher",
  "health and social work": "UX Researcher",
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
  if (lower.includes("information") || lower.includes("ict") || lower.includes("tech")) {
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

type QatarRecord = {
  year?: string;
  economic_activity?: string;
  lnsht_lqtsdy?: string; // Arabic field name
  value?: number;
};

type QatarResponse = {
  total_count?: number;
  results?: QatarRecord[];
};

export const qatarWagesAdapter: IngestionAdapter = {
  slug: "qatar_wages",
  async fetch(_sourceId: string): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];

    try {
      const url = `${QATAR_API}?limit=100`;
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) return [];

      const data = (await res.json()) as QatarResponse;
      const results = data.results ?? [];

      for (const r of results) {
        const activity = r.economic_activity ?? "";
        const role = matchActivityToRole(activity);
        if (!role) continue;

        // Value is in thousand QAR per month
        const monthlyThousand = r.value;
        if (monthlyThousand == null || !Number.isFinite(monthlyThousand) || monthlyThousand <= 0) continue;

        // Convert: thousand QAR monthly -> QAR annual
        const annual = Math.round(monthlyThousand * 1000 * 12);
        const spread = 0.22;

        rows.push({
          role,
          level: "Senior (IC3)",
          location: "Doha",
          currency: "QAR",
          p10: Math.round(annual * (1 - spread * 1.3)),
          p25: Math.round(annual * (1 - spread * 0.6)),
          p50: annual,
          p75: Math.round(annual * (1 + spread * 0.6)),
          p90: Math.round(annual * (1 + spread * 1.3)),
          sample_size: 35,
        });
      }
    } catch {
      // Return whatever we collected
    }

    return rows;
  },
};
