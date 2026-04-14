import { describe, expect, it } from "vitest";
import {
  buildAnalyticsInsightsPrompt,
  normalizeInsightsResponse,
  ANALYTICS_INSIGHTS_SCHEMA,
} from "@/lib/reports/ai-insights-prompt";
import type { AnalyticsPayload } from "@/lib/reports/analytics";

const BASE_PAYLOAD: AnalyticsPayload = {
  currency: "AED",
  activeEmployees: 50,
  benchmarkedEmployees: 42,
  departmentCount: 5,
  totalPayroll: 8_500_000,
  avgMarketComparison: 3.2,
  marketRowsCount: 200,
  marketFreshnessAt: "2026-04-10T00:00:00.000Z",
  benchmarkTrustLabel: "Blended market pool",
  marketBackedEmployees: 38,
  departments: [
    {
      name: "Engineering",
      headcount: 20,
      benchmarkedCount: 18,
      avgMarketComparison: 4.1,
      totalComp: 3_800_000,
    },
    {
      name: "Sales",
      headcount: 10,
      benchmarkedCount: 8,
      avgMarketComparison: 1.5,
      totalComp: 1_600_000,
    },
  ],
  benchmarkSourceBreakdown: [
    { source: "market-pool", count: 150 },
    { source: "ai-estimated", count: 50 },
  ],
};

describe("buildAnalyticsInsightsPrompt", () => {
  it("includes workspace metrics and currency in the prompt", () => {
    const prompt = buildAnalyticsInsightsPrompt(BASE_PAYLOAD);
    expect(prompt).toContain("Active employees: 50");
    expect(prompt).toContain("Benchmarked employees: 42");
    expect(prompt).toContain("Average vs market: 3.2%");
    expect(prompt).toContain("Currency: AED");
    expect(prompt).toContain("AED");
  });

  it("includes department breakdown", () => {
    const prompt = buildAnalyticsInsightsPrompt(BASE_PAYLOAD);
    expect(prompt).toContain("Engineering");
    expect(prompt).toContain("20 employees");
    expect(prompt).toContain("Sales");
  });

  it("includes benchmark source breakdown", () => {
    const prompt = buildAnalyticsInsightsPrompt(BASE_PAYLOAD);
    expect(prompt).toContain("market-pool: 150 rows");
    expect(prompt).toContain("ai-estimated: 50 rows");
  });

  it("handles empty departments and sources", () => {
    const payload: AnalyticsPayload = {
      ...BASE_PAYLOAD,
      departments: [],
      benchmarkSourceBreakdown: [],
    };
    const prompt = buildAnalyticsInsightsPrompt(payload);
    expect(prompt).toContain("no department data available");
    expect(prompt).toContain("no benchmark sources available");
  });
});

describe("normalizeInsightsResponse", () => {
  it("normalizes a complete valid response", () => {
    const raw = {
      executive_summary: "  Workspace is healthy.  ",
      insights: [
        { category: "trend", title: "Strong coverage", body: "42 of 50 benchmarked." },
        { category: "risk", title: "Compliance gap", body: "Score dropped 5 points." },
        { category: "action", title: "Refresh data", body: "Market data is 4 days old." },
      ],
      normalized_categories: [
        { raw: "Eng", canonical: "Engineering" },
      ],
    };

    const result = normalizeInsightsResponse(raw);

    expect(result.executive_summary).toBe("Workspace is healthy.");
    expect(result.insights).toHaveLength(3);
    expect(result.insights[0].category).toBe("trend");
    expect(result.insights[1].category).toBe("risk");
    expect(result.insights[2].category).toBe("action");
    expect(result.normalized_categories).toEqual([
      { raw: "Eng", canonical: "Engineering" },
    ]);
  });

  it("defaults invalid category to trend", () => {
    const raw = {
      executive_summary: "Summary",
      insights: [
        { category: "unknown", title: "Test", body: "Body text." },
      ],
      normalized_categories: [],
    };

    const result = normalizeInsightsResponse(raw);
    expect(result.insights[0].category).toBe("trend");
  });

  it("filters out insights with empty title or body", () => {
    const raw = {
      executive_summary: "Summary",
      insights: [
        { category: "trend", title: "", body: "Body text." },
        { category: "risk", title: "Valid", body: "" },
        { category: "action", title: "Also valid", body: "Has body." },
      ],
      normalized_categories: [],
    };

    const result = normalizeInsightsResponse(raw);
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].title).toBe("Also valid");
  });

  it("handles missing fields gracefully", () => {
    const result = normalizeInsightsResponse({});
    expect(result.executive_summary).toBe("");
    expect(result.insights).toEqual([]);
    expect(result.normalized_categories).toEqual([]);
  });

  it("filters out normalized_categories with empty raw or canonical", () => {
    const raw = {
      executive_summary: "Summary",
      insights: [],
      normalized_categories: [
        { raw: "Eng", canonical: "Engineering" },
        { raw: "", canonical: "Sales" },
        { raw: "HR", canonical: "" },
      ],
    };

    const result = normalizeInsightsResponse(raw);
    expect(result.normalized_categories).toEqual([
      { raw: "Eng", canonical: "Engineering" },
    ]);
  });

  it("handles non-array insights gracefully", () => {
    const raw = {
      executive_summary: "Summary",
      insights: "not an array",
      normalized_categories: null,
    };

    const result = normalizeInsightsResponse(raw);
    expect(result.insights).toEqual([]);
    expect(result.normalized_categories).toEqual([]);
  });
});

describe("ANALYTICS_INSIGHTS_SCHEMA", () => {
  it("has the expected structure for OpenAI json_schema", () => {
    expect(ANALYTICS_INSIGHTS_SCHEMA.name).toBe("analytics_insights");
    expect(ANALYTICS_INSIGHTS_SCHEMA.strict).toBe(true);
    expect(ANALYTICS_INSIGHTS_SCHEMA.schema.required).toContain(
      "executive_summary",
    );
    expect(ANALYTICS_INSIGHTS_SCHEMA.schema.required).toContain("insights");
    expect(ANALYTICS_INSIGHTS_SCHEMA.schema.required).toContain(
      "normalized_categories",
    );
    expect(ANALYTICS_INSIGHTS_SCHEMA.schema.additionalProperties).toBe(false);
  });
});
