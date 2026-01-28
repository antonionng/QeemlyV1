// Preset Layout Templates for Dashboard

// Define our own Layout type to avoid module resolution issues
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

export type LayoutPreset = {
  id: string;
  name: string;
  description: string;
  icon: string;
  widgets: string[];
  layout: GridLayoutItem[];
};

// Grid is 12 columns
const COLS = 12;

export const PRESET_LAYOUTS: LayoutPreset[] = [
  {
    id: "analyst",
    name: "Analyst View",
    description: "Data-heavy with charts and detailed comparisons",
    icon: "analyst",
    widgets: [
      "market-pulse",
      "salary-distribution",
      "trend-analytics",
      "geo-comparison",
      "role-comparison",
      "ai-insights",
      "market-outlook",
      "experience-matrix",
      "comp-mix",
    ],
    layout: [
      // Row 1: 2x2 grid
      { i: "market-pulse", x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "salary-distribution", x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      // Row 2: 2x2 grid
      { i: "trend-analytics", x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "geo-comparison", x: 6, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      // Row 3: 2x2 grid
      { i: "role-comparison", x: 0, y: 4, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "ai-insights", x: 6, y: 4, w: 6, h: 2, minW: 4, minH: 2 },
      // New row 4
      { i: "market-outlook", x: 0, y: 6, w: 4, h: 3, minW: 4, minH: 3 },
      { i: "experience-matrix", x: 4, y: 6, w: 8, h: 4, minW: 6, minH: 4 },
      { i: "comp-mix", x: 0, y: 9, w: 4, h: 3, minW: 4, minH: 3 },
    ],
  },
  {
    id: "executive",
    name: "Executive View",
    description: "KPIs and high-level summaries",
    icon: "executive",
    widgets: [
      "market-pulse",
      "trend-analytics",
      "geo-comparison",
      "ai-insights",
      "market-outlook",
      "industry-benchmark",
    ],
    layout: [
      // 2x2 Grid
      { i: "market-pulse", x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "trend-analytics", x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "geo-comparison", x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "ai-insights", x: 6, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      // Row 3
      { i: "market-outlook", x: 0, y: 4, w: 6, h: 3, minW: 4, minH: 3 },
      { i: "industry-benchmark", x: 6, y: 4, w: 6, h: 3, minW: 4, minH: 3 },
    ],
  },
  {
    id: "recruiter",
    name: "Recruiter View",
    description: "Role-focused with quick actions",
    icon: "recruiter",
    widgets: [
      "market-pulse",
      "salary-distribution",
      "role-comparison",
      "watchlist",
      "company-size-premium",
    ],
    layout: [
      // 2x2 Grid
      { i: "market-pulse", x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "salary-distribution", x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "role-comparison", x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "watchlist", x: 6, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "company-size-premium", x: 0, y: 4, w: 6, h: 3, minW: 4, minH: 3 },
    ],
  },
  {
    id: "compact",
    name: "Compact View",
    description: "Essential metrics at a glance",
    icon: "compact",
    widgets: [
      "market-pulse",
      "trend-analytics",
      "watchlist",
      "ai-insights",
    ],
    layout: [
      // 2x2 Grid
      { i: "market-pulse", x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "trend-analytics", x: 6, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "watchlist", x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
      { i: "ai-insights", x: 6, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
    ],
  },
];

export const DEFAULT_PRESET = "analyst";

export function getPreset(presetId: string): LayoutPreset | undefined {
  return PRESET_LAYOUTS.find(p => p.id === presetId);
}

export function getDefaultLayout(): LayoutPreset {
  return PRESET_LAYOUTS.find(p => p.id === DEFAULT_PRESET) || PRESET_LAYOUTS[0];
}

