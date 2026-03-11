"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, ArrowRight, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BenchmarkForm } from "@/components/dashboard/benchmarks/benchmark-form";
import { BenchmarkResults } from "@/components/dashboard/benchmarks/benchmark-results";
import { BenchmarkDetail } from "@/components/dashboard/benchmarks/benchmark-detail";
import { UploadModal } from "@/components/dashboard/upload";
import { useBenchmarkState } from "@/lib/benchmarks/benchmark-state";

type BenchmarkStats = {
  total: number;
  uniqueRoles: number;
  uniqueLocations: number;
  sources: string[];
  lastUpdated: string | null;
  hasRealData: boolean;
  diagnostics?: {
    market: {
      readMode: "service" | "session";
      clientWarning: string | null;
      error: string | null;
      warning: string | null;
      hasServiceRoleKey: boolean;
      hasPlatformWorkspaceId: boolean;
    };
  };
};

export default function BenchmarksPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stats, setStats] = useState<BenchmarkStats | null>(null);
  const {
    step,
    currentResult,
    recentResults,
    savedFilters,
    resetForm,
    loadFilter,
  } = useBenchmarkState();

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/benchmarks/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load benchmark stats:", err);
    }
  }, []);

  const freshnessLabel = stats?.lastUpdated
    ? new Date(stats.lastUpdated).toLocaleDateString("en-GB")
    : "Unknown";
  const marketDiagnosticMessage =
    stats?.diagnostics?.market.error ||
    stats?.diagnostics?.market.warning ||
    stats?.diagnostics?.market.clientWarning;

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadStats]);

  /* ── Titles per step ── */
  const titles: Record<string, string> = {
    form: "Benchmarking",
    results: "Role Pricing",
    detail: "Benchmark Analysis",
  };

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">
            {titles[step]}
          </h1>
          {stats && step === "form" && (
            <p className="mt-1 text-xs text-accent-500">
              {stats.total} benchmark rows across {stats.uniqueRoles} roles and {stats.uniqueLocations} locations
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {step !== "form" && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetForm}
              className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
            >
              New Search
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Benchmark
          </Button>
        </div>
      </div>

      {stats && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-1 px-4 py-3 text-xs text-accent-600">
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-brand-700">
              Source: {stats.sources.length > 0 ? stats.sources.slice(0, 2).join(", ") : "N/A"}
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
              Refreshed: {freshnessLabel}
            </span>
          </div>

          {marketDiagnosticMessage && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              Market dataset diagnostics: {marketDiagnosticMessage}
            </div>
          )}
        </div>
      )}

      {/* ── Form step ── */}
      {step === "form" && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <BenchmarkForm />

          <div className="space-y-6 lg:sticky lg:top-6 self-start">
            <div className="bench-section">
              <div className="pb-4">
                <h3 className="bench-section-header pb-1">Recent Searches</h3>
                <p className="text-sm text-brand-500">
                  Reopen the last roles you priced without rebuilding the form.
                </p>
              </div>
              {recentResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-brand-700">No recent searches yet</p>
                  <p className="mt-1 text-xs text-brand-500">
                    Your latest role pricing runs will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentResults.slice(0, 5).map((result, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        useBenchmarkState.setState({
                          formData: result.formData,
                          isFormComplete: true,
                          currentResult: result,
                          step: "results",
                        });
                      }}
                      className="group w-full rounded-2xl border border-border bg-surface-1 p-4 text-left transition-colors hover:border-brand-200 hover:bg-brand-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-brand-900">
                            {result.role.title}
                          </div>
                          <div className="mt-1 text-xs text-brand-500">
                            {result.location.city}, {result.location.country}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-brand-700 ring-1 ring-border">
                              {result.level.name}
                            </span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-brand-700 ring-1 ring-border">
                              {result.formData.employmentType === "expat" ? "Expat" : "National"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <span className="text-[11px] text-brand-400">
                            {new Date(result.createdAt).toLocaleDateString("en-GB")}
                          </span>
                          <ArrowRight className="h-4 w-4 text-brand-300 transition-colors group-hover:text-brand-500" />
                        </div>
                      </div>
                    </button>
                  ))}
                  {recentResults.length > 5 && (
                    <button className="w-full text-center text-xs font-medium text-brand-600 hover:text-brand-800 py-2">
                      View All <ArrowRight className="inline h-3 w-3 ml-0.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Benchmarks carousel (form step only) */}
      {step === "form" && savedFilters.length > 0 && (
        <div>
          <div className="flex items-center justify-between pb-4">
            <h3 className="bench-section-header pb-0">Saved Benchmarks</h3>
            <div className="flex items-center gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-brand-50">
                <ChevronLeft className="h-4 w-4 text-brand-600" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-brand-50">
                <ChevronRight className="h-4 w-4 text-brand-600" />
              </button>
            </div>
          </div>
          <div className="bench-saved-scroll">
            {savedFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => loadFilter(filter.id)}
                className="bench-section text-left hover:shadow-md transition-shadow"
              >
                <Bookmark className="h-5 w-5 text-brand-400 mb-3" />
                <div className="text-base font-bold text-brand-900 leading-snug">
                  {filter.name}
                </div>
                <div className="text-xs text-brand-500 mt-1.5 leading-relaxed">
                  {filter.formData?.levelId && (
                    <span>{filter.formData.levelId}</span>
                  )}
                </div>
                <div className="mt-3 text-xs font-medium text-brand-600 flex items-center gap-1">
                  View Benchmark Data <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Results step ── */}
      {step === "results" && currentResult && (
        <BenchmarkResults result={currentResult} />
      )}

      {/* ── Detail step ── */}
      {step === "detail" && currentResult && (
        <BenchmarkDetail result={currentResult} />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        type="benchmarks"
        onSuccess={() => {
          loadStats();
          setShowUploadModal(false);
        }}
      />
    </div>
  );
}
