"use client";

import { Check, RotateCcw } from "lucide-react";
import clsx from "clsx";
import {
  DRILLDOWN_VIEWS,
  useDrilldownPreferences,
} from "@/lib/benchmarks/drilldown-views";
import { useSalaryView } from "@/lib/salary-view-store";

interface ViewSelectorProps {
  className?: string;
}

export function ViewSelector({ className }: ViewSelectorProps) {
  const {
    enabledViews,
    toggleView,
    selectAll,
    resetToDefault,
  } = useDrilldownPreferences();
  const { salaryView, setSalaryView } = useSalaryView();

  return (
    <div className={clsx("lg:sticky lg:top-6", className)}>
      <div className="bench-section space-y-5">
        {/* ── Views ── */}
        <div>
          <h3 className="bench-section-header">Views</h3>
          <div className="space-y-1">
            {DRILLDOWN_VIEWS.map((view) => {
              const isEnabled = enabledViews.includes(view.id);
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => toggleView(view.id)}
                  className={clsx(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors text-sm",
                    isEnabled
                      ? "bg-brand-50 text-brand-900"
                      : "text-brand-600 hover:bg-muted",
                  )}
                >
                  <div
                    className={clsx(
                      "flex h-[18px] w-[18px] items-center justify-center rounded border transition-colors shrink-0",
                      isEnabled
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-brand-300 bg-white",
                    )}
                  >
                    {isEnabled && <Check className="h-3 w-3" />}
                  </div>
                  <Icon className="h-4 w-4 shrink-0 text-brand-400" />
                  <span className="font-medium truncate">{view.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Settings ── */}
        <div className="border-t border-border pt-4 space-y-3">
          {/* Salary view toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-brand-700">Salary View</span>
            <div className="bench-toggle text-xs">
              <button
                type="button"
                data-active={salaryView === "annual"}
                onClick={() => setSalaryView("annual")}
              >
                Annual
              </button>
              <button
                type="button"
                data-active={salaryView === "monthly"}
                onClick={() => setSalaryView("monthly")}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="border-t border-border pt-4 flex items-center gap-2">
          <button
            onClick={selectAll}
            className="flex-1 text-xs font-medium text-brand-600 hover:text-brand-800 py-1.5"
          >
            Select All
          </button>
          <button
            onClick={resetToDefault}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800 py-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
