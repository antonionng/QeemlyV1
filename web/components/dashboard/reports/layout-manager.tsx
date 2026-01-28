"use client";

import { useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import { WidgetWrapper } from "../widget-wrapper";
import { ReportStatsWidget } from "./widgets/report-stats";
import { ReportTemplatesWidget } from "./widgets/report-templates";
import { RecentReportsWidget } from "./widgets/recent-reports";
import { CustomBuilderWidget } from "./widgets/custom-builder";
import { getReportWidgetDefinition } from "@/lib/reports/widget-registry";

const ResponsiveGridLayout = WidthProvider(Responsive);

type ReportsLayoutManagerProps = {
  activeWidgets: string[];
  onRemoveWidget: (widgetId: string) => void;
};

// Layout configuration
const layout = [
  { i: "report-stats", x: 0, y: 0, w: 12, h: 1.5 },
  { i: "report-templates", x: 0, y: 1.5, w: 8, h: 4.5 },
  { i: "recent-reports", x: 8, y: 1.5, w: 4, h: 3 },
  { i: "custom-builder", x: 8, y: 4.5, w: 4, h: 1.5 },
];

export function ReportsLayoutManager({
  activeWidgets,
  onRemoveWidget,
}: ReportsLayoutManagerProps) {
  
  const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
    "report-stats": ReportStatsWidget,
    "report-templates": ReportTemplatesWidget,
    "recent-reports": RecentReportsWidget,
    "custom-builder": CustomBuilderWidget,
  };

  const layouts = useMemo(() => {
    const filteredLayout = layout.filter((item) => activeWidgets.includes(item.i));
    return {
      lg: filteredLayout,
      md: filteredLayout.map((item, index) => ({
        ...item,
        x: (index % 2) * 6,
        y: Math.floor(index / 2) * 4,
        w: 6,
        h: 4,
      })),
      sm: filteredLayout.map((item, index) => ({
        ...item,
        x: 0,
        y: index * 4,
        w: 4,
        h: 4,
      })),
    };
  }, [activeWidgets]);

  if (activeWidgets.length === 0) return null;

  return (
    <div className="w-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 4, xs: 2, xxs: 1 }}
        rowHeight={120}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        compactType="vertical"
        useCSSTransforms={true}
      >
        {activeWidgets.map((widgetId) => {
          const WidgetComponent = WIDGET_COMPONENTS[widgetId];
          const widgetDef = getReportWidgetDefinition(widgetId);
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
