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
};

type UnderMarketMatch = {
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
};

type SupportedResolution =
  | { handled: false }
  | {
      handled: true;
      payload: ChatFinalPayload;
    };

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
  if (!isUnderMarketQuestion(question)) {
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
    .select("id,first_name,last_name,department,role_id,level_id,location_id,base_salary,status")
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
  if (!isUnderMarketQuestion(question)) {
    return { handled: false };
  }

  const requestedCount = inferRequestedResultCount(question);
  const ranked = rankUnderMarketEmployees(employees, marketBenchmarks);
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
  matches: UnderMarketMatch[],
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
    lines.push(
      `Your ${countLabel(matches.length)} most under-market employees are ranked below.`,
    );
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
    `- Ranked by percentage gap between current base salary and the Qeemly market p50.`,
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

  if (unmatchedEmployees.length > 0) {
    lines.push(
      "",
      "Missing data:",
      `- ${unmatchedEmployees.join(", ")} could not be matched to a Qeemly market benchmark.`,
    );
  }

  return lines.join("\n");
}

function countLabel(count: number): string {
  if (count === 1) return "1";
  if (count === 2) return "two";
  if (count === 3) return "three";
  if (count === 4) return "four";
  if (count === 5) return "five";
  return String(count);
}

function isUnderMarketQuestion(question: string): boolean {
  return /\bunder[- ]market\b/i.test(question) || /\bbelow market\b/i.test(question);
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

function rankUnderMarketEmployees(
  employees: EmployeeRow[],
  marketBenchmarks: MarketBenchmark[],
): {
  matches: UnderMarketMatch[];
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

  const matches: UnderMarketMatch[] = [];
  const unmatchedEmployees: string[] = [];

  for (const employee of employees) {
    const exactKey = `${employee.role_id}::${employee.location_id}::${employee.level_id}`;
    const fallbackKey = `${employee.role_id}::${employee.level_id}`;
    const exactBenchmark = exactMap.get(exactKey);
    const fallbackBenchmark = roleLevelMap.get(fallbackKey);
    const benchmark = exactBenchmark || fallbackBenchmark;

    if (!benchmark) {
      unmatchedEmployees.push(fullName(employee));
      continue;
    }

    const marketP25 = toAnnual(Number(benchmark.p25) || 0);
    const marketP50 = toAnnual(Number(benchmark.p50) || 0);
    const baseSalary = Number(employee.base_salary) || 0;
    if (marketP50 <= 0 || baseSalary >= marketP50) {
      continue;
    }

    matches.push({
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
    });
  }

  matches.sort((left, right) => right.gapPct - left.gapPct || left.name.localeCompare(right.name));

  return { matches, unmatchedEmployees };
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
