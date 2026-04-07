"use client";

import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings } from "@/lib/company";
import { formatBenchmarkCompact } from "@/lib/utils/currency";
import { ModuleStateBanner } from "../module-state-banner";
import { SharedAiCallout } from "../shared-ai-callout";

interface CompanySizeViewProps {
  result: BenchmarkResult;
}

export function CompanySizeView({ result }: CompanySizeViewProps) {
  const { location } = result;
  const companySettings = useCompanySettings();
  const companySize = result.formData.companySize || companySettings.companySize;
  const targetCurrency = location.currency;

  const mod = result.detailSurface?.modules.companySize;
  const rows = mod?.data.rows ?? [];
  const isLoading = !mod || result.detailSurfaceStatus === "loading";
  const maxMedian = Math.max(...rows.map((r) => r.median), 1);

  return (
    <div className="bench-section">
      <div className="flex items-center justify-between pb-4">
        <h3 className="bench-section-header pb-0">Top Company Sizes</h3>
        {companySize && (
          <span className="text-xs text-brand-500">Your size: {companySize}</span>
        )}
      </div>
      <div className="space-y-3">
        {isLoading ? <ModuleStateBanner variant="loading" message="Loading company-size comparisons..." /> : null}
        {mod?.status === "error" ? (
          <ModuleStateBanner variant="error" message={mod.message ?? "Unable to load company-size comparisons."} />
        ) : null}
        {rows.map((item) => {
          const percentage = (item.median / maxMedian) * 100;

          return (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${
                item.isHighlighted ? "bg-brand-50 ring-1 ring-brand-200" : ""
              }`}
            >
              <div className="w-32 text-sm font-medium text-brand-700 flex items-center gap-2">
                {item.label}
                {item.isHighlighted && (
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
                    backgroundColor: item.isHighlighted
                      ? companySettings.primaryColor
                      : item.id === "broader-market"
                        ? "#94a3b8"
                        : "#34d399",
                  }}
                />
              </div>
              <div className="w-20 text-right text-sm font-medium text-brand-900">
                {formatBenchmarkCompact(item.median, targetCurrency)}
              </div>
              <div className="w-16 text-right text-xs text-brand-500">
                {typeof item.sampleSize === "number" && item.sampleSize > 0
                  ? `n=${item.sampleSize}`
                  : "AI cohort"}
              </div>
            </div>
          );
        })}
      </div>
      {mod?.data.fallbackLabel ? (
        <p className="mt-4 text-xs text-brand-500">
          No company-size-specific cohort is available for this role yet. Showing the broader market benchmark instead.
        </p>
      ) : rows.length === 0 && !isLoading ? (
        <p className="mt-4 text-xs text-brand-500">
          {mod?.message ?? "No company-size-specific cohort is available for this role yet."}
        </p>
      ) : rows.length > 0 ? (
        <p className="mt-4 text-xs text-brand-500">
          {mod?.source === "ai"
            ? "Company-size medians are being shown from the shared Qeemly AI Advisory briefing."
            : "Only cohorts with real segmented market matches are shown here. Missing cohorts fall back to the broader market row."}
        </p>
      ) : null}

      <SharedAiCallout section={mod?.narrative} />
    </div>
  );
}
