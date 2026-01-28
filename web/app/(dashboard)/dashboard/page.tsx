"use client";

import { ArrowUpRight, Download, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutManager } from "@/components/dashboard/layout-manager";
import { PresetSwitcher } from "@/components/dashboard/preset-switcher";
import { WidgetPicker } from "@/components/dashboard/widget-picker";
import { useDashboard } from "@/lib/dashboard/use-dashboard";
import { MARKET_PULSE, MARKET_OUTLOOK } from "@/lib/dashboard/dummy-data";
import { AiExplainTooltip } from "@/components/ui/ai-explain-tooltip";

export default function DashboardPage() {
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
  } = useDashboard();

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Title & Description */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-brand-900">
                Compensation Intelligence
              </h1>
              <Badge variant="brand" className="animate-pulse bg-brand-500/10 text-brand-600 border-brand-500/20">
                Live
              </Badge>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-brand-700/80 max-w-2xl">
              Real-time GCC salary benchmarks with AI-powered insights across{" "}
              <span className="font-semibold text-brand-900">{MARKET_PULSE.marketsTracked}</span> markets and{" "}
              <span className="font-semibold text-brand-900">{MARKET_PULSE.rolesTracked}</span> roles.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <PresetSwitcher
              currentPresetId={currentPresetId}
              isCustomized={isCustomized}
              onSelectPreset={applyPreset}
              onReset={resetToDefault}
            />
            <WidgetPicker
              activeWidgets={activeWidgets}
              onToggleWidget={toggleWidget}
            />
            <div className="hidden h-10 w-px bg-border/60 sm:block mx-1" />
            <Button variant="ghost" className="h-11 bg-white hover:bg-brand-50 border border-border/40 px-5">
              <Download className="mr-2 h-4 w-4 text-brand-600" />
              Export
            </Button>
            <Button className="h-11 px-6 shadow-lg shadow-brand-500/20">
              New search
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border border-border/40 bg-white/60 p-5 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-medium text-brand-700">
                <strong className="text-brand-900 font-bold">
                  {MARKET_PULSE.totalDataPoints.toLocaleString()}
                </strong>{" "}
                data points
              </span>
            </div>
            <AiExplainTooltip 
              message="Total verified salary data points collected across all GCC markets and roles. All data undergoes a multi-stage validation process."
              label=""
              className="scale-75 -ml-2"
            />
          </div>

          <div className="h-4 w-px bg-brand-200/60 hidden sm:block" />

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-brand-700">
              <strong className="text-brand-900 font-bold">
                {MARKET_PULSE.weeklySubmissions.toLocaleString()}
              </strong>{" "}
              submissions this week
            </span>
            <AiExplainTooltip 
              message="New salary entries submitted by verified users in the last 7 days. High submission volume ensures market data reflects current economic conditions."
              label=""
              className="scale-75 -ml-2"
            />
          </div>

          <div className="h-4 w-px bg-brand-200/60 hidden sm:block" />

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-brand-700">
              <strong className="text-brand-900 font-bold">
                {MARKET_PULSE.activeCompanies}
              </strong>{" "}
              active companies
            </span>
            <AiExplainTooltip 
              message="Number of unique organizations whose compensation data is currently represented in our benchmarks."
              label=""
              className="scale-75 -ml-2"
            />
          </div>

          <div className="h-4 w-px bg-brand-200/60 hidden lg:block" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-5 items-center rounded-full bg-brand-100/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-600 border border-brand-200/50">
                {MARKET_OUTLOOK.marketStatus}
              </div>
              <span className="text-sm font-medium text-brand-700">Market Confidence</span>
            </div>
            <AiExplainTooltip 
              message="A proprietary index calculating the overall reliability of the current market view based on data volume, freshness, and cross-source verification."
              label=""
              className="scale-75 -ml-2"
            />
          </div>

          <div className="ml-auto flex items-center gap-3 border-l border-brand-100 pl-8 hidden xl:flex">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 text-brand-500 animate-spin" />
                <span className="text-[11px] font-bold text-brand-500 uppercase tracking-tight">
                  Live Engine
                </span>
              </div>
              <span className="text-[10px] text-brand-400">
                Updated {MARKET_PULSE.lastUpdated ? "just now" : "recently"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <LayoutManager
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
            Click "Widgets" above to add your first widget to the dashboard.
          </p>
          <Button className="mt-4" onClick={() => toggleWidget("market-pulse")}>
            Add Market Pulse widget
          </Button>
        </div>
      )}
    </div>
  );
}
