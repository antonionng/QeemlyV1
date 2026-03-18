import { afterEach, describe, expect, it, vi } from "vitest";
import { wbGccWageWorkersAdapter } from "@/lib/ingestion/adapters/wb-gcc-wage-workers";
import { normalizeBenchmarkRow } from "@/lib/ingestion/normalizer";
import { getSourceTier } from "@/lib/ingestion/source-registry";

describe("wbGccWageWorkersAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is classified as a proxy source and normalizes fetched rows into canonical benchmarks", async () => {
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

    const rows = await wbGccWageWorkersAdapter.fetch("source-1");
    const seniorRow = rows.find((row) => row.level === "Senior (IC3)");
    const juniorRow = rows.find((row) => row.level === "Junior (IC1)");
    const normalized = normalizeBenchmarkRow((seniorRow ?? rows[0]) as Record<string, unknown>);

    expect(getSourceTier("wb_gcc_wage_workers")).toBe("proxy");
    expect(rows).toHaveLength(5);
    expect(juniorRow).toMatchObject({
      role: "Software Engineer",
      level: "Junior (IC1)",
      location: "Dubai",
      currency: "AED",
    });
    expect(seniorRow).toMatchObject({
      role: "Software Engineer",
      level: "Senior (IC3)",
      location: "Dubai",
      currency: "AED",
    });
    expect(normalized).toEqual({
      ok: expect.objectContaining({
        roleId: "swe",
        levelId: "ic3",
        locationId: "dubai",
        currency: "AED",
      }),
    });
  });
});
