import {
  type BenchmarkMatchQuality,
  type BenchmarkProvenance,
  type SalaryReviewAiPlanRequest,
  type SalaryReviewAiPlanResponse,
  type SalaryReviewAiProposalFactor,
  type SalaryReviewAiProposalItem,
} from "./ai-plan";

export type SalaryReviewAiEmployeeInput = {
  id: string;
  firstName: string;
  lastName: string;
  roleId: string;
  levelId: string;
  locationId: string;
  baseSalary: number;
  performanceRating: "low" | "meets" | "exceeds" | "exceptional" | null;
  hireDate: string | null;
};

export type SalaryReviewAiBenchmarkInput = {
  roleId: string;
  levelId: string;
  locationId: string;
  p50: number;
  sourceSlug?: string | null;
  sourceName?: string | null;
  provenance: BenchmarkProvenance;
};

export type SalaryReviewAiFreshnessInput = {
  provenance: Exclude<BenchmarkProvenance, "none">;
  lastUpdatedAt: string | null;
  confidence: "high" | "medium" | "low" | "unknown";
};

type MatchedBenchmark = {
  benchmark: SalaryReviewAiBenchmarkInput | null;
  matchQuality: BenchmarkMatchQuality;
};

const BAND_WEIGHT = 0.2;
const PERFORMANCE_WEIGHT = 0.25;
const MARKET_WEIGHT = 0.45;
const TENURE_WEIGHT = 0.1;

const INCREASE_STEP = 100;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function yearsSince(isoDate: string | null): number {
  if (!isoDate) return 0;
  const value = Date.parse(isoDate);
  if (Number.isNaN(value)) return 0;
  const elapsedMs = Date.now() - value;
  return Math.max(0, elapsedMs / (365.25 * 24 * 60 * 60 * 1000));
}

function getTenureSignal(years: number): { signal: number; text: string } {
  if (years < 1) return { signal: -0.25, text: "new hire (<1y tenure)" };
  if (years >= 5) return { signal: 0.4, text: "long tenure (5y+)" };
  if (years >= 3) return { signal: 0.25, text: "stable tenure (3y+)" };
  return { signal: 0.1, text: "developing tenure" };
}

function getPerformanceSignal(
  rating: SalaryReviewAiEmployeeInput["performanceRating"]
): { signal: number; text: string } {
  switch (rating) {
    case "exceptional":
      return { signal: 1, text: "exceptional performance" };
    case "exceeds":
      return { signal: 0.6, text: "exceeds expectations" };
    case "meets":
      return { signal: 0.2, text: "meets expectations" };
    case "low":
      return { signal: -0.6, text: "low performance rating" };
    default:
      return { signal: 0, text: "performance data unavailable" };
  }
}

function toAnnualBenchmark(p50: number): number {
  // Legacy benchmark ingestion often stores monthly compensation bands.
  return p50 < 100_000 ? p50 * 12 : p50;
}

function getBudgetFromRequest(request: SalaryReviewAiPlanRequest, totalPayroll: number): number {
  if (request.budgetType === "absolute") return request.budgetAbsolute ?? 0;
  return totalPayroll * ((request.budgetPercentage ?? 0) / 100);
}

function getBandSignal(marketGapPct: number): { signal: number; text: string } {
  if (marketGapPct >= 10) return { signal: 1, text: "below market benchmark" };
  if (marketGapPct >= 3) return { signal: 0.4, text: "slightly below market" };
  if (marketGapPct <= -10) return { signal: -0.8, text: "above market benchmark" };
  return { signal: 0, text: "near benchmark midpoint" };
}

function getFreshnessForProvenance(
  freshness: SalaryReviewAiFreshnessInput[],
  provenance: BenchmarkProvenance
): SalaryReviewAiProposalItem["benchmark"]["freshness"] {
  if (provenance === "none") {
    return { lastUpdatedAt: null, confidence: "unknown" };
  }

  const match = freshness.find((entry) => entry.provenance === provenance);
  if (!match) {
    return { lastUpdatedAt: null, confidence: "unknown" };
  }
  return {
    lastUpdatedAt: match.lastUpdatedAt,
    confidence: match.confidence,
  };
}

function allocateRoundedBudget(totalBudget: number, shares: Array<{ id: string; share: number }>): Map<string, number> {
  const rounded = new Map<string, number>();
  if (totalBudget <= 0 || shares.length === 0) return rounded;

  const raw = shares.map(({ id, share }) => {
    const target = totalBudget * share;
    const floor = Math.max(0, Math.floor(target / INCREASE_STEP) * INCREASE_STEP);
    return { id, target, floor, remainder: target - floor };
  });

  const used = raw.reduce((sum, row) => sum + row.floor, 0);
  let remaining = Math.round(totalBudget - used);
  for (const row of raw) rounded.set(row.id, row.floor);

  if (remaining >= INCREASE_STEP) {
    const byRemainder = [...raw].sort((a, b) => b.remainder - a.remainder);
    let idx = 0;
    while (remaining >= INCREASE_STEP && byRemainder.length > 0) {
      const current = byRemainder[idx % byRemainder.length];
      rounded.set(current.id, (rounded.get(current.id) ?? 0) + INCREASE_STEP);
      remaining -= INCREASE_STEP;
      idx += 1;
    }
  }

  if (remaining > 0) {
    const top = raw.sort((a, b) => b.target - a.target)[0];
    if (top) {
      rounded.set(top.id, (rounded.get(top.id) ?? 0) + remaining);
    }
  }

  return rounded;
}

function buildBenchmarkMaps(benchmarks: SalaryReviewAiBenchmarkInput[]) {
  const exactMap = new Map<string, SalaryReviewAiBenchmarkInput>();
  const roleLevelMap = new Map<string, SalaryReviewAiBenchmarkInput>();

  for (const benchmark of benchmarks) {
    const exactKey = `${benchmark.roleId}::${benchmark.locationId}::${benchmark.levelId}`;
    if (!exactMap.has(exactKey)) {
      exactMap.set(exactKey, benchmark);
    }
    const fallbackKey = `${benchmark.roleId}::${benchmark.levelId}`;
    if (!roleLevelMap.has(fallbackKey)) {
      roleLevelMap.set(fallbackKey, benchmark);
    }
  }

  return { exactMap, roleLevelMap };
}

function resolveBenchmarkMatch(
  employee: SalaryReviewAiEmployeeInput,
  workspaceMaps: ReturnType<typeof buildBenchmarkMaps>,
  ingestionMaps: ReturnType<typeof buildBenchmarkMaps>
): MatchedBenchmark {
  const exactKey = `${employee.roleId}::${employee.locationId}::${employee.levelId}`;
  const fallbackKey = `${employee.roleId}::${employee.levelId}`;

  const workspaceExact = workspaceMaps.exactMap.get(exactKey);
  if (workspaceExact) return { benchmark: workspaceExact, matchQuality: "exact" };

  const workspaceFallback = workspaceMaps.roleLevelMap.get(fallbackKey);
  if (workspaceFallback) return { benchmark: workspaceFallback, matchQuality: "role_level_fallback" };

  const ingestionExact = ingestionMaps.exactMap.get(exactKey);
  if (ingestionExact) return { benchmark: ingestionExact, matchQuality: "exact" };

  const ingestionFallback = ingestionMaps.roleLevelMap.get(fallbackKey);
  if (ingestionFallback) return { benchmark: ingestionFallback, matchQuality: "role_level_fallback" };

  return { benchmark: null, matchQuality: "none" };
}

type ScoredEmployee = {
  employee: SalaryReviewAiEmployeeInput;
  benchmark: SalaryReviewAiBenchmarkInput | null;
  matchQuality: BenchmarkMatchQuality;
  score: number;
  confidence: number;
  warnings: string[];
  factors: SalaryReviewAiProposalFactor[];
  rationale: string[];
};

function scoreEmployee(
  employee: SalaryReviewAiEmployeeInput,
  benchmark: SalaryReviewAiBenchmarkInput | null,
  matchQuality: BenchmarkMatchQuality,
  freshness: SalaryReviewAiProposalItem["benchmark"]["freshness"]
): ScoredEmployee {
  const warnings: string[] = [];
  const factors: SalaryReviewAiProposalFactor[] = [];
  const rationale: string[] = [];

  const tenureYears = yearsSince(employee.hireDate);
  const tenure = getTenureSignal(tenureYears);
  factors.push({
    key: "tenure",
    label: "Tenure",
    value: tenure.text,
    weight: TENURE_WEIGHT,
    impact: tenure.signal > 0 ? "positive" : tenure.signal < 0 ? "negative" : "neutral",
  });
  rationale.push(`Tenure signal: ${tenure.text}`);

  const perf = getPerformanceSignal(employee.performanceRating);
  factors.push({
    key: "performance",
    label: "Performance",
    value: perf.text,
    weight: PERFORMANCE_WEIGHT,
    impact: perf.signal > 0 ? "positive" : perf.signal < 0 ? "negative" : "neutral",
  });
  rationale.push(`Performance: ${perf.text}`);
  if (!employee.performanceRating) {
    warnings.push("Missing performance rating; recommendation confidence reduced.");
  }

  let marketSignal = 0;
  let marketGapPct = 0;
  if (benchmark) {
    const p50Annual = toAnnualBenchmark(benchmark.p50);
    if (p50Annual > 0) {
      marketGapPct = ((p50Annual - employee.baseSalary) / p50Annual) * 100;
      marketSignal = clamp(marketGapPct / 25, -1, 1);
      rationale.push(`Market gap: ${marketGapPct.toFixed(1)}% vs benchmark midpoint (P50).`);
    }
  } else {
    warnings.push("No benchmark match found; using internal compensation signals only.");
    rationale.push("No benchmark match available for role-level-location.");
  }

  factors.push({
    key: "market_gap",
    label: "Market Gap",
    value: benchmark ? `${marketGapPct.toFixed(1)}% vs P50` : "benchmark unavailable",
    weight: MARKET_WEIGHT,
    impact: marketSignal > 0 ? "positive" : marketSignal < 0 ? "negative" : "neutral",
  });

  const band = getBandSignal(marketGapPct);
  factors.push({
    key: "band_position",
    label: "Band Position",
    value: band.text,
    weight: BAND_WEIGHT,
    impact: band.signal > 0 ? "positive" : band.signal < 0 ? "negative" : "neutral",
  });
  rationale.push(`Band signal: ${band.text}`);

  const score =
    marketSignal * MARKET_WEIGHT +
    perf.signal * PERFORMANCE_WEIGHT +
    band.signal * BAND_WEIGHT +
    tenure.signal * TENURE_WEIGHT;

  let confidence = 78;
  if (!benchmark) confidence -= 22;
  if (matchQuality === "role_level_fallback") confidence -= 8;
  if (matchQuality === "exact") confidence += 5;
  if (!employee.performanceRating) confidence -= 10;
  if (freshness.confidence === "low") confidence -= 8;
  if (freshness.confidence === "medium") confidence -= 3;

  confidence = clamp(Math.round(confidence), 30, 96);

  if (matchQuality === "role_level_fallback") {
    warnings.push("Benchmark uses role+level fallback (location-specific match unavailable).");
  }
  if (freshness.confidence === "low") {
    warnings.push("Benchmark freshness confidence is low.");
  }

  return {
    employee,
    benchmark,
    matchQuality,
    score,
    confidence,
    warnings,
    factors,
    rationale,
  };
}

export function buildSalaryReviewAiPlan(args: {
  request: SalaryReviewAiPlanRequest;
  employees: SalaryReviewAiEmployeeInput[];
  workspaceBenchmarks: SalaryReviewAiBenchmarkInput[];
  ingestionBenchmarks: SalaryReviewAiBenchmarkInput[];
  freshness: SalaryReviewAiFreshnessInput[];
}): SalaryReviewAiPlanResponse {
  const selectedIds = new Set(args.request.selectedEmployeeIds ?? []);
  const selectedEmployees = args.request.selectedEmployeeIds?.length
    ? args.employees.filter((employee) => selectedIds.has(employee.id))
    : args.employees;

  const totalCurrentPayroll = selectedEmployees.reduce((sum, employee) => sum + employee.baseSalary, 0);
  const budget = getBudgetFromRequest(args.request, totalCurrentPayroll);
  const workspaceMaps = buildBenchmarkMaps(args.workspaceBenchmarks);
  const ingestionMaps = buildBenchmarkMaps(args.ingestionBenchmarks);

  const scored = selectedEmployees.map((employee) => {
    const matched = resolveBenchmarkMatch(employee, workspaceMaps, ingestionMaps);
    const freshness = getFreshnessForProvenance(args.freshness, matched.benchmark?.provenance ?? "none");
    return scoreEmployee(employee, matched.benchmark, matched.matchQuality, freshness);
  });

  const shares = scored.map((entry) => {
    const baseShare = totalCurrentPayroll > 0 ? entry.employee.baseSalary / totalCurrentPayroll : 0;
    const scoreMultiplier = clamp(1 + entry.score, 0.2, 2.2);
    return {
      id: entry.employee.id,
      share: Math.max(0, baseShare * scoreMultiplier),
    };
  });
  const shareTotal = shares.reduce((sum, entry) => sum + entry.share, 0);
  const normalizedShares =
    shareTotal > 0
      ? shares.map((entry) => ({ id: entry.id, share: entry.share / shareTotal }))
      : shares.map((entry) => ({ id: entry.id, share: 0 }));

  const allocated = allocateRoundedBudget(budget, normalizedShares);

  const items: SalaryReviewAiProposalItem[] = scored.map((entry) => {
    const proposedIncrease = Math.max(0, allocated.get(entry.employee.id) ?? 0);
    const proposedSalary = entry.employee.baseSalary + proposedIncrease;
    const proposedPercentage =
      entry.employee.baseSalary > 0 ? (proposedIncrease / entry.employee.baseSalary) * 100 : 0;
    const freshness = getFreshnessForProvenance(
      args.freshness,
      entry.benchmark?.provenance ?? "none"
    );

    return {
      employeeId: entry.employee.id,
      employeeName: `${entry.employee.firstName} ${entry.employee.lastName}`.trim(),
      currentSalary: entry.employee.baseSalary,
      proposedIncrease,
      proposedSalary,
      proposedPercentage,
      confidence: entry.confidence,
      rationale: entry.rationale,
      factors: entry.factors,
      benchmark: {
        provenance: entry.benchmark?.provenance ?? "none",
        sourceSlug: entry.benchmark?.sourceSlug ?? null,
        sourceName: entry.benchmark?.sourceName ?? null,
        matchQuality: entry.matchQuality,
        freshness,
      },
      warnings: entry.warnings,
    };
  });

  const budgetUsed = items.reduce((sum, item) => sum + item.proposedIncrease, 0);
  const budgetRemaining = budget - budgetUsed;
  const warnings = [
    budgetUsed > budget ? "Recommendation exceeds budget." : "",
    items.some((item) => item.benchmark.provenance === "none")
      ? "Some employees do not have benchmark matches and use internal signals only."
      : "",
    items.some((item) => item.benchmark.matchQuality === "role_level_fallback")
      ? "Some benchmark matches use role-level fallback due to missing location-specific records."
      : "",
  ].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      mode: "assistive",
      budget,
      budgetUsed,
      budgetRemaining,
      budgetUsedPercentage: budget > 0 ? (budgetUsed / budget) * 100 : 0,
      totalCurrentPayroll,
      totalProposedPayroll: totalCurrentPayroll + budgetUsed,
      employeesConsidered: selectedEmployees.length,
      employeesWithWarnings: items.filter((item) => item.warnings.length > 0).length,
    },
    items,
    warnings,
  };
}

export const __internal = {
  resolveBenchmarkMatch,
  allocateRoundedBudget,
};

