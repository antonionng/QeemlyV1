"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { OfferBuilderWorkspace } from "@/components/dashboard/offers/offer-builder-workspace";
import { useBenchmarkState, type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";

function OfferBuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultIndex = searchParams.get("from");
  const [result, setResult] = useState<BenchmarkResult | null>(null);

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
    router.push("/dashboard/benchmarks");
  }, [router]);

  if (!result) {
    return (
      <div className="space-y-8">
        <DashboardPageHeader
          title="Offer Builder"
          actions={
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Benchmarks
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
            onClick={handleBack}
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
        title="Offer Builder"
        subtitle={`${result.role.title} - ${result.level.name} - ${result.location.city}, ${result.location.country}`}
        actions={
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Benchmarks
          </Button>
        }
      />
      <OfferBuilderWorkspace result={result} />
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
