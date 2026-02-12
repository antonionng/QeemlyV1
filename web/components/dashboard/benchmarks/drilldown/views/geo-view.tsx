"use client";

import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { LOCATIONS, generateBenchmark } from "@/lib/dashboard/dummy-data";
import { useCompanySettings, getCompanyInitials } from "@/lib/company";
import { useCurrencyFormatter, convertCurrency, monthlyToAnnual, roundToThousand } from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";

interface GeoViewProps {
  result: BenchmarkResult;
}

// Extended locations including UK
const ALL_LOCATIONS = [
  { id: "london", city: "London", country: "United Kingdom", countryCode: "GB", currency: "AED" as const, flag: "GB" },
  { id: "manchester", city: "Manchester", country: "United Kingdom", countryCode: "GB", currency: "AED" as const, flag: "GB" },
  ...LOCATIONS,
];

export function GeoView({ result }: GeoViewProps) {
  const { role, level, location } = result;
  const companySettings = useCompanySettings();
  const currency = useCurrencyFormatter();
  const { salaryView } = useSalaryView();
  
  // Company branding
  const hasCompanyLogo = !!companySettings.companyLogo;
  const companyInitials = getCompanyInitials(companySettings.companyName);
  
  // Convert from monthly AED to company's default currency (respects salary view mode)
  const convertToDefault = (value: number) => {
    const converted = salaryView === "annual" ? monthlyToAnnual(value) : value;
    return roundToThousand(convertCurrency(converted, "AED", currency.defaultCurrency));
  };
  
  const formatCompact = (value: number) => {
    if (value >= 1000) {
      return `${currency.symbol}${(value / 1000).toFixed(0)}k`;
    }
    return currency.format(value);
  };

  // Generate comparison data for all locations
  const locationData = ALL_LOCATIONS.map(loc => {
    const locationId = loc.id === "london" || loc.id === "manchester" ? "dubai" : loc.id;
    const bench = generateBenchmark(role.id, locationId, level.id);
    const median = convertToDefault(bench.percentiles.p50);
    
    // Apply location adjustments
    let adjustedMedian = median;
    if (loc.id === "london") adjustedMedian = Math.round(median * 1.1);
    if (loc.id === "manchester") adjustedMedian = Math.round(median * 0.85);
    
    return {
      location: loc,
      median: adjustedMedian,
      yoyChange: bench.yoyChange,
      sampleSize: bench.sampleSize,
      isSelected: loc.id === location.id,
    };
  }).sort((a, b) => b.median - a.median);

  const maxMedian = locationData[0]?.median || 1;

  return (
    <Card className="p-6">
      {/* Header with company branding */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-brand-900">Geographic Comparison</h3>
        </div>
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
        {role.title} ({level.name}) salaries across markets in {currency.defaultCurrency}
      </p>

      <div className="space-y-3">
        {locationData.map((item) => {
          const percentage = (item.median / maxMedian) * 100;
          
          return (
            <div
              key={item.location.id}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                item.isSelected ? "bg-brand-50 ring-1 ring-brand-200" : ""
              }`}
            >
              <div className="w-6 text-center text-lg">
                {item.location.countryCode === "GB" ? "🇬🇧" : 
                 item.location.countryCode === "AE" ? "🇦🇪" :
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
                  {formatCompact(item.median)}
                </div>
                <div className={`text-xs ${item.yoyChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {item.yoyChange >= 0 ? "+" : ""}{item.yoyChange.toFixed(1)}%
                </div>
              </div>
              {item.isSelected && (
                <Badge variant="brand" className="text-xs">
                  Selected
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-brand-500">
        Location premiums reflect cost of living and local talent competition.
      </p>
    </Card>
  );
}
