"use client";

import { useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import { WidgetWrapper } from "../widget-wrapper";
import { ColIndexWidget } from "./widgets/col-index";
import { PurchasingPowerWidget } from "./widgets/purchasing-power";
import { RecommendedRangeWidget } from "./widgets/recommended-range";
import { CostBreakdownWidget } from "./widgets/cost-breakdown";
import { SummaryExportWidget } from "./widgets/summary-export";
import { ComparisonWidget } from "./widgets/comparison";
import { getRelocationWidgetDefinition } from "@/lib/relocation/widget-registry";
import type { RelocationResult, CompApproach } from "@/lib/relocation/calculator";

const ResponsiveGridLayout = WidthProvider(Responsive);

type RelocationLayoutManagerProps = {
  result: RelocationResult | null;
  compApproach: CompApproach;
  hybridCap?: number;
  activeWidgets: string[];
  onRemoveWidget: (widgetId: string) => void;
};

// Layout configuration
const layout = [
  { i: "comparison", x: 0, y: 0, w: 8, h: 2 },
  { i: "col-index", x: 8, y: 0, w: 4, h: 2 },
  { i: "purchasing-power", x: 0, y: 2, w: 4, h: 2 },
  { i: "recommended-range", x: 4, y: 2, w: 4, h: 2 },
  { i: "summary-export", x: 8, y: 2, w: 4, h: 2 },
  { i: "cost-breakdown", x: 0, y: 4, w: 12, h: 3 },
];

export function RelocationLayoutManager({
  result,
  compApproach,
  hybridCap,
  activeWidgets,
  onRemoveWidget,
}: RelocationLayoutManagerProps) {
  
  const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
    "comparison": ComparisonWidget,
    "col-index": ColIndexWidget,
    "purchasing-power": PurchasingPowerWidget,
    "recommended-range": RecommendedRangeWidget,
    "cost-breakdown": CostBreakdownWidget,
    "summary-export": SummaryExportWidget,
  };

  const layouts = useMemo(() => {
    const filteredLayout = layout.filter((item) => activeWidgets.includes(item.i));
    return {
      lg: filteredLayout,
      md: filteredLayout.map((item, index) => ({
        ...item,
        x: (index % 2) * 6,
        y: Math.floor(index / 2) * 3,
        w: 6,
        h: 3,
      })),
      sm: filteredLayout.map((item, index) => ({
        ...item,
        x: 0,
        y: index * 3,
        w: 4,
        h: 3,
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
          const widgetDef = getRelocationWidgetDefinition(widgetId);
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
                  tooltipExplanation: widgetDef.aiExplain,
                }}
              >
                <WidgetComponent 
                  result={result} 
                  compApproach={compApproach}
                  hybridCap={hybridCap}
                />
              </WidgetWrapper>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
