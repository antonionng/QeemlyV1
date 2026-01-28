// Relocation Widget Registry
// Defines all available widgets for the relocation calculator results

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  FileDown,
  PieChart,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

export type RelocationWidgetSize = "small" | "medium" | "large";

export interface RelocationWidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  defaultSize: RelocationWidgetSize;
  minWidth: number; // Grid units (1-12)
  minHeight: number; // Grid units
  aiExplain: string; // Explanation shown in AI tooltip
}

export const RELOCATION_WIDGET_REGISTRY: Record<string, RelocationWidgetDefinition> = {
  "col-index": {
    id: "col-index",
    name: "Cost of Living Index",
    description: "Ratio comparison between home and target locations",
    icon: TrendingUp,
    defaultSize: "small",
    minWidth: 3,
    minHeight: 2,
    aiExplain:
      "The Cost of Living (CoL) index compares how expensive the target city is relative to the home city. A ratio of 1.2x means the target location is 20% more expensive overall. This index accounts for rent, transportation, food, utilities, and other living expenses.",
  },
  "purchasing-power": {
    id: "purchasing-power",
    name: "Purchasing Power",
    description: "Equivalent salary to maintain living standard",
    icon: Wallet,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 2,
    aiExplain:
      "Purchasing power salary is the amount needed in the target location to maintain the same standard of living as the home location. If someone earns $100K in a city with CoL index 80, they would need $125K in a city with CoL index 100 to have equivalent purchasing power.",
  },
  "recommended-range": {
    id: "recommended-range",
    name: "Recommended Range",
    description: "Suggested salary adjustment range",
    icon: Target,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 2,
    aiExplain:
      "The recommended salary range provides flexibility for negotiation and accounts for individual circumstances. Rather than a single number, this range (typically ±5%) gives room for factors like experience level, urgency of hire, and candidate expectations while staying within budget guidelines.",
  },
  "cost-breakdown": {
    id: "cost-breakdown",
    name: "Cost Breakdown",
    description: "Side-by-side cost comparison",
    icon: PieChart,
    defaultSize: "large",
    minWidth: 6,
    minHeight: 3,
    aiExplain:
      "This breakdown shows estimated monthly costs across major categories: rent, transportation, food, utilities, and other expenses. Use this to understand which specific costs drive the difference between locations. You can override the rent estimate if you have more accurate data for the candidate's situation.",
  },
  "summary-export": {
    id: "summary-export",
    name: "Summary",
    description: "Export and share results",
    icon: FileDown,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 2,
    aiExplain:
      "Export this analysis as a PDF for stakeholder review, or copy a shareable link. The summary includes all inputs and calculated outputs, making it easy to document compensation decisions and maintain consistency across offers.",
  },
  "comparison": {
    id: "comparison",
    name: "Location Comparison",
    description: "Quick visual comparison of both locations",
    icon: ArrowLeftRight,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 2,
    aiExplain:
      "A side-by-side snapshot comparing the home and target locations, showing key metrics at a glance. This helps quickly validate your inputs and understand the overall cost difference between the two cities.",
  },
};

export const ALL_RELOCATION_WIDGET_IDS = Object.keys(RELOCATION_WIDGET_REGISTRY);

export function getRelocationWidgetDefinition(
  widgetId: string
): RelocationWidgetDefinition | undefined {
  return RELOCATION_WIDGET_REGISTRY[widgetId];
}

// Default widget layout for the relocation page
export const DEFAULT_RELOCATION_WIDGETS = [
  "comparison",
  "col-index",
  "purchasing-power",
  "recommended-range",
  "cost-breakdown",
  "summary-export",
];
