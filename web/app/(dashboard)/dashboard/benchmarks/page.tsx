"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, ArrowRight, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { BenchmarkForm } from "@/components/dashboard/benchmarks/benchmark-form";
import { BenchmarkResults } from "@/components/dashboard/benchmarks/benchmark-results";
import { BenchmarkDetail } from "@/components/dashboard/benchmarks/benchmark-detail";
import { UploadModal } from "@/components/dashboard/upload";
import { useBenchmarkState } from "@/lib/benchmarks/benchmark-state";
import { normalizeSavedBonusPercentage, useCompanySettings } from "@/lib/company";
import type { FundingStage } from "@/lib/company/settings";
import { hasDbEmployees } from "@/lib/employees/data-service";
import { getBenchmarkPageTitle } from "@/lib/benchmarks/results-presentation";
import { useWorkspaceChangeVersion } from "@/lib/workspace-client";

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
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);
  const [hasCompanyData, setHasCompanyData] = useState(false);
  const updateCompanySettings = useCompanySettings((state) => state.updateSettings);
  const markCompanyConfigured = useCompanySettings((state) => state.markAsConfigured);
  const {
    step,
    currentResult,
    recentResults,
    savedFilters,
    reconcileWorkspace,
    resetForm,
    loadFilter,
  } = useBenchmarkState();
  const workspaceChangeVersion = useWorkspaceChangeVersion();

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

  const marketDiagnosticMessage =
    stats?.diagnostics?.market.error || stats?.diagnostics?.market.clientWarning;

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadStats, workspaceChangeVersion]);

  useEffect(() => {
    let isCancelled = false;

    const syncWorkspaceState = async () => {
      setIsWorkspaceReady(false);
      try {
        const [response, employeeDataPresent] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          hasDbEmployees(),
        ]);
        if (!response.ok) return;

        const payload = (await response.json()) as {
          workspace_id?: string | null;
          workspace_name?: string | null;
          is_viewing_as_admin?: boolean;
          settings?: {
            company_name?: string | null;
            company_logo?: string | null;
            company_website?: string | null;
            company_description?: string | null;
            primary_color?: string | null;
            industry?: string | null;
            company_size?: string | null;
            funding_stage?: string | null;
            headquarters_country?: string | null;
            headquarters_city?: string | null;
            target_percentile?: number | null;
            review_cycle?: string | null;
            default_currency?: string | null;
            fiscal_year_start?: number | null;
            default_bonus_percentage?: number | null;
            equity_vesting_schedule?: string | null;
            benefits_tier?: string | null;
            comp_split_basic_pct?: number | null;
            comp_split_housing_pct?: number | null;
            comp_split_transport_pct?: number | null;
            comp_split_other_pct?: number | null;
            is_configured?: boolean;
          };
        };
        if (isCancelled) return;

        const settings = payload.settings ?? {};
        const isViewingAsAdmin = payload.is_viewing_as_admin === true;
        const effectiveCompanyName =
          isViewingAsAdmin && payload.workspace_name
            ? payload.workspace_name
            : settings.company_name || payload.workspace_name || "";

        updateCompanySettings({
          companyName: effectiveCompanyName,
          companyLogo: isViewingAsAdmin ? null : settings.company_logo || null,
          companyWebsite: settings.company_website || "",
          companyDescription: settings.company_description || "",
          primaryColor: settings.primary_color || "#5C45FD",
          industry: settings.industry || "",
          companySize: settings.company_size || "",
          fundingStage: (settings.funding_stage as FundingStage | null) || "Seed",
          headquartersCountry: settings.headquarters_country || "AE",
          headquartersCity: settings.headquarters_city || "",
          targetPercentile: (settings.target_percentile as 25 | 50 | 75 | 90 | null) || 50,
          reviewCycle: (settings.review_cycle as "monthly" | "quarterly" | "biannual" | "annual" | null) || "annual",
          defaultCurrency: settings.default_currency || "AED",
          fiscalYearStart: settings.fiscal_year_start || 1,
          defaultBonusPercentage: normalizeSavedBonusPercentage(settings.default_bonus_percentage),
          equityVestingSchedule:
            (settings.equity_vesting_schedule as
              | "4-year-1-cliff"
              | "4-year-no-cliff"
              | "3-year"
              | "5-year"
              | "custom"
              | "none"
              | null) || "4-year-1-cliff",
          benefitsTier: (settings.benefits_tier as "basic" | "standard" | "premium" | "custom" | null) || "standard",
          compSplitBasicPct: settings.comp_split_basic_pct ?? 60,
          compSplitHousingPct: settings.comp_split_housing_pct ?? 25,
          compSplitTransportPct: settings.comp_split_transport_pct ?? 10,
          compSplitOtherPct: settings.comp_split_other_pct ?? 5,
        });
        if (settings.is_configured && !isViewingAsAdmin) {
          markCompanyConfigured();
        }

        reconcileWorkspace(payload.workspace_id ?? null);
        setHasCompanyData(employeeDataPresent);
      } catch (error) {
        console.error("Failed to reconcile benchmark workspace state:", error);
      } finally {
        if (!isCancelled) {
          setIsWorkspaceReady(true);
        }
      }
    };

    void syncWorkspaceState();

    return () => {
      isCancelled = true;
    };
  }, [markCompanyConfigured, reconcileWorkspace, updateCompanySettings, workspaceChangeVersion]);

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={getBenchmarkPageTitle(step)}
        subtitle={
          stats && step === "form" && isWorkspaceReady
            ? `${stats.total} market benchmark rows across ${stats.uniqueRoles} roles and ${stats.uniqueLocations} locations`
            : undefined
        }
        actions={
          <>
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
          </>
        }
      />

      {stats && (
        <div className="space-y-3">
          {marketDiagnosticMessage && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              Market benchmark updates: {marketDiagnosticMessage}
            </div>
          )}
        </div>
      )}

      {/* ── Form step ── */}
      {step === "form" && isWorkspaceReady && (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <BenchmarkForm />

          <div className="space-y-6">
            <div className="bench-section">
              <h3 className="bench-section-header">Recent Searches</h3>
              {recentResults.length === 0 ? (
                <p className="py-4 text-center text-xs text-brand-400">No recent searches yet.</p>
              ) : (
                <div className="space-y-1">
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
                      className="group flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-brand-50"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-brand-900">
                          {result.role.title}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-500">
                          <span>{result.level.name}</span>
                          <span>·</span>
                          <span>{result.location.city}, {result.location.country}</span>
                          <span>·</span>
                          <span>{result.formData.employmentType === "expat" ? "Expat" : "National"}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-brand-300 transition-colors group-hover:text-brand-500" />
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
      {step === "form" && isWorkspaceReady && savedFilters.length > 0 && (
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
      {step === "results" && isWorkspaceReady && currentResult && (
        <BenchmarkResults result={currentResult} hasCompanyData={hasCompanyData} />
      )}

      {/* ── Detail step ── */}
      {step === "detail" && isWorkspaceReady && currentResult && (
        <BenchmarkDetail result={currentResult} hasCompanyData={hasCompanyData} />
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
