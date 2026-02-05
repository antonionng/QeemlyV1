"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Settings2, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBenchmarkState, type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useDrilldownPreferences, getOrderedEnabledViews, type DrilldownViewId } from "@/lib/benchmarks/drilldown-views";
import { ViewSelector } from "./drilldown/view-selector";
import { FilterSidebar } from "./filter-sidebar";
import {
  LevelTableView,
  IndustryView,
  CompanySizeView,
  TrendView,
  GeoView,
  CompMixView,
  SalaryBreakdownView,
  AIInsightsView,
  OfferBuilderView,
} from "./drilldown/views";

interface BenchmarkDetailProps {
  result: BenchmarkResult;
}

// Map view IDs to components
const VIEW_COMPONENTS: Record<DrilldownViewId, React.ComponentType<{ result: BenchmarkResult }>> = {
  "level-table": LevelTableView,
  "industry": IndustryView,
  "company-size": CompanySizeView,
  "trend-chart": TrendView,
  "geo-comparison": GeoView,
  "comp-mix": CompMixView,
  "salary-breakdown": SalaryBreakdownView,
  "ai-insights": AIInsightsView,
  "offer-builder": OfferBuilderView,
};

type CompType = "base" | "ote" | "total";

export function BenchmarkDetail({ result }: BenchmarkDetailProps) {
  const { goToStep } = useBenchmarkState();
  const { enabledViews, viewOrder } = useDrilldownPreferences();
  const [compType, setCompType] = useState<CompType>("base");
  const [showViewSelector, setShowViewSelector] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  
  const { benchmark, role, level, location } = result;
  
  // Get ordered list of enabled views
  const orderedViews = getOrderedEnabledViews(enabledViews, viewOrder);

  return (
    <div className="flex gap-6">
      {/* Filter Sidebar */}
      {showFilters && <FilterSidebar />}

      {/* View Selector Sidebar */}
      {showViewSelector && <ViewSelector />}

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => goToStep("results")}
            className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to summary
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-brand-900">Detailed Analysis</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-xs font-medium text-brand-700 hover:bg-brand-100"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {showFilters ? "Hide" : "Show"} Filters
            </button>
            <button
              onClick={() => setShowViewSelector(!showViewSelector)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-xs font-medium text-brand-700 hover:bg-brand-100"
            >
              <Settings2 className="h-3.5 w-3.5" />
              {showViewSelector ? "Hide" : "Show"} Views
            </button>
          </div>
        </div>

        {/* Role context bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-brand-50">
          <Badge variant="brand">{role.title}</Badge>
          <span className="text-sm text-brand-700">{level.name}</span>
          <span className="text-brand-300">|</span>
          <span className="text-sm text-brand-700">{location.city}, {location.country}</span>
          <span className="text-brand-300">|</span>
          <div className="flex items-center gap-1.5 text-xs text-brand-600">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Estimated</span>
            <span className="text-brand-300">•</span>
            <span>{benchmark.sampleSize} data points</span>
            <span className="text-brand-300">•</span>
            <span>{benchmark.confidence} confidence</span>
          </div>
        </div>

        {/* Compensation Type Toggle */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-brand-700 mr-4">Compensation Type:</span>
            {[
              { value: "base", label: "Base Salary" },
              { value: "ote", label: "On Target Earnings" },
              { value: "total", label: "Total Cash" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setCompType(option.value as CompType)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  compType === option.value
                    ? "bg-brand-500 text-white"
                    : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Dynamic Views */}
        {orderedViews.length > 0 ? (
          <div className="space-y-6">
            {orderedViews.map((view) => {
              const ViewComponent = VIEW_COMPONENTS[view.id];
              return <ViewComponent key={view.id} result={result} />;
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Settings2 className="mx-auto h-12 w-12 text-brand-300" />
            <h3 className="mt-4 text-lg font-semibold text-brand-900">
              No views selected
            </h3>
            <p className="mt-2 text-sm text-brand-600">
              Click &quot;Show Views&quot; to select which analytical views to display.
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowViewSelector(true)}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Show View Selector
            </Button>
          </Card>
        )}

        {/* Back button */}
        <div className="flex justify-start pt-4">
          <Button variant="ghost" onClick={() => goToStep("results")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Summary
          </Button>
        </div>
      </div>
    </div>
  );
}
