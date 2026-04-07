import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAiBenchmarkDetailBriefing } from "@/lib/benchmarks/ai-estimate";
import {
  resolveCanonicalBenchmarkLookupBatch,
  resolveMarketBenchmarkLookupBatch,
  type BenchmarkLookupClient,
} from "@/lib/benchmarks/lookup-service";
import { makeBenchmarkLookupKey, type BenchmarkLookupEntry } from "@/lib/benchmarks/data-service";
import { buildDetailSurface } from "@/lib/benchmarks/detail-surface";
import type { BenchmarkDetailSupportData } from "@/lib/benchmarks/detail-ai";
import {
  COMPANY_SIZES,
  INDUSTRIES,
  LEVELS,
  LOCATIONS,
  ROLES,
  type SalaryBenchmark,
} from "@/lib/dashboard/dummy-data";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get("roleId");
  const locationId = searchParams.get("locationId");
  const levelId = searchParams.get("levelId");
  const industry = searchParams.get("industry");
  const companySize = searchParams.get("companySize");

  if (!roleId || !locationId || !levelId) {
    return NextResponse.json(
      { error: "roleId, locationId, and levelId are required." },
      { status: 400 },
    );
  }

  const role = ROLES.find((r) => r.id === roleId);
  const level = LEVELS.find((l) => l.id === levelId);
  const location = LOCATIONS.find((l) => l.id === locationId);

  if (!role || !level || !location) {
    return NextResponse.json(
      { error: "Invalid roleId, levelId, or locationId." },
      { status: 400 },
    );
  }

  const client = supabase as unknown as BenchmarkLookupClient;

  const [aiBriefingResult, supportDataResult, baseBenchmarkResult] =
    await Promise.allSettled([
      getAiBenchmarkDetailBriefing(roleId, locationId, industry, companySize),
      fetchSupportDataServerSide(client, {
        roleId,
        locationId,
        levelId,
        industry,
        companySize,
      }),
      fetchBaseBenchmarkServerSide(client, {
        roleId,
        locationId,
        levelId,
        industry,
        companySize,
      }),
    ]);

  const aiBriefing =
    aiBriefingResult.status === "fulfilled" ? aiBriefingResult.value : null;
  const supportData =
    supportDataResult.status === "fulfilled" ? supportDataResult.value : null;
  const baseBenchmark =
    baseBenchmarkResult.status === "fulfilled"
      ? baseBenchmarkResult.value
      : null;

  if (!baseBenchmark) {
    return NextResponse.json(
      { error: "Base benchmark not found." },
      { status: 404 },
    );
  }

  const contract = buildDetailSurface({
    aiBriefing,
    supportData,
    benchmark: baseBenchmark,
    roleTitle: role.title,
    levelName: level.name,
    location,
    industry,
    companySize,
  });

  return NextResponse.json({ detailSurface: contract });
}

// ---------------------------------------------------------------------------
// Server-side support data fetching
// ---------------------------------------------------------------------------

async function fetchSupportDataServerSide(
  client: BenchmarkLookupClient,
  args: {
    roleId: string;
    locationId: string;
    levelId: string;
    industry: string | null;
    companySize: string | null;
  },
): Promise<BenchmarkDetailSupportData> {
  const currentLevelIndex = LEVELS.findIndex((l) => l.id === args.levelId);
  const adjacentLevels = LEVELS.slice(
    Math.max(0, currentLevelIndex - 1),
    Math.min(LEVELS.length, currentLevelIndex + 2),
  );
  const levelTableLevels = LEVELS.filter(
    (l) => l.category === "IC" || l.category === "Manager",
  ).slice(0, 6);

  const levelTableLocationId =
    args.locationId === "london" || args.locationId === "manchester"
      ? "dubai"
      : args.locationId;

  const industriesToLoad = [
    args.industry,
    ...INDUSTRIES.filter((i) => i !== args.industry),
  ]
    .filter((i): i is string => Boolean(i))
    .slice(0, 5);

  const companySizesToLoad = [
    args.companySize,
    ...COMPANY_SIZES.filter((s) => s !== args.companySize),
  ]
    .filter((s): s is string => Boolean(s))
    .slice(0, 5);

  const primaryEntries = new Map<string, BenchmarkLookupEntry>();
  const comparisonEntries = new Map<string, BenchmarkLookupEntry>();

  const addPrimary = (entry: BenchmarkLookupEntry) => {
    primaryEntries.set(makeBenchmarkLookupKey(entry), entry);
  };
  const addComparison = (entry: BenchmarkLookupEntry) => {
    const key = makeBenchmarkLookupKey(entry);
    if (!primaryEntries.has(key)) {
      comparisonEntries.set(key, entry);
    }
  };

  for (const level of levelTableLevels) {
    addPrimary({
      roleId: args.roleId,
      locationId: levelTableLocationId,
      levelId: level.id,
      industry: args.industry,
      companySize: args.companySize,
    });
  }

  for (const level of adjacentLevels) {
    addPrimary({
      roleId: args.roleId,
      locationId: args.locationId,
      levelId: level.id,
      industry: args.industry,
      companySize: args.companySize,
    });
  }

  for (const ind of industriesToLoad) {
    addComparison({
      roleId: args.roleId,
      locationId: args.locationId,
      levelId: args.levelId,
      industry: ind,
      companySize: args.companySize,
    });
  }

  for (const size of companySizesToLoad) {
    addComparison({
      roleId: args.roleId,
      locationId: args.locationId,
      levelId: args.levelId,
      industry: args.industry,
      companySize: size,
    });
  }

  for (const loc of LOCATIONS) {
    addComparison({
      roleId: args.roleId,
      locationId: loc.id,
      levelId: args.levelId,
      industry: args.industry,
      companySize: args.companySize,
    });
  }

  const [primaryResults, comparisonResults] = await Promise.all([
    resolveCanonicalBenchmarkLookupBatch(client, [...primaryEntries.values()]),
    resolveMarketBenchmarkLookupBatch(client, [...comparisonEntries.values()]),
  ]);

  const batchResults = { ...comparisonResults, ...primaryResults };

  const levelTableBenchmarks = Object.fromEntries(
    levelTableLevels
      .map((level) => {
        const benchmark =
          batchResults[
            makeBenchmarkLookupKey({
              roleId: args.roleId,
              locationId: levelTableLocationId,
              levelId: level.id,
              industry: args.industry,
              companySize: args.companySize,
            })
          ];
        return benchmark ? [level.id, benchmark] : null;
      })
      .filter(Boolean) as Array<[string, SalaryBenchmark]>,
  );

  const offerBuilderBenchmarks = Object.fromEntries(
    adjacentLevels
      .map((level) => {
        const benchmark =
          batchResults[
            makeBenchmarkLookupKey({
              roleId: args.roleId,
              locationId: args.locationId,
              levelId: level.id,
              industry: args.industry,
              companySize: args.companySize,
            })
          ];
        return benchmark ? [level.id, benchmark] : null;
      })
      .filter(Boolean) as Array<[string, SalaryBenchmark]>,
  );

  const industryEntries = industriesToLoad.map((ind) => {
    const benchmark =
      batchResults[
        makeBenchmarkLookupKey({
          roleId: args.roleId,
          locationId: args.locationId,
          levelId: args.levelId,
          industry: ind,
          companySize: args.companySize,
        })
      ];
    if (!benchmark) return null;
    if (
      benchmark.benchmarkSegmentation?.matchedIndustry &&
      benchmark.benchmarkSegmentation.matchedIndustry === ind
    ) {
      return { industry: ind, benchmark, fallback: false };
    }
    if (benchmark.benchmarkSegmentation?.isFallback) {
      return { industry: ind, benchmark, fallback: true };
    }
    return null;
  });

  const industryBenchmarks: Record<string, SalaryBenchmark> = {};
  let industryFallbackBenchmark: SalaryBenchmark | null = null;
  for (const entry of industryEntries) {
    if (!entry) continue;
    if (entry.fallback) {
      industryFallbackBenchmark ??= entry.benchmark;
    } else {
      industryBenchmarks[entry.industry] = entry.benchmark;
    }
  }

  const companySizeEntries = companySizesToLoad.map((size) => {
    const benchmark =
      batchResults[
        makeBenchmarkLookupKey({
          roleId: args.roleId,
          locationId: args.locationId,
          levelId: args.levelId,
          industry: args.industry,
          companySize: size,
        })
      ];
    if (!benchmark) return null;
    if (
      benchmark.benchmarkSegmentation?.matchedCompanySize &&
      benchmark.benchmarkSegmentation.matchedCompanySize === size
    ) {
      return { companySize: size, benchmark, fallback: false };
    }
    if (benchmark.benchmarkSegmentation?.isFallback) {
      return { companySize: size, benchmark, fallback: true };
    }
    return null;
  });

  const companySizeBenchmarks: Record<string, SalaryBenchmark> = {};
  let companySizeFallbackBenchmark: SalaryBenchmark | null = null;
  for (const entry of companySizeEntries) {
    if (!entry) continue;
    if (entry.fallback) {
      companySizeFallbackBenchmark ??= entry.benchmark;
    } else {
      companySizeBenchmarks[entry.companySize] = entry.benchmark;
    }
  }

  const geoBenchmarksByLocation = Object.fromEntries(
    LOCATIONS.map((loc) => {
      const benchmark =
        batchResults[
          makeBenchmarkLookupKey({
            roleId: args.roleId,
            locationId: loc.id,
            levelId: args.levelId,
            industry: args.industry,
            companySize: args.companySize,
          })
        ];
      return benchmark ? [loc.id, benchmark] : null;
    }).filter(Boolean) as Array<[string, SalaryBenchmark]>,
  );

  return {
    levelTableBenchmarks,
    offerBuilderBenchmarks,
    industryBenchmarks,
    industryFallbackBenchmark,
    companySizeBenchmarks,
    companySizeFallbackBenchmark,
    geoBenchmarksByLocation,
  };
}

async function fetchBaseBenchmarkServerSide(
  client: BenchmarkLookupClient,
  args: {
    roleId: string;
    locationId: string;
    levelId: string;
    industry: string | null;
    companySize: string | null;
  },
): Promise<SalaryBenchmark | null> {
  const results = await resolveCanonicalBenchmarkLookupBatch(client, [
    {
      roleId: args.roleId,
      locationId: args.locationId,
      levelId: args.levelId,
      industry: args.industry,
      companySize: args.companySize,
    },
  ]);
  const key = makeBenchmarkLookupKey({
    roleId: args.roleId,
    locationId: args.locationId,
    levelId: args.levelId,
    industry: args.industry,
    companySize: args.companySize,
  });
  return results[key] ?? null;
}
