"use client";

import { CompensationHealthScoreCard } from "@/components/compensation/CompensationHealthScoreCard";
import type { OverviewMetrics } from "@/lib/dashboard/company-overview";
import type {
  OverviewInteractionMap,
  OverviewInteractionTarget,
} from "@/lib/dashboard/overview-interactions";
import { getHealthScoreFactors } from "@/lib/dashboard/overview-card-helpers";

interface HealthScoreProps {
  metrics: OverviewMetrics;
  interactions?: OverviewInteractionMap;
  onInteract?: (target: OverviewInteractionTarget) => void;
}

export function HealthScore({ metrics, interactions, onInteract }: HealthScoreProps) {
  const factors = getHealthScoreFactors(metrics);
  const [bandAlignmentFactor, marketPositionFactor, riskManagementFactor] = factors;

  return (
    <CompensationHealthScoreCard
      score={metrics.healthScore}
      bandAlignment={bandAlignmentFactor?.width ?? 0}
      marketPosition={marketPositionFactor?.width ?? 0}
      riskScore={riskManagementFactor?.width ?? 0}
      bandAlignmentDescription={bandAlignmentFactor?.description}
      marketPositionDescription={marketPositionFactor?.description}
      riskScoreDescription={riskManagementFactor?.description}
      gaugeInteraction={interactions?.healthScoreGauge}
      bandAlignmentInteraction={interactions?.healthScoreFactors.bandAlignment}
      marketPositionInteraction={interactions?.healthScoreFactors.marketPosition}
      riskManagementInteraction={interactions?.healthScoreFactors.riskManagement}
      onInteract={onInteract}
      cardTestId="health-score-card"
      gaugeShellTestId="health-score-gauge-shell"
    />
  );
}
