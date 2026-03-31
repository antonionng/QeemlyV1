import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  createServiceClientMock,
  getWorkspaceContextMock,
  fetchMarketBenchmarksMock,
  buildSalaryReviewAiPlanMock,
  generateSalaryReviewAiRationaleMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  getWorkspaceContextMock: vi.fn(),
  fetchMarketBenchmarksMock: vi.fn(),
  buildSalaryReviewAiPlanMock: vi.fn(),
  generateSalaryReviewAiRationaleMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/workspace-context", () => ({
  getWorkspaceContext: getWorkspaceContextMock,
}));

vi.mock("@/lib/benchmarks/platform-market", () => ({
  fetchMarketBenchmarks: fetchMarketBenchmarksMock,
}));

vi.mock("@/lib/salary-review/ai-plan-engine", async () => {
  const actual = await vi.importActual<typeof import("@/lib/salary-review/ai-plan-engine")>(
    "@/lib/salary-review/ai-plan-engine",
  );
  return {
    ...actual,
    buildSalaryReviewAiPlan: buildSalaryReviewAiPlanMock,
  };
});

vi.mock("@/lib/salary-review/ai-rationale", () => ({
  generateSalaryReviewAiRationale: generateSalaryReviewAiRationaleMock,
}));

import { POST } from "@/app/api/salary-review/ai-plan/route";

function createSupabaseClient() {
  return {
    from: vi.fn((table: string) => {
      if (table === "employees") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "emp-1",
                    first_name: "Ava",
                    last_name: "Stone",
                    role_id: "swe",
                    level_id: "ic3",
                    location_id: "dubai",
                    base_salary: 200_000,
                    performance_rating: "exceeds",
                    hire_date: "2021-01-10",
                    status: "active",
                  },
                ],
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === "salary_benchmarks") {
        const query = {
          in: vi.fn(() => query),
          limit: vi.fn(() => query),
          order: vi.fn(() => query),
          eq: vi.fn(() => query),
          then: (resolve: (value: { data: []; error: null }) => unknown) =>
            Promise.resolve(resolve({ data: [], error: null })),
        };
        return {
          select: vi.fn(() => query),
        };
      }

      if (table === "data_freshness_metrics") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            })),
          })),
        };
      }

      if (table === "workspace_settings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  industry: "Fintech",
                  company_size: "201-500",
                },
                error: null,
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

const basePlan = {
  generatedAt: "2026-03-31T10:00:00.000Z",
  strategicSummary: null,
  summary: {
    mode: "assistive" as const,
    budget: 25_000,
    budgetUsed: 25_000,
    budgetRemaining: 0,
    budgetUsedPercentage: 100,
    totalCurrentPayroll: 200_000,
    totalProposedPayroll: 225_000,
    employeesConsidered: 1,
    employeesWithWarnings: 0,
  },
  items: [
    {
      employeeId: "emp-1",
      employeeName: "Ava Stone",
      currentSalary: 200_000,
      proposedIncrease: 25_000,
      proposedSalary: 225_000,
      proposedPercentage: 12.5,
      confidence: 91,
      rationale: ["Market gap: 10.0% vs benchmark midpoint (P50)."],
      aiRationale: null,
      factors: [],
      benchmark: {
        provenance: "ingestion" as const,
        sourceSlug: "qeemly_ingestion",
        sourceName: "Qeemly Ingestion",
        matchQuality: "exact" as const,
        matchType: "exact" as const,
        fallbackReason: null,
        freshness: {
          lastUpdatedAt: "2026-03-01T00:00:00.000Z",
          confidence: "high" as const,
        },
      },
      warnings: [],
    },
  ],
  warnings: [],
};

describe("POST /api/salary-review/ai-plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockResolvedValue(createSupabaseClient());
    createServiceClientMock.mockReturnValue(createSupabaseClient());
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "ws-1",
        is_override: false,
      },
    });
    fetchMarketBenchmarksMock.mockResolvedValue([]);
    buildSalaryReviewAiPlanMock.mockReturnValue(basePlan);
    generateSalaryReviewAiRationaleMock.mockResolvedValue({
      strategicSummary:
        "Use the engineering increase to close a meaningful market gap, but keep the cohort narrative disciplined against the fixed budget.",
      items: [
        {
          employeeId: "emp-1",
          aiRationale:
            "Ava is below market and performing strongly, so the recommendation accelerates her movement while still keeping within the approved budget policy.",
        },
      ],
    });
  });

  it("enriches the response with strategic summary and AI rationale", async () => {
    const response = await POST(
      new Request("http://localhost/api/salary-review/ai-plan", {
        method: "POST",
        body: JSON.stringify({
          mode: "assistive",
          cycle: "annual",
          budgetType: "absolute",
          budgetAbsolute: 25_000,
        }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.strategicSummary).toContain("engineering increase");
    expect(payload.items[0].aiRationale).toContain("below market");
    expect(payload.items[0].rationale).toEqual(["Market gap: 10.0% vs benchmark midpoint (P50)."]);
    expect(generateSalaryReviewAiRationaleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewContext: {
          industry: "Fintech",
          companySize: "201-500",
        },
      }),
    );
  });

  it("falls back to the deterministic plan when AI enrichment fails", async () => {
    generateSalaryReviewAiRationaleMock.mockResolvedValueOnce(null);

    const response = await POST(
      new Request("http://localhost/api/salary-review/ai-plan", {
        method: "POST",
        body: JSON.stringify({
          mode: "assistive",
          cycle: "annual",
          budgetType: "absolute",
          budgetAbsolute: 25_000,
        }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.strategicSummary).toBeNull();
    expect(payload.items[0].aiRationale).toBeNull();
    expect(payload.items[0].rationale).toEqual(["Market gap: 10.0% vs benchmark midpoint (P50)."]);
  });
});
