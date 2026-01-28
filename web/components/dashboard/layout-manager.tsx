"use client";

import { useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import { WidgetWrapper } from "./widget-wrapper";
import { MarketPulseWidget } from "./widgets/market-pulse";
import { SalaryDistributionWidget } from "./widgets/salary-distribution";
import { TrendAnalyticsWidget } from "./widgets/trend-analytics";
import { GeoComparisonWidget } from "./widgets/geo-comparison";
import { RoleComparisonWidget } from "./widgets/role-comparison";
import { WatchlistWidget } from "./widgets/watchlist";
import { AIInsightsWidget } from "./widgets/ai-insights";
import { ActivityFeedWidget } from "./widgets/activity-feed";
import { MarketOutlookWidget } from "./widgets/market-outlook";
import { IndustryBenchmarkWidget } from "./widgets/industry-benchmark";
import { CompanySizePremiumWidget } from "./widgets/company-size-premium";
import { ExperienceMatrixWidget } from "./widgets/experience-matrix";
import { CompMixWidget } from "./widgets/comp-mix";
import type { GridLayoutItem } from "@/lib/dashboard/preset-layouts";

const ResponsiveGridLayout = WidthProvider(Responsive);

type LayoutManagerProps = {
  layout: GridLayoutItem[];
  activeWidgets: string[];
  onLayoutChange: (layout: GridLayoutItem[]) => void;
  onRemoveWidget: (widgetId: string) => void;
};

const WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  "market-pulse": MarketPulseWidget,
  "salary-distribution": SalaryDistributionWidget,
  "trend-analytics": TrendAnalyticsWidget,
  "geo-comparison": GeoComparisonWidget,
  "role-comparison": RoleComparisonWidget,
  "watchlist": WatchlistWidget,
  "ai-insights": AIInsightsWidget,
  "activity-feed": ActivityFeedWidget,
  "market-outlook": MarketOutlookWidget,
  "industry-benchmark": IndustryBenchmarkWidget,
  "company-size-premium": CompanySizePremiumWidget,
  "experience-matrix": ExperienceMatrixWidget,
  "comp-mix": CompMixWidget,
};

// Generate responsive layouts from the main layout
function generateResponsiveLayouts(layout: GridLayoutItem[], activeWidgets: string[]) {
  const filteredLayout = layout.filter((item) => activeWidgets.includes(item.i));
  
  // Large (12 cols) - use original layout with consistent heights
  const lg = filteredLayout.map((item) => ({
    ...item,
    h: item.h || 2,
  }));
  
  // Medium (6 cols) - 2 column grid
  const md = filteredLayout.map((item, index) => ({
    ...item,
    x: (index % 2) * 3,
    y: Math.floor(index / 2) * 2,
    w: 3,
    h: 2,
  }));
  
  // Small (4 cols) - 2 column grid
  const sm = filteredLayout.map((item, index) => ({
    ...item,
    x: (index % 2) * 2,
    y: Math.floor(index / 2) * 2,
    w: 2,
    h: 2,
  }));
  
  // Extra small (2 cols) - 2 column grid
  const xs = filteredLayout.map((item, index) => ({
    ...item,
    x: (index % 2),
    y: Math.floor(index / 2) * 2,
    w: 1,
    h: 2,
  }));
  
  // XXS (1 col) - single column stack
  const xxs = filteredLayout.map((item, index) => ({
    ...item,
    x: 0,
    y: index * 2,
    w: 1,
    h: 2,
  }));
  
  return { lg, md, sm, xs, xxs };
}

export function LayoutManager({
  layout,
  activeWidgets,
  onLayoutChange,
  onRemoveWidget,
}: LayoutManagerProps) {
  // Generate responsive layouts
  const layouts = useMemo(
    () => generateResponsiveLayouts(layout, activeWidgets),
    [layout, activeWidgets]
  );

  if (activeWidgets.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 6, sm: 4, xs: 2, xxs: 1 }}
        rowHeight={160}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        compactType="vertical"
        preventCollision={false}
        onLayoutChange={(currentLayout, allLayouts) => {
          onLayoutChange(
            currentLayout.map((item) => ({ ...item })) as GridLayoutItem[],
          );
        }}
        useCSSTransforms={true}
        isDraggable={true}
        isResizable={true}
      >
        {activeWidgets.map((widgetId) => {
          const WidgetComponent = WIDGET_COMPONENTS[widgetId];
          if (!WidgetComponent) return null;

          return (
            <div key={widgetId}>
              <WidgetWrapper
                widgetId={widgetId}
                onRemove={() => onRemoveWidget(widgetId)}
              >
                <WidgetComponent />
              </WidgetWrapper>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
