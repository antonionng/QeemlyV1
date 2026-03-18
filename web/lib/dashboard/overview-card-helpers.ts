import type { OverviewMetrics, OverviewRiskSummary } from "@/lib/dashboard/company-overview";

type HealthFactorTone = "positive" | "warning" | "critical";

export const OVERVIEW_BAND_COLORS = {
  inBand: "#00BC7D",
  inBandBg: "rgba(0,188,125,0.1)",
  aboveBand: "#FE9A00",
  aboveBandBg: "rgba(254,154,0,0.1)",
  belowBand: "#FF2056",
  belowBandBg: "rgba(255,32,86,0.1)",
} as const;

type HealthScoreFactor = {
  label: string;
  value: number;
  width: number;
  target: number;
  description: string;
  tone: HealthFactorTone;
};

export function getHealthScorePresentation(metrics: Pick<
  OverviewMetrics,
  "healthScore" | "rolesOutsideBand" | "benchmarkedEmployees"
>) {
  const summary = buildHealthSummary(metrics);

  if (metrics.healthScore >= 80) {
    return {
      label: "Good",
      tone: "positive" as const,
      icon: "check-circle" as const,
      accentClass: "text-emerald-600",
      primaryValue: `${metrics.healthScore}`,
      secondaryValue: `Health score ${metrics.healthScore}/100`,
      summary,
    };
  }

  if (metrics.healthScore >= 60) {
    return {
      label: "Good",
      tone: "positive" as const,
      icon: "check-circle" as const,
      accentClass: "text-emerald-600",
      primaryValue: `${metrics.healthScore}`,
      secondaryValue: `Health score ${metrics.healthScore}/100`,
      summary,
    };
  }

  if (metrics.healthScore >= 40) {
    return {
      label: "Warning",
      tone: "warning" as const,
      icon: "alert-circle" as const,
      accentClass: "text-amber-600",
      primaryValue: `${metrics.healthScore}`,
      secondaryValue: `Health score ${metrics.healthScore}/100`,
      summary,
    };
  }

  return {
    label: "Critical",
    tone: "critical" as const,
    icon: "x-circle" as const,
    accentClass: "text-rose-600",
    primaryValue: `${metrics.healthScore}`,
    secondaryValue: `Health score ${metrics.healthScore}/100`,
    summary,
  };
}

export function getHealthScoreFactors(
  metrics: Pick<
    OverviewMetrics,
    "inBandPercentage" | "avgMarketPosition" | "payrollRiskFlags" | "activeEmployees" | "benchmarkedEmployees"
  >,
): HealthScoreFactor[] {
  if (metrics.activeEmployees === 0 || metrics.benchmarkedEmployees === 0) {
    return [
      {
        label: "Band Alignment",
        value: 0,
        target: 75,
        description: "No benchmarked employees yet",
        tone: "critical",
        width: 0,
      },
      {
        label: "Market Position",
        value: 0,
        target: 85,
        description: "No benchmarked employees yet",
        tone: "critical",
        width: 0,
      },
      {
        label: "Risk Management",
        value: 0,
        target: 90,
        description: "No benchmarked employees yet",
        tone: "critical",
        width: 0,
      },
    ];
  }

  const factors = [
    {
      label: "Band Alignment",
      value: clampPercent(metrics.inBandPercentage),
      target: 75,
      description: `${metrics.inBandPercentage}% of employees in band`,
    },
    {
      label: "Market Position",
      value: clampPercent(Math.max(0, 100 - Math.abs(metrics.avgMarketPosition - 2.5) * 8)),
      target: 85,
      description: `${metrics.avgMarketPosition >= 0 ? "+" : ""}${metrics.avgMarketPosition}% vs market`,
    },
    {
      label: "Risk Management",
      value: clampPercent(
        Math.max(0, 100 - (metrics.payrollRiskFlags / Math.max(metrics.activeEmployees, 1)) * 500),
      ),
      target: 90,
      description: `${metrics.payrollRiskFlags} risk flags`,
    },
  ] as const;

  return factors.map((factor) => {
    const tone =
      factor.value >= factor.target
        ? "positive"
        : factor.value >= factor.target * 0.7
          ? "warning"
          : "critical";

    return {
      ...factor,
      tone,
      width: clampPercent(factor.value),
    };
  });
}

export function getRiskCardPresentation(
  metrics: Pick<OverviewMetrics, "payrollRiskFlags">,
  summary: OverviewRiskSummary,
) {
  const topDepartment = summary.departmentRows[0] ?? null;

  return {
    title: "Above-Market Pay Risk",
    subtitle: "Focus on employees above market thresholds first.",
    badgeLabel: `${summary.totalAtRisk} above market`,
    primaryFocusTitle: topDepartment ? `Start with ${topDepartment.name}` : "Review above-market employees",
    primaryFocusDescription: topDepartment
      ? `${topDepartment.value} employees in ${topDepartment.name} are above market thresholds.`
      : `${metrics.payrollRiskFlags} employees are above market thresholds.`,
    actionLabel: "Review above-market employees",
  };
}

export function getBandDistributionPresentation(
  metrics: Pick<
    OverviewMetrics,
    "bandDistribution" | "bandDistributionCounts"
  >,
) {
  const { inBand, above, below } = metrics.bandDistribution;
  const { inBand: inBandCount, above: aboveCount, below: belowCount } = metrics.bandDistributionCounts;

  if (above >= below && above >= inBand) {
    return {
      title: "Band Distribution",
      subtitle: "Most benchmarked employees are above the target band.",
      primaryFocusTitle: `${above}% above band`,
      primaryFocusDescription: `${aboveCount} benchmarked employees are currently paid above the target range.`,
      targetLabel: "75% in band target",
      targetProgressLabel: `${Math.max(0, 75 - inBand)} percentage points to go`,
    };
  }

  if (below >= above && below >= inBand) {
    return {
      title: "Band Distribution",
      subtitle: "Most benchmarked employees are below the target band.",
      primaryFocusTitle: `${below}% below band`,
      primaryFocusDescription: `${belowCount} benchmarked employees are currently paid below the target range.`,
      targetLabel: "75% in band target",
      targetProgressLabel: `${Math.max(0, 75 - inBand)} percentage points to go`,
    };
  }

  return {
    title: "Band Distribution",
    subtitle: "Most benchmarked employees are inside the target band.",
    primaryFocusTitle: `${inBand}% in band`,
    primaryFocusDescription: `${inBandCount} benchmarked employees are currently inside the target range.`,
    targetLabel: "75% in band target",
    targetProgressLabel: inBand >= 75 ? "Target met" : `${Math.max(0, 75 - inBand)} percentage points to go`,
  };
}

function buildHealthSummary(
  metrics: Pick<OverviewMetrics, "rolesOutsideBand" | "benchmarkedEmployees">,
): string {
  if (metrics.benchmarkedEmployees === 0) {
    return "No benchmarked employees are included in this score yet.";
  }

  if (metrics.rolesOutsideBand === 0) {
    return "All benchmarked employees are currently inside the target band.";
  }

  return `${metrics.rolesOutsideBand} of ${metrics.benchmarkedEmployees} benchmarked employees are outside the target band.`;
}
function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}
