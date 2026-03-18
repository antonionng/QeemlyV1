import { describe, expect, it } from "vitest";
import { summarizePublishedContributionMix } from "@/lib/benchmarks/coverage-contract";

describe("summarizePublishedContributionMix", () => {
  it("counts published rows by contributing source type", () => {
    const summary = summarizePublishedContributionMix([
      {
        source_breakdown: {
          employee: 2,
          uploaded: 0,
          admin: 1,
        },
      },
      {
        source_breakdown: {
          employee: 0,
          uploaded: 3,
          admin: 0,
        },
      },
      {
        source_breakdown: {
          employee: 0,
          uploaded: 0,
          admin: 4,
        },
      },
    ]);

    expect(summary).toEqual({
      rowsWithEmployeeSupport: 1,
      rowsWithUploadedSupport: 1,
      rowsWithAdminSupport: 2,
    });
  });
});
