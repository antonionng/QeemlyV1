// Benchmark Widget Registry - Defines all available benchmark widgets

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Brain,
  Briefcase,
  Globe2,
  LineChart,
  Search,
  Sliders,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

export type WidgetSize = "small" | "medium" | "large" | "full";

export type BenchmarkWidgetDefinition = {
  id: string;
  name: string;
  description: string;
  tooltipExplanation: string;
  icon: LucideIcon;
  defaultSize: WidgetSize;
  minWidth: number;  // Grid units (1-12)
  minHeight: number; // Grid units
  maxWidth?: number;
  maxHeight?: number;
  category: "search" | "metrics" | "charts" | "tools" | "insights";
};

export const BENCHMARK_WIDGET_REGISTRY: Record<string, BenchmarkWidgetDefinition> = {
  "role-search": {
    id: "role-search",
    name: "Role Search",
    description: "Find and select roles to benchmark",
    tooltipExplanation: "Search for any job role to see compensation data. The cards show a quick preview with median salary and year-over-year change. Click a role to load detailed benchmark data across all widgets.",
    icon: Search,
    defaultSize: "large",
    minWidth: 6,
    minHeight: 3,
    category: "search",
  },
  "salary-overview": {
    id: "salary-overview",
    name: "Salary Overview",
    description: "Key compensation metrics at a glance",
    tooltipExplanation: "This shows the median monthly compensation for the selected role. P50 (median) means half of data points are above and half below this value. The MoM (month-over-month) and YoY (year-over-year) changes indicate salary movement trends.",
    icon: BarChart3,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 2,
    category: "metrics",
  },
  "percentile-distribution": {
    id: "percentile-distribution",
    name: "Percentile Distribution",
    description: "P10-P90 salary range visualization",
    tooltipExplanation: "Percentiles show salary distribution across the market. P25 represents entry-level compensation, P50 is mid-market (median), P75 is competitive pay for experienced hires, and P90 is premium compensation for top talent.",
    icon: BarChart3,
    defaultSize: "large",
    minWidth: 6,
    minHeight: 3,
    category: "charts",
  },
  "trend-chart": {
    id: "trend-chart",
    name: "Trend Chart",
    description: "Historical salary movement over time",
    tooltipExplanation: "This chart shows how salaries have changed over time. The shaded area represents the P25-P75 range, while the line shows the median. Use the time range selector to analyze short-term vs long-term trends.",
    icon: TrendingUp,
    defaultSize: "large",
    minWidth: 6,
    minHeight: 3,
    category: "charts",
  },
  "gcc-markets": {
    id: "gcc-markets",
    name: "GCC Markets",
    description: "Compare salaries across GCC locations",
    tooltipExplanation: "Compare the same role across different GCC markets to understand regional pay variations. Factors like cost of living, talent availability, and local demand influence these differences. Click a market to switch your benchmark location.",
    icon: Globe2,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 3,
    category: "charts",
  },
  "offer-builder": {
    id: "offer-builder",
    name: "Offer Builder",
    description: "Interactive offer targeting tool",
    tooltipExplanation: "Use this tool to determine competitive offer ranges. Slide to your target percentile - P50 matches market median, P75 is competitive for strong candidates, P90 helps close top talent. The recommended range accounts for negotiation flexibility.",
    icon: Sliders,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 2,
    category: "tools",
  },
  "quick-actions": {
    id: "quick-actions",
    name: "Quick Actions",
    description: "Common benchmark operations",
    tooltipExplanation: "Quick access to frequently used actions. Save benchmarks to your watchlist for alerts, export data for reports, or add roles to comparison view for side-by-side analysis.",
    icon: Zap,
    defaultSize: "small",
    minWidth: 3,
    minHeight: 2,
    category: "tools",
  },
  "ai-guidance": {
    id: "ai-guidance",
    name: "AI Guidance",
    description: "Smart hiring recommendations",
    tooltipExplanation: "AI-powered insights based on current market conditions and your selected role. Recommendations factor in demand trends, competitive dynamics, and optimal offer strategies to help you close candidates successfully.",
    icon: Sparkles,
    defaultSize: "medium",
    minWidth: 4,
    minHeight: 2,
    category: "insights",
  },
};

export const ALL_BENCHMARK_WIDGET_IDS = Object.keys(BENCHMARK_WIDGET_REGISTRY);

export function getBenchmarkWidgetDefinition(widgetId: string): BenchmarkWidgetDefinition | undefined {
  return BENCHMARK_WIDGET_REGISTRY[widgetId];
}

export function getBenchmarkWidgetsByCategory(category: BenchmarkWidgetDefinition["category"]): BenchmarkWidgetDefinition[] {
  return Object.values(BENCHMARK_WIDGET_REGISTRY).filter(w => w.category === category);
}
