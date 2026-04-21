import {
  type BenchmarkMatchQuality,
  type BenchmarkMatchType,
  type BenchmarkProvenance,
  type SalaryReviewAiPlanRequest,
  type SalaryReviewAiPlanResponse,
  type SalaryReviewAiProposalFactor,
  type SalaryReviewAiProposalItem,
  type SalaryReviewAiScenarioId,
  type SalaryReviewAiScenario,
  type SalaryReviewAiScenarioResponse,
  type SalaryReviewAiRiskSummary,
  type SalaryReviewAiCohortContext,
  type SalaryReviewAiObjective,
} from "./ai-plan";
import { resolveBenchmarkForEmployee } from "@/lib/benchmarks/benchmark-resolver";

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
  matchType: BenchmarkMatchType;
  fallbackReason: string | null;
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

function resolveBenchmarkMatch(
  employee: SalaryReviewAiEmployeeInput,
  workspaceBenchmarks: SalaryReviewAiBenchmarkInput[],
  ingestionBenchmarks: SalaryReviewAiBenchmarkInput[],
): MatchedBenchmark {
  const resolved = resolveBenchmarkForEmployee({
    employee,
    marketBenchmarks: ingestionBenchmarks.map((benchmark, index) => ({
      ...benchmark,
      id: `${benchmark.roleId}::${benchmark.locationId}::${benchmark.levelId}::${index}`,
      role_id: benchmark.roleId,
      level_id: benchmark.levelId,
      location_id: benchmark.locationId,
    })),
    workspaceBenchmarks: workspaceBenchmarks.map((benchmark, index) => ({
      ...benchmark,
      id: `${benchmark.roleId}::${benchmark.locationId}::${benchmark.levelId}::workspace::${index}`,
      role_id: benchmark.roleId,
      level_id: benchmark.levelId,
      location_id: benchmark.locationId,
    })),
  });

  return {
    benchmark: resolved.row
      ? {
          roleId: String(resolved.row.role_id),
          levelId: String(resolved.row.level_id),
          locationId: String(resolved.row.location_id),
          p50: Number(resolved.row.p50),
          sourceSlug: (resolved.row as { sourceSlug?: string | null }).sourceSlug ?? null,
          sourceName: (resolved.row as { sourceName?: string | null }).sourceName ?? null,
          provenance: (resolved.row as { provenance?: BenchmarkProvenance }).provenance ?? "none",
        }
      : null,
    matchQuality: resolved.matchQuality,
    matchType: resolved.matchType,
    fallbackReason: resolved.fallbackReason,
  };
}

type ScoredEmployee = {
  employee: SalaryReviewAiEmployeeInput;
  benchmark: SalaryReviewAiBenchmarkInput | null;
  matchQuality: BenchmarkMatchQuality;
  matchType: BenchmarkMatchType;
  fallbackReason: string | null;
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
  matchType: BenchmarkMatchType,
  fallbackReason: string | null,
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
    warnings.push(
      fallbackReason
        ? `Benchmark fallback: ${fallbackReason}`
        : "Benchmark fallback: strict role-level-location match is unavailable.",
    );
  }
  if (freshness.confidence === "low") {
    warnings.push("Benchmark freshness confidence is low.");
  }

  return {
    employee,
    benchmark,
    matchQuality,
    matchType,
    fallbackReason,
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
  const scored = selectedEmployees.map((employee) => {
    const matched = resolveBenchmarkMatch(employee, args.workspaceBenchmarks, args.ingestionBenchmarks);
    const freshness = getFreshnessForProvenance(args.freshness, matched.benchmark?.provenance ?? "none");
    return scoreEmployee(
      employee,
      matched.benchmark,
      matched.matchQuality,
      matched.matchType,
      matched.fallbackReason,
      freshness,
    );
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
      aiRationale: null,
      factors: entry.factors,
      benchmark: {
        provenance: entry.benchmark?.provenance ?? "none",
        sourceSlug: entry.benchmark?.sourceSlug ?? null,
        sourceName: entry.benchmark?.sourceName ?? null,
        matchQuality: entry.matchQuality,
        matchType: entry.matchType,
        fallbackReason: entry.fallbackReason,
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
    strategicSummary: null,
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

// ---------------------------------------------------------------------------
// Scenario generation
// ---------------------------------------------------------------------------

type ScenarioWeightProfile = {
  market: number;
  performance: number;
  band: number;
  tenure: number;
};

const SCENARIO_WEIGHT_PROFILES: Record<SalaryReviewAiScenarioId, ScenarioWeightProfile> = {
  hold: { market: 0, performance: 0, band: 0, tenure: 0 },
  balanced: { market: 0.45, performance: 0.25, band: 0.2, tenure: 0.1 },
  retention_first: { market: 0.55, performance: 0.15, band: 0.25, tenure: 0.05 },
  market_alignment: { market: 0.6, performance: 0.1, band: 0.25, tenure: 0.05 },
};

const SCENARIO_META: Record<SalaryReviewAiScenarioId, { label: string; description: string }> = {
  hold: {
    label: "Budget Hold",
    description: "No increases applied. Shows unresolved market risk and retention exposure.",
  },
  balanced: {
    label: "Balanced",
    description: "Allocates budget using market position, performance, band placement, and tenure signals.",
  },
  retention_first: {
    label: "Retention First",
    description: "Prioritizes employees furthest below market with strong performance to reduce flight risk.",
  },
  market_alignment: {
    label: "Market Alignment",
    description: "Focuses spending on closing the largest market gaps regardless of performance tier.",
  },
};

function applyPopulationFilters(
  employees: SalaryReviewAiEmployeeInput[],
  request: SalaryReviewAiPlanRequest,
  scored: ScoredEmployee[],
): ScoredEmployee[] {
  const exclusions = computeExclusionReasons(scored, request);
  return scored.filter((entry) => !exclusions.get(entry.employee.id));
}

function computeExclusionReasons(
  scored: ScoredEmployee[],
  request: SalaryReviewAiPlanRequest,
): Map<string, string | null> {
  const result = new Map<string, string | null>();
  const rules = request.populationRules;
  if (!rules) {
    for (const entry of scored) result.set(entry.employee.id, null);
    return result;
  }

  for (const entry of scored) {
    let reason: string | null = null;
    if (rules.excludeRecentHires) {
      const years = yearsSince(entry.employee.hireDate);
      if (years < 1) reason = "Excluded: hired less than 1 year ago.";
    }
    if (!reason && rules.excludeLowPerformers && entry.employee.performanceRating === "low") {
      reason = "Excluded: low performance rating.";
    }
    if (!reason && rules.exactBenchmarkOnly && entry.matchQuality !== "exact") {
      reason = "Excluded: no exact benchmark match for role, level and location.";
    }
    result.set(entry.employee.id, reason);
  }
  return result;
}

function computeRiskSummary(scored: ScoredEmployee[]): SalaryReviewAiRiskSummary {
  let belowMarketCount = 0;
  let belowMarketTotalGap = 0;
  let retentionRiskCount = 0;
  let totalMarketGapPct = 0;
  let benchmarkedCount = 0;

  for (const entry of scored) {
    if (!entry.benchmark) continue;
    const p50Annual = toAnnualBenchmark(entry.benchmark.p50);
    if (p50Annual <= 0) continue;

    benchmarkedCount += 1;
    const gapPct = ((p50Annual - entry.employee.baseSalary) / p50Annual) * 100;
    totalMarketGapPct += gapPct;

    if (gapPct > 3) {
      belowMarketCount += 1;
      belowMarketTotalGap += p50Annual - entry.employee.baseSalary;
    }
    if (
      gapPct > 10 &&
      entry.employee.performanceRating !== "low" &&
      entry.employee.performanceRating !== null
    ) {
      retentionRiskCount += 1;
    }
  }

  return {
    belowMarketCount,
    belowMarketTotalGap: Math.round(belowMarketTotalGap),
    retentionRiskCount,
    avgMarketGapPercent: benchmarkedCount > 0
      ? Math.round((totalMarketGapPct / benchmarkedCount) * 10) / 10
      : 0,
  };
}

function computeCohortContext(
  scored: ScoredEmployee[],
  totalCurrentPayroll: number,
): SalaryReviewAiCohortContext {
  let benchmarkedCount = 0;
  let totalGapPct = 0;

  for (const entry of scored) {
    if (!entry.benchmark) continue;
    const p50Annual = toAnnualBenchmark(entry.benchmark.p50);
    if (p50Annual <= 0) continue;
    benchmarkedCount += 1;
    totalGapPct += ((p50Annual - entry.employee.baseSalary) / p50Annual) * 100;
  }

  return {
    totalEmployees: scored.length,
    totalCurrentPayroll,
    benchmarkCoverage: scored.length > 0 ? Math.round((benchmarkedCount / scored.length) * 100) : 0,
    avgMarketGapPercent: benchmarkedCount > 0
      ? Math.round((totalGapPct / benchmarkedCount) * 10) / 10
      : 0,
  };
}

function buildScenarioFromScored(
  scenarioId: SalaryReviewAiScenarioId,
  scored: ScoredEmployee[],
  budget: number,
  totalCurrentPayroll: number,
  freshness: SalaryReviewAiFreshnessInput[],
  maxIncreasePercent: number | null,
  isRecommended: boolean,
  exclusions: Map<string, string | null> = new Map(),
): SalaryReviewAiScenario {
  const isExcluded = (id: string) => Boolean(exclusions.get(id));
  const meta = SCENARIO_META[scenarioId];
  const weights = SCENARIO_WEIGHT_PROFILES[scenarioId];

  if (scenarioId === "hold" || budget <= 0) {
    const items: SalaryReviewAiProposalItem[] = scored.map((entry) => {
      const f = getFreshnessForProvenance(freshness, entry.benchmark?.provenance ?? "none");
      const excluded = isExcluded(entry.employee.id);
      const reason = exclusions.get(entry.employee.id) ?? null;
      return {
        employeeId: entry.employee.id,
        employeeName: `${entry.employee.firstName} ${entry.employee.lastName}`.trim(),
        currentSalary: entry.employee.baseSalary,
        proposedIncrease: 0,
        proposedSalary: entry.employee.baseSalary,
        proposedPercentage: 0,
        confidence: entry.confidence,
        rationale: entry.rationale,
        aiRationale: null,
        factors: entry.factors,
        benchmark: {
          provenance: entry.benchmark?.provenance ?? "none",
          sourceSlug: entry.benchmark?.sourceSlug ?? null,
          sourceName: entry.benchmark?.sourceName ?? null,
          matchQuality: entry.matchQuality,
          matchType: entry.matchType,
          fallbackReason: entry.fallbackReason,
          freshness: f,
        },
        warnings: excluded && reason ? [...entry.warnings, reason] : entry.warnings,
        isExcluded: excluded,
        exclusionReason: reason,
      };
    });

    return {
      id: scenarioId === "hold" ? "hold" : scenarioId,
      label: scenarioId === "hold" ? meta.label : `${meta.label} (no budget)`,
      description: scenarioId === "hold"
        ? meta.description
        : `Budget is zero. ${meta.description}`,
      isRecommended: isRecommended && scenarioId === "hold",
      strategicSummary: null,
      summary: {
        mode: "assistive",
        budget: 0,
        budgetUsed: 0,
        budgetRemaining: 0,
        budgetUsedPercentage: 0,
        totalCurrentPayroll,
        totalProposedPayroll: totalCurrentPayroll,
        employeesConsidered: scored.length,
        employeesWithWarnings: items.filter((item) => item.warnings.length > 0).length,
      },
      items,
      warnings: [],
      riskSummary: computeRiskSummary(scored.filter((entry) => !isExcluded(entry.employee.id))),
    };
  }

  const reweighted = scored.map((entry) => {
    const marketFactor = entry.factors.find((f) => f.key === "market_gap");
    const perfFactor = entry.factors.find((f) => f.key === "performance");
    const bandFactor = entry.factors.find((f) => f.key === "band_position");
    const tenureFactor = entry.factors.find((f) => f.key === "tenure");

    const marketSignal = marketFactor ? impactToSignal(marketFactor.impact) : 0;
    const perfSignal = perfFactor ? impactToSignal(perfFactor.impact) : 0;
    const bandSignal = bandFactor ? impactToSignal(bandFactor.impact) : 0;
    const tenureSignal = tenureFactor ? impactToSignal(tenureFactor.impact) : 0;

    const score =
      marketSignal * weights.market +
      perfSignal * weights.performance +
      bandSignal * weights.band +
      tenureSignal * weights.tenure;

    return { ...entry, score };
  });

  const shares = reweighted.map((entry) => {
    if (isExcluded(entry.employee.id)) {
      return { id: entry.employee.id, share: 0 };
    }
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

  const items: SalaryReviewAiProposalItem[] = reweighted.map((entry) => {
    const excluded = isExcluded(entry.employee.id);
    const reason = exclusions.get(entry.employee.id) ?? null;

    let proposedIncrease = excluded ? 0 : Math.max(0, allocated.get(entry.employee.id) ?? 0);

    if (
      !excluded &&
      maxIncreasePercent != null &&
      maxIncreasePercent > 0 &&
      entry.employee.baseSalary > 0
    ) {
      const cap = Math.round((entry.employee.baseSalary * maxIncreasePercent) / 100);
      proposedIncrease = Math.min(proposedIncrease, cap);
    }

    const proposedSalary = entry.employee.baseSalary + proposedIncrease;
    const proposedPercentage =
      entry.employee.baseSalary > 0 ? (proposedIncrease / entry.employee.baseSalary) * 100 : 0;
    const f = getFreshnessForProvenance(freshness, entry.benchmark?.provenance ?? "none");

    return {
      employeeId: entry.employee.id,
      employeeName: `${entry.employee.firstName} ${entry.employee.lastName}`.trim(),
      currentSalary: entry.employee.baseSalary,
      proposedIncrease,
      proposedSalary,
      proposedPercentage,
      confidence: entry.confidence,
      rationale: entry.rationale,
      aiRationale: null,
      factors: entry.factors,
      benchmark: {
        provenance: entry.benchmark?.provenance ?? "none",
        sourceSlug: entry.benchmark?.sourceSlug ?? null,
        sourceName: entry.benchmark?.sourceName ?? null,
        matchQuality: entry.matchQuality,
        matchType: entry.matchType,
        fallbackReason: entry.fallbackReason,
        freshness: f,
      },
      warnings: excluded && reason ? [...entry.warnings, reason] : entry.warnings,
      isExcluded: excluded,
      exclusionReason: reason,
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
    id: scenarioId,
    label: meta.label,
    description: meta.description,
    isRecommended,
    strategicSummary: null,
    summary: {
      mode: "assistive",
      budget,
      budgetUsed,
      budgetRemaining,
      budgetUsedPercentage: budget > 0 ? (budgetUsed / budget) * 100 : 0,
      totalCurrentPayroll,
      totalProposedPayroll: totalCurrentPayroll + budgetUsed,
      employeesConsidered: scored.length,
      employeesWithWarnings: items.filter((item) => item.warnings.length > 0).length,
    },
    items,
    warnings,
    riskSummary: computeRiskSummary(reweighted.filter((entry) => !isExcluded(entry.employee.id))),
  };
}

function impactToSignal(impact: "positive" | "neutral" | "negative"): number {
  if (impact === "positive") return 0.6;
  if (impact === "negative") return -0.6;
  return 0;
}

function pickRecommendedScenario(
  objective: SalaryReviewAiObjective | undefined,
  budget: number,
): SalaryReviewAiScenarioId {
  if (budget <= 0) return "hold";
  switch (objective) {
    case "retention":
      return "retention_first";
    case "performance":
      return "balanced";
    case "equity":
      return "market_alignment";
    default:
      return "balanced";
  }
}

function selectScenariosToGenerate(
  budget: number,
  budgetIntent: SalaryReviewAiPlanRequest["budgetIntent"],
): SalaryReviewAiScenarioId[] {
  const scenarios: SalaryReviewAiScenarioId[] = ["hold"];

  if (budget > 0) {
    scenarios.push("balanced", "retention_first");
  }

  if (budgetIntent === "show_ideal" || budget > 0) {
    scenarios.push("market_alignment");
  }

  return scenarios;
}

function computeIdealBudget(scored: ScoredEmployee[]): number {
  let totalNeeded = 0;
  for (const entry of scored) {
    if (!entry.benchmark) continue;
    const p50Annual = toAnnualBenchmark(entry.benchmark.p50);
    if (p50Annual <= 0) continue;
    const gap = p50Annual - entry.employee.baseSalary;
    if (gap > 0) totalNeeded += gap;
  }
  return Math.round(totalNeeded);
}

export function buildSalaryReviewAiScenarios(args: {
  request: SalaryReviewAiPlanRequest;
  employees: SalaryReviewAiEmployeeInput[];
  workspaceBenchmarks: SalaryReviewAiBenchmarkInput[];
  ingestionBenchmarks: SalaryReviewAiBenchmarkInput[];
  freshness: SalaryReviewAiFreshnessInput[];
}): SalaryReviewAiScenarioResponse {
  const selectedIds = new Set(args.request.selectedEmployeeIds ?? []);
  const selectedEmployees = args.request.selectedEmployeeIds?.length
    ? args.employees.filter((employee) => selectedIds.has(employee.id))
    : args.employees;

  const totalCurrentPayroll = selectedEmployees.reduce((sum, employee) => sum + employee.baseSalary, 0);
  const userBudget = getBudgetFromRequest(args.request, totalCurrentPayroll);

  const allScored = selectedEmployees.map((employee) => {
    const matched = resolveBenchmarkMatch(employee, args.workspaceBenchmarks, args.ingestionBenchmarks);
    const freshness = getFreshnessForProvenance(args.freshness, matched.benchmark?.provenance ?? "none");
    return scoreEmployee(
      employee,
      matched.benchmark,
      matched.matchQuality,
      matched.matchType,
      matched.fallbackReason,
      freshness,
    );
  });

  const exclusions = computeExclusionReasons(allScored, args.request);
  const eligibleForBudget = allScored.filter((entry) => !exclusions.get(entry.employee.id));

  const scenarioIds = selectScenariosToGenerate(userBudget, args.request.budgetIntent);
  const recommended = pickRecommendedScenario(args.request.objective, userBudget);
  const maxIncreasePct = args.request.populationRules?.maxIncreasePercent ?? null;

  const scenarios: SalaryReviewAiScenario[] = scenarioIds.map((id) => {
    let scenarioBudget = id === "hold" ? 0 : userBudget;

    if (id === "market_alignment" && args.request.budgetIntent === "show_ideal") {
      const ideal = computeIdealBudget(eligibleForBudget);
      scenarioBudget = Math.max(scenarioBudget, ideal);
    }

    return buildScenarioFromScored(
      id,
      allScored,
      scenarioBudget,
      totalCurrentPayroll,
      args.freshness,
      maxIncreasePct,
      id === recommended,
      exclusions,
    );
  });

  return {
    generatedAt: new Date().toISOString(),
    scenarios,
    cohortContext: computeCohortContext(allScored, totalCurrentPayroll),
  };
}

export const __internal = {
  resolveBenchmarkMatch,
  allocateRoundedBudget,
  applyPopulationFilters,
  computeExclusionReasons,
  computeRiskSummary,
  computeCohortContext,
  buildScenarioFromScored,
  selectScenariosToGenerate,
  pickRecommendedScenario,
  computeIdealBudget,
};

