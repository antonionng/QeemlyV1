import { getOpenAIClient, getAdvisoryModel } from "@/lib/ai/openai";
import type { CompApproach, RelocationResult } from "@/lib/relocation/calculator";

export type RelocationAdvisoryRequest = {
  homeCityId: string;
  targetCityId: string;
  baseSalary: number;
  compApproach: CompApproach;
  hybridCap?: number;
  rentOverride?: number;
  roleId: string;
  levelId: string;
};

export type RelocationPolicyContext = {
  industry: string | null;
  companySize: string | null;
  targetPercentile: number | null;
  compSplitBasicPct: number | null;
  compSplitHousingPct: number | null;
  compSplitTransportPct: number | null;
  compSplitOtherPct: number | null;
};

export type RelocationBenchmarkContext = {
  roleId: string;
  levelId: string;
  locationId: string;
  currency: string;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sampleSize: number;
  benchmarkSource: string;
};

export type RelocationAiAdvisory = {
  summary: string;
  recommendationHeadline: string;
  recommendedSalary: number;
  recommendedRange: {
    min: number;
    max: number;
  };
  rationale: string;
  risks: string[];
  policyNotes: string[];
  supportSuggestions: string[];
  sourceContext: {
    benchmarkSource: string | null;
    targetPercentile: number | null;
  };
};

type RelocationAiGenerationInput = {
  request: RelocationAdvisoryRequest;
  deterministicResult: RelocationResult;
  policyContext: RelocationPolicyContext;
  benchmarkContext: RelocationBenchmarkContext | null;
};

type CacheEntry = {
  value: RelocationAiAdvisory | null;
  createdAt: number;
};

const advisoryCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;
const RELOCATION_AI_SCHEMA_VERSION = "relocation-ai-v1";

export async function getRelocationAiAdvisory(
  input: RelocationAiGenerationInput,
): Promise<RelocationAiAdvisory | null> {
  const cacheKey = buildCacheKey(input);
  const cached = advisoryCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
    return cached.value;
  }

  try {
    const advisory = await callRelocationAdvisoryModel(input);
    advisoryCache.set(cacheKey, {
      value: advisory,
      createdAt: Date.now(),
    });
    return advisory;
  } catch (error) {
    console.error("[relocation-ai] advisory generation failed:", error);
    advisoryCache.set(cacheKey, {
      value: null,
      createdAt: Date.now(),
    });
    return null;
  }
}

export function invalidateRelocationAiCache() {
  advisoryCache.clear();
}

function buildCacheKey(input: RelocationAiGenerationInput) {
  return JSON.stringify({
    v: RELOCATION_AI_SCHEMA_VERSION,
    request: input.request,
    deterministicResult: {
      recommendedSalary: input.deterministicResult.recommendedSalary,
      recommendedRange: input.deterministicResult.recommendedRange,
      purchasingPowerSalary: input.deterministicResult.purchasingPowerSalary,
      localMarketSalary: input.deterministicResult.localMarketSalary,
      colRatio: input.deterministicResult.colRatio,
    },
    policyContext: input.policyContext,
    benchmarkContext: input.benchmarkContext,
  });
}

const JSON_SCHEMA = {
  name: "relocation_advisory",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      summary: { type: "string" as const },
      recommendationHeadline: { type: "string" as const },
      recommendedSalary: { type: "number" as const },
      recommendedRange: {
        type: "object" as const,
        properties: {
          min: { type: "number" as const },
          max: { type: "number" as const },
        },
        required: ["min", "max"],
        additionalProperties: false,
      },
      rationale: { type: "string" as const },
      risks: {
        type: "array" as const,
        items: { type: "string" as const },
      },
      policyNotes: {
        type: "array" as const,
        items: { type: "string" as const },
      },
      supportSuggestions: {
        type: "array" as const,
        items: { type: "string" as const },
      },
      sourceContext: {
        type: "object" as const,
        properties: {
          benchmarkSource: { type: ["string", "null"] as const },
          targetPercentile: { type: ["number", "null"] as const },
        },
        required: ["benchmarkSource", "targetPercentile"],
        additionalProperties: false,
      },
    },
    required: [
      "summary",
      "recommendationHeadline",
      "recommendedSalary",
      "recommendedRange",
      "rationale",
      "risks",
      "policyNotes",
      "supportSuggestions",
      "sourceContext",
    ],
    additionalProperties: false,
  },
};

function buildPrompt(input: RelocationAiGenerationInput) {
  const { request, deterministicResult, policyContext, benchmarkContext } = input;
  return `You are a GCC compensation and mobility advisor.

Generate a relocation compensation recommendation in annual AED for this move.

Relocation inputs:
- Home city: ${deterministicResult.homeCity.name}, ${deterministicResult.homeCity.country}
- Target city: ${deterministicResult.targetCity.name}, ${deterministicResult.targetCity.country}
- Current annual salary: AED ${request.baseSalary}
- Compensation approach: ${request.compApproach}
- Hybrid cap: ${request.hybridCap ?? "not provided"}
- Rent override: ${request.rentOverride ?? "not provided"}
- Role id: ${request.roleId}
- Level id: ${request.levelId}

Deterministic calculator outputs:
- Cost of living ratio: ${deterministicResult.colRatio.toFixed(2)}x
- Purchasing power salary: AED ${deterministicResult.purchasingPowerSalary}
- Local market salary placeholder: AED ${deterministicResult.localMarketSalary}
- Deterministic recommendation: AED ${deterministicResult.recommendedSalary}
- Deterministic range: AED ${deterministicResult.recommendedRange.min} to AED ${deterministicResult.recommendedRange.max}
- Monthly cost difference: AED ${deterministicResult.monthlyDifference}
- Annual cost difference: AED ${deterministicResult.annualDifference}

Policy context:
- Industry: ${policyContext.industry ?? "unknown"}
- Company size: ${policyContext.companySize ?? "unknown"}
- Target percentile: ${policyContext.targetPercentile ?? "unknown"}
- Package split: basic ${policyContext.compSplitBasicPct ?? "unknown"}%, housing ${policyContext.compSplitHousingPct ?? "unknown"}%, transport ${policyContext.compSplitTransportPct ?? "unknown"}%, other ${policyContext.compSplitOtherPct ?? "unknown"}%

Benchmark context:
- ${benchmarkContext
    ? `Target market p25: AED ${benchmarkContext.p25}, p50: AED ${benchmarkContext.p50}, p75: AED ${benchmarkContext.p75}, p90: AED ${benchmarkContext.p90}, sample size ${benchmarkContext.sampleSize}, source ${benchmarkContext.benchmarkSource}`
    : "No target market benchmark was found"}.

Instructions:
- Recommended salary must be a realistic annual AED number for the target market and policy context.
- Use benchmark context when available as the main market anchor.
- Use deterministic relocation math as a reference, not the only truth.
- Keep the recommendation explainable for HR and hiring managers.
- Return 1 to 3 concise risks, 1 to 3 policy notes, and 1 to 3 support suggestions.
- The recommended range should be realistic around the recommendation, not wider than necessary.
- Return JSON only.`;
}

async function callRelocationAdvisoryModel(
  input: RelocationAiGenerationInput,
): Promise<RelocationAiAdvisory> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: getAdvisoryModel(),
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are a relocation compensation engine. Respond only with the requested JSON schema.",
      },
      {
        role: "user",
        content: buildPrompt(input),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: JSON_SCHEMA,
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty relocation advisory response");
  }

  return JSON.parse(content) as RelocationAiAdvisory;
}
