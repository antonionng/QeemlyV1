import { getBenchmarkModel, getOpenAIClient } from "@/lib/ai/openai";
import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";
import type {
  SalaryReviewAiPlanRequest,
  SalaryReviewAiPlanResponse,
  SalaryReviewAiScenarioResponse,
} from "./ai-plan";
import type { SalaryReviewAiEmployeeInput } from "./ai-plan-engine";

export type SalaryReviewAiRationaleResult = {
  strategicSummary: string;
  items: Array<{
    employeeId: string;
    aiRationale: string;
  }>;
};

const JSON_SCHEMA = {
  name: "salary_review_ai_rationale",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      strategicSummary: { type: "string" as const },
      items: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            employeeId: { type: "string" as const },
            aiRationale: { type: "string" as const },
          },
          required: ["employeeId", "aiRationale"],
          additionalProperties: false,
        },
      },
    },
    required: ["strategicSummary", "items"],
    additionalProperties: false,
  },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
}

function labelForRole(roleId: string): string {
  return ROLES.find((role) => role.id === roleId)?.title ?? roleId;
}

function labelForLevel(levelId: string): string {
  return LEVELS.find((level) => level.id === levelId)?.name ?? levelId;
}

function labelForLocation(locationId: string): string {
  const location = LOCATIONS.find((entry) => entry.id === locationId);
  if (!location) return locationId;
  return `${location.city}, ${location.country}`;
}

function buildPrompt(args: {
  request: SalaryReviewAiPlanRequest;
  employees: SalaryReviewAiEmployeeInput[];
  plan: SalaryReviewAiPlanResponse;
  reviewContext: {
    industry: string | null;
    companySize: string | null;
  };
}): string {
  const itemsByEmployeeId = new Map(args.plan.items.map((item) => [item.employeeId, item]));
  const employeeLines = args.employees
    .map((employee) => {
      const item = itemsByEmployeeId.get(employee.id);
      if (!item) return null;

      const warnings = item.warnings.length > 0 ? item.warnings.join("; ") : "none";
      const factors =
        item.factors.length > 0
          ? item.factors.map((factor) => `${factor.label}: ${factor.value}`).join("; ")
          : "none";

      return [
        `Employee: ${item.employeeName}`,
        `Employee ID: ${employee.id}`,
        `Role: ${labelForRole(employee.roleId)}`,
        `Level: ${labelForLevel(employee.levelId)}`,
        `Location: ${labelForLocation(employee.locationId)}`,
        `Current salary: ${formatCurrency(item.currentSalary)}`,
        `Proposed increase: ${formatCurrency(item.proposedIncrease)} (${item.proposedPercentage.toFixed(1)}%)`,
        `Proposed salary: ${formatCurrency(item.proposedSalary)}`,
        `Performance: ${employee.performanceRating ?? "unavailable"}`,
        `Tenure start: ${employee.hireDate ?? "unavailable"}`,
        `Confidence: ${item.confidence}/100`,
        `Benchmark source: ${item.benchmark.sourceName ?? item.benchmark.provenance}`,
        `Benchmark match quality: ${item.benchmark.matchQuality}`,
        `Existing rationale: ${item.rationale.join(" ")}`,
        `Supporting factors: ${factors}`,
        `Warnings: ${warnings}`,
      ].join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  const companySize = args.reviewContext.companySize ?? "Unknown";
  const industry = args.reviewContext.industry ?? "General market";
  const budgetPolicy =
    args.request.budgetType === "absolute"
      ? `Absolute budget of ${formatCurrency(args.request.budgetAbsolute ?? 0)}`
      : `Budget of ${(args.request.budgetPercentage ?? 0).toFixed(1)}% of payroll`;

  return `You are Qeemly AI Advisory, acting as a senior compensation and rewards analyst for a salary review cycle.

Generate:
1. A cohort-level strategic summary in 2 to 4 sentences.
2. One employee rationale per employee, written in 2 to 3 sentences.

Guidance:
- Keep all recommendations aligned to the already-determined increases. Do not change the money.
- Focus on the why: market position, performance evidence, benchmark strength, pay discipline, and risk.
- Be specific and executive-ready. No bullet points, markdown, or filler.
- If evidence is weak, say so clearly but professionally.
- Reference the current industry and company size context when relevant.

Cycle: ${args.request.cycle}
Budget policy: ${budgetPolicy}
Budget used: ${formatCurrency(args.plan.summary.budgetUsed)}
Employees considered: ${args.plan.summary.employeesConsidered}
Industry: ${industry}
Company size: ${companySize}

Employees:
${employeeLines}`;
}

export async function generateSalaryReviewAiRationale(args: {
  request: SalaryReviewAiPlanRequest;
  employees: SalaryReviewAiEmployeeInput[];
  plan: SalaryReviewAiPlanResponse;
  reviewContext: {
    industry: string | null;
    companySize: string | null;
  };
}): Promise<SalaryReviewAiRationaleResult | null> {
  if (args.plan.items.length === 0 || args.employees.length === 0) {
    return null;
  }

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: getBenchmarkModel(),
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a compensation analyst. Return only JSON that matches the requested schema. Do not include markdown.",
        },
        {
          role: "user",
          content: buildPrompt(args),
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

    const parsed = JSON.parse(content) as SalaryReviewAiRationaleResult;
    if (!parsed.strategicSummary?.trim()) {
      throw new Error("Missing strategic summary");
    }

    const validEmployeeIds = new Set(args.plan.items.map((item) => item.employeeId));
    const items = parsed.items.filter(
      (item) => validEmployeeIds.has(item.employeeId) && item.aiRationale.trim().length > 0,
    );

    if (items.length === 0) {
      throw new Error("Missing employee rationale");
    }

    return {
      strategicSummary: parsed.strategicSummary.trim(),
      items: items.map((item) => ({
        employeeId: item.employeeId,
        aiRationale: item.aiRationale.trim(),
      })),
    };
  } catch (error) {
    console.error("[salary-review/ai-rationale] GPT rationale call failed:", error);
    return null;
  }
}

const SCENARIO_RATIONALE_SCHEMA = {
  name: "salary_review_scenario_rationale",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      scenarios: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            scenarioId: { type: "string" as const },
            strategicSummary: { type: "string" as const },
          },
          required: ["scenarioId", "strategicSummary"],
          additionalProperties: false,
        },
      },
    },
    required: ["scenarios"],
    additionalProperties: false,
  },
};

type ScenarioRationaleGptResult = {
  scenarios: Array<{
    scenarioId: string;
    strategicSummary: string;
  }>;
};

function buildScenarioPrompt(args: {
  request: SalaryReviewAiPlanRequest;
  scenarioResponse: SalaryReviewAiScenarioResponse;
  reviewContext: { industry: string | null; companySize: string | null };
}): string {
  const companySize = args.reviewContext.companySize ?? "Unknown";
  const industry = args.reviewContext.industry ?? "General market";
  const budgetPolicy =
    args.request.budgetType === "absolute"
      ? `Absolute budget of ${formatCurrency(args.request.budgetAbsolute ?? 0)}`
      : `Budget of ${(args.request.budgetPercentage ?? 0).toFixed(1)}% of payroll`;

  const objective = args.request.objective ?? "balanced";
  const cohort = args.scenarioResponse.cohortContext;

  const scenarioLines = args.scenarioResponse.scenarios.map((scenario) => {
    const risk = scenario.riskSummary;
    return [
      `Scenario: ${scenario.label} (${scenario.id})`,
      `  Description: ${scenario.description}`,
      `  Budget used: ${formatCurrency(scenario.summary.budgetUsed)} of ${formatCurrency(scenario.summary.budget)}`,
      `  Employees with increases: ${scenario.items.filter((i) => i.proposedIncrease > 0).length} of ${scenario.summary.employeesConsidered}`,
      `  Below-market employees: ${risk.belowMarketCount}`,
      `  Retention risk count: ${risk.retentionRiskCount}`,
      `  Avg market gap: ${risk.avgMarketGapPercent}%`,
      `  Recommended: ${scenario.isRecommended ? "Yes" : "No"}`,
    ].join("\n");
  }).join("\n\n");

  return `You are Qeemly AI Advisory, acting as a senior compensation and rewards analyst for a salary review cycle with multiple scenarios.

Generate a strategic summary for each scenario in 2 to 3 sentences. Each summary should:
- Explain the trade-offs of that scenario versus the alternatives.
- Reference specific risk metrics (below-market count, retention risk, market gap).
- Be executive-ready and specific. No filler.

Objective: ${objective}
Cycle: ${args.request.cycle}
Budget policy: ${budgetPolicy}
Industry: ${industry}
Company size: ${companySize}
Total employees: ${cohort.totalEmployees}
Benchmark coverage: ${cohort.benchmarkCoverage}%
Avg market gap: ${cohort.avgMarketGapPercent}%

Scenarios:
${scenarioLines}`;
}

export async function generateScenarioRationale(args: {
  request: SalaryReviewAiPlanRequest;
  employees: SalaryReviewAiEmployeeInput[];
  scenarioResponse: SalaryReviewAiScenarioResponse;
  reviewContext: { industry: string | null; companySize: string | null };
}): Promise<SalaryReviewAiScenarioResponse | null> {
  if (args.scenarioResponse.scenarios.length === 0) return null;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: getBenchmarkModel(),
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a compensation analyst. Return only JSON that matches the requested schema. Do not include markdown.",
        },
        {
          role: "user",
          content: buildScenarioPrompt(args),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: SCENARIO_RATIONALE_SCHEMA,
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as ScenarioRationaleGptResult;
    const summaryById = new Map(
      parsed.scenarios.map((s) => [s.scenarioId, s.strategicSummary.trim()]),
    );

    return {
      ...args.scenarioResponse,
      scenarios: args.scenarioResponse.scenarios.map((scenario) => ({
        ...scenario,
        strategicSummary: summaryById.get(scenario.id) ?? null,
      })),
    };
  } catch (error) {
    console.error("[salary-review/ai-rationale] Scenario rationale call failed:", error);
    return null;
  }
}
