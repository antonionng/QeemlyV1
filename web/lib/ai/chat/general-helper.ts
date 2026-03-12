import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";
import type { ChatFinalPayload } from "@/lib/ai/chat/protocol";
import type { MarketBenchmark } from "@/lib/benchmarks/platform-market";

type EmployeeRow = {
  id: string;
  first_name: string;
  last_name: string;
  department?: string | null;
  role_id: string;
  level_id: string;
  location_id: string;
  base_salary: number;
  status?: string | null;
  hire_date?: string | null;
  last_review_date?: string | null;
  performance_rating?: "low" | "meets" | "exceeds" | "exceptional" | null;
};

type EmployeeMarketMatch = {
  employeeId: string;
  name: string;
  department: string;
  roleId: string;
  roleTitle: string;
  levelId: string;
  levelName: string;
  locationId: string;
  locationName: string;
  currency: string;
  baseSalary: number;
  marketP25: number;
  marketP50: number;
  gapPct: number;
  belowP25: boolean;
  matchQuality: "exact" | "role_level_fallback";
  sampleSize: number | null;
  hireDate: string | null;
  lastReviewDate: string | null;
  performanceRating: EmployeeRow["performance_rating"];
  retentionRiskScore: number;
};

type SupportedResolution =
  | { handled: false }
  | {
      handled: true;
      payload: ChatFinalPayload;
    };

type HelperIntent = "under_market" | "retention_risk" | "department_gaps" | "coverage_gaps" | null;

const MAX_RESULT_COUNT = 5;

export async function resolveGeneralHelperQuestion(args: {
  supabase: {
    from: (table: string) => unknown;
  };
  workspaceId: string;
  message: string;
  marketBenchmarks: MarketBenchmark[];
}): Promise<SupportedResolution> {
  const question = args.message.trim();
  if (!detectIntent(question)) {
    return { handled: false };
  }

  const { data, error } = (await (args.supabase
    .from("employees") as {
      select: (columns: string) => {
        eq: (column: string, value: unknown) => {
          eq: (column: string, value: unknown) => Promise<{
            data: EmployeeRow[] | null;
            error: { message?: string } | null;
          }>;
        };
      };
    })
    .select(
      "id,first_name,last_name,department,role_id,level_id,location_id,base_salary,status,hire_date,last_review_date,performance_rating",
    )
    .eq("workspace_id", args.workspaceId)
    .eq("status", "active")) as {
    data: EmployeeRow[] | null;
    error: { message?: string } | null;
  };

  if (error) {
    throw new Error(error.message || "Failed to load employees for helper chat");
  }

  return resolveSupportedQuestion(question, data || [], args.marketBenchmarks);
}

function resolveSupportedQuestion(
  question: string,
  employees: EmployeeRow[],
  marketBenchmarks: MarketBenchmark[],
): SupportedResolution {
  const intent = detectIntent(question);
  if (!intent) {
    return { handled: false };
  }

  const ranked = rankMatchedEmployees(employees, marketBenchmarks);

  if (intent === "coverage_gaps") {
    return {
      handled: true,
      payload: {
        mode: "general",
        answer: buildCoverageAnswer(ranked.unmatchedEmployees, employees.length),
        missing_data:
          ranked.unmatchedEmployees.length > 0
            ? [`${ranked.unmatchedEmployees.length} active employees could not be matched to a Qeemly market benchmark.`]
            : [],
      },
    };
  }

  if (intent === "department_gaps") {
    return {
      handled: true,
      payload: {
        mode: "general",
        answer: buildDepartmentGapAnswer(ranked.matches, ranked.unmatchedEmployees),
        missing_data:
          ranked.unmatchedEmployees.length > 0
            ? [`${ranked.unmatchedEmployees.length} active employees could not be matched to a Qeemly market benchmark.`]
            : [],
      },
    };
  }

  if (intent === "retention_risk") {
    return {
      handled: true,
      payload: {
        mode: "general",
        answer: buildRetentionRiskAnswer(ranked.matches, ranked.unmatchedEmployees),
        missing_data:
          ranked.unmatchedEmployees.length > 0
            ? [`${ranked.unmatchedEmployees.length} active employees could not be matched to a Qeemly market benchmark.`]
            : [],
      },
    };
  }

  const requestedCount = inferRequestedResultCount(question);
  const topMatches = ranked.matches.slice(0, requestedCount);

  if (topMatches.length === 0) {
    return {
      handled: true,
      payload: {
        mode: "general",
        answer: buildNoMatchesAnswer(ranked.unmatchedEmployees),
        missing_data:
          ranked.unmatchedEmployees.length > 0
            ? [`${ranked.unmatchedEmployees.length} active employees could not be matched to a Qeemly market benchmark.`]
            : [],
      },
    };
  }

  return {
    handled: true,
    payload: {
      mode: "general",
      answer: buildUnderMarketAnswer(question, topMatches, ranked.matches.length, ranked.unmatchedEmployees),
      missing_data:
        ranked.unmatchedEmployees.length > 0
          ? [`${ranked.unmatchedEmployees.length} active employees could not be matched to a Qeemly market benchmark.`]
          : [],
    },
  };
}

function detectIntent(question: string): HelperIntent {
  if (/\bweak benchmark coverage\b|\bbenchmark coverage\b|\bcoverage gap\b/i.test(question)) {
    return "coverage_gaps";
  }
  if (/\bdepartment\b.*\bbelow market\b|\bdepartment\b.*\bunder[- ]market\b|\bfurthest below market\b/i.test(question)) {
    return "department_gaps";
  }
  if (/\bretention risk\b|\bflight risk\b/i.test(question)) {
    return "retention_risk";
  }
  if (/\bunder[- ]market\b/i.test(question) || /\bbelow market\b/i.test(question)) {
    return "under_market";
  }
  return null;
}

function buildNoMatchesAnswer(unmatchedEmployees: string[]): string {
  const lines = [
    "I could not find any active employees with a Qeemly market benchmark match below market right now.",
  ];

  if (unmatchedEmployees.length > 0) {
    lines.push(
      "",
      "Missing data:",
      `- ${unmatchedEmployees.length} active employees could not be matched to a Qeemly market benchmark.`,
    );
  }

  return lines.join("\n");
}

function buildUnderMarketAnswer(
  question: string,
  matches: EmployeeMarketMatch[],
  totalMatchedUnderMarket: number,
  unmatchedEmployees: string[],
): string {
  const singular = isSingularRequest(question);
  const top = matches[0];
  const lines: string[] = [];

  if (singular) {
    lines.push(
      `The most under-market employee is ${top.name}, ${top.gapPct}% below the Qeemly market median for ${top.roleTitle} in ${top.locationName}.`,
    );
  } else {
    lines.push(`Your ${countLabel(matches.length)} most under-market employees are ranked below.`);
  }

  lines.push("");

  for (const [index, match] of matches.entries()) {
    lines.push(
      `${index + 1}. ${match.name} - ${match.roleTitle}, ${match.levelName}, ${match.locationName}. ${formatCurrency(match.currency, match.baseSalary)} vs market p50 ${formatCurrency(match.currency, match.marketP50)} (${match.gapPct}% below market).`,
    );
  }

  lines.push(
    "",
    "Evidence:",
    "- Ranked by percentage gap between current base salary and the Qeemly market p50.",
    `- ${totalMatchedUnderMarket} active employees in this workspace are below the market median with a benchmark match.`,
    `- ${matches.filter((match) => match.belowP25).length} of the displayed employees are below market p25.`,
  );

  if (matches.some((match) => match.matchQuality === "role_level_fallback")) {
    lines.push("- Some results use a role-and-level fallback because an exact location benchmark was not available.");
  }

  lines.push(
    "",
    "Next steps:",
    "- Review the top-ranked employees in Salary Review.",
    "- Check whether the affected roles cluster in one department or location.",
  );

  appendMissingData(lines, unmatchedEmployees);
  return lines.join("\n");
}

function buildRetentionRiskAnswer(matches: EmployeeMarketMatch[], unmatchedEmployees: string[]): string {
  if (matches.length === 0) {
    return buildNoMatchesAnswer(unmatchedEmployees);
  }

  const top = [...matches].sort((left, right) => right.retentionRiskScore - left.retentionRiskScore)[0];
  const lines = [
    `The highest retention risk employee is ${top.name}, an ${describePerformance(top.performanceRating)} performer who is ${top.gapPct}% below the Qeemly market median for ${top.roleTitle} in ${top.locationName}.`,
    "",
    "Evidence:",
    `- Retention risk score: ${top.retentionRiskScore}/100.`,
    `- Current base salary is ${formatCurrency(top.currency, top.baseSalary)} versus market p50 ${formatCurrency(top.currency, top.marketP50)}.`,
    `- Last review ${formatReviewDate(top.lastReviewDate)} and tenure ${formatTenure(top.hireDate)} increase the need for attention.`,
    "",
    "Next steps:",
    "- Review this employee first in Salary Review.",
    "- Compare this employee against peers in the same role and location.",
  ];

  appendMissingData(lines, unmatchedEmployees);
  return lines.join("\n");
}

function buildDepartmentGapAnswer(matches: EmployeeMarketMatch[], unmatchedEmployees: string[]): string {
  if (matches.length === 0) {
    return buildNoMatchesAnswer(unmatchedEmployees);
  }

  const departmentMap = new Map<
    string,
    { totalGap: number; count: number; employees: EmployeeMarketMatch[] }
  >();

  for (const match of matches) {
    const existing = departmentMap.get(match.department) || { totalGap: 0, count: 0, employees: [] };
    existing.totalGap += match.gapPct;
    existing.count += 1;
    existing.employees.push(match);
    departmentMap.set(match.department, existing);
  }

  const topDepartment = [...departmentMap.entries()]
    .map(([department, summary]) => ({
      department,
      avgGap: Math.round(summary.totalGap / summary.count),
      employees: summary.employees.sort((left, right) => right.gapPct - left.gapPct),
      count: summary.count,
    }))
    .sort((left, right) => right.avgGap - left.avgGap)[0];

  const lines = [
    `${topDepartment.department} is the department furthest below market, averaging ${topDepartment.avgGap}% below the Qeemly market median across ${topDepartment.count} matched employee${topDepartment.count === 1 ? "" : "s"}.`,
    "",
    "Top impacted employees:",
    ...topDepartment.employees.slice(0, 3).map(
      (employee, index) =>
        `${index + 1}. ${employee.name} - ${employee.roleTitle} in ${employee.locationName} (${employee.gapPct}% below market).`,
    ),
    "",
    "Next steps:",
    "- Review whether this gap is isolated to one role family or reflects a broader department issue.",
    "- Compare the department's pay positioning against your current budget plan.",
  ];

  appendMissingData(lines, unmatchedEmployees);
  return lines.join("\n");
}

function buildCoverageAnswer(unmatchedEmployees: string[], totalEmployees: number): string {
  if (unmatchedEmployees.length === 0) {
    return [
      "Benchmark coverage looks strong right now.",
      "",
      "Evidence:",
      `- All ${totalEmployees} active employees in this workspace have a Qeemly market benchmark match.`,
    ].join("\n");
  }

  return [
    `There is weak benchmark coverage for ${unmatchedEmployees.length} active employee${unmatchedEmployees.length === 1 ? "" : "s"}.`,
    "",
    "Coverage gaps:",
    `- ${unmatchedEmployees.length} active employee${unmatchedEmployees.length === 1 ? "" : "s"} could not be matched to a Qeemly market benchmark.`,
    `- Affected employees: ${unmatchedEmployees.join(", ")}.`,
    `- Coverage rate: ${Math.round(((totalEmployees - unmatchedEmployees.length) / Math.max(1, totalEmployees)) * 100)}% of active employees are matched today.`,
    "",
    "Next steps:",
    "- Check whether the missing roles need new benchmark mappings or fresh market data.",
    "- Review unmatched roles before relying on broad compensation recommendations.",
  ].join("\n");
}

function appendMissingData(lines: string[], unmatchedEmployees: string[]) {
  if (unmatchedEmployees.length === 0) {
    return;
  }

  lines.push("", "Missing data:", `- ${unmatchedEmployees.join(", ")} could not be matched to a Qeemly market benchmark.`);
}

function countLabel(count: number): string {
  if (count === 1) return "1";
  if (count === 2) return "two";
  if (count === 3) return "three";
  if (count === 4) return "four";
  if (count === 5) return "five";
  return String(count);
}

function isSingularRequest(question: string): boolean {
  if (/\btop\s+\d+\b/i.test(question)) return false;
  if (/\bemployees\b|\bpeople\b|\bteam\b/i.test(question)) return false;
  return /\bwho\b|\bemployee\b/i.test(question);
}

function inferRequestedResultCount(question: string): number {
  const explicitCount = question.match(/\btop\s+(\d+)\b/i)?.[1];
  if (explicitCount) {
    return Math.max(1, Math.min(MAX_RESULT_COUNT, Number(explicitCount)));
  }

  return isSingularRequest(question) ? 1 : 3;
}

function rankMatchedEmployees(
  employees: EmployeeRow[],
  marketBenchmarks: MarketBenchmark[],
): {
  matches: EmployeeMarketMatch[];
  unmatchedEmployees: string[];
} {
  const exactMap = new Map<string, MarketBenchmark>();
  const roleLevelMap = new Map<string, MarketBenchmark>();

  for (const benchmark of marketBenchmarks) {
    const exactKey = `${benchmark.role_id}::${benchmark.location_id}::${benchmark.level_id}`;
    if (!exactMap.has(exactKey)) {
      exactMap.set(exactKey, benchmark);
    }

    const fallbackKey = `${benchmark.role_id}::${benchmark.level_id}`;
    if (!roleLevelMap.has(fallbackKey)) {
      roleLevelMap.set(fallbackKey, benchmark);
    }
  }

  const matches: EmployeeMarketMatch[] = [];
  const unmatchedEmployees: string[] = [];

  for (const employee of employees) {
    const exactKey = `${employee.role_id}::${employee.location_id}::${employee.level_id}`;
    const fallbackKey = `${employee.role_id}::${employee.level_id}`;
    const exactBenchmark = exactMap.get(exactKey);
    const fallbackBenchmark = roleLevelMap.get(fallbackKey);
    const benchmark = exactBenchmark || fallbackBenchmark;

    if (!benchmark) {
      unmatchedEmployees.push(`${fullName(employee)} (${employee.role_id})`);
      continue;
    }

    const marketP25 = toAnnual(Number(benchmark.p25) || 0);
    const marketP50 = toAnnual(Number(benchmark.p50) || 0);
    const baseSalary = Number(employee.base_salary) || 0;
    if (marketP50 <= 0 || baseSalary >= marketP50) {
      continue;
    }

    const match: EmployeeMarketMatch = {
      employeeId: employee.id,
      name: fullName(employee),
      department: employee.department || "Unknown",
      roleId: employee.role_id,
      roleTitle: ROLES.find((role) => role.id === employee.role_id)?.title || humanizeId(employee.role_id),
      levelId: employee.level_id,
      levelName: LEVELS.find((level) => level.id === employee.level_id)?.name || humanizeId(employee.level_id),
      locationId: employee.location_id,
      locationName:
        LOCATIONS.find((location) => location.id === employee.location_id)?.city || humanizeId(employee.location_id),
      currency: benchmark.currency,
      baseSalary,
      marketP25,
      marketP50,
      gapPct: Math.round(((marketP50 - baseSalary) / marketP50) * 100),
      belowP25: baseSalary < marketP25,
      matchQuality: exactBenchmark ? "exact" : "role_level_fallback",
      sampleSize: benchmark.sample_size,
      hireDate: employee.hire_date || null,
      lastReviewDate: employee.last_review_date || null,
      performanceRating: employee.performance_rating || null,
      retentionRiskScore: 0,
    };

    match.retentionRiskScore = computeRetentionRiskScore(match);
    matches.push(match);
  }

  matches.sort((left, right) => right.gapPct - left.gapPct || left.name.localeCompare(right.name));
  return { matches, unmatchedEmployees };
}

function computeRetentionRiskScore(match: EmployeeMarketMatch): number {
  let score = match.gapPct * 2;

  if (match.performanceRating === "exceptional") score += 30;
  else if (match.performanceRating === "exceeds") score += 20;
  else if (match.performanceRating === "meets") score += 8;

  if (match.belowP25) score += 10;

  const tenureYears = getTenureYears(match.hireDate);
  if (tenureYears >= 3) score += 8;
  else if (tenureYears >= 1) score += 4;

  const monthsSinceReview = getMonthsSince(match.lastReviewDate);
  if (monthsSinceReview >= 12) score += 10;
  else if (monthsSinceReview >= 6) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getTenureYears(dateValue: string | null): number {
  if (!dateValue) return 0;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 0;
  return (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

function getMonthsSince(dateValue: string | null): number {
  if (!dateValue) return 99;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 99;
  return (Date.now() - date.getTime()) / (30 * 24 * 60 * 60 * 1000);
}

function describePerformance(rating: EmployeeRow["performance_rating"]): string {
  if (rating === "exceptional") return "exceptional";
  if (rating === "exceeds") return "strong";
  if (rating === "meets") return "solid";
  if (rating === "low") return "low";
  return "unrated";
}

function formatReviewDate(dateValue: string | null): string {
  if (!dateValue) return "is missing";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "is missing";
  return `was on ${date.toISOString().slice(0, 10)}`;
}

function formatTenure(dateValue: string | null): string {
  const tenureYears = getTenureYears(dateValue);
  if (tenureYears <= 0) return "is unknown";
  return `is ${Math.round(tenureYears)} years`;
}

function toAnnual(value: number): number {
  return value < 100_000 ? value * 12 : value;
}

function fullName(employee: EmployeeRow): string {
  return `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Unknown employee";
}

function humanizeId(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCurrency(currency: string, value: number): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export const __internal = {
  resolveSupportedQuestion,
};
