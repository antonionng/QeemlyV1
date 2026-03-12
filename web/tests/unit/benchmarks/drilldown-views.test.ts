import { describe, expect, it } from "vitest";

import {
  filterDrilldownViewsForCompanyData,
  getOrderedEnabledViews,
  type DrilldownViewId,
} from "@/lib/benchmarks/drilldown-views";

describe("drilldown view visibility", () => {
  it("hides tenant-only views when the workspace has no employee data", () => {
    const enabledViews: DrilldownViewId[] = [
      "level-table",
      "ai-insights",
      "offer-builder",
      "trend-chart",
    ];
    const viewOrder: DrilldownViewId[] = [
      "level-table",
      "ai-insights",
      "offer-builder",
      "trend-chart",
    ];

    const visibleViews = filterDrilldownViewsForCompanyData(
      getOrderedEnabledViews(enabledViews, viewOrder),
      false,
    );

    expect(visibleViews.map((view) => view.id)).toEqual(["level-table", "trend-chart"]);
  });

  it("keeps all enabled views when company data exists", () => {
    const enabledViews: DrilldownViewId[] = ["level-table", "ai-insights", "offer-builder"];
    const viewOrder: DrilldownViewId[] = ["level-table", "ai-insights", "offer-builder"];

    const visibleViews = filterDrilldownViewsForCompanyData(
      getOrderedEnabledViews(enabledViews, viewOrder),
      true,
    );

    expect(visibleViews.map((view) => view.id)).toEqual([
      "level-table",
      "ai-insights",
      "offer-builder",
    ]);
  });
});
