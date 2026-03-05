import type { IngestionAdapter } from "./types";

const DEFAULT_SPREAD = 0.2;
const DEFAULT_PAGE_SIZE = 100;

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

const ROLE_KEYWORDS: Array<{ keywords: string[]; role: string }> = [
  { keywords: ["software"], role: "Software Engineer" },
  { keywords: ["developer"], role: "Software Engineer" },
  { keywords: ["information", "communication"], role: "Software Engineer" },
  { keywords: ["ict"], role: "Software Engineer" },
  { keywords: ["data"], role: "Data Analyst" },
  { keywords: ["analyst"], role: "Data Analyst" },
  { keywords: ["financial"], role: "Data Analyst" },
  { keywords: ["bank"], role: "Data Analyst" },
  { keywords: ["product"], role: "Product Manager" },
  { keywords: ["professional"], role: "Product Manager" },
  { keywords: ["scientific"], role: "Product Manager" },
  { keywords: ["design"], role: "Product Designer" },
  { keywords: ["security"], role: "Security Engineer" },
  { keywords: ["quality"], role: "QA Engineer" },
  { keywords: ["devops"], role: "DevOps Engineer" },
];

export type OdsAdapterConfig = {
  slug: string;
  endpoint: string;
  location: string;
  currency: string;
  roleFields: string[];
  valueFields: string[];
  yearFields?: string[];
  minYear?: number;
  annualMultiplier?: number;
  sampleSize?: number;
  defaultRole?: string;
  defaultLevel?: string;
  spread?: number;
  pageSize?: number;
  maxPages?: number;
};

export type WorldBankAdapterConfig = {
  slug: string;
  indicatorId: string;
  role: string;
  countries: string;
  annualMultiplier?: number;
  sampleSize?: number;
  level?: string;
  spread?: number;
};

type OdsResponse = {
  total_count?: number;
  results?: Array<Record<string, unknown>>;
};

type WorldBankDataPoint = {
  countryiso3code: string;
  country?: { value?: string };
  date?: string;
  value?: number | null;
};

type WorldBankResponse = [
  { page: number; pages: number; per_page: number; total: number },
  WorldBankDataPoint[] | null,
];

function pickFirstString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function pickFirstNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const parsed = parseNumeric(record[key]);
    if (parsed != null) return parsed;
  }
  return null;
}

function toAnnualComp(value: number, annualMultiplier: number): number {
  let annual = Math.round(value * annualMultiplier);
  // Keep values in a practical DQ-friendly range.
  if (annual < 1_000) annual = Math.round(annual * 2_000);
  if (annual > 2_000_000) annual = 2_000_000;
  return annual;
}

function deriveRole(sourceText: string, fallbackRole: string): string {
  const lower = sourceText.toLowerCase();
  for (const entry of ROLE_KEYWORDS) {
    if (entry.keywords.every((k) => lower.includes(k))) return entry.role;
  }
  return fallbackRole;
}

async function fetchJsonWithRetry(url: string, retries = 2): Promise<unknown | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) continue;
      return (await res.json()) as unknown;
    } catch {
      continue;
    }
  }
  return null;
}

function buildPercentiles(annual: number, spread: number) {
  return {
    p10: Math.round(annual * (1 - spread * 1.3)),
    p25: Math.round(annual * (1 - spread * 0.6)),
    p50: annual,
    p75: Math.round(annual * (1 + spread * 0.6)),
    p90: Math.round(annual * (1 + spread * 1.3)),
  };
}

export function createOdsAdapter(config: OdsAdapterConfig): IngestionAdapter {
  return {
    slug: config.slug,
    async fetch(_sourceId: string): Promise<Record<string, unknown>[]> {
      const rows: Record<string, unknown>[] = [];
      const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE;
      const maxPages = config.maxPages ?? 8;
      const spread = config.spread ?? DEFAULT_SPREAD;
      const defaultLevel = config.defaultLevel ?? "Senior (IC3)";
      const defaultRole = config.defaultRole ?? "Data Analyst";
      const annualMultiplier = config.annualMultiplier ?? 12;

      let offset = 0;
      let totalCount = Number.MAX_SAFE_INTEGER;
      let page = 0;

      while (offset < totalCount && page < maxPages) {
        const url = `${config.endpoint}?limit=${pageSize}&offset=${offset}`;
        const body = (await fetchJsonWithRetry(url)) as OdsResponse | null;
        if (!body) break;

        const results = Array.isArray(body.results) ? body.results : [];
        totalCount = body.total_count ?? results.length;
        if (results.length === 0) break;

        for (const record of results) {
          const yearText = config.yearFields
            ? pickFirstString(record, config.yearFields)
            : null;
          const parsedYear = yearText ? Number.parseInt(yearText, 10) : null;
          if (config.minYear && parsedYear && parsedYear < config.minYear) continue;

          const sourceText =
            pickFirstString(record, config.roleFields) ??
            pickFirstString(record, ["sector", "category", "occupation", "title"]) ??
            "";
          const role = deriveRole(sourceText, defaultRole);
          const value = pickFirstNumber(record, config.valueFields);
          if (value == null || value <= 0) continue;

          const annual = toAnnualComp(value, annualMultiplier);
          const p = buildPercentiles(annual, spread);

          rows.push({
            role,
            level: defaultLevel,
            location: config.location,
            currency: config.currency,
            ...p,
            sample_size: config.sampleSize ?? 30,
          });
        }

        if (results.length < pageSize) break;
        offset += pageSize;
        page++;
      }

      return rows;
    },
  };
}

export function createWorldBankAdapter(config: WorldBankAdapterConfig): IngestionAdapter {
  return {
    slug: config.slug,
    async fetch(_sourceId: string): Promise<Record<string, unknown>[]> {
      const spread = config.spread ?? DEFAULT_SPREAD;
      const annualMultiplier = config.annualMultiplier ?? 1;
      const level = config.level ?? "Senior (IC3)";
      const sampleSize = config.sampleSize ?? 45;
      const url = `https://api.worldbank.org/v2/country/${config.countries}/indicator/${config.indicatorId}?format=json&mrnev=3&per_page=200`;

      const body = (await fetchJsonWithRetry(url)) as WorldBankResponse | null;
      const points = body?.[1] ?? [];
      if (!Array.isArray(points)) return [];

      const rows: Record<string, unknown>[] = [];
      for (const point of points) {
        const raw = point.value;
        if (raw == null || !Number.isFinite(raw) || raw <= 0) continue;
        const annual = toAnnualComp(Number(raw), annualMultiplier);
        const p = buildPercentiles(annual, spread);
        const countryCode = point.countryiso3code ?? "ARE";
        rows.push({
          role: config.role,
          level,
          location: COUNTRY_TO_LOCATION[countryCode] ?? "Dubai",
          currency: COUNTRY_TO_CURRENCY[countryCode] ?? "AED",
          ...p,
          sample_size: sampleSize,
        });
      }

      return rows;
    },
  };
}
