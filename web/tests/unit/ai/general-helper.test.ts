import { describe, expect, it } from "vitest";
import { __internal } from "@/lib/ai/chat/general-helper";

const employees = [
  {
    id: "emp-1",
    first_name: "Antonio",
    last_name: "Giugno",
    department: "Data",
    role_id: "data-analyst",
    level_id: "ic3",
    location_id: "dubai",
    base_salary: 120_000,
    status: "active",
    hire_date: "2021-01-01",
    last_review_date: "2024-12-01",
    performance_rating: "exceptional" as const,
  },
  {
    id: "emp-2",
    first_name: "Mina",
    last_name: "Patel",
    department: "Engineering",
    role_id: "swe",
    level_id: "ic3",
    location_id: "dubai",
    base_salary: 100_000,
    status: "active",
    hire_date: "2024-01-01",
    last_review_date: "2025-10-01",
    performance_rating: "meets" as const,
  },
  {
    id: "emp-3",
    first_name: "Omar",
    last_name: "Hassan",
    department: "Product",
    role_id: "pm",
    level_id: "ic2",
    location_id: "riyadh",
    base_salary: 95_000,
    status: "active",
    hire_date: "2023-06-01",
    last_review_date: "2024-05-01",
    performance_rating: "exceeds" as const,
  },
  {
    id: "emp-4",
    first_name: "Lina",
    last_name: "Khan",
    department: "Finance",
    role_id: "unknown-role",
    level_id: "ic2",
    location_id: "dubai",
    base_salary: 90_000,
    status: "active",
    hire_date: "2025-01-15",
    last_review_date: null,
    performance_rating: null,
  },
];

const marketBenchmarks = [
  {
    role_id: "data-analyst",
    location_id: "dubai",
    level_id: "ic3",
    currency: "AED",
    p10: 110_000,
    p25: 130_000,
    p50: 160_000,
    p75: 180_000,
    p90: 200_000,
    sample_size: 18,
    source: "market" as const,
  },
  {
    role_id: "swe",
    location_id: "dubai",
    level_id: "ic3",
    currency: "AED",
    p10: 90_000,
    p25: 100_000,
    p50: 120_000,
    p75: 140_000,
    p90: 160_000,
    sample_size: 22,
    source: "market" as const,
  },
  {
    role_id: "pm",
    location_id: "riyadh",
    level_id: "ic2",
    currency: "SAR",
    p10: 90_000,
    p25: 95_000,
    p50: 100_000,
    p75: 110_000,
    p90: 125_000,
    sample_size: 15,
    source: "market" as const,
  },
];

describe("general helper", () => {
  it("returns a ranked under-market list for plural prompts", () => {
    const result = __internal.resolveSupportedQuestion(
      "Find my most under-market employees",
      employees,
      marketBenchmarks,
    );

    expect(result.handled).toBe(true);
    if (!result.handled) {
      throw new Error("Expected helper question to be handled");
    }

    expect(result.payload.answer).toContain("three most under-market employees");
    expect(result.payload.answer).toContain("Antonio Giugno");
    expect(result.payload.answer).toContain("Mina Patel");
    expect(result.payload.answer).toContain("Omar Hassan");
    expect(result.payload.answer).toContain("Lina Khan");
    expect(result.payload.answer).toContain("could not be matched to a Qeemly market benchmark");
  });

  it("returns a single employee for singular prompts", () => {
    const result = __internal.resolveSupportedQuestion(
      "Who is most under market?",
      employees,
      marketBenchmarks,
    );

    expect(result.handled).toBe(true);
    if (!result.handled) {
      throw new Error("Expected helper question to be handled");
    }

    expect(result.payload.answer).toContain("most under-market employee is Antonio Giugno");
    expect(result.payload.answer).not.toContain("2.");
  });

  it("ignores unsupported questions", () => {
    const result = __internal.resolveSupportedQuestion(
      "Can you summarize current market trends?",
      employees,
      marketBenchmarks,
    );

    expect(result.handled).toBe(false);
  });

  it("returns the highest retention risk employee for supported prompts", () => {
    const result = __internal.resolveSupportedQuestion(
      "Who is my highest retention risk employee?",
      employees,
      marketBenchmarks,
    );

    expect(result.handled).toBe(true);
    if (!result.handled) {
      throw new Error("Expected helper question to be handled");
    }

    expect(result.payload.answer).toContain("highest retention risk employee is Antonio Giugno");
    expect(result.payload.answer).toContain("exceptional performer");
    expect(result.payload.answer).toContain("below the Qeemly market median");
  });

  it("returns the department furthest below market", () => {
    const result = __internal.resolveSupportedQuestion(
      "Which department is furthest below market?",
      employees,
      marketBenchmarks,
    );

    expect(result.handled).toBe(true);
    if (!result.handled) {
      throw new Error("Expected helper question to be handled");
    }

    expect(result.payload.answer).toContain("Data is the department furthest below market");
    expect(result.payload.answer).toContain("Antonio Giugno");
  });

  it("returns benchmark coverage gaps", () => {
    const result = __internal.resolveSupportedQuestion(
      "Where do we have weak benchmark coverage?",
      employees,
      marketBenchmarks,
    );

    expect(result.handled).toBe(true);
    if (!result.handled) {
      throw new Error("Expected helper question to be handled");
    }

    expect(result.payload.answer).toContain("1 active employee could not be matched");
    expect(result.payload.answer).toContain("Lina Khan");
    expect(result.payload.answer).toContain("unknown-role");
  });
});
