import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CostBreakdownWidget } from "@/components/dashboard/relocation/widgets/cost-breakdown";
import { calculateRelocation } from "@/lib/relocation/calculator";

describe("CostBreakdownWidget", () => {
  it("uses wrap-safe difference rows for long currency values", () => {
    const result = calculateRelocation({
      homeCityId: "dubai",
      targetCityId: "london",
      baseSalary: 450_000,
      compApproach: "purchasing-power",
    });

    const html = renderToStaticMarkup(
      React.createElement(CostBreakdownWidget, {
        result,
      })
    );

    expect(html).toContain("Monthly difference");
    expect(html).toContain("Annual difference");
    expect(html).toContain("break-words");
    expect(html).toContain("grid gap-1");
    expect(html).toContain("flex flex-wrap items-center gap-x-2 gap-y-1");
  });
});
