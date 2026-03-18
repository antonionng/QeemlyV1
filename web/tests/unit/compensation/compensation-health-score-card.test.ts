import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CompensationHealthScoreCard } from "@/components/compensation/CompensationHealthScoreCard";
import type { OverviewInteractionTarget } from "@/lib/dashboard/overview-interactions";

describe("CompensationHealthScoreCard", () => {
  it("renders the requested card shell, gauge, status badge, and metric rows", () => {
    const html = renderToStaticMarkup(
      React.createElement(CompensationHealthScoreCard, {
        score: 70,
        bandAlignment: 65,
        marketPosition: 40,
        riskScore: 15,
      }),
    );

    expect(html).toContain('data-testid="compensation-health-score-card"');
    expect(html).toContain('data-testid="health-score-gauge"');
    expect(html).toContain('data-testid="health-score-needle"');
    expect(html).toContain('data-testid="health-score-center-stack"');
    expect(html).toContain(">70%</");
    expect(html).toContain(">Good<");
    expect(html).toContain(">Band Alignment<");
    expect(html).toContain(">Market Position<");
    expect(html).toContain(">Risk Management<");
    expect(html).toContain("background-color:#5C45FD");
    expect(html).toContain("background-color:#FE9A00");
    expect(html).toContain("background-color:#FF2056");
  });

  it("maps score thresholds to Excellent, Good, Warning, and Risk badges", () => {
    const excellent = renderToStaticMarkup(
      React.createElement(CompensationHealthScoreCard, {
        score: 80,
        bandAlignment: 65,
        marketPosition: 40,
        riskScore: 15,
      }),
    );
    const warning = renderToStaticMarkup(
      React.createElement(CompensationHealthScoreCard, {
        score: 45,
        bandAlignment: 65,
        marketPosition: 40,
        riskScore: 15,
      }),
    );
    const risk = renderToStaticMarkup(
      React.createElement(CompensationHealthScoreCard, {
        score: 15,
        bandAlignment: 65,
        marketPosition: 40,
        riskScore: 15,
      }),
    );

    expect(excellent).toContain(">Excellent<");
    expect(excellent).toContain("bg-teal-100 text-teal-700");
    expect(warning).toContain(">Warning<");
    expect(warning).toContain("bg-amber-100 text-amber-700");
    expect(risk).toContain(">Risk<");
    expect(risk).toContain("bg-red-100 text-red-700");
  });

  it("clamps out-of-range scores and only renders interactive wrappers when targets exist", () => {
    const gaugeInteraction: OverviewInteractionTarget = {
      id: "health-score-gauge",
      label: "Compensation Health Score",
      action: "drawer",
      drawer: {
        type: "health-score",
        title: "Compensation Health Score",
        eyebrow: "Overview detail",
        metricLabel: "Overall score",
        metricValue: "100%",
        summary: "Summary",
        sections: [],
      },
      tooltip: {
        title: "Compensation Health Score",
        value: "100%",
        description: "Summary",
      },
    };

    const bandAlignmentInteraction: OverviewInteractionTarget = {
      id: "band-alignment",
      label: "Band Alignment",
      action: "link",
      href: "/dashboard/salary-review?cohort=outside-band",
      tooltip: {
        title: "Band Alignment",
        value: "65%",
        description: "Band detail",
      },
    };

    const interactive = renderToStaticMarkup(
      React.createElement(CompensationHealthScoreCard, {
        score: 120,
        bandAlignment: 65,
        marketPosition: 40,
        riskScore: 15,
        gaugeInteraction,
        bandAlignmentInteraction,
      }),
    );
    const staticHtml = renderToStaticMarkup(
      React.createElement(CompensationHealthScoreCard, {
        score: -5,
        bandAlignment: 65,
        marketPosition: 40,
        riskScore: 15,
      }),
    );

    expect(interactive).toContain(">100%</");
    expect(interactive).toContain('data-testid="health-score-gauge-action"');
    expect(interactive).toContain('data-overview-action="drawer"');
    expect(interactive).toContain('data-testid="health-score-factor-band-alignment-action"');
    expect(interactive).toContain('data-overview-action="link"');
    expect(staticHtml).toContain(">0%</");
    expect(staticHtml).not.toContain('data-testid="health-score-gauge-action"');
    expect(staticHtml).not.toContain('data-testid="health-score-factor-band-alignment-action"');
  });
});
