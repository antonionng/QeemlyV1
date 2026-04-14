import { buildAiBenchmarkRows } from "@/lib/benchmarks/ai-benchmark-rows";
import {
  annualizeBenchmarkValue,
  resolveBenchmarkPayPeriod,
  type BenchmarkPayPeriod,
} from "@/lib/benchmarks/pay-period";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import {
  resolveBenchmarkForEmployee,
  type BenchmarkResolverMatchType,
  type BenchmarkResolverResult,
} from "@/lib/benchmarks/benchmark-resolver";
import { buildBenchmarkTrustLabels } from "@/lib/benchmarks/trust";
import { getRelocationCities } from "@/lib/relocation/col-data";
import { convertRelocationCurrency } from "@/lib/relocation/currency";

export type RelocationMarketBenchmarkRow = {
  id?: string | null;
  role_id: string;
  level_id: string;
  location_id: string;
  currency: string;
  pay_period?: BenchmarkPayPeriod | null;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sample_size?: number | null;
  source: "market" | "ai-estimated";
};

export type RelocationResolvedMarketContext = {
  requestedLocationId: string;
  matchedLocationId: string;
  currency: string;
  payPeriod: "annual";
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sampleSize: number;
  benchmarkSource: "market" | "ai-estimated";
  sourceLabel: string;
  matchType: Exclude<BenchmarkResolverMatchType, "none">;
  matchLabel: string;
  fallbackReason: string | null;
};

export type RelocationSalaryComparisons = {
  benchmarkToBenchmark: {
    homeMarketP50: number;
    homeMarketCurrency: string;
    homeMarketP50Aed: number;
    targetMarketP50: number;
    targetMarketCurrency: string;
    targetMarketP50Aed: number;
    differenceInAed: number;
    percentChange: number;
  };
  currentToDestinationMarket: {
    currentSalary: number;
    currentSalaryCurrency: string;
    currentSalaryAed: number;
    currentSalaryInTargetCurrency: number;
    targetMarketP50: number;
    targetMarketCurrency: string;
    targetMarketP50Aed: number;
    gapInAed: number;
    gapPercent: number;
  };
};

export type RelocationMarketData = {
  homeMarketContext: RelocationResolvedMarketContext | null;
  targetMarketContext: RelocationResolvedMarketContext | null;
  salaryComparisons: RelocationSalaryComparisons | null;
};

type BuildRelocationMarketDataArgs = {
  roleId: string;
  levelId: string;
  homeLocationId: string;
  targetLocationId: string;
  currentSalary: number;
  currentSalaryCurrency: string;
  marketBenchmarks: RelocationMarketBenchmarkRow[];
};

type LoadRelocationMarketDataArgs = Omit<BuildRelocationMarketDataArgs, "marketBenchmarks"> & {
  industry?: string | null;
  companySize?: string | null;
};

function buildKey(roleId: string, levelId: string, locationId: string) {
  return `${roleId}::${levelId}::${locationId}`;
}

function toAnnualRow(row: RelocationMarketBenchmarkRow): RelocationMarketBenchmarkRow {
  const sourcePayPeriod = resolveBenchmarkPayPeriod(row.pay_period, row.p50);
  return {
    ...row,
    pay_period: "annual",
    p10: annualizeBenchmarkValue(row.p10, sourcePayPeriod),
    p25: annualizeBenchmarkValue(row.p25, sourcePayPeriod),
    p50: annualizeBenchmarkValue(row.p50, sourcePayPeriod),
    p75: annualizeBenchmarkValue(row.p75, sourcePayPeriod),
    p90: annualizeBenchmarkValue(row.p90, sourcePayPeriod),
  };
}

function resolvePreferredMatch(
  rows: RelocationMarketBenchmarkRow[],
  locationId: string,
  roleId: string,
  levelId: string,
): BenchmarkResolverResult<RelocationMarketBenchmarkRow> {
  const aiRows = rows.filter((row) => row.source === "ai-estimated");
  const marketRows = rows.filter((row) => row.source === "market");
  const employee = { roleId, levelId, locationId };

  const aiMatch =
    aiRows.length > 0
      ? resolveBenchmarkForEmployee({
          employee,
          marketBenchmarks: aiRows,
          workspaceBenchmarks: [],
        })
      : null;

  if (aiMatch?.row && aiMatch.source === "ai-estimated") {
    return aiMatch;
  }

  const exactMap = new Map(
    marketRows.map((row) => [buildKey(row.role_id, row.level_id, row.location_id), row]),
  );
  const exactMarketMatch = exactMap.get(buildKey(roleId, levelId, locationId));
  if (exactMarketMatch) {
    return {
      row: exactMarketMatch,
      source: "market",
      matchQuality: "exact",
      matchType: "exact",
      matchedBenchmarkId: exactMarketMatch.id ? String(exactMarketMatch.id) : null,
      fallbackReason: null,
    };
  }

  const requestedCity = getRelocationCities().find((city) => city.id === locationId);
  if (requestedCity) {
    const sameCountryMarketMatch = getRelocationCities()
      .filter((city) => city.country === requestedCity.country && city.id !== locationId)
      .map((city) => exactMap.get(buildKey(roleId, levelId, city.id)))
      .find(Boolean);

    if (sameCountryMarketMatch) {
      return {
        row: sameCountryMarketMatch,
        source: "market",
        matchQuality: "role_level_fallback",
        matchType: "location_fallback",
        matchedBenchmarkId: sameCountryMarketMatch.id
          ? String(sameCountryMarketMatch.id)
          : null,
        fallbackReason: "Used the closest market benchmark from the same country.",
      };
    }
  }

  return resolveBenchmarkForEmployee({
    employee,
    marketBenchmarks: marketRows,
    workspaceBenchmarks: [],
  });
}

function toResolvedContext(
  requestedLocationId: string,
  match: BenchmarkResolverResult<RelocationMarketBenchmarkRow>,
): RelocationResolvedMarketContext | null {
  if (!match.row || !match.source || match.matchType === "none") {
    return null;
  }

  const row = toAnnualRow(match.row);
  const labels = buildBenchmarkTrustLabels({
    source: match.source,
    matchQuality: match.matchQuality === "none" ? null : match.matchQuality,
    matchType: match.matchType,
    fallbackReason: match.fallbackReason,
    sampleSize: row.sample_size ?? 0,
  });

  return {
    requestedLocationId,
    matchedLocationId: row.location_id,
    currency: row.currency,
    payPeriod: "annual",
    p10: row.p10,
    p25: row.p25,
    p50: row.p50,
    p75: row.p75,
    p90: row.p90,
    sampleSize: row.sample_size ?? 0,
    benchmarkSource: match.source,
    sourceLabel: labels?.sourceLabel ?? "No benchmark coverage",
    matchType: match.matchType,
    matchLabel: labels?.matchLabel ?? "No benchmark coverage",
    fallbackReason: match.fallbackReason,
  };
}

export function buildRelocationMarketData(
  args: BuildRelocationMarketDataArgs,
): RelocationMarketData {
  const normalizedRows = args.marketBenchmarks.map(toAnnualRow);
  const homeMatch = resolvePreferredMatch(
    normalizedRows,
    args.homeLocationId,
    args.roleId,
    args.levelId,
  );
  const targetMatch = resolvePreferredMatch(
    normalizedRows,
    args.targetLocationId,
    args.roleId,
    args.levelId,
  );

  const homeMarketContext = toResolvedContext(args.homeLocationId, homeMatch);
  const targetMarketContext = toResolvedContext(args.targetLocationId, targetMatch);

  if (!targetMarketContext) {
    return {
      homeMarketContext,
      targetMarketContext,
      salaryComparisons: null,
    };
  }

  const currentSalaryAed = convertRelocationCurrency(
    args.currentSalary,
    args.currentSalaryCurrency,
    "AED",
  );
  const targetMarketP50Aed = convertRelocationCurrency(
    targetMarketContext.p50,
    targetMarketContext.currency,
    "AED",
  );
  const currentSalaryInTargetCurrency = convertRelocationCurrency(
    args.currentSalary,
    args.currentSalaryCurrency,
    targetMarketContext.currency,
  );
  const gapInAed = targetMarketP50Aed - currentSalaryAed;

  const salaryComparisons: RelocationSalaryComparisons = {
    benchmarkToBenchmark: {
      homeMarketP50: homeMarketContext?.p50 ?? 0,
      homeMarketCurrency: homeMarketContext?.currency ?? args.currentSalaryCurrency,
      homeMarketP50Aed: homeMarketContext
        ? convertRelocationCurrency(homeMarketContext.p50, homeMarketContext.currency, "AED")
        : currentSalaryAed,
      targetMarketP50: targetMarketContext.p50,
      targetMarketCurrency: targetMarketContext.currency,
      targetMarketP50Aed,
      differenceInAed:
        targetMarketP50Aed -
        (homeMarketContext
          ? convertRelocationCurrency(homeMarketContext.p50, homeMarketContext.currency, "AED")
          : currentSalaryAed),
      percentChange:
        homeMarketContext && homeMarketContext.p50 > 0
          ? ((targetMarketP50Aed -
              convertRelocationCurrency(homeMarketContext.p50, homeMarketContext.currency, "AED")) /
              convertRelocationCurrency(homeMarketContext.p50, homeMarketContext.currency, "AED")) *
            100
          : 0,
    },
    currentToDestinationMarket: {
      currentSalary: args.currentSalary,
      currentSalaryCurrency: args.currentSalaryCurrency,
      currentSalaryAed,
      currentSalaryInTargetCurrency,
      targetMarketP50: targetMarketContext.p50,
      targetMarketCurrency: targetMarketContext.currency,
      targetMarketP50Aed,
      gapInAed,
      gapPercent: currentSalaryAed > 0 ? (gapInAed / currentSalaryAed) * 100 : 0,
    },
  };

  return {
    homeMarketContext,
    targetMarketContext,
    salaryComparisons,
  };
}

export async function loadRelocationMarketData(
  client: Parameters<typeof fetchMarketBenchmarks>[0],
  args: LoadRelocationMarketDataArgs,
): Promise<RelocationMarketData> {
  const [marketBenchmarks, aiRows] = await Promise.all([
    fetchMarketBenchmarks(client, { includeSegmented: true }),
    buildAiBenchmarkRows([
      {
        roleId: args.roleId,
        locationId: args.homeLocationId,
        industry: args.industry ?? null,
        companySize: args.companySize ?? null,
      },
      {
        roleId: args.roleId,
        locationId: args.targetLocationId,
        industry: args.industry ?? null,
        companySize: args.companySize ?? null,
      },
    ]),
  ]);

  return buildRelocationMarketData({
    ...args,
    marketBenchmarks: [...aiRows, ...marketBenchmarks],
  });
}
