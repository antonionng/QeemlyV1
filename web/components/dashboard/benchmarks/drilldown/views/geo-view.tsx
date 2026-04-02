"use client";

import { useEffect, useMemo, useState } from "react";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { LOCATIONS, type SalaryBenchmark } from "@/lib/dashboard/dummy-data";
import { useCompanySettings, getCompanyInitials } from "@/lib/company";
import { convertCurrency, formatBenchmarkCompact, toBenchmarkDisplayValue } from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";
import { getBenchmarksBatch, makeBenchmarkLookupKey } from "@/lib/benchmarks/data-service";
import { SharedAiCallout } from "../shared-ai-callout";

interface GeoViewProps {
  result: BenchmarkResult;
}

const ALL_LOCATIONS = LOCATIONS;

export function GeoView({ result }: GeoViewProps) {
  const { role, level, location } = result;
  const companySettings = useCompanySettings();
  const { salaryView } = useSalaryView();
  const [benchmarksByLocation, setBenchmarksByLocation] = useState<Record<string, SalaryBenchmark>>({});
  const aiComparisonPoints = result.aiDetailBriefing?.views.geoComparison.comparisonPoints ?? null;
  const prefetchedGeoBenchmarks = result.detailSupportData?.geoBenchmarksByLocation ?? {};
  
  // Company branding
  const hasCompanyLogo = !!companySettings.companyLogo;
  const companyInitials = getCompanyInitials(companySettings.companyName);

  const aiLocationData = useMemo(
    () =>
      aiComparisonPoints?.map((point) => {
        const matchedLocation = ALL_LOCATIONS.find((entry) => entry.id === point.id);
        if (!matchedLocation) return null;

        return {
          location: matchedLocation,
          median: point.median,
          relativeMedianAed: point.relativeValue ?? point.median,
          currency: point.currency || matchedLocation.currency,
          yoyChange: point.yoyChange ?? 0,
          sampleSize: point.sampleSize ?? 0,
          isSelected: matchedLocation.id === location.id,
        };
      }).filter(Boolean) as Array<{
        location: (typeof ALL_LOCATIONS)[number];
        median: number;
        relativeMedianAed: number;
        currency: string;
        yoyChange: number;
        sampleSize: number;
        isSelected: boolean;
      }> ?? [],
    [aiComparisonPoints, location.id],
  );
  
  useEffect(() => {
    if (aiLocationData.length > 0) {
      setBenchmarksByLocation({});
      return;
    }

    if (Object.keys(prefetchedGeoBenchmarks).length > 0) {
      setBenchmarksByLocation(prefetchedGeoBenchmarks);
      return;
    }

    const run = async () => {
      const benchmarks = await getBenchmarksBatch(
        ALL_LOCATIONS.map((loc) => ({
          roleId: role.id,
          locationId: loc.id,
          levelId: level.id,
          industry: result.formData.industry,
          companySize: result.formData.companySize,
        })),
      );
      const next: Record<string, SalaryBenchmark> = {};
      for (const loc of ALL_LOCATIONS) {
        const benchmark = benchmarks[makeBenchmarkLookupKey({
          roleId: role.id,
          locationId: loc.id,
          levelId: level.id,
          industry: result.formData.industry,
          companySize: result.formData.companySize,
        })];
        if (benchmark) {
          next[loc.id] = benchmark;
        }
      }
      setBenchmarksByLocation(next);
    };
    void run();
  }, [aiLocationData.length, level.id, prefetchedGeoBenchmarks, result.formData.companySize, result.formData.industry, role.id]);

  // Build comparison data for locations where real rows exist
  const locationData = aiLocationData.length > 0
    ? [...aiLocationData].sort((a, b) => b.relativeMedianAed - a.relativeMedianAed)
    : ALL_LOCATIONS.map((loc) => {
    const bench = benchmarksByLocation[loc.id];
    if (!bench) return null;
    const sourceCurrency = bench.currency;
    const targetCurrency = loc.currency;
    const sourceMedian = bench.percentiles.p50;
    
    const median = toBenchmarkDisplayValue(sourceMedian, {
      salaryView,
      sourceCurrency,
      targetCurrency,
      payPeriod: bench.payPeriod,
    });
    const relativeMedianAed = convertCurrency(sourceMedian, sourceCurrency, "AED");
    
    return {
      location: loc,
      median,
      relativeMedianAed,
      currency: targetCurrency,
      yoyChange: bench.yoyChange,
      sampleSize: bench.sampleSize,
      isSelected: loc.id === location.id,
    };
  }).filter(Boolean).sort((a, b) => b!.relativeMedianAed - a!.relativeMedianAed) as Array<{
    location: (typeof ALL_LOCATIONS)[number];
    median: number;
    relativeMedianAed: number;
    currency: string;
    yoyChange: number;
    sampleSize: number;
    isSelected: boolean;
  }>;

  const maxMedian = locationData[0]?.relativeMedianAed || 1;

  return (
    <div className="bench-section">
      {/* Header with company branding */}
      <div className="flex items-center justify-between pb-4">
        <h3 className="bench-section-header pb-0">Geographic Comparison</h3>
        {companySettings.isConfigured && (
          <div className="flex items-center gap-2">
            {hasCompanyLogo ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-border overflow-hidden">
                <img 
                  src={companySettings.companyLogo!} 
                  alt={companySettings.companyName}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div 
                className="flex h-6 w-6 items-center justify-center rounded-md text-white font-bold text-[10px]"
                style={{ backgroundColor: companySettings.primaryColor }}
              >
                {companyInitials}
              </div>
            )}
            <span className="text-xs text-brand-600">{companySettings.companyName}</span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-brand-500 mb-4">
        {role.title} ({level.name}) salaries across markets in local currencies
      </p>

      <div className="space-y-3">
        {locationData.map((item) => {
          const percentage = (item.relativeMedianAed / maxMedian) * 100;
          
          return (
            <div
              key={item.location.id}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                item.isSelected ? "bg-brand-50 ring-1 ring-brand-200" : ""
              }`}
            >
              <div className="w-6 text-center text-lg">
                {item.location.countryCode === "AE" ? "🇦🇪" :
                 item.location.countryCode === "SA" ? "🇸🇦" :
                 item.location.countryCode === "QA" ? "🇶🇦" :
                 item.location.countryCode === "BH" ? "🇧🇭" :
                 item.location.countryCode === "KW" ? "🇰🇼" :
                 item.location.countryCode === "OM" ? "🇴🇲" : "🌍"}
              </div>
              <div className="w-24">
                <div className="text-sm font-medium text-brand-900">
                  {item.location.city}
                </div>
                <div className="text-xs text-brand-500">
                  {item.location.country}
                </div>
              </div>
              <div className="flex-1 h-6 bg-brand-50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.isSelected ? "bg-brand-500" : "bg-brand-300"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-20 text-right">
                <div className="text-sm font-bold text-brand-900">
                  {formatBenchmarkCompact(item.median, item.currency)}
                </div>
                <div className={`text-xs ${item.yoyChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {item.yoyChange >= 0 ? "+" : ""}{item.yoyChange.toFixed(1)}%
                </div>
              </div>
              {item.isSelected && (
                <span className="text-[10px] font-medium text-brand-600 px-2 py-0.5 rounded-full bg-brand-100">
                  Selected
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-brand-500">
        Location premiums reflect cost of living and local talent competition.
      </p>

      <SharedAiCallout section={result.aiDetailBriefing?.views.geoComparison} />
    </div>
  );
}
