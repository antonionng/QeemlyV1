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
  getChatModel: () => "gpt-5.4-mini",
}));

import {
  clearEmployeeAdvisoryCache,
  generateEmployeeSalaryReviewAdvisory,
} from "@/lib/salary-review/employee-advisory";

const employeeInput = {
  id: "emp-1",
  firstName: "Ava",
  lastName: "Stone",
  roleName: "Software Engineer",
  levelName: "Senior (IC3)",
  locationName: "Dubai, UAE",
  department: "Engineering",
  baseSalary: 200_000,
  bandPosition: "below" as const,
  bandPercentile: 32,
  marketComparison: -12,
  performanceRating: "exceeds" as const,
  tenureLabel: "3y 2m",
  proposedIncrease: 18_000,
  benchmark: {
    source: "Qeemly Ingestion",
    matchQuality: "exact",
    confidence: "high",
  },
};

describe("generateEmployeeSalaryReviewAdvisory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearEmployeeAdvisoryCache();
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary:
                "Ava is materially below market for a strong performance profile, so a measured corrective increase is warranted to reduce retention risk while preserving internal pay discipline.",
            }),
          },
        },
      ],
    });
  });

  it("returns a personalized advisory summary", async () => {
    const result = await generateEmployeeSalaryReviewAdvisory({
      employee: employeeInput,
      reviewContext: {
        industry: "Fintech",
        companySize: "201-500",
      },
    });

    expect(result?.summary).toContain("below market");
  });

  it("reuses the cached response for the same employee inputs", async () => {
    await generateEmployeeSalaryReviewAdvisory({
      employee: employeeInput,
      reviewContext: {
        industry: "Fintech",
        companySize: "201-500",
      },
    });

    const second = await generateEmployeeSalaryReviewAdvisory({
      employee: employeeInput,
      reviewContext: {
        industry: "Fintech",
        companySize: "201-500",
      },
    });

    expect(second?.summary).toContain("below market");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("uses the smaller chat model for single-employee advisory", async () => {
    await generateEmployeeSalaryReviewAdvisory({
      employee: employeeInput,
      reviewContext: {
        industry: null,
        companySize: null,
      },
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.4-mini",
        temperature: 0.2,
      }),
    );
  });
});
