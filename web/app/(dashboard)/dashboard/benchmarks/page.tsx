"use client";

import { Download, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BenchmarksLayoutManager } from "@/components/dashboard/benchmarks/layout-manager";
import { BenchmarkPresetSwitcher } from "@/components/dashboard/benchmarks/preset-switcher";
import { BenchmarkWidgetPicker } from "@/components/dashboard/benchmarks/widget-picker";
import { BenchmarksProvider, useBenchmarksContext } from "@/lib/benchmarks/context";
import { MARKET_PULSE } from "@/lib/dashboard/dummy-data";

function BenchmarksContent() {
  const {
    currentPresetId,
    activeWidgets,
    layout,
    isCustomized,
    applyPreset,
    updateLayout,
    removeWidget,
    toggleWidget,
    resetToDefault,
    selectedRole,
    selectedLocation,
  } = useBenchmarksContext();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Title & Description */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-brand-900">
                Salary Benchmarks
              </h1>
              <Badge variant="brand" className="bg-brand-500/10 text-brand-600 border-brand-500/20">
                Real-time
              </Badge>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-brand-700/80 max-w-2xl">
              Search roles, compare markets, and build competitive offers with data from{" "}
              <span className="font-semibold text-brand-900">{MARKET_PULSE.marketsTracked}</span> GCC markets.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <BenchmarkPresetSwitcher
              currentPresetId={currentPresetId}
              isCustomized={isCustomized}
              onSelectPreset={applyPreset}
              onReset={resetToDefault}
            />
            <BenchmarkWidgetPicker
              activeWidgets={activeWidgets}
              onToggleWidget={toggleWidget}
            />
            <div className="hidden h-10 w-px bg-border/60 sm:block mx-1" />
            <Button variant="ghost" className="h-11 bg-white hover:bg-brand-50 border border-border/40 px-5">
              <Download className="mr-2 h-4 w-4 text-brand-600" />
              Export
            </Button>
          </div>
        </div>

        {/* Context bar */}
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-border/40 bg-white/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm text-brand-700">
              <strong className="text-brand-900">
                {MARKET_PULSE.totalDataPoints.toLocaleString()}
              </strong>{" "}
              data points
            </span>
          </div>
          <div className="h-4 w-px bg-brand-200" />
          {selectedRole ? (
            <span className="text-sm text-brand-700">
              Viewing: <strong className="text-brand-900">{selectedRole.title}</strong>
            </span>
          ) : (
            <span className="text-sm text-brand-500">
              Select a role to begin
            </span>
          )}
          {selectedLocation && selectedRole && (
            <>
              <div className="h-4 w-px bg-brand-200" />
              <span className="text-sm text-brand-700">
                Market: <strong className="text-brand-900">{selectedLocation.city}, {selectedLocation.country}</strong>
              </span>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 text-brand-500" />
            <span className="text-xs text-brand-500">
              Last updated: Just now
            </span>
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <BenchmarksLayoutManager
        layout={layout}
        activeWidgets={activeWidgets}
        onLayoutChange={updateLayout}
        onRemoveWidget={removeWidget}
      />

      {/* Empty state */}
      {activeWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand-200 bg-brand-50/30 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-500">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-brand-900">
            No widgets added
          </h3>
          <p className="mt-1 text-sm text-brand-600">
            Click "Widgets" above to add benchmark widgets to your view.
          </p>
          <Button className="mt-4" onClick={() => toggleWidget("role-search")}>
            Add Role Search widget
          </Button>
        </div>
      )}
    </div>
  );
}

export default function BenchmarksPage() {
  return (
    <BenchmarksProvider>
      <BenchmarksContent />
    </BenchmarksProvider>
  );
}
