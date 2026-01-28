// Reports Widget Registry
// Defines all available widgets for the reports dashboard

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Clock,
  FileSearch,
  FileStack,
  LayoutGrid,
  PlusCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export type ReportWidgetSize = "small" | "medium" | "large" | "full";

export interface ReportWidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  defaultSize: ReportWidgetSize;
  minWidth: number; // Grid units (1-12)
  minHeight: number; // Grid units
  tooltipExplanation: string;
}

export const REPORT_WIDGET_REGISTRY: Record<string, ReportWidgetDefinition> = {
  "report-stats": {
    id: "report-stats",
    name: "Reporting KPIs",
    description: "Key performance indicators for your reports",
    icon: TrendingUp,
    defaultSize: "full",
    minWidth: 12,
    minHeight: 1,
    tooltipExplanation: "Track the volume and status of your reporting activity over the last 30 days. Includes generation count, readiness, and data coverage metrics.",
  },
  "report-templates": {
    id: "report-templates",
    name: "Report Templates",
    description: "Curated templates to start fast",
    icon: FileStack,
    defaultSize: "large",
    minWidth: 8,
    minHeight: 4,
    tooltipExplanation: "Choose from high-impact templates designed for Board reviews, compliance updates, or deep-dive benchmarks. All templates are customizable on export.",
  },
  "recent-reports": {
    id: "recent-reports",
    name: "Recent Reports",
    description: "Your recently generated outputs",
    icon: Clock,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    tooltipExplanation: "Quickly access and download the reports you or your team have recently generated. Track status from 'Building' to 'Ready'.",
  },
  "custom-builder": {
    id: "custom-builder",
    name: "Custom Report Builder",
    description: "Assemble bespoke narratives",
    icon: Sparkles,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 2,
    tooltipExplanation: "The custom builder lets you mix and match different data blocks - from benchmarks to pay equity charts - into a single professional narrative.",
  },
};

export const ALL_REPORT_WIDGET_IDS = Object.keys(REPORT_WIDGET_REGISTRY);

export function getReportWidgetDefinition(widgetId: string): ReportWidgetDefinition | undefined {
  return REPORT_WIDGET_REGISTRY[widgetId];
}
