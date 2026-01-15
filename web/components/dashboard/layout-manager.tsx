"use client";

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
};

export function LayoutManager({
  layout,
  activeWidgets,
  onLayoutChange,
  onRemoveWidget,
}: LayoutManagerProps) {
  // Filter layout to only include active widgets
  const currentLayout = layout.filter((item) => activeWidgets.includes(item.i));

  const handleLayoutChange = (newLayout: any) => {
    // Only trigger change if something actually moved or resized
    // react-grid-layout's onLayoutChange gives the full layout
    onLayoutChange(newLayout);
  };

  if (activeWidgets.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: currentLayout }}
        breakpoints={{ lg: 1024, md: 768, sm: 640, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 8, sm: 4, xs: 2, xxs: 1 }}
        rowHeight={160}
        draggableHandle=".drag-handle"
        margin={[20, 20]}
        compactType="vertical"
        preventCollision={false}
        measureBeforeMount={true}
        onLayoutChange={(currentLayout) => {
          onLayoutChange(currentLayout);
        }}
        useCSSTransforms={false}
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
