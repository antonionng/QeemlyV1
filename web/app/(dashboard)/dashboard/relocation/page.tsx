"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { InputPanel, RelocationFormData } from "@/components/dashboard/relocation/input-panel";
import { RelocationLayoutManager } from "@/components/dashboard/relocation/layout-manager";
import { calculateRelocation } from "@/lib/relocation/calculator";
import { ALL_RELOCATION_WIDGET_IDS } from "@/lib/relocation/widget-registry";
import { Globe2, Info, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setRelocationCities, type City } from "@/lib/relocation/col-data";
import { useEffect } from "react";

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
  const [citiesVersion, setCitiesVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;
    void fetch("/api/relocation/cities")
      .then(async (res) => {
        if (!res.ok) return;
        const payload = await res.json();
        const cities: City[] = (payload.cities || []).map((row: any) => ({
          id: row.city_id,
          name: row.name,
          country: row.country,
          region: row.region,
          flag: row.flag,
          colIndex: Number(row.col_index),
          breakdown: {
            rent: Number(row.rent),
            transport: Number(row.transport),
            food: Number(row.food),
            utilities: Number(row.utilities),
            other: Number(row.other),
          },
          currency: row.currency,
          currencySymbol: row.currency_symbol,
        }));
        if (!isMounted || cities.length === 0) return;
        setRelocationCities(cities);
        setCitiesVersion((v) => v + 1);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

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
  }, [formData, citiesVersion]);

  const handleRemoveWidget = (widgetId: string) => {
    setActiveWidgets(prev => prev.filter(id => id !== widgetId));
  };

  const handleResetWidgets = () => {
    setActiveWidgets(ALL_RELOCATION_WIDGET_IDS);
  };

  return (
    <div className="bench-results relative z-10 space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="page-title">
                Relocation Calculator
              </h1>
              <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                MVP
              </span>
            </div>
            <p className="page-subtitle max-w-2xl">
              Calculate fair compensation adjustments for international hiring and talent relocation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetWidgets}
              className="hidden h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50 lg:flex"
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Reset Layout
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
            >
              <Info className="mr-2 h-4 w-4" />
              How it works
            </Button>
          </div>
        </div>

        {/* Trust strip */}
        {result && (
          <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-1 px-4 py-3 text-xs text-accent-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-brand-700">
              <Globe2 className="h-3.5 w-3.5" />
              Route: {result.homeCity.name} {result.homeCity.flag} → {result.targetCity.name} {result.targetCity.flag}
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
              CoL Ratio: {result.colRatio.toFixed(2)}x
            </span>
            <span className="rounded-full bg-accent-100 px-2.5 py-1 text-accent-700">
              Source: Workspace relocation dataset
            </span>
            <span className="ml-auto rounded-full bg-accent-50 px-2.5 py-1 text-accent-500">
              Refreshed: Just now
            </span>
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
        <div className="flex min-h-screen items-center justify-center bg-surface-2">
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
