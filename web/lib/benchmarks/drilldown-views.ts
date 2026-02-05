// Drilldown Views Registry
// Configuration and types for customizable benchmark drill-down views

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  TableProperties,
  Building2,
  BarChart3,
  TrendingUp,
  Globe2,
  PieChart,
  Sparkles,
  Calculator,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// View IDs
export type DrilldownViewId =
  | "level-table"
  | "industry"
  | "company-size"
  | "trend-chart"
  | "geo-comparison"
  | "comp-mix"
  | "salary-breakdown"
  | "ai-insights"
  | "offer-builder";

// View configuration
export interface DrilldownView {
  id: DrilldownViewId;
  label: string;
  description: string;
  icon: LucideIcon;
  defaultEnabled: boolean;
  category: "data" | "comparison" | "tools";
}

// All available views
export const DRILLDOWN_VIEWS: DrilldownView[] = [
  {
    id: "level-table",
    label: "Level Table",
    description: "Percentile breakdown by seniority level",
    icon: TableProperties,
    defaultEnabled: true,
    category: "data",
  },
  {
    id: "industry",
    label: "Industry Breakdown",
    description: "Compare salaries across industries",
    icon: Building2,
    defaultEnabled: true,
    category: "comparison",
  },
  {
    id: "company-size",
    label: "Company Size",
    description: "Salary premium by company size",
    icon: BarChart3,
    defaultEnabled: false,
    category: "comparison",
  },
  {
    id: "trend-chart",
    label: "Trend Chart",
    description: "Historical salary trends over time",
    icon: TrendingUp,
    defaultEnabled: true,
    category: "data",
  },
  {
    id: "geo-comparison",
    label: "Geographic Comparison",
    description: "Compare across locations/markets",
    icon: Globe2,
    defaultEnabled: false,
    category: "comparison",
  },
  {
    id: "comp-mix",
    label: "Compensation Mix",
    description: "Base, bonus, and equity breakdown",
    icon: PieChart,
    defaultEnabled: false,
    category: "data",
  },
  {
    id: "salary-breakdown",
    label: "Salary Breakdown",
    description: "UAE salary split: Basic, Housing, Transport, Other",
    icon: Wallet,
    defaultEnabled: true,
    category: "data",
  },
  {
    id: "ai-insights",
    label: "AI Insights",
    description: "AI-powered analysis and recommendations",
    icon: Sparkles,
    defaultEnabled: true,
    category: "tools",
  },
  {
    id: "offer-builder",
    label: "Offer Builder",
    description: "Build competitive offer packages",
    icon: Calculator,
    defaultEnabled: false,
    category: "tools",
  },
];

// Get default enabled view IDs
export const DEFAULT_ENABLED_VIEWS: DrilldownViewId[] = DRILLDOWN_VIEWS
  .filter((v) => v.defaultEnabled)
  .map((v) => v.id);

// Get view by ID
export function getView(id: DrilldownViewId): DrilldownView | undefined {
  return DRILLDOWN_VIEWS.find((v) => v.id === id);
}

// Get views by category
export function getViewsByCategory(category: DrilldownView["category"]): DrilldownView[] {
  return DRILLDOWN_VIEWS.filter((v) => v.category === category);
}

// Drilldown preferences state
export interface DrilldownPreferencesState {
  enabledViews: DrilldownViewId[];
  viewOrder: DrilldownViewId[];
  
  // Actions
  toggleView: (id: DrilldownViewId) => void;
  enableView: (id: DrilldownViewId) => void;
  disableView: (id: DrilldownViewId) => void;
  setViewOrder: (order: DrilldownViewId[]) => void;
  selectAll: () => void;
  resetToDefault: () => void;
  isViewEnabled: (id: DrilldownViewId) => boolean;
}

export const useDrilldownPreferences = create<DrilldownPreferencesState>()(
  persist(
    (set, get) => ({
      enabledViews: [...DEFAULT_ENABLED_VIEWS],
      viewOrder: DRILLDOWN_VIEWS.map((v) => v.id),
      
      toggleView: (id) => set((state) => {
        const isEnabled = state.enabledViews.includes(id);
        return {
          enabledViews: isEnabled
            ? state.enabledViews.filter((v) => v !== id)
            : [...state.enabledViews, id],
        };
      }),
      
      enableView: (id) => set((state) => ({
        enabledViews: state.enabledViews.includes(id)
          ? state.enabledViews
          : [...state.enabledViews, id],
      })),
      
      disableView: (id) => set((state) => ({
        enabledViews: state.enabledViews.filter((v) => v !== id),
      })),
      
      setViewOrder: (order) => set({ viewOrder: order }),
      
      selectAll: () => set({
        enabledViews: DRILLDOWN_VIEWS.map((v) => v.id),
      }),
      
      resetToDefault: () => set({
        enabledViews: [...DEFAULT_ENABLED_VIEWS],
        viewOrder: DRILLDOWN_VIEWS.map((v) => v.id),
      }),
      
      isViewEnabled: (id) => get().enabledViews.includes(id),
    }),
    {
      name: "qeemly:drilldown-views",
    }
  )
);

// Get ordered enabled views
export function getOrderedEnabledViews(
  enabledViews: DrilldownViewId[],
  viewOrder: DrilldownViewId[]
): DrilldownView[] {
  return viewOrder
    .filter((id) => enabledViews.includes(id))
    .map((id) => getView(id)!)
    .filter(Boolean);
}
