"use client";

import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings } from "@/lib/company";
import { formatBenchmarkCompact, toBenchmarkDisplayValue } from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";

interface IndustryViewProps {
  result: BenchmarkResult;
}

export function IndustryView({ result }: IndustryViewProps) {
  const { location, benchmark } = result;
  const companySettings = useCompanySettings();
  const { salaryView } = useSalaryView();
  
  // Company branding
  const companyIndustry = companySettings.industry;
  
  const sourceLocationId = location.id === "london" ? "dubai" : location.id;
  const sourceCurrency = location.id === "london" ? "AED" : location.currency;
  const targetCurrency = location.currency;

  const baselineMedian = toBenchmarkDisplayValue(benchmark.percentiles.p50, {
    salaryView,
    sourceCurrency,
    targetCurrency,
  });

  const industryData = [
    {
      industry: companyIndustry || "Selected industry",
      median: baselineMedian,
      isCompanyIndustry: true,
    },
  ];

  return (
    <div className="bench-section">
      <div className="flex items-center justify-between pb-4">
        <h3 className="bench-section-header pb-0">Industry Breakdown</h3>
        {companySettings.isConfigured && (
          <span className="text-xs text-brand-500">Your industry: {companyIndustry}</span>
        )}
      </div>
      <div className="space-y-3">
        {industryData.map((item, index) => {
          const maxMedian = industryData[0].median;
          const percentage = (item.median / maxMedian) * 100;
          
          return (
            <div 
              key={item.industry} 
              className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${
                item.isCompanyIndustry ? "bg-brand-50 ring-1 ring-brand-200" : ""
              }`}
            >
              <div className="w-32 text-sm font-medium text-brand-700 truncate flex items-center gap-2">
                {item.industry}
                {item.isCompanyIndustry && (
                  <span 
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: companySettings.primaryColor }}
                  />
                )}
              </div>
              <div className="flex-1 h-8 bg-brand-50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: item.isCompanyIndustry ? companySettings.primaryColor : (index === 0 ? "#6366f1" : "#c4b5fd")
                  }}
                />
              </div>
              <div className="w-20 text-right text-sm font-medium text-brand-900">
                {formatBenchmarkCompact(item.median, targetCurrency)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-brand-500">Cross-industry segmented benchmarks are not yet available in this workspace dataset.</p>
    </div>
  );
}
