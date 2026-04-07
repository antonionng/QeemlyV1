"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBenchmarkState, type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import {
  filterDrilldownViewsForCompanyData,
  useDrilldownPreferences,
  getOrderedEnabledViews,
  type DrilldownViewId,
} from "@/lib/benchmarks/drilldown-views";
import { fetchDetailSurface } from "@/lib/benchmarks/data-service";
import { ViewSelector } from "./drilldown/view-selector";
import { ModuleStateBanner } from "./drilldown/module-state-banner";
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
  hasCompanyData?: boolean;
}

const VIEW_COMPONENTS: Record<
  DrilldownViewId,
  React.ComponentType<{ result: BenchmarkResult }>
> = {
  "level-table": LevelTableView,
  industry: IndustryView,
  "company-size": CompanySizeView,
  "trend-chart": TrendView,
  "geo-comparison": GeoView,
  "comp-mix": CompMixView,
  "salary-breakdown": SalaryBreakdownView,
  "ai-insights": AIInsightsView,
  "offer-builder": OfferBuilderView,
};

export function BenchmarkDetail({ result, hasCompanyData = true }: BenchmarkDetailProps) {
  const router = useRouter();
  const { goToStep } = useBenchmarkState();
  const { enabledViews, viewOrder } = useDrilldownPreferences();

  const { role, level, location } = result;
  const orderedViews = filterDrilldownViewsForCompanyData(
    getOrderedEnabledViews(enabledViews, viewOrder),
    hasCompanyData,
  );

  const isDetailLoading = result.detailSurfaceStatus === "loading";
  const isDetailUnavailable = result.detailSurfaceStatus === "unavailable";

  const retryDetailLoads = () => {
    useBenchmarkState.setState((state) => {
      if (!state.currentResult) return state;
      return {
        ...state,
        currentResult: {
          ...state.currentResult,
          detailSurface: null,
          detailSurfaceStatus: "idle",
        },
      };
    });
  };

  useEffect(() => {
    if (
      result.detailSurface ||
      result.detailSurfaceStatus === "loading" ||
      result.detailSurfaceStatus === "unavailable"
    ) {
      return;
    }

    let isCancelled = false;

    useBenchmarkState.setState((state) => {
      if (!state.currentResult) return state;
      return {
        ...state,
        currentResult: {
          ...state.currentResult,
          detailSurfaceStatus: "loading",
        },
      };
    });

    const loadSurface = async () => {
      const surface = await fetchDetailSurface(role.id, location.id, level.id, {
        industry: result.formData.industry,
        companySize: result.formData.companySize,
      });

      if (isCancelled) return;

      useBenchmarkState.setState((state) => {
        if (!state.currentResult) return state;
        return {
          ...state,
          currentResult: {
            ...state.currentResult,
            detailSurface: surface,
            detailSurfaceStatus: surface ? "ready" : "unavailable",
          },
          recentResults: state.recentResults.map((entry) =>
            entry.createdAt === result.createdAt
              ? {
                  ...entry,
                  detailSurface: surface,
                  detailSurfaceStatus: surface ? "ready" : "unavailable",
                }
              : entry,
          ),
        };
      });
    };

    void loadSurface();

    return () => {
      isCancelled = true;
    };
  }, [
    level.id,
    location.id,
    result.createdAt,
    result.detailSurface,
    result.detailSurfaceStatus,
    result.formData.companySize,
    result.formData.industry,
    role.id,
  ]);

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="w-full xl:w-64 xl:flex-shrink-0">
        <ViewSelector hasCompanyData={hasCompanyData} />
      </div>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex items-center justify-start">
          <Button variant="ghost" onClick={() => goToStep("results")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="bench-section flex flex-wrap items-start gap-x-2 gap-y-2 text-sm">
          <span className="font-semibold text-brand-900">{role.title}</span>
          <span className="text-brand-400">·</span>
          <span className="text-brand-700">{level.name}</span>
          <span className="text-brand-400">·</span>
          <span className="text-brand-700">
            {location.city}, {location.country}
          </span>
          <span className="text-brand-400">·</span>
          <span className="text-brand-700">
            {result.formData.employmentType === "expat" ? "Expat" : "National"}
          </span>
        </div>
        {isDetailLoading ? (
          <ModuleStateBanner
            variant="loading"
            message="Qeemly AI is preparing detailed modules. Sections will appear as they become ready."
          />
        ) : null}
        {isDetailUnavailable ? (
          <ModuleStateBanner
            variant="error"
            message="Some detailed modules are unavailable right now. You can retry loading all modules."
            actionLabel="Retry Modules"
            onAction={retryDetailLoads}
          />
        ) : null}

        {orderedViews.length > 0 ? (
          <div className="space-y-6">
            {orderedViews.map((view) => {
              const ViewComponent = VIEW_COMPONENTS[view.id];
              return <ViewComponent key={view.id} result={result} />;
            })}
          </div>
        ) : (
          <div className="bench-section py-12 text-center">
            <Settings2 className="mx-auto h-10 w-10 text-brand-300" />
            <h3 className="mt-4 text-base font-semibold text-brand-900">
              No views selected
            </h3>
            <p className="mt-1 text-sm text-brand-500">
              Toggle views in the sidebar to display analytical sections.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {hasCompanyData && (
            <button
              onClick={() => {
                router.push("/dashboard/offers/builder?from=current");
              }}
              className="bench-cta max-w-xs"
            >
              Open Offer Builder <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
