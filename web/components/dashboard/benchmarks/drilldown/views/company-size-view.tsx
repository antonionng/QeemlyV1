"use client";

import { useEffect, useMemo, useState } from "react";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings } from "@/lib/company";
import { getBenchmark } from "@/lib/benchmarks/data-service";
import { COMPANY_SIZES, type SalaryBenchmark } from "@/lib/dashboard/dummy-data";
import { formatBenchmarkCompact, toBenchmarkDisplayValue } from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";

interface CompanySizeViewProps {
  result: BenchmarkResult;
}

export function CompanySizeView({ result }: CompanySizeViewProps) {
  const { role, level, location } = result;
  const companySettings = useCompanySettings();
  const { salaryView } = useSalaryView();
  const companySize = result.formData.companySize || companySettings.companySize;
  const [companySizeBenchmarks, setCompanySizeBenchmarks] = useState<Record<string, SalaryBenchmark>>({});
  const [fallbackBenchmark, setFallbackBenchmark] = useState<SalaryBenchmark | null>(null);

  const targetCurrency = location.currency;
  const sizesToLoad = useMemo(() => {
    const ordered = [companySize, ...COMPANY_SIZES.filter((size) => size !== companySize)];
    return ordered.filter(Boolean).slice(0, 5);
  }, [companySize]);

  useEffect(() => {
    const run = async () => {
      const entries = await Promise.all(
        sizesToLoad.map(async (size) => {
          const nextBenchmark = await getBenchmark(role.id, location.id, level.id, {
            industry: result.formData.industry,
            companySize: size,
          });
          if (!nextBenchmark) return null;
          if (
            nextBenchmark.benchmarkSegmentation?.matchedCompanySize &&
            nextBenchmark.benchmarkSegmentation.matchedCompanySize === size
          ) {
            return { size, benchmark: nextBenchmark, fallback: false };
          }

          if (nextBenchmark.benchmarkSegmentation?.isFallback) {
            return { size, benchmark: nextBenchmark, fallback: true };
          }

          return null;
        }),
      );

      const next: Record<string, SalaryBenchmark> = {};
      let nextFallback: SalaryBenchmark | null = null;
      for (const entry of entries) {
        if (!entry) continue;
        if (entry.fallback) {
          nextFallback ??= entry.benchmark;
          continue;
        }
        next[entry.size] = entry.benchmark;
      }
      setCompanySizeBenchmarks(next);
      setFallbackBenchmark(nextFallback);
    };

    void run();
  }, [level.id, location.id, result.formData.industry, role.id, sizesToLoad]);

  const companySizeData = sizesToLoad
    .map((size) => {
      const nextBenchmark = companySizeBenchmarks[size];
      if (!nextBenchmark) return null;
      return {
        size,
        median: toBenchmarkDisplayValue(nextBenchmark.percentiles.p50, {
          salaryView,
          sourceCurrency: nextBenchmark.currency,
          targetCurrency,
          payPeriod: nextBenchmark.payPeriod,
        }),
        isCompanySize: size === companySize,
        sampleSize: nextBenchmark.sampleSize,
      };
    })
    .filter(Boolean) as Array<{
    size: string;
    median: number;
    isCompanySize: boolean;
    sampleSize: number;
    isFallback?: boolean;
  }>;
  const fallbackRow =
    companySizeData.length === 0 && fallbackBenchmark
      ? {
          size: "Broader market",
          median: toBenchmarkDisplayValue(fallbackBenchmark.percentiles.p50, {
            salaryView,
            sourceCurrency: fallbackBenchmark.currency,
            targetCurrency,
            payPeriod: fallbackBenchmark.payPeriod,
          }),
          isCompanySize: false,
          sampleSize: fallbackBenchmark.sampleSize,
          isFallback: true,
        }
      : null;
  const displayedCompanySizeData = fallbackRow ? [fallbackRow] : companySizeData;
  const maxMedian = Math.max(...displayedCompanySizeData.map((item) => item.median), 1);

  return (
    <div className="bench-section">
      <div className="flex items-center justify-between pb-4">
        <h3 className="bench-section-header pb-0">Top Company Sizes</h3>
        {companySize && (
          <span className="text-xs text-brand-500">Your size: {companySize}</span>
        )}
      </div>
      <div className="space-y-3">
        {displayedCompanySizeData.map((item) => {
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
                    backgroundColor: item.isCompanySize
                      ? companySettings.primaryColor
                      : item.isFallback
                        ? "#94a3b8"
                        : "#34d399"
                  }}
                />
              </div>
              <div className="w-20 text-right text-sm font-medium text-brand-900">
                {formatBenchmarkCompact(item.median, targetCurrency)}
              </div>
              <div className="w-16 text-right text-xs text-brand-500">
                n={item.sampleSize}
              </div>
            </div>
          );
        })}
      </div>
      {fallbackRow ? (
        <p className="mt-4 text-xs text-brand-500">
          No company-size-specific cohort is available for this role yet. Showing the broader market benchmark instead.
        </p>
      ) : companySizeData.length === 0 ? (
        <p className="mt-4 text-xs text-brand-500">
          No company-size-specific cohort is available for this role yet. Qeemly is using the broader market row.
        </p>
      ) : (
        <p className="mt-4 text-xs text-brand-500">
          Only cohorts with real segmented market matches are shown here. Missing cohorts fall back to the broader market row.
        </p>
      )}
    </div>
  );
}
