import { beforeEach, describe, expect, it, vi } from "vitest";
import { invalidateAiBenchmarkCache } from "@/lib/benchmarks/ai-estimate";

const mockCreate = vi.fn();
const { unstableCacheMock } = vi.hoisted(() => ({
  unstableCacheMock: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}));

vi.mock("@/lib/ai/openai", () => ({
  getOpenAIClient: () => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }),
  getBenchmarkModel: () => "gpt-5.4",
  getBenchmarkBriefingModel: () => "gpt-5.4-mini",
}));

vi.mock("next/cache", () => ({
  unstable_cache: unstableCacheMock,
}));

import {
  getAiBenchmarkForLevel,
  getAiBenchmarkAdvisory,
  getAiBenchmarkForLevelLight,
  getAiBenchmarkAdvisoryLight,
} from "@/lib/benchmarks/ai-estimate";

const MOCK_ADVISORY = {
  levels: [
    { levelId: "ic1", levelName: "Junior (IC1)", p10: 120000, p25: 140000, p50: 160000, p75: 185000, p90: 210000 },
    { levelId: "ic2", levelName: "Mid-Level (IC2)", p10: 180000, p25: 210000, p50: 250000, p75: 290000, p90: 330000 },
    { levelId: "ic3", levelName: "Senior (IC3)", p10: 280000, p25: 330000, p50: 380000, p75: 440000, p90: 510000 },
    { levelId: "ic4", levelName: "Staff (IC4)", p10: 400000, p25: 460000, p50: 530000, p75: 610000, p90: 700000 },
    { levelId: "ic5", levelName: "Principal (IC5)", p10: 550000, p25: 620000, p50: 700000, p75: 800000, p90: 920000 },
    { levelId: "m1", levelName: "Manager (M1)", p10: 350000, p25: 420000, p50: 500000, p75: 580000, p90: 670000 },
    { levelId: "m2", levelName: "Senior Manager (M2)", p10: 450000, p25: 520000, p50: 600000, p75: 700000, p90: 810000 },
    { levelId: "d1", levelName: "Director (D1)", p10: 580000, p25: 670000, p50: 780000, p75: 900000, p90: 1050000 },
    { levelId: "d2", levelName: "Senior Director (D2)", p10: 720000, p25: 830000, p50: 960000, p75: 1100000, p90: 1280000 },
    { levelId: "vp", levelName: "VP", p10: 900000, p25: 1050000, p50: 1200000, p75: 1400000, p90: 1650000 },
  ],
  currency: "AED",
  payPeriod: "annual",
  reasoning: "GCC tech salaries reflect strong demand for experienced engineers.",
  marketContext: "Abu Dhabi is experiencing growth in fintech hiring.",
  confidenceNote: "Estimates based on regional market patterns. Use alongside published data.",
  industryInsight: "Fintech typically pays 10-15% above broad market.",
  companySizeInsight: "Mid-size companies (201-500) offer competitive base with limited equity.",
};

const MOCK_LIGHT_ADVISORY = {
  levels: MOCK_ADVISORY.levels,
  currency: "AED",
  payPeriod: "annual",
  summary: "Software engineer pay in Abu Dhabi remains competitive, with fintech premiums holding above the broader market.",
};

describe("AI benchmark advisory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateAiBenchmarkCache();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(MOCK_ADVISORY) } }],
    });
  });

  it("returns a specific level from the multi-level advisory", async () => {
    const result = await getAiBenchmarkForLevel("swe", "abu-dhabi", "ic3", {
      industry: "Fintech",
      companySize: "201-500",
    });

    expect(result).not.toBeNull();
    expect(result!.level.levelId).toBe("ic3");
    expect(result!.level.p50).toBe(380000);
    expect(result!.advisory.reasoning).toContain("GCC");
    expect(result!.advisory.industryInsight).toContain("Fintech");
  });

  it("caches the advisory and reuses it for a different level", async () => {
    await getAiBenchmarkForLevel("swe", "abu-dhabi", "ic3");
    const result = await getAiBenchmarkForLevel("swe", "abu-dhabi", "ic2");

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result!.level.levelId).toBe("ic2");
    expect(result!.level.p50).toBe(250000);
  });

  it("deduplicates concurrent calls for the same advisory key", async () => {
    let resolveCall: ((value: { choices: Array<{ message: { content: string } }> }) => void) | null = null;
    mockCreate.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCall = resolve;
        }),
    );

    const first = getAiBenchmarkForLevel("swe", "abu-dhabi", "ic3", {
      industry: "Fintech",
      companySize: "201-500",
    });
    const second = getAiBenchmarkForLevel("swe", "abu-dhabi", "ic2", {
      industry: "Fintech",
      companySize: "201-500",
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);

    resolveCall?.({
      choices: [{ message: { content: JSON.stringify(MOCK_ADVISORY) } }],
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult?.level.levelId).toBe("ic3");
    expect(secondResult?.level.levelId).toBe("ic2");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("makes separate calls for different filter combinations", async () => {
    await getAiBenchmarkForLevel("swe", "abu-dhabi", "ic3", { industry: "Fintech" });
    await getAiBenchmarkForLevel("swe", "abu-dhabi", "ic3", { industry: "Banking" });

    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("returns null for a level not in the response", async () => {
    const result = await getAiBenchmarkForLevel("swe", "abu-dhabi", "nonexistent-level");
    expect(result).toBeNull();
  });

  it("returns null when GPT call fails", async () => {
    mockCreate.mockRejectedValue(new Error("API rate limit"));

    const result = await getAiBenchmarkAdvisory("swe", "abu-dhabi", null, null);
    expect(result).toBeNull();
  });

  it("returns null when GPT returns empty content", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const result = await getAiBenchmarkAdvisory("swe", "abu-dhabi", null, null);
    expect(result).toBeNull();
  });

  it("passes the correct model to the GPT call", async () => {
    await getAiBenchmarkForLevel("swe", "dubai", "ic1");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.4-mini",
        temperature: 0.3,
      }),
    );
  });

  it("includes role, location, industry, and company size in the prompt", async () => {
    await getAiBenchmarkForLevel("swe", "abu-dhabi", "ic3", {
      industry: "Fintech",
      companySize: "201-500",
    });

    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find(
      (m: { role: string }) => m.role === "user",
    );
    expect(userMessage.content).toContain("Software Engineer");
    expect(userMessage.content).toContain("Abu Dhabi");
    expect(userMessage.content).toContain("Fintech");
    expect(userMessage.content).toContain("201-500");
  });

  it("returns a specific level from the light advisory", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_LIGHT_ADVISORY) } }],
    });

    const result = await getAiBenchmarkForLevelLight("swe", "abu-dhabi", "ic3", {
      industry: "Fintech",
      companySize: "201-500",
    });

    expect(result).not.toBeNull();
    expect(result!.level.levelId).toBe("ic3");
    expect(result!.level.p50).toBe(380000);
    expect(result!.advisory.summary).toContain("competitive");
  });

  it("caches the light advisory and reuses it for a different level", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_LIGHT_ADVISORY) } }],
    });

    await getAiBenchmarkForLevelLight("swe", "abu-dhabi", "ic3");
    const result = await getAiBenchmarkForLevelLight("swe", "abu-dhabi", "ic2");

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result!.level.levelId).toBe("ic2");
    expect(result!.advisory.summary).toContain("competitive");
  });

  it("returns null when the light advisory response is empty", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    const result = await getAiBenchmarkAdvisoryLight("swe", "abu-dhabi", null, null);

    expect(result).toBeNull();
  });
});
