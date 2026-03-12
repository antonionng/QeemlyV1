"use client";

import { useEffect, useMemo, useState } from "react";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings } from "@/lib/company";
import { getBenchmark } from "@/lib/benchmarks/data-service";
import { INDUSTRIES, type SalaryBenchmark } from "@/lib/dashboard/dummy-data";
import { formatBenchmarkCompact, toBenchmarkDisplayValue } from "@/lib/utils/currency";
import { useSalaryView } from "@/lib/salary-view-store";

interface IndustryViewProps {
  result: BenchmarkResult;
}

export function IndustryView({ result }: IndustryViewProps) {
  const { role, level, location } = result;
  const companySettings = useCompanySettings();
  const { salaryView } = useSalaryView();
  const companyIndustry = result.formData.industry || companySettings.industry;
  const [industryBenchmarks, setIndustryBenchmarks] = useState<Record<string, SalaryBenchmark>>({});
  const [fallbackBenchmark, setFallbackBenchmark] = useState<SalaryBenchmark | null>(null);

  const targetCurrency = location.currency;
  const industriesToLoad = useMemo(() => {
    const ordered = [companyIndustry, ...INDUSTRIES.filter((industry) => industry !== companyIndustry)];
    return ordered.filter(Boolean).slice(0, 5);
  }, [companyIndustry]);

  useEffect(() => {
    const run = async () => {
      const entries = await Promise.all(
        industriesToLoad.map(async (industry) => {
          const nextBenchmark = await getBenchmark(role.id, location.id, level.id, {
            industry,
            companySize: result.formData.companySize,
          });
          if (!nextBenchmark) return null;
          if (
            nextBenchmark.benchmarkSegmentation?.matchedIndustry &&
            nextBenchmark.benchmarkSegmentation.matchedIndustry === industry
          ) {
            return { industry, benchmark: nextBenchmark, fallback: false };
          }

          if (nextBenchmark.benchmarkSegmentation?.isFallback) {
            return { industry, benchmark: nextBenchmark, fallback: true };
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
        next[entry.industry] = entry.benchmark;
      }
      setIndustryBenchmarks(next);
      setFallbackBenchmark(nextFallback);
    };

    void run();
  }, [industriesToLoad, level.id, location.id, result.formData.companySize, role.id]);

  const industryData = industriesToLoad
    .map((industry) => {
      const nextBenchmark = industryBenchmarks[industry];
      if (!nextBenchmark) return null;
      return {
        industry,
        median: toBenchmarkDisplayValue(nextBenchmark.percentiles.p50, {
          salaryView,
          sourceCurrency: nextBenchmark.currency,
          targetCurrency,
        }),
        isCompanyIndustry: industry === companyIndustry,
        sampleSize: nextBenchmark.sampleSize,
      };
    })
    .filter(Boolean) as Array<{
    industry: string;
    median: number;
    isCompanyIndustry: boolean;
    sampleSize: number;
    isFallback?: boolean;
  }>;
  const fallbackRow =
    industryData.length === 0 && fallbackBenchmark
      ? {
          industry: "Broader market",
          median: toBenchmarkDisplayValue(fallbackBenchmark.percentiles.p50, {
            salaryView,
            sourceCurrency: fallbackBenchmark.currency,
            targetCurrency,
          }),
          isCompanyIndustry: false,
          sampleSize: fallbackBenchmark.sampleSize,
          isFallback: true,
        }
      : null;
  const displayedIndustryData = fallbackRow ? [fallbackRow] : industryData;
  const maxMedian = Math.max(...displayedIndustryData.map((item) => item.median), 1);

  return (
    <div className="bench-section">
      <div className="flex items-center justify-between pb-4">
        <h3 className="bench-section-header pb-0">Industry Breakdown</h3>
        {companyIndustry && (
          <span className="text-xs text-brand-500">Your industry: {companyIndustry}</span>
        )}
      </div>
      <div className="space-y-3">
        {displayedIndustryData.map((item, index) => {
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
                    backgroundColor: item.isCompanyIndustry
                      ? companySettings.primaryColor
                      : item.isFallback
                        ? "#94a3b8"
                        : index === 0
                          ? "#6366f1"
                          : "#c4b5fd"
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
          No industry-specific cohort is available for this role yet. Showing the broader market benchmark instead.
        </p>
      ) : industryData.length === 0 ? (
        <p className="mt-4 text-xs text-brand-500">
          No industry-specific cohort is available for this role yet. Qeemly is using the broader market row.
        </p>
      ) : (
        <p className="mt-4 text-xs text-brand-500">
          Only cohorts with real segmented market matches are shown here. Missing cohorts fall back to the broader market row.
        </p>
      )}
    </div>
  );
}
