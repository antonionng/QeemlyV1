"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Suspense, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { InputPanel, RelocationFormData } from "@/components/dashboard/relocation/input-panel";
import { ComparisonWidget } from "@/components/dashboard/relocation/widgets/comparison";
import { ColIndexWidget } from "@/components/dashboard/relocation/widgets/col-index";
import { PurchasingPowerWidget } from "@/components/dashboard/relocation/widgets/purchasing-power";
import { RecommendedRangeWidget } from "@/components/dashboard/relocation/widgets/recommended-range";
import { CostBreakdownWidget } from "@/components/dashboard/relocation/widgets/cost-breakdown";
import { SummaryExportWidget } from "@/components/dashboard/relocation/widgets/summary-export";
import { calculateRelocation } from "@/lib/relocation/calculator";
import { Card } from "@/components/ui/card";
import { ArrowRightLeft, Globe2 } from "lucide-react";
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

const COMP_APPROACH_LABELS: Record<RelocationFormData["compApproach"], string> = {
  local: "Local Market Pay",
  "purchasing-power": "Purchasing Power",
  hybrid: "Hybrid Approach",
};

function RelocationSectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`dash-card overflow-hidden border border-accent-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,250,252,0.94))] p-0 shadow-[0_10px_30px_rgba(17,24,39,0.04)] ${className}`.trim()}
    >
      <div className="border-b border-accent-100/80 px-6 py-4">
        <h3 className="text-base font-semibold text-accent-950">{title}</h3>
        <p className="mt-1 text-sm text-accent-600">{description}</p>
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </Card>
  );
}

function RelocationPageContent() {
  const searchParams = useSearchParams();
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

    void citiesVersion;

    return calculateRelocation({
      homeCityId: formData.homeCityId,
      targetCityId: formData.targetCityId,
      baseSalary: formData.baseSalary,
      compApproach: formData.compApproach,
      hybridCap: formData.hybridCap,
      rentOverride: formData.rentOverride,
    });
  }, [formData, citiesVersion]);

  return (
    <div className="bench-results relative z-10 space-y-7">
      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              Relocation strategy workspace
            </p>
            <h1 className="page-title">Relocation Calculator</h1>
            <p className="page-subtitle max-w-xl">
              Calm, decision-ready guidance for every move.
            </p>
          </div>

        </div>

        {result && (
          <Card className="mt-6 overflow-hidden border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50/90 p-0">
            <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-accent-800 ring-1 ring-brand-100">
                  <ArrowRightLeft className="h-4 w-4 text-brand-600" />
                  {result.homeCity.name} {result.homeCity.flag} to {result.targetCity.name} {result.targetCity.flag}
                </span>
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-accent-800 ring-1 ring-brand-100">
                  CoL {result.colRatio.toFixed(2)}x
                </span>
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-accent-800 ring-1 ring-brand-100">
                  {COMP_APPROACH_LABELS[formData.compApproach]}
                </span>
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-accent-950 sm:text-2xl">
                    Recommended midpoint: AED {Math.round(result.recommendedSalary).toLocaleString("en-US")}
                  </h2>
                  <p className="mt-1 text-sm text-accent-600">
                    Calm, decision-ready guidance for every move.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-accent-600">
                  <Globe2 className="h-4 w-4 text-brand-600" />
                  <span>{result.targetCity.name} relative to {result.homeCity.name}</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div>
          <div className="xl:sticky xl:top-24">
            <InputPanel data={formData} onChange={setFormData} />
          </div>
        </div>

        <div className="space-y-6">
          <section className="overview-section">
            <div>
              <h2 className="overview-section-title">Decision summary</h2>
              <p className="overview-supporting-text mt-1 max-w-2xl">
                Review the route, headline recommendation, and share-ready summary in the same surface.
              </p>
            </div>
            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)]">
              <RelocationSectionCard
                title="Location comparison"
                description="Compare both locations side by side before reviewing pay guidance."
              >
                <ComparisonWidget result={result} />
              </RelocationSectionCard>
              <RelocationSectionCard
                title="Share analysis"
                description="Leadership-ready summary for stakeholder review, approval, or handoff."
              >
                <SummaryExportWidget
                  result={result}
                  compApproach={formData.compApproach}
                  hybridCap={formData.hybridCap}
                />
              </RelocationSectionCard>
            </div>
          </section>

          <section className="overview-section">
            <div>
              <h2 className="overview-section-title">Key outputs</h2>
              <p className="overview-supporting-text mt-1 max-w-2xl">
                Highlight the cost ratio, equivalent pay, and recommended range in one branded grid.
              </p>
            </div>
            <div className="grid gap-6 xl:grid-cols-3">
              <RelocationSectionCard
                title="Cost of living index"
                description="See the relative market pressure between the two locations."
              >
                <ColIndexWidget result={result} />
              </RelocationSectionCard>
              <RelocationSectionCard
                title="Purchasing power"
                description="Translate the move into an equivalent salary target."
              >
                <PurchasingPowerWidget result={result} />
              </RelocationSectionCard>
              <RelocationSectionCard
                title="Recommended range"
                description="Frame the final offer range using the selected compensation policy."
              >
                <RecommendedRangeWidget
                  result={result}
                  compApproach={formData.compApproach}
                  hybridCap={formData.hybridCap}
                />
              </RelocationSectionCard>
            </div>
          </section>

          <section className="overview-section">
            <div>
              <h2 className="overview-section-title">Cost breakdown</h2>
              <p className="overview-supporting-text mt-1 max-w-2xl">
                Break down what is driving the difference across rent, transport, food, utilities, and other costs.
              </p>
            </div>
            <RelocationSectionCard
              title="Monthly cost drivers"
              description="Use the category split below to explain where relocation pressure is really coming from."
            >
              <CostBreakdownWidget result={result} />
            </RelocationSectionCard>
          </section>
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
