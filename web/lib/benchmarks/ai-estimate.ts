/**
 * AI Benchmark Advisory via GPT-5.3
 *
 * Runs alongside Qeemly market data to provide an AI compensation analyst
 * perspective. Generates percentile estimates for all levels in a single call,
 * cached by role/location/industry/companySize so repeated level lookups are
 * instant.
 */

import { getOpenAIClient, getBenchmarkModel } from "@/lib/ai/openai";
import { unstable_cache } from "next/cache";
import type { BenchmarkDetailAiBriefing } from "@/lib/benchmarks/detail-ai";
import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AiLevelEstimate = {
  levelId: string;
  levelName: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
};

export type AiBenchmarkAdvisory = {
  levels: AiLevelEstimate[];
  currency: string;
  payPeriod: "annual";
  reasoning: string;
  marketContext: string;
  confidenceNote: string;
  industryInsight: string | null;
  companySizeInsight: string | null;
  detailBriefing: BenchmarkDetailAiBriefing;
};

// ---------------------------------------------------------------------------
// Cache: keyed by "role::location::industry::companySize"
// ---------------------------------------------------------------------------

type CacheEntry = { data: AiBenchmarkAdvisory; createdAt: number };

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<AiBenchmarkAdvisory | null>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const SHARED_CACHE_TTL_SECONDS = 5 * 60;
const AI_ADVISORY_SCHEMA_VERSION = "detail-numbers-v2";

const getSharedAiBenchmarkAdvisory = unstable_cache(
  async (
    roleId: string,
    locationId: string,
    industry: string | null,
    companySize: string | null,
  ) => callGpt(roleId, locationId, industry, companySize),
  [AI_ADVISORY_SCHEMA_VERSION, "shared"],
  { revalidate: SHARED_CACHE_TTL_SECONDS },
);

function cacheKey(
  roleId: string,
  locationId: string,
  industry: string | null,
  companySize: string | null,
): string {
  return `${AI_ADVISORY_SCHEMA_VERSION}::${roleId}::${locationId}::${industry ?? ""}::${companySize ?? ""}`;
}

export function invalidateAiBenchmarkCache(): void {
  cache.clear();
  inFlight.clear();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the AI advisory for a specific level within a role/location combo.
 * Generates all levels in one LLM call, then caches and returns the
 * requested level.
 */
export async function getAiBenchmarkForLevel(
  roleId: string,
  locationId: string,
  levelId: string,
  filters: { industry?: string | null; companySize?: string | null } = {},
): Promise<{ advisory: AiBenchmarkAdvisory; level: AiLevelEstimate } | null> {
  const advisory = await getAiBenchmarkAdvisory(
    roleId,
    locationId,
    filters.industry ?? null,
    filters.companySize ?? null,
  );
  if (!advisory) return null;

  const level = advisory.levels.find((l) => l.levelId === levelId);
  if (!level) return null;

  return { advisory, level };
}

/**
 * Full advisory across all levels for a role/location (cached).
 */
export async function getAiBenchmarkAdvisory(
  roleId: string,
  locationId: string,
  industry: string | null,
  companySize: string | null,
): Promise<AiBenchmarkAdvisory | null> {
  const key = cacheKey(roleId, locationId, industry, companySize);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
    return cached.data;
  }

  const inFlightRequest = inFlight.get(key);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = (async () => {
    try {
      const advisory = await getSharedAiBenchmarkAdvisory(
        roleId,
        locationId,
        industry,
        companySize,
      );
      cache.set(key, { data: advisory, createdAt: Date.now() });
      return advisory;
    } catch (error) {
      console.error("[ai-estimate] GPT benchmark call failed:", error);
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, request);
  return request;
}

// ---------------------------------------------------------------------------
// GPT call
// ---------------------------------------------------------------------------

const JSON_SCHEMA = {
  name: "compensation_advisory",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      levels: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            levelId: { type: "string" as const },
            levelName: { type: "string" as const },
            p10: { type: "number" as const },
            p25: { type: "number" as const },
            p50: { type: "number" as const },
            p75: { type: "number" as const },
            p90: { type: "number" as const },
          },
          required: ["levelId", "levelName", "p10", "p25", "p50", "p75", "p90"],
          additionalProperties: false,
        },
      },
      currency: { type: "string" as const },
      payPeriod: { type: "string" as const, enum: ["annual"] },
      reasoning: { type: "string" as const },
      marketContext: { type: "string" as const },
      confidenceNote: { type: "string" as const },
      industryInsight: { type: ["string", "null"] as const },
      companySizeInsight: { type: ["string", "null"] as const },
      detailBriefing: {
        type: "object" as const,
        properties: {
          executiveBriefing: { type: "string" as const },
          hiringSignal: { type: "string" as const },
          negotiationPosture: { type: "string" as const },
          views: {
            type: "object" as const,
            properties: {
              levelTable: sectionSchema(),
              aiInsights: sectionSchema(),
              trend: sectionSchema(),
              salaryBreakdown: sectionSchema(),
              industry: sectionSchema(),
              companySize: sectionSchema(),
              geoComparison: sectionSchema(),
              compMix: sectionSchema(),
              offerBuilder: sectionSchema(),
            },
            required: [
              "levelTable",
              "aiInsights",
              "trend",
              "salaryBreakdown",
              "industry",
              "companySize",
              "geoComparison",
              "compMix",
              "offerBuilder",
            ],
            additionalProperties: false,
          },
        },
        required: ["executiveBriefing", "hiringSignal", "negotiationPosture", "views"],
        additionalProperties: false,
      },
    },
    required: [
      "levels",
      "currency",
      "payPeriod",
      "reasoning",
      "marketContext",
      "confidenceNote",
      "industryInsight",
      "companySizeInsight",
      "detailBriefing",
    ],
    additionalProperties: false,
  },
};

function sectionSchema() {
  return {
    type: "object" as const,
    properties: {
      summary: { type: "string" as const },
      action: { type: ["string", "null"] as const },
      packageBreakdown: {
        type: ["object", "null"] as const,
        properties: {
          basicSalaryPct: { type: "number" as const },
          housingPct: { type: "number" as const },
          transportPct: { type: "number" as const },
          otherAllowancesPct: { type: "number" as const },
        },
        required: ["basicSalaryPct", "housingPct", "transportPct", "otherAllowancesPct"],
        additionalProperties: false,
      },
      compensationMix: {
        type: ["object", "null"] as const,
        properties: {
          basicSalaryPct: { type: "number" as const },
          housingPct: { type: "number" as const },
          transportPct: { type: "number" as const },
          otherAllowancesPct: { type: "number" as const },
        },
        required: ["basicSalaryPct", "housingPct", "transportPct", "otherAllowancesPct"],
        additionalProperties: false,
      },
      levelBands: {
        type: ["array", "null"] as const,
        items: {
          type: "object" as const,
          properties: {
            levelId: { type: "string" as const },
            levelName: { type: "string" as const },
            p10: { type: "number" as const },
            p25: { type: "number" as const },
            p50: { type: "number" as const },
            p75: { type: "number" as const },
            p90: { type: "number" as const },
          },
          required: ["levelId", "levelName", "p10", "p25", "p50", "p75", "p90"],
          additionalProperties: false,
        },
      },
      comparisonPoints: {
        type: ["array", "null"] as const,
        items: {
          type: "object" as const,
          properties: {
            id: { type: "string" as const },
            label: { type: "string" as const },
            median: { type: "number" as const },
            currency: { type: ["string", "null"] as const },
            sampleSize: { type: ["number", "null"] as const },
            yoyChange: { type: ["number", "null"] as const },
            relativeValue: { type: ["number", "null"] as const },
          },
          required: ["id", "label", "median", "currency", "sampleSize", "yoyChange", "relativeValue"],
          additionalProperties: false,
        },
      },
      trendPoints: {
        type: ["array", "null"] as const,
        items: {
          type: "object" as const,
          properties: {
            month: { type: "string" as const },
            p25: { type: "number" as const },
            p50: { type: "number" as const },
            p75: { type: "number" as const },
          },
          required: ["month", "p25", "p50", "p75"],
          additionalProperties: false,
        },
      },
    },
    required: [
      "summary",
      "action",
      "packageBreakdown",
      "compensationMix",
      "levelBands",
      "comparisonPoints",
      "trendPoints",
    ],
    additionalProperties: false,
  };
}

function buildPrompt(
  roleId: string,
  locationId: string,
  industry: string | null,
  companySize: string | null,
): string {
  const role = ROLES.find((r) => r.id === roleId);
  const location = LOCATIONS.find((l) => l.id === locationId);

  const roleTitle = role?.title ?? roleId;
  const city = location?.city ?? locationId;
  const country = location?.country ?? "";
  const currency = location?.currency ?? "AED";

  const levelList = LEVELS
    .map((l) => `  - ${l.id}: ${l.name}`)
    .join("\n");

  const industryLine = industry ? `Industry: ${industry}` : "Industry: All industries (broad market)";
  const sizeLine = companySize
    ? `Company size: ${companySize} employees`
    : "Company size: All sizes (broad market)";

  return `You are a senior compensation and rewards analyst with deep expertise in GCC (Gulf Cooperation Council) labour markets. You have current knowledge of salary benchmarks across the UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, and Oman for technology, finance, and professional services roles.

Provide annual base salary compensation benchmarks in ${currency} for the following role and location:

Role: ${roleTitle} (${role?.family ?? "General"})
Location: ${city}, ${country}
${industryLine}
${sizeLine}

Generate percentile estimates (p10, p25, p50, p75, p90) for each of these seniority levels:
${levelList}

Guidelines:
- All figures must be annual base salary in ${currency}.
- Account for local cost of living, demand/supply dynamics, and regulatory context (e.g. Emiratisation premiums in UAE, Saudisation in KSA).
- If an industry is specified, adjust for that industry's typical premium or discount relative to the broad market.
- If a company size is specified, adjust accordingly (smaller companies often pay less base but may offer more equity; larger companies have more structured bands).
- p10 represents entry-level for the band, p90 represents top-of-market premiums.
- Ensure realistic gaps between levels: each step up should reflect genuine market progression.
- Provide concise reasoning, market context, and a confidence note on data reliability.
- If industry or company size filters were provided, include targeted insights for those segments.
- Also return one shared AI detail briefing for the benchmark drilldown views.
- Each view summary must interpret the same market story from a different angle without contradicting the percentile estimates.
- Keep each summary concise, specific, and useful for compensation decision-making.
- For the offer builder section, include a realistic package breakdown percentage split across basic salary, housing, transport, and other allowances that totals 100.
- For the compensation mix section, include a realistic component mix percentage split across the same four categories that totals 100.
- For the level table section, include levelBands for nearby seniority levels using the same annual-market story as the first screen.
- For the offer builder section, also include levelBands for the adjacent-level anchor chart so the plot uses AI numbers instead of a separate market fetch.
- For the industry section, include comparisonPoints with up to 5 industry medians in ${currency}; put the requested industry first when present.
- For the company size section, include comparisonPoints with up to 5 company-size medians in ${currency}; put the requested size first when present.
- For the geo comparison section, include comparisonPoints for GCC locations. Use each location's local currency in the currency field, median in that local currency, and relativeValue as the same median normalized to AED for sorting and bar widths.
- For the trend section, include 12 monthly trendPoints for p25, p50, and p75 in ${currency}, ending with the current month-equivalent estimate.
- For the salary breakdown section, include a realistic package breakdown percentage split across basic salary, housing, transport, and other allowances that totals 100.
- Actions should be short, direct recommendations. Use null only if no action is appropriate.`;
}

async function callGpt(
  roleId: string,
  locationId: string,
  industry: string | null,
  companySize: string | null,
): Promise<AiBenchmarkAdvisory> {
  const client = getOpenAIClient();
  const model = getBenchmarkModel();

  const response = await client.chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are a compensation benchmarking engine. Respond only with the requested JSON schema. Do not include markdown formatting.",
      },
      {
        role: "user",
        content: buildPrompt(roleId, locationId, industry, companySize),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: JSON_SCHEMA,
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty GPT response");
  }

  const parsed = JSON.parse(content) as AiBenchmarkAdvisory;

  if (!Array.isArray(parsed.levels) || parsed.levels.length === 0) {
    throw new Error("GPT returned no level estimates");
  }

  return parsed;
}
