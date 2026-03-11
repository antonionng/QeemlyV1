import { describe, expect, it } from "vitest";
import {
  BENCHMARK_DETAIL_TABS,
  getBenchmarkDetailTab,
  getBenchmarkDetailTabViews,
  getDefaultBenchmarkDetailTab,
  getPrimaryBenchmarkDetailTab,
} from "@/lib/benchmarks/detail-tabs";

describe("benchmark detail tabs", () => {
  it("keeps the hybrid flow ordered around quick pricing first", () => {
    expect(BENCHMARK_DETAIL_TABS.map((tab) => tab.id)).toEqual([
      "summary",
      "offer",
      "internal-pay",
      "market-analysis",
    ]);
    expect(getDefaultBenchmarkDetailTab()).toBe("summary");
    expect(getPrimaryBenchmarkDetailTab()).toBe("offer");
  });

  it("groups legacy drilldown views into the new tabbed analysis buckets", () => {
    expect(getBenchmarkDetailTabViews("summary")).toEqual(["ai-insights"]);
    expect(getBenchmarkDetailTabViews("offer")).toEqual(["offer-builder"]);
    expect(getBenchmarkDetailTabViews("internal-pay")).toEqual([
      "level-table",
      "salary-breakdown",
      "comp-mix",
    ]);
    expect(getBenchmarkDetailTabViews("market-analysis")).toEqual([
      "trend-chart",
      "geo-comparison",
      "industry",
      "company-size",
    ]);
  });

  it("returns tab metadata by id", () => {
    expect(getBenchmarkDetailTab("offer")).toMatchObject({
      label: "Offer",
      description: "Create a competitive package from this benchmark",
    });
  });
});
