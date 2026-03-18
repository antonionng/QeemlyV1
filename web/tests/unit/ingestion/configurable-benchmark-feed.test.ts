import { afterEach, describe, expect, it, vi } from "vitest";
import { configurableBenchmarkFeedAdapter } from "@/lib/ingestion/adapters/configurable-benchmark-feed";

describe("configurableBenchmarkFeedAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns inline benchmark rows from source config", async () => {
    const rows = await configurableBenchmarkFeedAdapter.fetch("source-1", {
      source: {
        slug: "sample_gcc_market",
        config: {
          rows: [
            {
              role: "Software Engineer",
              level: "Senior (IC3)",
              location: "Dubai",
              currency: "AED",
              p10: 80_000,
              p25: 95_000,
              p50: 110_000,
              p75: 125_000,
              p90: 140_000,
              sample_size: 25,
            },
          ],
        },
      },
    });

    expect(rows).toEqual([
      {
        role: "Software Engineer",
        level: "Senior (IC3)",
        location: "Dubai",
        currency: "AED",
        p10: 80_000,
        p25: 95_000,
        p50: 110_000,
        p75: 125_000,
        p90: 140_000,
        sample_size: 25,
      },
    ]);
  });

  it("can load benchmark rows from a configured JSON url", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          rows: [
            {
              role: "Product Manager",
              level: "Manager (M1)",
              location: "Riyadh",
              currency: "SAR",
              p10: 120_000,
              p25: 135_000,
              p50: 150_000,
              p75: 170_000,
              p90: 190_000,
              sample_size: 18,
            },
          ],
        }),
      }),
    );

    const rows = await configurableBenchmarkFeedAdapter.fetch("source-2", {
      source: {
        slug: "gulf_talent_2024",
        config: {
          url: "https://example.com/gulf-talent-2024.json",
        },
      },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      role: "Product Manager",
      level: "Manager (M1)",
      location: "Riyadh",
    });
  });
});
