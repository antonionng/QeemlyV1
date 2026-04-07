"use client";

import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings, getCompanyInitials } from "@/lib/company";
import { formatBenchmarkCompact } from "@/lib/utils/currency";
import { ModuleStateBanner } from "../module-state-banner";
import { SharedAiCallout } from "../shared-ai-callout";

interface GeoViewProps {
  result: BenchmarkResult;
}

export function GeoView({ result }: GeoViewProps) {
  const { role, level } = result;
  const companySettings = useCompanySettings();
  const hasCompanyLogo = !!companySettings.companyLogo;
  const companyInitials = getCompanyInitials(companySettings.companyName);

  const mod = result.detailSurface?.modules.geoComparison;
  const rows = [...(mod?.data.rows ?? [])].sort(
    (a, b) => b.relativeValue - a.relativeValue,
  );
  const isLoading = !mod || result.detailSurfaceStatus === "loading";
  const maxRelative = rows[0]?.relativeValue || 1;

  const flagEmoji = (countryCode: string) => {
    const map: Record<string, string> = {
      AE: "\u{1F1E6}\u{1F1EA}",
      SA: "\u{1F1F8}\u{1F1E6}",
      QA: "\u{1F1F6}\u{1F1E6}",
      BH: "\u{1F1E7}\u{1F1ED}",
      KW: "\u{1F1F0}\u{1F1FC}",
      OM: "\u{1F1F4}\u{1F1F2}",
      GB: "\u{1F1EC}\u{1F1E7}",
    };
    return map[countryCode] ?? "\u{1F30D}";
  };

  return (
    <div className="bench-section">
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
        {isLoading ? <ModuleStateBanner variant="loading" message="Loading geographic comparisons..." /> : null}
        {mod?.status === "error" ? (
          <ModuleStateBanner variant="error" message={mod.message ?? "Unable to load geographic data."} />
        ) : null}
        {mod?.status === "empty" && !isLoading ? (
          <ModuleStateBanner variant="info" message={mod.message ?? "No geographic data available."} />
        ) : null}
        {rows.map((item) => {
          const percentage = (item.relativeValue / maxRelative) * 100;

          return (
            <div
              key={item.locationId}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                item.isSelected ? "bg-brand-50 ring-1 ring-brand-200" : ""
              }`}
            >
              <div className="w-6 text-center text-lg">{flagEmoji(item.flag)}</div>
              <div className="w-24">
                <div className="text-sm font-medium text-brand-900">{item.city}</div>
                <div className="text-xs text-brand-500">{item.country}</div>
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
                {item.yoyChange !== null && (
                  <div
                    className={`text-xs ${item.yoyChange >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {item.yoyChange >= 0 ? "+" : ""}
                    {item.yoyChange.toFixed(1)}%
                  </div>
                )}
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

      <SharedAiCallout section={mod?.narrative} />
    </div>
  );
}
