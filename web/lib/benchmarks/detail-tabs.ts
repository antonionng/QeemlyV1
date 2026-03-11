import type { DrilldownViewId } from "./drilldown-views";

export type BenchmarkDetailTabId =
  | "summary"
  | "offer"
  | "internal-pay"
  | "market-analysis";

export type BenchmarkDetailTab = {
  id: BenchmarkDetailTabId;
  label: string;
  description: string;
  viewIds: DrilldownViewId[];
};

export const BENCHMARK_DETAIL_TABS: BenchmarkDetailTab[] = [
  {
    id: "summary",
    label: "Summary",
    description: "See the recommended market position and guidance",
    viewIds: ["ai-insights"],
  },
  {
    id: "offer",
    label: "Offer",
    description: "Create a competitive package from this benchmark",
    viewIds: ["offer-builder"],
  },
  {
    id: "internal-pay",
    label: "Internal Pay",
    description: "Compare this role across levels and pay structure",
    viewIds: ["level-table", "salary-breakdown", "comp-mix"],
  },
  {
    id: "market-analysis",
    label: "Market Analysis",
    description: "Explore supporting market comparisons and trends",
    viewIds: ["trend-chart", "geo-comparison", "industry", "company-size"],
  },
];

export function getBenchmarkDetailTab(id: BenchmarkDetailTabId): BenchmarkDetailTab {
  return BENCHMARK_DETAIL_TABS.find((tab) => tab.id === id) ?? BENCHMARK_DETAIL_TABS[0];
}

export function getBenchmarkDetailTabViews(id: BenchmarkDetailTabId): DrilldownViewId[] {
  return getBenchmarkDetailTab(id).viewIds;
}

export function getDefaultBenchmarkDetailTab(): BenchmarkDetailTabId {
  return "summary";
}

export function getPrimaryBenchmarkDetailTab(): BenchmarkDetailTabId {
  return "offer";
}
