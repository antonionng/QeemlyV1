"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { getIndustryBreakdown } from "@/lib/dashboard/dummy-data";
import { useCompanySettings, getCompanyInitials } from "@/lib/company";
import { useCurrencyFormatter, convertCurrency, monthlyToAnnual, roundToThousand } from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";

interface IndustryViewProps {
  result: BenchmarkResult;
}

export function IndustryView({ result }: IndustryViewProps) {
  const { role, level, location } = result;
  const companySettings = useCompanySettings();
  const currency = useCurrencyFormatter();
  const { salaryView } = useSalaryView();
  
  // Company branding
  const companyIndustry = companySettings.industry;
  
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

  // Industry breakdown
  const industryData = getIndustryBreakdown(role.id, location.id === "london" ? "dubai" : location.id, level.id)
    .slice(0, 8)
    .map(item => ({
      ...item,
      median: convertToDefault(item.median),
      isCompanyIndustry: item.industry === companyIndustry,
    }));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-900">By Industry</h3>
        {companySettings.isConfigured && (
          <Badge variant="outline" className="text-xs">
            Your industry: {companyIndustry}
          </Badge>
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
                {formatCompact(item.median)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-brand-500">
        Industry variations reflect different talent demands and budget allocations across sectors.
      </p>
    </Card>
  );
}
