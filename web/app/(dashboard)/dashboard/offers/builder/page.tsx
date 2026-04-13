"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { OfferBuilderWorkspace } from "@/components/dashboard/offers/offer-builder-workspace";
import { useBenchmarkState, type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import type { OfferMode } from "@/lib/offers/types";

const MODE_LABELS: Record<OfferMode, string> = {
  candidate_manual: "Manual Candidate Offer",
  candidate_advised: "Qeemly Advised Offer",
  internal: "Internal Offer",
};

function isValidMode(value: string | null): value is OfferMode {
  return value === "candidate_manual" || value === "candidate_advised" || value === "internal";
}

function OfferBuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultIndex = searchParams.get("from");
  const modeParam = searchParams.get("mode");
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [offerMode, setOfferMode] = useState<OfferMode | null>(
    isValidMode(modeParam) ? modeParam : null,
  );

  useEffect(() => {
    const state = useBenchmarkState.getState();
    if (resultIndex === "current" && state.currentResult) {
      setResult(state.currentResult);
    } else if (resultIndex !== null) {
      const idx = parseInt(resultIndex, 10);
      if (!isNaN(idx) && state.recentResults[idx]) {
        setResult(state.recentResults[idx]);
      }
    }
    if (!result && state.currentResult) {
      setResult(state.currentResult);
    }
  }, [resultIndex, result]);

  const handleBack = useCallback(() => {
    if (offerMode && !result) {
      setOfferMode(null);
      return;
    }
    router.push("/dashboard/benchmarks");
  }, [router, offerMode, result]);

  const handleSelectMode = (mode: OfferMode) => {
    setOfferMode(mode);
  };

  if (!offerMode) {
    return (
      <div className="space-y-8">
        <DashboardPageHeader
          title="Offer Builder"
          subtitle="Choose the type of offer you want to create"
          actions={
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/benchmarks")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Benchmarks
            </Button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleSelectMode("candidate_advised")}
            className="bench-section group cursor-pointer text-left transition-all hover:ring-2 hover:ring-brand-300"
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-500">
              Recommended
            </div>
            <h3 className="text-base font-bold text-brand-900">
              Qeemly Advised Offer
            </h3>
            <p className="mt-2 text-sm text-brand-600">
              Build an offer backed by Qeemly benchmark data. Package values are
              pre-filled from market intelligence and can be adjusted before finalizing.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode("candidate_manual")}
            className="bench-section group cursor-pointer text-left transition-all hover:ring-2 hover:ring-brand-300"
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-500">
              Custom
            </div>
            <h3 className="text-base font-bold text-brand-900">
              Manual Candidate Offer
            </h3>
            <p className="mt-2 text-sm text-brand-600">
              Enter package values directly without benchmark-derived guidance.
              Ideal when you already have a number in mind or are working outside
              standard benchmarks.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode("internal")}
            className="bench-section group cursor-pointer text-left transition-all hover:ring-2 hover:ring-brand-300"
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-500">
              Internal
            </div>
            <h3 className="text-base font-bold text-brand-900">
              Internal Offer Brief
            </h3>
            <p className="mt-2 text-sm text-brand-600">
              Create an internal-only document with benchmark rationale, band
              positioning, negotiation guardrails, and approval notes for
              recruiters and leadership.
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (offerMode !== "candidate_manual" && !result) {
    return (
      <div className="space-y-8">
        <DashboardPageHeader
          title={MODE_LABELS[offerMode]}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setOfferMode(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Change Mode
            </Button>
          }
        />
        <div className="bench-section py-16 text-center">
          <h3 className="text-base font-semibold text-brand-900">
            No benchmark selected
          </h3>
          <p className="mt-2 text-sm text-brand-500">
            Run a benchmark search first, then open the Offer Builder from the
            detail view.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-6"
            onClick={() => router.push("/dashboard/benchmarks")}
          >
            Go to Benchmarks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={MODE_LABELS[offerMode]}
        subtitle={
          result
            ? `${result.role.title} - ${result.level.name} - ${result.location.city}, ${result.location.country}`
            : undefined
        }
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOfferMode(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Change Mode
            </Button>
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Benchmarks
            </Button>
          </div>
        }
      />
      <OfferBuilderWorkspace result={result} offerMode={offerMode} />
    </div>
  );
}

export default function OfferBuilderPage() {
  return (
    <Suspense fallback={null}>
      <OfferBuilderPageContent />
    </Suspense>
  );
}
