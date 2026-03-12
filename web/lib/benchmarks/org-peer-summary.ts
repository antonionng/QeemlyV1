import type { DbBenchmark } from "@/lib/benchmarks/data-service";
import {
  selectBestMarketBenchmark,
  type MarketBenchmark,
  type MarketBenchmarkQuery,
} from "@/lib/benchmarks/platform-market";
import { monthlyToAnnual } from "@/lib/utils/currency";

export type OrgPeerSummaryEmployee = {
  id: string;
  role_id: string;
  level_id: string;
  location_id: string;
  status: string | null;
  base_salary: number | null;
  bonus: number | null;
  equity: number | null;
};

export type OrgPeerSummary = {
  benchmarkSource: "market" | "uploaded" | null;
  bandLow: number | null;
  bandHigh: number | null;
  matchingEmployeeCount: number;
  inBandCount: number;
};

type OrgPeerSummaryArgs = {
  employees: OrgPeerSummaryEmployee[];
  marketBenchmarks: MarketBenchmark[];
  workspaceBenchmarks: DbBenchmark[];
  roleId: string;
  locationId: string;
  levelId: string;
  industry?: string | null;
  companySize?: string | null;
};

export function getOrgPeerSummary({
  employees,
  marketBenchmarks,
  workspaceBenchmarks,
  roleId,
  locationId,
  levelId,
  industry,
  companySize,
}: OrgPeerSummaryArgs): OrgPeerSummary {
  const matchingEmployees = employees.filter(
    (employee) =>
      employee.status !== "inactive" &&
      employee.role_id === roleId &&
      employee.location_id === locationId &&
      employee.level_id === levelId,
  );

  const marketBenchmark = selectBestMarketBenchmark(
    marketBenchmarks.filter(
      (benchmark) =>
        benchmark.role_id === roleId &&
        benchmark.location_id === locationId &&
        benchmark.level_id === levelId,
    ),
    { industry, companySize },
  );

  const workspaceBenchmark = selectWorkspaceBenchmark(
    workspaceBenchmarks,
    { roleId, locationId, levelId },
    { industry, companySize },
  );

  const resolvedBenchmark = marketBenchmark ?? workspaceBenchmark;
  if (!resolvedBenchmark) {
    return {
      benchmarkSource: null,
      bandLow: null,
      bandHigh: null,
      matchingEmployeeCount: matchingEmployees.length,
      inBandCount: 0,
    };
  }

  const bandLow = monthlyToAnnual(Number(resolvedBenchmark.p25) || 0);
  const bandHigh = monthlyToAnnual(Number(resolvedBenchmark.p75) || 0);
  const benchmarkSource = marketBenchmark ? "market" : "uploaded";

  const inBandCount = matchingEmployees.filter((employee) => {
    const totalComp =
      (Number(employee.base_salary) || 0) +
      (Number(employee.bonus) || 0) +
      (Number(employee.equity) || 0);
    return totalComp >= bandLow && totalComp <= bandHigh;
  }).length;

  return {
    benchmarkSource,
    bandLow,
    bandHigh,
    matchingEmployeeCount: matchingEmployees.length,
    inBandCount,
  };
}

function selectWorkspaceBenchmark(
  rows: DbBenchmark[],
  benchmarkKey: { roleId: string; locationId: string; levelId: string },
  query: MarketBenchmarkQuery,
): DbBenchmark | null {
  const matches = rows.filter(
    (row) =>
      row.role_id === benchmarkKey.roleId &&
      row.location_id === benchmarkKey.locationId &&
      row.level_id === benchmarkKey.levelId,
  );

  const marketLikeRows: MarketBenchmark[] = matches.map((row) => ({
    role_id: row.role_id,
    location_id: row.location_id,
    level_id: row.level_id,
    currency: row.currency,
    industry: row.industry,
    company_size: row.company_size,
    p10: Number(row.p10) || 0,
    p25: Number(row.p25) || 0,
    p50: Number(row.p50) || 0,
    p75: Number(row.p75) || 0,
    p90: Number(row.p90) || 0,
    sample_size: row.sample_size,
    source: "market",
  }));

  const selected = selectBestMarketBenchmark(marketLikeRows, query);
  if (!selected) return null;

  return (
    matches.find(
      (row) =>
        row.role_id === selected.role_id &&
        row.location_id === selected.location_id &&
        row.level_id === selected.level_id &&
        normalizeSegmentValue(row.industry) === normalizeSegmentValue(selected.industry) &&
        normalizeSegmentValue(row.company_size) === normalizeSegmentValue(selected.company_size),
    ) ?? null
  );
}

function normalizeSegmentValue(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
