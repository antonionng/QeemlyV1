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
    ],
    layout: [
      // Row 1: 2x2 grid
      { i: "role-search", x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "salary-overview", x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      // Row 2: 2x2 grid
      { i: "percentile-distribution", x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "trend-chart", x: 6, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      // Row 3: 2x2 grid
      { i: "offer-builder", x: 0, y: 4, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "gcc-markets", x: 6, y: 4, w: 6, h: 2, minW: 4, minH: 2 },
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
      { i: "role-search", x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "salary-overview", x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "percentile-distribution", x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "ai-guidance", x: 6, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
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
    ],
    layout: [
      // 2x2 Grid
      { i: "role-search", x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "salary-overview", x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "offer-builder", x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "gcc-markets", x: 6, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
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
      // 2x2 Grid
      { i: "role-search", x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "salary-overview", x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "trend-chart", x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "gcc-markets", x: 6, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
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
