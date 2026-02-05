"use client";

import { useState } from "react";
import { RefreshCw, Sparkles, Plus, Bookmark, Trash2, Play, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BenchmarkForm } from "@/components/dashboard/benchmarks/benchmark-form";
import { BenchmarkResults } from "@/components/dashboard/benchmarks/benchmark-results";
import { BenchmarkDetail } from "@/components/dashboard/benchmarks/benchmark-detail";
import { UploadModal } from "@/components/dashboard/upload";
import { useBenchmarkState } from "@/lib/benchmarks/benchmark-state";
import { MARKET_PULSE } from "@/lib/dashboard/dummy-data";

export default function BenchmarksPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { 
    step, 
    currentResult, 
    recentResults, 
    savedFilters,
    resetForm,
    saveCurrentFilter,
    loadFilter,
    deleteFilter,
    isFormComplete,
  } = useBenchmarkState();

  const handleSaveFilter = () => {
    saveCurrentFilter();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Title & Description */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-brand-900">
                {step === "form" ? "New Benchmark" : step === "results" ? "Benchmark Results" : "Detailed Analysis"}
              </h1>
              <Badge variant="brand" className="bg-brand-500/10 text-brand-600 border-brand-500/20">
                Real-time
              </Badge>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-brand-700/80 max-w-2xl">
              {step === "form" 
                ? "Complete the form below to run a salary benchmark. All fields marked with the form context are required."
                : step === "results"
                ? "Review your benchmark results below. Click 'View Detailed' for in-depth analysis."
                : "Explore detailed market data, level progressions, and industry comparisons."
              }
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button variant="ghost" onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Benchmarks
            </Button>
            {step !== "form" && (
              <Button variant="ghost" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Benchmark
              </Button>
            )}
          </div>
        </div>

        {/* Data indicator */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-500">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>
              <strong className="text-brand-700">{MARKET_PULSE.totalDataPoints.toLocaleString()}</strong> data points
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Updated just now</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-enhanced</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {step === "form" && <BenchmarkForm />}
          {step === "results" && currentResult && <BenchmarkResults result={currentResult} />}
          {step === "detail" && currentResult && <BenchmarkDetail result={currentResult} />}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Saved Filters */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-brand-900">Saved Filters</h3>
              {step === "form" && isFormComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveFilter}
                  className="h-8 px-2 text-xs"
                >
                  <Bookmark className="mr-1 h-3 w-3" />
                  Save Current
                </Button>
              )}
            </div>
            
            {savedFilters.length === 0 ? (
              <div className="text-center py-6">
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-brand-50 text-brand-400">
                  <Bookmark className="h-5 w-5" />
                </div>
                <p className="mt-2 text-xs text-brand-500">
                  No saved filters yet.
                </p>
                <p className="text-xs text-brand-400">
                  Complete a form and save it for quick access.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="group flex items-center gap-2 p-2 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors"
                  >
                    <button
                      onClick={() => loadFilter(filter.id)}
                      className="flex-1 text-left"
                    >
                      <div className="text-sm font-medium text-brand-900 truncate">
                        {filter.name}
                      </div>
                      <div className="text-xs text-brand-500">
                        {new Date(filter.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => loadFilter(filter.id)}
                        className="p-1.5 rounded-md text-brand-600 hover:bg-brand-200"
                        title="Load filter"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteFilter(filter.id)}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-100"
                        title="Delete filter"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Benchmarks */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-brand-900 mb-4">Recent Benchmarks</h3>
            {recentResults.length === 0 ? (
              <div className="text-center py-6">
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-brand-50 text-brand-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="mt-2 text-xs text-brand-500">
                  No recent benchmarks yet.
                </p>
                <p className="text-xs text-brand-400">
                  Complete the form to run your first benchmark.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentResults.slice(0, 5).map((result, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // Re-view past result - load the form data and go to results
                      useBenchmarkState.setState({
                        formData: result.formData,
                        isFormComplete: true,
                        currentResult: result,
                        step: "results",
                      });
                    }}
                    className="w-full text-left p-3 rounded-xl bg-brand-50 hover:bg-brand-100 transition-colors"
                  >
                    <div className="text-sm font-medium text-brand-900 truncate">
                      {result.role.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-brand-500">
                      <span>{result.level.name}</span>
                      <span>•</span>
                      <span>{result.location.city}</span>
                    </div>
                    <div className="text-xs text-brand-400 mt-1">
                      {new Date(result.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        type="benchmarks"
        onSuccess={() => {
          // Refresh data after upload
          window.location.reload();
        }}
      />
    </div>
  );
}
