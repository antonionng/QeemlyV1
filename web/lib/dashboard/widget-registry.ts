// Widget Registry - Defines all available dashboard widgets

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Globe2,
  LayoutGrid,
  LineChart,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";

export type WidgetSize = "small" | "medium" | "large" | "full";

export type WidgetDefinition = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  defaultSize: WidgetSize;
  minWidth: number;  // Grid units (1-12)
  minHeight: number; // Grid units
  maxWidth?: number;
  maxHeight?: number;
  category: "metrics" | "charts" | "lists" | "insights";
};

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  "market-pulse": {
    id: "market-pulse",
    name: "Market Pulse",
    description: "Live market indicators with confidence metrics",
    icon: Activity,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 2,
    maxWidth: 6,
    category: "metrics",
  },
  "salary-distribution": {
    id: "salary-distribution",
    name: "Salary Distribution",
    description: "Percentile breakdown with range visualization",
    icon: BarChart3,
    defaultSize: "large",
    minWidth: 6,
    minHeight: 3,
    category: "charts",
  },
  "trend-analytics": {
    id: "trend-analytics",
    name: "Trend Analytics",
    description: "Historical salary movement over time",
    icon: TrendingUp,
    defaultSize: "large",
    minWidth: 6,
    minHeight: 3,
    category: "charts",
  },
  "geo-comparison": {
    id: "geo-comparison",
    name: "Geo Comparison",
    description: "Salary comparison across markets",
    icon: Globe2,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "charts",
  },
  "role-comparison": {
    id: "role-comparison",
    name: "Role Comparison",
    description: "Side-by-side role analysis",
    icon: Scale,
    defaultSize: "large",
    minWidth: 6,
    minHeight: 3,
    category: "charts",
  },
  "watchlist": {
    id: "watchlist",
    name: "Watchlist",
    description: "Saved searches with price alerts",
    icon: Bell,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "lists",
  },
  "ai-insights": {
    id: "ai-insights",
    name: "AI Insights",
    description: "Smart recommendations and anomalies",
    icon: Brain,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "insights",
  },
  "activity-feed": {
    id: "activity-feed",
    name: "Activity Feed",
    description: "Recent team searches and exports",
    icon: Users,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "lists",
  },
};

export const ALL_WIDGET_IDS = Object.keys(WIDGET_REGISTRY);

export function getWidgetDefinition(widgetId: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY[widgetId];
}

export function getWidgetsByCategory(category: WidgetDefinition["category"]): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).filter(w => w.category === category);
}

