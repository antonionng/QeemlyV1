"use client";

import { useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import { WidgetWrapper } from "../widget-wrapper";
import { RoleSearchWidget } from "./widgets/role-search";
import { SalaryOverviewWidget } from "./widgets/salary-overview";
import { PercentileDistributionWidget } from "./widgets/percentile-distribution";
import { TrendChartWidget } from "./widgets/trend-chart";
import { GCCMarketsWidget } from "./widgets/gcc-markets";
import { OfferBuilderWidget } from "./widgets/offer-builder";
import { QuickActionsWidget } from "./widgets/quick-actions";
import { AIGuidanceWidget } from "./widgets/ai-guidance";
import { getBenchmarkWidgetDefinition } from "@/lib/benchmarks/widget-registry";
import type { GridLayoutItem } from "@/lib/benchmarks/preset-layouts";

const ResponsiveGridLayout = WidthProvider(Responsive);

type BenchmarksLayoutManagerProps = {
  layout: GridLayoutItem[];
  activeWidgets: string[];
  onLayoutChange: (layout: GridLayoutItem[]) => void;
  onRemoveWidget: (widgetId: string) => void;
};

const WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  "role-search": RoleSearchWidget,
  "salary-overview": SalaryOverviewWidget,
  "percentile-distribution": PercentileDistributionWidget,
  "trend-chart": TrendChartWidget,
  "gcc-markets": GCCMarketsWidget,
  "offer-builder": OfferBuilderWidget,
  "quick-actions": QuickActionsWidget,
  "ai-guidance": AIGuidanceWidget,
};

// Generate responsive layouts from the main layout
function generateResponsiveLayouts(layout: GridLayoutItem[], activeWidgets: string[]) {
  const filteredLayout = layout.filter((item) => activeWidgets.includes(item.i));
  
  // Large (12 cols) - use original layout
  const lg = filteredLayout;
  
  // Medium (6 cols) - 2 column grid
  const md = filteredLayout.map((item, index) => ({
    ...item,
    x: (index % 2) * 3,
    y: Math.floor(index / 2) * 3,
    w: 3,
    h: 3,
  }));
  
  // Small (4 cols) - 2 column grid
  const sm = filteredLayout.map((item, index) => ({
    ...item,
    x: (index % 2) * 2,
    y: Math.floor(index / 2) * 3,
    w: 2,
    h: 3,
  }));
  
  // Extra small (2 cols) - 2 column grid
  const xs = filteredLayout.map((item, index) => ({
    ...item,
    x: (index % 2),
    y: Math.floor(index / 2) * 3,
    w: 1,
    h: 3,
  }));
  
  // XXS (1 col) - single column stack
  const xxs = filteredLayout.map((item, index) => ({
    ...item,
    x: 0,
    y: index * 3,
    w: 1,
    h: 3,
  }));
  
  return { lg, md, sm, xs, xxs };
}

export function BenchmarksLayoutManager({
  layout,
  activeWidgets,
  onLayoutChange,
  onRemoveWidget,
}: BenchmarksLayoutManagerProps) {
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
        rowHeight={120}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        compactType="vertical"
        preventCollision={false}
        onLayoutChange={(currentLayout, allLayouts) => {
          // Update with the current breakpoint's layout
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
          const widgetDef = getBenchmarkWidgetDefinition(widgetId);
          if (!WidgetComponent || !widgetDef) return null;

          return (
            <div key={widgetId}>
              <WidgetWrapper
                widgetId={widgetId}
                onRemove={() => onRemoveWidget(widgetId)}
                customWidget={{
                  id: widgetDef.id,
                  name: widgetDef.name,
                  description: widgetDef.description,
                  icon: widgetDef.icon,
                  tooltipExplanation: widgetDef.tooltipExplanation,
                }}
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
