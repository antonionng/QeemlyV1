"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { InputPanel, RelocationFormData } from "@/components/dashboard/relocation/input-panel";
import { RelocationLayoutManager } from "@/components/dashboard/relocation/layout-manager";
import { calculateRelocation } from "@/lib/relocation/calculator";
import { ALL_RELOCATION_WIDGET_IDS } from "@/lib/relocation/widget-registry";
import { Globe2, Info, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_FORM_DATA: RelocationFormData = {
  homeCityId: "dubai",
  targetCityId: "london",
  baseSalary: 450000,
  compApproach: "purchasing-power",
  hybridCap: 120,
  rentOverride: undefined,
};

function RelocationPageContent() {
  const searchParams = useSearchParams();

  // Active widgets state
  const [activeWidgets, setActiveWidgets] = useState<string[]>(ALL_RELOCATION_WIDGET_IDS);

  // Initialize from URL params if present
  const [formData, setFormData] = useState<RelocationFormData>(() => {
    const home = searchParams.get("home");
    const target = searchParams.get("target");
    const salary = searchParams.get("salary");
    const approach = searchParams.get("approach");
    const cap = searchParams.get("cap");

    return {
      homeCityId: home || DEFAULT_FORM_DATA.homeCityId,
      targetCityId: target || DEFAULT_FORM_DATA.targetCityId,
      baseSalary: salary ? Number(salary) : DEFAULT_FORM_DATA.baseSalary,
      compApproach: (approach as RelocationFormData["compApproach"]) || DEFAULT_FORM_DATA.compApproach,
      hybridCap: cap ? Number(cap) : DEFAULT_FORM_DATA.hybridCap,
      rentOverride: undefined,
    };
  });

  // Calculate results whenever inputs change
  const result = useMemo(() => {
    if (!formData.homeCityId || !formData.targetCityId || !formData.baseSalary) {
      return null;
    }

    return calculateRelocation({
      homeCityId: formData.homeCityId,
      targetCityId: formData.targetCityId,
      baseSalary: formData.baseSalary,
      compApproach: formData.compApproach,
      hybridCap: formData.hybridCap,
      rentOverride: formData.rentOverride,
    });
  }, [formData]);

  const handleRemoveWidget = (widgetId: string) => {
    setActiveWidgets(prev => prev.filter(id => id !== widgetId));
  };

  const handleResetWidgets = () => {
    setActiveWidgets(ALL_RELOCATION_WIDGET_IDS);
  };

  return (
    <div className="bench-results space-y-8 relative z-10">
      {/* Header Section - Matches Benchmarks */}
      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-brand-900">
                Relocation Calculator
              </h1>
              <span className="rounded-full bg-brand-500/10 text-brand-600 border border-brand-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                MVP
              </span>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-brand-700/80 max-w-2xl">
              Calculate fair compensation adjustments for international hiring and talent relocation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetWidgets}
              className="h-11 bg-white hover:bg-brand-50 border border-border/40 px-5 font-bold text-brand-700 hidden lg:flex"
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Reset Layout
            </Button>
            <Button size="sm" className="h-11 px-6 font-bold uppercase tracking-widest text-[11px] bg-brand-600 text-white shadow-sm">
              <Info className="mr-2 h-4 w-4" />
              How it works
            </Button>
          </div>
        </div>

        {/* Stats Bar / Quick Info */}
        {result && (
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3 border-r border-border/40 pr-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Globe2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent-500">Routing</p>
                <p className="text-sm font-bold text-brand-900">
                  {result.homeCity.name} {result.homeCity.flag} → {result.targetCity.name} {result.targetCity.flag}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 border-r border-border/40 pr-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent-500">CoL Ratio</p>
                <p className="text-sm font-bold text-brand-900">{result.colRatio.toFixed(2)}x</p>
              </div>
            </div>

            <div className="ml-auto text-[11px] font-medium text-accent-400 italic">
              Last updated: Just now
            </div>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Input Panel */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="lg:sticky lg:top-24">
            <InputPanel data={formData} onChange={setFormData} />
          </div>
        </div>

        {/* Widgets Grid - Using LayoutManager */}
        <div className="lg:col-span-8 xl:col-span-9">
          <RelocationLayoutManager
            result={result}
            compApproach={formData.compApproach}
            hybridCap={formData.hybridCap}
            activeWidgets={activeWidgets}
            onRemoveWidget={handleRemoveWidget}
          />
        </div>
      </div>
    </div>
  );
}

export default function RelocationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-brand-900 uppercase tracking-widest">Loading Calculator...</p>
          </div>
        </div>
      }
    >
      <RelocationPageContent />
    </Suspense>
  );
}
