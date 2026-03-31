import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getWorkspaceContextMock,
  calculateRelocationMock,
  getRelocationAiAdvisoryMock,
  createServiceClientMock,
  findMarketBenchmarkMock,
} = vi.hoisted(() => ({
  getWorkspaceContextMock: vi.fn(),
  calculateRelocationMock: vi.fn(),
  getRelocationAiAdvisoryMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  findMarketBenchmarkMock: vi.fn(),
}));

vi.mock("@/lib/workspace-context", () => ({
  getWorkspaceContext: getWorkspaceContextMock,
}));

vi.mock("@/lib/relocation/calculator", () => ({
  calculateRelocation: calculateRelocationMock,
}));

vi.mock("@/lib/relocation/ai-advisory", () => ({
  getRelocationAiAdvisory: getRelocationAiAdvisoryMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/benchmarks/platform-market", () => ({
  findMarketBenchmark: findMarketBenchmarkMock,
}));

describe("POST /api/relocation/advisory", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "workspace-1",
      },
    });

    createServiceClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "workspace_settings") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    industry: "Technology",
                    company_size: "201-500",
                    target_percentile: 50,
                    comp_split_basic_pct: 60,
                    comp_split_housing_pct: 25,
                    comp_split_transport_pct: 10,
                    comp_split_other_pct: 5,
                  },
                }),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    calculateRelocationMock.mockReturnValue({
      homeCity: { id: "london", name: "London", country: "United Kingdom", flag: "GB" },
      targetCity: { id: "dubai", name: "Dubai", country: "UAE", flag: "AE" },
      colRatio: 0.69,
      baseSalary: 450000,
      purchasingPowerSalary: 310500,
      localMarketSalary: 330000,
      recommendedSalary: 320000,
      recommendedRange: { min: 304000, max: 336000 },
      costBreakdown: {
        home: { rent: 12800, transport: 1650, food: 2900, utilities: 900, other: 2200 },
        target: { rent: 9000, transport: 1100, food: 2200, utilities: 750, other: 1500 },
      },
      monthlyDifference: -4400,
      annualDifference: -52800,
    });

    findMarketBenchmarkMock.mockResolvedValue({
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      currency: "AED",
      pay_period: "annual",
      p10: 240000,
      p25: 280000,
      p50: 320000,
      p75: 370000,
      p90: 420000,
      sample_size: 12,
      industry: "Technology",
      company_size: "201-500",
    });

    getRelocationAiAdvisoryMock.mockResolvedValue({
      summary: "Dubai relocation can be positioned as a moderated uplift rather than a straight market reset.",
      recommendationHeadline: "AI recommendation",
      recommendedSalary: 338000,
      recommendedRange: { min: 325000, max: 352000 },
      rationale: "The move lowers living costs, but Dubai software engineer market pay still supports a premium above purchasing power parity.",
      risks: [
        "Candidate may anchor on Dubai market medians rather than cost-of-living savings.",
      ],
      policyNotes: [
        "Keep the package structure aligned to your standard GCC policy splits.",
      ],
      supportSuggestions: [
        "Offer a one-time mobility allowance instead of inflating fixed cash further.",
      ],
      sourceContext: {
        benchmarkSource: "market",
        targetPercentile: 50,
      },
    });
  });

  it("returns deterministic and AI relocation recommendations together, with AI as the primary recommendation", async () => {
    const { POST } = await import("@/app/api/relocation/advisory/route");

    const response = await POST(
      new Request("http://localhost/api/relocation/advisory", {
        method: "POST",
        body: JSON.stringify({
          homeCityId: "london",
          targetCityId: "dubai",
          baseSalary: 450000,
          compApproach: "hybrid",
          hybridCap: 110,
          roleId: "swe",
          levelId: "ic3",
        }),
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.deterministicResult.recommendedSalary).toBe(320000);
    expect(payload.aiAdvisory.recommendedSalary).toBe(338000);
    expect(payload.recommendedResult.recommendedSalary).toBe(338000);
    expect(payload.aiAdvisory.sourceContext.benchmarkSource).toBe("market");
    expect(payload.aiAdvisory.risks[0]).toContain("Candidate may anchor");
  });

  it("falls back to the deterministic recommendation when AI advisory is unavailable", async () => {
    getRelocationAiAdvisoryMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/relocation/advisory/route");

    const response = await POST(
      new Request("http://localhost/api/relocation/advisory", {
        method: "POST",
        body: JSON.stringify({
          homeCityId: "london",
          targetCityId: "dubai",
          baseSalary: 450000,
          compApproach: "hybrid",
          hybridCap: 110,
          roleId: "swe",
          levelId: "ic3",
        }),
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.aiAdvisory).toBeNull();
    expect(payload.recommendedResult.recommendedSalary).toBe(320000);
  });
});
