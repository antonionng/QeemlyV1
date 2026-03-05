"use client";

import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings } from "@/lib/company";
import { formatBenchmarkCompact, toBenchmarkDisplayValue } from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";

interface CompanySizeViewProps {
  result: BenchmarkResult;
}

export function CompanySizeView({ result }: CompanySizeViewProps) {
  const { location, benchmark } = result;
  const companySettings = useCompanySettings();
  const { salaryView } = useSalaryView();
  
  // Company branding - match size category
  const companySize = companySettings.companySize;
  
  const sourceLocationId = location.id === "london" ? "dubai" : location.id;
  const sourceCurrency = location.id === "london" ? "AED" : location.currency;
  const targetCurrency = location.currency;

  const companySizeData = [
    {
      size: companySize || "Selected size",
      median: toBenchmarkDisplayValue(benchmark.percentiles.p50, {
        salaryView,
        sourceCurrency,
        targetCurrency,
      }),
      isCompanySize: true,
    },
  ];

  return (
    <div className="bench-section">
      <div className="flex items-center justify-between pb-4">
        <h3 className="bench-section-header pb-0">Top Company Sizes</h3>
        {companySettings.isConfigured && (
          <span className="text-xs text-brand-500">Your size: {companySize}</span>
        )}
      </div>
      <div className="space-y-3">
        {companySizeData.map((item) => {
          const maxMedian = companySizeData[companySizeData.length - 1].median;
          const percentage = (item.median / maxMedian) * 100;
          
          return (
            <div 
              key={item.size} 
              className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${
                item.isCompanySize ? "bg-brand-50 ring-1 ring-brand-200" : ""
              }`}
            >
              <div className="w-32 text-sm font-medium text-brand-700 flex items-center gap-2">
                {item.size}
                {item.isCompanySize && (
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
                    backgroundColor: item.isCompanySize ? companySettings.primaryColor : "#34d399"
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
      <p className="mt-4 text-xs text-brand-500">Company-size segmented premiums are not yet available in this workspace dataset.</p>
    </div>
  );
}
