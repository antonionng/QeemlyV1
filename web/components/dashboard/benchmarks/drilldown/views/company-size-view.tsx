"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { getCompanySizePremium } from "@/lib/dashboard/dummy-data";
import { useCompanySettings } from "@/lib/company";
import { useCurrencyFormatter, convertCurrency, monthlyToAnnual, roundToThousand } from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";

interface CompanySizeViewProps {
  result: BenchmarkResult;
}

export function CompanySizeView({ result }: CompanySizeViewProps) {
  const { role, level, location } = result;
  const companySettings = useCompanySettings();
  const currency = useCurrencyFormatter();
  const { salaryView } = useSalaryView();
  
  // Company branding - match size category
  const companySize = companySettings.companySize;
  
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

  // Company size premium
  const companySizeData = getCompanySizePremium(role.id, location.id === "london" ? "dubai" : location.id, level.id)
    .map(item => ({
      ...item,
      median: convertToDefault(item.median),
      isCompanySize: item.size === companySize,
    }));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-900">By Company Size</h3>
        {companySettings.isConfigured && (
          <Badge variant="outline" className="text-xs">
            Your size: {companySize}
          </Badge>
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
                {formatCompact(item.median)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-brand-500">
        Larger companies typically offer 15-25% higher compensation due to more complex roles and larger budgets.
      </p>
    </Card>
  );
}
