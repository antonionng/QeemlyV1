import { getChatModel, getOpenAIClient } from "@/lib/ai/openai";

export type EmployeeAdvisoryInput = {
  id: string;
  firstName: string;
  lastName: string;
  roleName: string;
  levelName: string;
  locationName: string;
  department: string;
  baseSalary: number;
  bandPosition: "below" | "in-band" | "above";
  bandPercentile: number;
  marketComparison: number;
  performanceRating: "low" | "meets" | "exceeds" | "exceptional" | null;
  tenureLabel: string;
  proposedIncrease: number;
  benchmark: {
    source: string | null;
    matchQuality: string | null;
    confidence: string | null;
  };
};

export type EmployeeAdvisoryResult = {
  summary: string;
};

type AdvisoryCacheEntry = {
  summary: EmployeeAdvisoryResult;
  createdAt: number;
};

const advisoryCache = new Map<string, AdvisoryCacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

const JSON_SCHEMA = {
  name: "employee_salary_review_advisory",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      summary: { type: "string" as const },
    },
    required: ["summary"],
    additionalProperties: false,
  },
};

function buildCacheKey(args: {
  employee: EmployeeAdvisoryInput;
  reviewContext: {
    industry: string | null;
    companySize: string | null;
  };
}): string {
  return JSON.stringify(args);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildPrompt(args: {
  employee: EmployeeAdvisoryInput;
  reviewContext: {
    industry: string | null;
    companySize: string | null;
  };
}): string {
  const { employee, reviewContext } = args;

  return `You are Qeemly AI Advisory, acting as a senior compensation and rewards analyst.

Write one concise personalized salary review advisory paragraph for this employee.

Rules:
- Keep it to 2 sentences.
- Be specific and practical.
- Focus on pay positioning, performance evidence, benchmark quality, and compensation action framing.
- Do not use bullet points or markdown.
- Do not restate all inputs mechanically.
- If evidence is weaker, mention that carefully.

Employee:
- Name: ${employee.firstName} ${employee.lastName}
- Role: ${employee.roleName}
- Level: ${employee.levelName}
- Department: ${employee.department}
- Location: ${employee.locationName}
- Base salary: ${formatCurrency(employee.baseSalary)}
- Band position: ${employee.bandPosition}
- Band percentile: ${employee.bandPercentile}%
- Market comparison: ${employee.marketComparison}% vs market median
- Performance: ${employee.performanceRating ?? "unavailable"}
- Tenure: ${employee.tenureLabel}
- Proposed increase: ${formatCurrency(employee.proposedIncrease)}
- Benchmark source: ${employee.benchmark.source ?? "unavailable"}
- Benchmark match quality: ${employee.benchmark.matchQuality ?? "unavailable"}
- Benchmark confidence: ${employee.benchmark.confidence ?? "unavailable"}

Workspace context:
- Industry: ${reviewContext.industry ?? "general market"}
- Company size: ${reviewContext.companySize ?? "unknown"}`;
}

export function clearEmployeeAdvisoryCache(): void {
  advisoryCache.clear();
}

export async function generateEmployeeSalaryReviewAdvisory(args: {
  employee: EmployeeAdvisoryInput;
  reviewContext: {
    industry: string | null;
    companySize: string | null;
  };
}): Promise<EmployeeAdvisoryResult | null> {
  const cacheKey = buildCacheKey(args);
  const cached = advisoryCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return cached.summary;
  }

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: getChatModel(),
      temperature: 0.2,
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
      throw new Error("Empty employee advisory response");
    }

    const parsed = JSON.parse(content) as EmployeeAdvisoryResult;
    if (!parsed.summary?.trim()) {
      throw new Error("Missing employee advisory summary");
    }

    const result = { summary: parsed.summary.trim() };
    advisoryCache.set(cacheKey, {
      summary: result,
      createdAt: Date.now(),
    });
    return result;
  } catch (error) {
    console.error("[salary-review/employee-advisory] advisory call failed:", error);
    return null;
  }
}
