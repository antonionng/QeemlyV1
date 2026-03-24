import { formatAEDCompact } from "@/lib/employees";
import type { CompanyOverviewSnapshot } from "@/lib/dashboard/company-overview";
import {
  getHealthScoreFactors,
  getHealthScorePresentation,
} from "@/lib/dashboard/overview-card-helpers";

export type OverviewInteractionTooltip = {
  title: string;
  value: string;
  description: string;
};

export type OverviewDrawerSection = {
  label: string;
  value: string;
  detail: string;
};

export type OverviewMetricDrawerContent = {
  type: "health-score" | "total-payroll";
  title: string;
  eyebrow: string;
  metricLabel: string;
  metricValue: string;
  summary: string;
  sections: OverviewDrawerSection[];
};

export type OverviewLinkInteractionTarget = {
  id: string;
  label: string;
  action: "link";
  href: string;
  tooltip: OverviewInteractionTooltip;
};

export type OverviewDrawerInteractionTarget = {
  id: string;
  label: string;
  action: "drawer";
  drawer: OverviewMetricDrawerContent;
  tooltip: OverviewInteractionTooltip;
};

export type OverviewInteractionTarget =
  | OverviewLinkInteractionTarget
  | OverviewDrawerInteractionTarget;

export type OverviewInteractionMap = {
  healthScoreGauge: OverviewInteractionTarget;
  healthScoreFactors: {
    bandAlignment: OverviewInteractionTarget;
    marketPosition: OverviewInteractionTarget;
    riskManagement: OverviewInteractionTarget;
  };
  bandDistribution: {
    inBand: OverviewInteractionTarget;
    aboveBand: OverviewInteractionTarget;
    belowBand: OverviewInteractionTarget;
  };
  statCards: {
    activeEmployees: OverviewInteractionTarget;
    totalPayroll: OverviewInteractionTarget;
    inBand: OverviewInteractionTarget;
    riskFlags: OverviewInteractionTarget;
  };
};

export function buildOverviewInteractionMap(
  snapshot: CompanyOverviewSnapshot,
): OverviewInteractionMap {
  const { metrics, benchmarkCoverage, riskSummary } = snapshot;
  const factors = getHealthScoreFactors(metrics);
  const healthPresentation = getHealthScorePresentation(metrics);
  const averagePayroll =
    metrics.activeEmployees > 0 ? Math.round(metrics.totalPayroll / metrics.activeEmployees) : 0;
  const formatBandDistributionDescription = (
    percentage: number,
    employeeCount: number,
    position: "inside" | "above" | "below",
  ) => {
    const noun = `employee${employeeCount === 1 ? "" : "s"}`;
    const verb = employeeCount === 1 ? "is" : "are";

    return `${percentage}% of benchmarked employees. ${employeeCount} ${noun} ${verb} currently ${position} the target range.`;
  };

  return {
    healthScoreGauge: {
      id: "health-score-gauge",
      label: "Compensation Health Score",
      action: "drawer",
      drawer: {
        type: "health-score",
        title: "Compensation Health Score",
        eyebrow: "Overview detail",
        metricLabel: "Overall score",
        metricValue: `${healthPresentation.primaryValue}%`,
        summary: healthPresentation.summary,
        sections: factors.map((factor) => ({
          label: factor.label,
          value: `${factor.value}%`,
          detail: factor.description,
        })),
      },
      tooltip: {
        title: "Compensation Health Score",
        value: `${healthPresentation.primaryValue}%`,
        description: healthPresentation.summary,
      },
    },
    healthScoreFactors: {
      bandAlignment: {
        id: "band-alignment",
        label: "Band Alignment",
        action: "link",
        href: buildPeopleHref({ band: "outside-band" }),
        tooltip: {
          title: "Band Alignment",
          value: `${metrics.inBandPercentage}% in band`,
          description: `${metrics.rolesOutsideBand} benchmarked employees sit outside the target range.`,
        },
      },
      marketPosition: {
        id: "market-position",
        label: "Market Position",
        action: "link",
        href: "/dashboard/benchmarks",
        tooltip: {
          title: "Market Position",
          value: `${metrics.avgMarketPosition >= 0 ? "+" : ""}${metrics.avgMarketPosition}% vs market`,
          description: "Open benchmarking to inspect the market context behind this positioning.",
        },
      },
      riskManagement: {
        id: "risk-management",
        label: "Risk Management",
        action: "link",
        href: buildPeopleHref({ band: "above" }),
        tooltip: {
          title: "Risk Management",
          value: `${metrics.payrollRiskFlags} risk flags`,
          description: riskSummary.methodologyLabel,
        },
      },
    },
    bandDistribution: {
      inBand: {
        id: "band-distribution-in-band",
        label: "In Band",
        action: "link",
        href: buildPeopleHref({ band: "in-band" }),
        tooltip: {
          title: "In Band",
          value: `${metrics.bandDistribution.inBand}%`,
          description: formatBandDistributionDescription(
            metrics.bandDistribution.inBand,
            metrics.bandDistributionCounts.inBand,
            "inside",
          ),
        },
      },
      aboveBand: {
        id: "band-distribution-above-band",
        label: "Above Band",
        action: "link",
        href: buildPeopleHref({ band: "above" }),
        tooltip: {
          title: "Above Band",
          value: `${metrics.bandDistribution.above}%`,
          description: formatBandDistributionDescription(
            metrics.bandDistribution.above,
            metrics.bandDistributionCounts.above,
            "above",
          ),
        },
      },
      belowBand: {
        id: "band-distribution-below-band",
        label: "Below Band",
        action: "link",
        href: buildPeopleHref({ band: "below" }),
        tooltip: {
          title: "Below Band",
          value: `${metrics.bandDistribution.below}%`,
          description: formatBandDistributionDescription(
            metrics.bandDistribution.below,
            metrics.bandDistributionCounts.below,
            "below",
          ),
        },
      },
    },
    statCards: {
      activeEmployees: {
        id: "active-employees",
        label: "Active Employees",
        action: "link",
        href: buildPeopleHref({}),
        tooltip: {
          title: "Active Employees",
          value: `${metrics.activeEmployees}`,
          description: `${metrics.totalEmployees} total employees. Open People to inspect the live roster.`,
        },
      },
      totalPayroll: {
        id: "total-payroll",
        label: "Total Payroll",
        action: "drawer",
        drawer: {
          type: "total-payroll",
          title: "Total Payroll",
          eyebrow: "Overview detail",
          metricLabel: "Annual compensation",
          metricValue: formatAEDCompact(metrics.totalPayroll),
          summary: `${metrics.payrollChange >= 0 ? "+" : ""}${metrics.payrollChange}% vs last year across ${metrics.activeEmployees} active employees.`,
          sections: [
            {
              label: "Average per employee",
              value: formatAEDCompact(averagePayroll),
              detail: "Computed from total annual payroll divided by active employees.",
            },
            {
              label: "Benchmarked coverage",
              value: `${benchmarkCoverage.coveragePct}%`,
              detail: `${benchmarkCoverage.benchmarkedEmployees} of ${benchmarkCoverage.activeEmployees} active employees are benchmark-matched.`,
            },
            {
              label: "Latest period",
              value:
                metrics.payrollTrend[metrics.payrollTrend.length - 1]?.month ??
                "Current",
              detail: "Open the payroll trend section below for the full time-series view.",
            },
          ],
        },
        tooltip: {
          title: "Total Payroll",
          value: formatAEDCompact(metrics.totalPayroll),
          description: `${metrics.payrollChange >= 0 ? "+" : ""}${metrics.payrollChange}% versus last year.`,
        },
      },
      inBand: {
        id: "in-band",
        label: "In Band",
        action: "link",
        href: buildPeopleHref({ band: "in-band" }),
        tooltip: {
          title: "In Band",
          value: `${metrics.inBandPercentage}%`,
          description: `${metrics.outOfBandPercentage}% of benchmarked employees remain outside the target range.`,
        },
      },
      riskFlags: {
        id: "risk-flags",
        label: "Risk Flags",
        action: "link",
        href: buildPeopleHref({ band: "above" }),
        tooltip: {
          title: "Risk Flags",
          value: `${metrics.payrollRiskFlags}`,
          description: `${riskSummary.totalAtRisk} employees are above market thresholds across tracked departments.`,
        },
      },
    },
  };
}

function buildPeopleHref({
  band,
}: {
  band?: "outside-band" | "in-band" | "above" | "below";
}) {
  const searchParams = new URLSearchParams();
  if (band) {
    searchParams.set("band", band);
  }
  const query = searchParams.toString();
  return query ? `/dashboard/people?${query}` : "/dashboard/people";
}
