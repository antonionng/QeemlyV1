import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.fn();

vi.mock("@/lib/ai/openai", () => ({
  getOpenAIClient: () => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }),
  getBenchmarkModel: () => "gpt-5.4",
}));

import { generateSalaryReviewAiRationale } from "@/lib/salary-review/ai-rationale";
import type { SalaryReviewAiPlanResponse } from "@/lib/salary-review";
import type { SalaryReviewAiEmployeeInput } from "@/lib/salary-review/ai-plan-engine";

const plan: SalaryReviewAiPlanResponse = {
  generatedAt: "2026-03-31T10:00:00.000Z",
  strategicSummary: null,
  summary: {
    mode: "assistive",
    budget: 25_000,
    budgetUsed: 25_000,
    budgetRemaining: 0,
    budgetUsedPercentage: 100,
    totalCurrentPayroll: 500_000,
    totalProposedPayroll: 525_000,
    employeesConsidered: 2,
    employeesWithWarnings: 1,
  },
  items: [
    {
      employeeId: "emp-1",
      employeeName: "Ava Stone",
      currentSalary: 200_000,
      proposedIncrease: 15_000,
      proposedSalary: 215_000,
      proposedPercentage: 7.5,
      confidence: 90,
      rationale: ["Market gap: 8.0% vs benchmark midpoint (P50)."],
      aiRationale: null,
      factors: [
        {
          key: "market_gap",
          label: "Market Gap",
          value: "8.0% vs P50",
          weight: 0.45,
          impact: "positive",
        },
      ],
      benchmark: {
        provenance: "ingestion",
        sourceSlug: "qeemly_ingestion",
        sourceName: "Qeemly Ingestion",
        matchQuality: "exact",
        matchType: "exact",
        fallbackReason: null,
        freshness: {
          lastUpdatedAt: "2026-03-01T00:00:00.000Z",
          confidence: "high",
        },
      },
      warnings: [],
    },
    {
      employeeId: "emp-2",
      employeeName: "Omar Haleem",
      currentSalary: 300_000,
      proposedIncrease: 10_000,
      proposedSalary: 310_000,
      proposedPercentage: 3.3,
      confidence: 67,
      rationale: ["Missing performance rating; recommendation confidence reduced."],
      aiRationale: null,
      factors: [
        {
          key: "performance",
          label: "Performance",
          value: "performance data unavailable",
          weight: 0.25,
          impact: "neutral",
        },
      ],
      benchmark: {
        provenance: "workspace",
        sourceSlug: "workspace_uploaded",
        sourceName: "Workspace Benchmarks",
        matchQuality: "role_level_fallback",
        matchType: "location_fallback",
        fallbackReason: "Used role-level fallback in GCC market pool.",
        freshness: {
          lastUpdatedAt: "2026-02-15T00:00:00.000Z",
          confidence: "medium",
        },
      },
      warnings: ["Missing performance rating; recommendation confidence reduced."],
    },
  ],
  warnings: ["Some employees require fallback benchmark matches."],
};

const employees: SalaryReviewAiEmployeeInput[] = [
  {
    id: "emp-1",
    firstName: "Ava",
    lastName: "Stone",
    roleId: "swe",
    levelId: "ic3",
    locationId: "dubai",
    baseSalary: 200_000,
    performanceRating: "exceeds",
    hireDate: "2021-01-10",
  },
  {
    id: "emp-2",
    firstName: "Omar",
    lastName: "Haleem",
    roleId: "pm",
    levelId: "m1",
    locationId: "riyadh",
    baseSalary: 300_000,
    performanceRating: null,
    hireDate: "2019-05-02",
  },
];

describe("generateSalaryReviewAiRationale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              strategicSummary:
                "Prioritize the under-market engineering move, while keeping the product adjustment more conservative because evidence quality is weaker.",
              items: [
                {
                  employeeId: "emp-1",
                  aiRationale:
                    "Ava is below the market midpoint and has strong performance momentum, so the recommendation leans into competitive positioning while still staying within policy.",
                },
                {
                  employeeId: "emp-2",
                  aiRationale:
                    "Omar still receives an increase, but the narrative is more measured because benchmark matching and performance evidence are less complete for this case.",
                },
              ],
            }),
          },
        },
      ],
    });
  });

  it("returns a strategic summary and per-employee AI rationale", async () => {
    const result = await generateSalaryReviewAiRationale({
      request: {
        mode: "assistive",
        cycle: "annual",
        budgetType: "absolute",
        budgetAbsolute: 25_000,
      },
      employees,
      plan,
      reviewContext: {
        industry: "Fintech",
        companySize: "201-500",
      },
    });

    expect(result).toEqual({
      strategicSummary:
        "Prioritize the under-market engineering move, while keeping the product adjustment more conservative because evidence quality is weaker.",
      items: [
        {
          employeeId: "emp-1",
          aiRationale:
            "Ava is below the market midpoint and has strong performance momentum, so the recommendation leans into competitive positioning while still staying within policy.",
        },
        {
          employeeId: "emp-2",
          aiRationale:
            "Omar still receives an increase, but the narrative is more measured because benchmark matching and performance evidence are less complete for this case.",
        },
      ],
    });
  });

  it("sends the GPT-5.4 model and includes review context in the prompt", async () => {
    await generateSalaryReviewAiRationale({
      request: {
        mode: "assistive",
        cycle: "annual",
        budgetType: "absolute",
        budgetAbsolute: 25_000,
      },
      employees,
      plan,
      reviewContext: {
        industry: "Fintech",
        companySize: "201-500",
      },
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.4",
        temperature: 0.3,
      }),
    );

    const call = mockCreate.mock.calls[0][0];
    const userMessage = call.messages.find((message: { role: string }) => message.role === "user");
    expect(userMessage.content).toContain("Industry: Fintech");
    expect(userMessage.content).toContain("Company size: 201-500");
    expect(userMessage.content).toContain("Ava Stone");
    expect(userMessage.content).toContain("Omar Haleem");
  });

  it("returns null when the GPT call fails", async () => {
    mockCreate.mockRejectedValueOnce(new Error("rate limited"));

    const result = await generateSalaryReviewAiRationale({
      request: {
        mode: "assistive",
        cycle: "annual",
        budgetType: "absolute",
        budgetAbsolute: 25_000,
      },
      employees,
      plan,
      reviewContext: {
        industry: null,
        companySize: null,
      },
    });

    expect(result).toBeNull();
  });
});
