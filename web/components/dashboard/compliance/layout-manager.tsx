"use client";

import { useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import { WidgetWrapper } from "../widget-wrapper";
import {
  LaborLawTrackerWidget,
  PayEquityAuditWidget,
  DocumentVaultWidget,
  VisaComplianceWidget,
  RiskHeatmapWidget,
  AuditLogWidget,
  PolicyManagerWidget,
  ComplianceCalendarWidget,
} from "./widgets";
import { getComplianceWidgetDefinition } from "@/lib/compliance/widget-registry";
import type { GridLayoutItem } from "@/lib/compliance/preset-layouts";

const ResponsiveGridLayout = WidthProvider(Responsive);

type ComplianceLayoutManagerProps = {
  layout: GridLayoutItem[];
  activeWidgets: string[];
  onLayoutChange: (layout: GridLayoutItem[]) => void;
  onRemoveWidget: (widgetId: string) => void;
};

const WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  "labor-law-tracker": LaborLawTrackerWidget,
  "pay-equity-audit": PayEquityAuditWidget,
  "document-vault": DocumentVaultWidget,
  "visa-compliance": VisaComplianceWidget,
  "risk-heatmap": RiskHeatmapWidget,
  "audit-log": AuditLogWidget,
  "policy-manager": PolicyManagerWidget,
  "compliance-calendar": ComplianceCalendarWidget,
};

function generateResponsiveLayouts(layout: GridLayoutItem[], activeWidgets: string[]) {
  const filteredLayout = layout.filter((item) => activeWidgets.includes(item.i));
  
  const lg = filteredLayout;
  
  const md = filteredLayout.map((item, index) => ({
    ...item,
    x: (index % 2) * 3,
    y: Math.floor(index / 2) * 3,
    w: 3,
    h: 3,
  }));
  
  const sm = filteredLayout.map((item, index) => ({
    ...item,
    x: (index % 2) * 2,
    y: Math.floor(index / 2) * 3,
    w: 2,
    h: 3,
  }));
  
  const xs = filteredLayout.map((item, index) => ({
    ...item,
    x: (index % 2),
    y: Math.floor(index / 2) * 3,
    w: 1,
    h: 3,
  }));
  
  const xxs = filteredLayout.map((item, index) => ({
    ...item,
    x: 0,
    y: index * 3,
    w: 1,
    h: 3,
  }));
  
  return { lg, md, sm, xs, xxs };
}

export function ComplianceLayoutManager({
  layout,
  activeWidgets,
  onLayoutChange,
  onRemoveWidget,
}: ComplianceLayoutManagerProps) {
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
        onLayoutChange={(currentLayout) => {
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
          const widgetDef = getComplianceWidgetDefinition(widgetId);
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
