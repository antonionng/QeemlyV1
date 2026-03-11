import type { OverviewMetrics, OverviewRiskSummary } from "@/lib/dashboard/company-overview";

export function getHealthScorePresentation(metrics: Pick<
  OverviewMetrics,
  "healthScore" | "rolesOutsideBand" | "benchmarkedEmployees"
>) {
  const summary = buildHealthSummary(metrics);

  if (metrics.healthScore >= 80) {
    return {
      label: "Excellent",
      tone: "positive" as const,
      icon: "check-circle" as const,
      accentClass: "text-emerald-600",
      primaryValue: `${metrics.healthScore}/100`,
      secondaryValue: "Excellent",
      summary,
    };
  }

  if (metrics.healthScore >= 60) {
    return {
      label: "Good",
      tone: "positive" as const,
      icon: "check-circle" as const,
      accentClass: "text-emerald-600",
      primaryValue: `${metrics.healthScore}/100`,
      secondaryValue: "Good",
      summary,
    };
  }

  if (metrics.healthScore >= 40) {
    return {
      label: "Fair",
      tone: "warning" as const,
      icon: "alert-circle" as const,
      accentClass: "text-amber-600",
      primaryValue: `${metrics.healthScore}/100`,
      secondaryValue: "Fair",
      summary,
    };
  }

  return {
    label: "Critical",
    tone: "critical" as const,
    icon: "x-circle" as const,
    accentClass: "text-rose-600",
    primaryValue: "Critical",
    secondaryValue: `Health score ${metrics.healthScore}/100`,
    summary,
  };
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
