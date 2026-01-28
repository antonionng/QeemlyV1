// Preset Layout Templates for Benchmarks

export type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
};

export type BenchmarkLayoutPreset = {
  id: string;
  name: string;
  description: string;
  icon: string;
  widgets: string[];
  layout: GridLayoutItem[];
};

// Grid is 12 columns
const COLS = 12;

export const BENCHMARK_PRESET_LAYOUTS: BenchmarkLayoutPreset[] = [
  {
    id: "full-analysis",
    name: "Full Analysis",
    description: "Complete view with all benchmark data and tools",
    icon: "full",
    widgets: [
      "role-search",
      "salary-overview",
      "percentile-distribution",
      "trend-chart",
      "gcc-markets",
      "offer-builder",
      "quick-actions",
      "ai-guidance",
    ],
    layout: [
      // Row 1: Role Search (left) + Quick Actions & AI Guidance (right)
      { i: "role-search", x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
      { i: "quick-actions", x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: "ai-guidance", x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      // Row 2: Salary Overview (left) + Offer Builder (right)
      { i: "salary-overview", x: 0, y: 3, w: 6, h: 3, minW: 4, minH: 2 },
      { i: "offer-builder", x: 6, y: 3, w: 6, h: 3, minW: 4, minH: 2 },
      // Row 3: Charts side by side
      { i: "percentile-distribution", x: 0, y: 6, w: 6, h: 3, minW: 4, minH: 3 },
      { i: "trend-chart", x: 6, y: 6, w: 6, h: 3, minW: 4, minH: 3 },
      // Row 4: Full width markets
      { i: "gcc-markets", x: 0, y: 9, w: 12, h: 3, minW: 6, minH: 2 },
    ],
  },
  {
    id: "quick-view",
    name: "Quick View",
    description: "Essential metrics for fast lookups",
    icon: "quick",
    widgets: [
      "role-search",
      "salary-overview",
      "percentile-distribution",
      "ai-guidance",
    ],
    layout: [
      // 2x2 Grid
      { i: "role-search", x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
      { i: "ai-guidance", x: 6, y: 0, w: 6, h: 3, minW: 3, minH: 2 },
      { i: "salary-overview", x: 0, y: 3, w: 6, h: 3, minW: 4, minH: 2 },
      { i: "percentile-distribution", x: 6, y: 3, w: 6, h: 3, minW: 4, minH: 3 },
    ],
  },
  {
    id: "offer-mode",
    name: "Offer Mode",
    description: "Focused on creating competitive offers",
    icon: "offer",
    widgets: [
      "role-search",
      "salary-overview",
      "offer-builder",
      "gcc-markets",
      "ai-guidance",
      "quick-actions",
    ],
    layout: [
      // Row 1: 2x2 top section
      { i: "role-search", x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
      { i: "salary-overview", x: 6, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
      // Row 2: Offer builder + actions
      { i: "offer-builder", x: 0, y: 3, w: 6, h: 3, minW: 4, minH: 2 },
      { i: "ai-guidance", x: 6, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
      { i: "quick-actions", x: 9, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
      // Row 3: Full width markets
      { i: "gcc-markets", x: 0, y: 6, w: 12, h: 3, minW: 6, minH: 2 },
    ],
  },
  {
    id: "trends-focus",
    name: "Trends Focus",
    description: "Historical data and market movements",
    icon: "trends",
    widgets: [
      "role-search",
      "trend-chart",
      "gcc-markets",
      "salary-overview",
    ],
    layout: [
      // Row 1: 2x2
      { i: "role-search", x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
      { i: "salary-overview", x: 6, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
      // Row 2: Full width trend chart
      { i: "trend-chart", x: 0, y: 3, w: 12, h: 4, minW: 6, minH: 3 },
      // Row 3: Full width markets
      { i: "gcc-markets", x: 0, y: 7, w: 12, h: 3, minW: 6, minH: 2 },
    ],
  },
];

export const DEFAULT_BENCHMARK_PRESET = "full-analysis";

export function getBenchmarkPreset(presetId: string): BenchmarkLayoutPreset | undefined {
  return BENCHMARK_PRESET_LAYOUTS.find(p => p.id === presetId);
}

export function getDefaultBenchmarkLayout(): BenchmarkLayoutPreset {
  return BENCHMARK_PRESET_LAYOUTS.find(p => p.id === DEFAULT_BENCHMARK_PRESET) || BENCHMARK_PRESET_LAYOUTS[0];
}
