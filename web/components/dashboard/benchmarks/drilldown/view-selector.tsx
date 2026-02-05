"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { 
  DRILLDOWN_VIEWS, 
  useDrilldownPreferences,
  getViewsByCategory,
  type DrilldownViewId,
} from "@/lib/benchmarks/drilldown-views";

interface ViewSelectorProps {
  className?: string;
}

export function ViewSelector({ className }: ViewSelectorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { 
    enabledViews, 
    toggleView, 
    selectAll, 
    resetToDefault,
  } = useDrilldownPreferences();

  const dataViews = getViewsByCategory("data");
  const comparisonViews = getViewsByCategory("comparison");
  const toolViews = getViewsByCategory("tools");

  const enabledCount = enabledViews.length;
  const totalCount = DRILLDOWN_VIEWS.length;

  if (isCollapsed) {
    return (
      <div className={clsx("w-12 flex-shrink-0", className)}>
        <div className="sticky top-6 rounded-2xl border border-border bg-white p-2 shadow-sm">
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-600 hover:bg-brand-50"
            title="Expand view selector"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="mt-2 text-center">
            <span className="text-xs font-semibold text-brand-600">{enabledCount}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("w-64 flex-shrink-0", className)}>
      <div className="sticky top-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-brand-900">Views</h3>
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-brand-500 hover:bg-brand-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-between mb-4 text-xs text-brand-600">
          <span>{enabledCount} of {totalCount} views enabled</span>
        </div>

        {/* Data Views */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-2">
            Data
          </p>
          <div className="space-y-1">
            {dataViews.map((view) => {
              const isEnabled = enabledViews.includes(view.id);
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => toggleView(view.id)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    isEnabled
                      ? "bg-brand-50 text-brand-900"
                      : "text-brand-600 hover:bg-muted"
                  )}
                >
                  <div
                    className={clsx(
                      "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                      isEnabled
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-brand-300 bg-white"
                    )}
                  >
                    {isEnabled && <Check className="h-3 w-3" />}
                  </div>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{view.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison Views */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-2">
            Comparison
          </p>
          <div className="space-y-1">
            {comparisonViews.map((view) => {
              const isEnabled = enabledViews.includes(view.id);
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => toggleView(view.id)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    isEnabled
                      ? "bg-brand-50 text-brand-900"
                      : "text-brand-600 hover:bg-muted"
                  )}
                >
                  <div
                    className={clsx(
                      "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                      isEnabled
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-brand-300 bg-white"
                    )}
                  >
                    {isEnabled && <Check className="h-3 w-3" />}
                  </div>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{view.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tool Views */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-2">
            Tools
          </p>
          <div className="space-y-1">
            {toolViews.map((view) => {
              const isEnabled = enabledViews.includes(view.id);
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => toggleView(view.id)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    isEnabled
                      ? "bg-brand-50 text-brand-900"
                      : "text-brand-600 hover:bg-muted"
                  )}
                >
                  <div
                    className={clsx(
                      "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                      isEnabled
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-brand-300 bg-white"
                    )}
                  >
                    {isEnabled && <Check className="h-3 w-3" />}
                  </div>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{view.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="w-full justify-center text-xs"
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
            className="w-full justify-center text-xs"
          >
            <RotateCcw className="mr-1.5 h-3 w-3" />
            Reset to Default
          </Button>
        </div>
      </div>
    </div>
  );
}
