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
  tooltipExplanation?: string;
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
    tooltipExplanation: "Real-time stream of data points, submissions, and active companies contributing to the GCC dataset. Includes confidence scores based on data freshness and volume.",
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
    tooltipExplanation: "Shows the full range of compensation from P10 to P90. P50 represents the market median. Use this to understand the spread and competitiveness of different pay bands.",
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
    tooltipExplanation: "Visualizes how median salaries and percentiles have moved over the last 12 months. Essential for understanding market volatility and forecasting future adjustments.",
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
    tooltipExplanation: "Side-by-side comparison of median salaries across major GCC cities like Dubai, Riyadh, and Doha. Helps in cross-border talent strategy and relocation planning.",
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
    tooltipExplanation: "Compare compensation packages for different job families or roles within the same family. Useful for internal equity checks and role-based budget allocation.",
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
    tooltipExplanation: "Keep track of specific role/location combinations. We'll alert you to significant market shifts or new high-confidence data points for these entries.",
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
    tooltipExplanation: "Advanced AI analysis identifying market anomalies, emerging trends, and predictive salary forecasts based on global and regional economic indicators.",
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
    tooltipExplanation: "A real-time log of team interactions with the platform. See what roles and markets are currently being researched by your organization.",
  },
  "market-outlook": {
    id: "market-outlook",
    name: "Market Outlook",
    description: "Sentiment analysis and hiring velocity",
    icon: TrendingUp,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "insights",
    tooltipExplanation: "AI-driven sentiment analysis of the GCC job market. Evaluates whether the market currently favors candidates or employers, along with real-time hiring velocity across tech hubs.",
  },
  "industry-benchmark": {
    id: "industry-benchmark",
    name: "Industry Benchmark",
    description: "Pay variation across sectors",
    icon: BarChart3,
    defaultSize: "large",
    minWidth: 6,
    minHeight: 3,
    category: "charts",
    tooltipExplanation: "Compares compensation for the selected role across different industries (e.g., Fintech vs. Retail). Helps identify sectors with higher pay premiums.",
  },
  "company-size-premium": {
    id: "company-size-premium",
    name: "Company Size Premium",
    description: "Pay variance by headcount",
    icon: Scale,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "charts",
    tooltipExplanation: "Visualizes how company size impacts compensation. Typically shows the 'premium' paid by larger organizations compared to startups.",
  },
  "experience-matrix": {
    id: "experience-matrix",
    name: "Experience Matrix",
    description: "Full level progression view",
    icon: LayoutGrid,
    defaultSize: "large",
    minWidth: 6,
    minHeight: 4,
    category: "charts",
    tooltipExplanation: "A comprehensive grid showing pay progression across all experience levels. Ideal for career path planning and long-term budget forecasting.",
  },
  "comp-mix": {
    id: "comp-mix",
    name: "Comp Mix",
    description: "Base, Bonus & Equity split",
    icon: Activity,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "charts",
    tooltipExplanation: "Breaks down the total compensation package into its core components. Shows how much of the offer is typically guaranteed base vs. variable performance pay.",
  },
};

export const ALL_WIDGET_IDS = Object.keys(WIDGET_REGISTRY);

export function getWidgetDefinition(widgetId: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY[widgetId];
}

export function getWidgetsByCategory(category: WidgetDefinition["category"]): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).filter(w => w.category === category);
}

