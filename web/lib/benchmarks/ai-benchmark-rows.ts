import {
  getAiBenchmarkAdvisoryLight,
  getAiBenchmarkForLevelLight,
} from "@/lib/benchmarks/ai-estimate";
import { findMarketBenchmark } from "@/lib/benchmarks/platform-market";

export type AiBenchmarkRequest = {
  roleId: string;
  locationId: string;
  industry?: string | null;
  companySize?: string | null;
};

export type AiBenchmarkRow = {
  id: string;
  role_id: string;
  level_id: string;
  location_id: string;
  currency: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  source: "ai-estimated";
  provenance: "ai-generated";
  sample_size: number;
  confidence: "Medium";
  freshness_at: string;
};

export type AiFirstBenchmarkContext = {
  role_id: string;
  level_id: string;
  location_id: string;
  currency: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sample_size: number;
  benchmarkSource: "ai-estimated" | "market";
};

function makeKey(request: AiBenchmarkRequest): string {
  return [
    request.roleId,
    request.locationId,
    request.industry ?? "",
    request.companySize ?? "",
  ].join("::");
}

export async function buildAiBenchmarkRows(
  requests: AiBenchmarkRequest[],
): Promise<AiBenchmarkRow[]> {
  const uniqueRequests = new Map<string, AiBenchmarkRequest>();
  for (const request of requests) {
    if (!request.roleId || !request.locationId) continue;
    uniqueRequests.set(makeKey(request), request);
  }

  const results = await Promise.all(
    [...uniqueRequests.values()].map(async (request) => {
      const advisory = await getAiBenchmarkAdvisoryLight(
        request.roleId,
        request.locationId,
        request.industry ?? null,
        request.companySize ?? null,
      ).catch(() => null);

      if (!advisory) return [];

      const generatedAt = new Date().toISOString();
      return advisory.levels.map((level) => ({
        id: `${request.roleId}::${request.locationId}::${level.levelId}::ai`,
        role_id: request.roleId,
        level_id: level.levelId,
        location_id: request.locationId,
        currency: advisory.currency,
        p10: level.p10,
        p25: level.p25,
        p50: level.p50,
        p75: level.p75,
        p90: level.p90,
        source: "ai-estimated" as const,
        provenance: "ai-generated" as const,
        sample_size: 0,
        confidence: "Medium" as const,
        freshness_at: generatedAt,
      }));
    }),
  );

  return results.flat();
}

export async function resolveAiFirstBenchmarkContext(
  client: Parameters<typeof findMarketBenchmark>[0],
  args: {
    roleId: string;
    locationId: string;
    levelId: string;
    industry?: string | null;
    companySize?: string | null;
  },
): Promise<AiFirstBenchmarkContext | null> {
  const aiResult = await getAiBenchmarkForLevelLight(
    args.roleId,
    args.locationId,
    args.levelId,
    {
      industry: args.industry ?? null,
      companySize: args.companySize ?? null,
    },
  ).catch(() => null);

  if (aiResult) {
    return {
      role_id: args.roleId,
      level_id: args.levelId,
      location_id: args.locationId,
      currency: aiResult.advisory.currency,
      p10: aiResult.level.p10,
      p25: aiResult.level.p25,
      p50: aiResult.level.p50,
      p75: aiResult.level.p75,
      p90: aiResult.level.p90,
      sample_size: 0,
      benchmarkSource: "ai-estimated",
    };
  }

  const marketBenchmark = await findMarketBenchmark(
    client,
    args.roleId,
    args.locationId,
    args.levelId,
    {
      industry: args.industry ?? null,
      companySize: args.companySize ?? null,
    },
  );

  if (!marketBenchmark) return null;

  return {
    role_id: marketBenchmark.role_id,
    level_id: marketBenchmark.level_id,
    location_id: marketBenchmark.location_id,
    currency: marketBenchmark.currency,
    p10: marketBenchmark.p10,
    p25: marketBenchmark.p25,
    p50: marketBenchmark.p50,
    p75: marketBenchmark.p75,
    p90: marketBenchmark.p90,
    sample_size: marketBenchmark.sample_size ?? 0,
    benchmarkSource: "market",
  };
}
