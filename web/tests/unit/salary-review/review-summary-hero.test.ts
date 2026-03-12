import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReviewSummaryHero } from "@/components/dashboard/salary-review/review-summary-hero";

describe("ReviewSummaryHero", () => {
  it("renders a compact summary with a direct budget edit anchor", () => {
    const html = renderToStaticMarkup(
      React.createElement(ReviewSummaryHero, {
        budget: 163_000,
        budgetUsed: 0,
        budgetRemaining: 163_000,
        budgetPolicyLabel: "5% of current payroll is available for this review cycle.",
        budgetAllocationLabel: "0 proposals are allocating budget yet across 95 selected employees.",
        budgetRemainingLabel: "163,000 AED remaining in the current policy.",
        selectedEmployees: 95,
        coveredEmployees: 95,
        totalEmployees: 95,
        belowBandEmployees: 12,
        proposedEmployees: 0,
        benchmarkTrustLabel: "Qeemly Market Dataset",
      })
    );

    expect(html).toContain("Edit budget");
    expect(html).toContain('href="#review-settings"');
    expect(html).toContain("Review budget");
    expect(html).toContain("Review workspace at a glance");
    expect(html).not.toContain(
      "Use your review budget policy, market coverage, and gap signals to guide salary decisions."
    );
  });
});
