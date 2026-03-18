import { afterEach, describe, expect, it, vi } from "vitest";
import { createOdsAdapter, createWorldBankAdapter } from "@/lib/ingestion/adapters/factory";

describe("createOdsAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to common wage field names when the configured field list misses the live schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_count: 1,
          results: [
            {
              sector: "information and communication",
              monthly_wage: 12_000,
            },
          ],
        }),
      }),
    );

    const adapter = createOdsAdapter({
      slug: "test_ods",
      endpoint: "https://example.com/records",
      location: "Dubai",
      currency: "AED",
      roleFields: ["sector"],
      valueFields: ["value"],
      annualMultiplier: 12,
      defaultRole: "Software Engineer",
    });

    const rows = await adapter.fetch("source-1");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      role: "Software Engineer",
      location: "Dubai",
      currency: "AED",
      level: "Senior (IC3)",
    });
  });

  it("can fan one ODS record into multiple configured GCC city variants", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_count: 1,
          results: [
            {
              sector: "information and communication",
              value: 12_000,
            },
          ],
        }),
      }),
    );

    const adapter = createOdsAdapter({
      slug: "test_city_fanout",
      endpoint: "https://example.com/records",
      location: "Dubai",
      currency: "AED",
      roleFields: ["sector"],
      valueFields: ["value"],
      annualMultiplier: 12,
      defaultRole: "Software Engineer",
      locationVariants: [
        { location: "Dubai", multiplier: 1 },
        { location: "Abu Dhabi", multiplier: 1.04 },
      ],
    });

    const rows = await adapter.fetch("source-1");

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.location)).toEqual(["Dubai", "Abu Dhabi"]);
  });
});

describe("createWorldBankAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("can fan one fetched country point into multiple benchmark levels", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { page: 1, pages: 1, per_page: 200, total: 1 },
          [
            {
              countryiso3code: "ARE",
              value: 55,
            },
          ],
        ],
      }),
    );

    const adapter = createWorldBankAdapter({
      slug: "test_worldbank",
      indicatorId: "SL.EMP.WORK.ZS",
      role: "Software Engineer",
      countries: "ARE",
      annualMultiplier: 2100,
      levelVariants: [
        { level: "Junior (IC1)", multiplier: 0.65 },
        { level: "Senior (IC3)", multiplier: 1 },
        { level: "Staff (IC4)", multiplier: 1.25 },
      ],
    });

    const rows = await adapter.fetch("source-1");

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.level)).toEqual([
      "Junior (IC1)",
      "Senior (IC3)",
      "Staff (IC4)",
    ]);
  });
});
