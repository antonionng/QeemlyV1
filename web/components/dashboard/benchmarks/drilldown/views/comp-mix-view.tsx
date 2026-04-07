"use client";

import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { applyBenchmarkViewMode } from "@/lib/benchmarks/pay-period";
import { useSalaryView } from "@/lib/salary-view-store";
import { ModuleStateBanner } from "../module-state-banner";
import { SharedAiCallout } from "../shared-ai-callout";

interface CompMixViewProps {
  result: BenchmarkResult;
}

export function CompMixView({ result }: CompMixViewProps) {
  const { level, benchmark } = result;
  const { salaryView } = useSalaryView();

  const mod = result.detailSurface?.modules.compMix;
  const isLoading = !mod || result.detailSurfaceStatus === "loading";
  const breakdown = mod?.data.breakdown;
  const hasBreakdown = mod?.status === "ready" && breakdown && breakdown.basicSalaryPct > 0;

  const convertValue = (annualValue: number) => {
    const viewValue = applyBenchmarkViewMode(annualValue, salaryView);
    return salaryView === "annual"
      ? Math.round(viewValue / 1000) * 1000
      : Math.round(viewValue / 100) * 100;
  };

  const formatAED = (value: number) => {
    if (value >= 1000) {
      return `AED ${(value / 1000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const hasEmployerCost = Boolean(benchmark.nationalsCostBreakdown);
  const p50 = convertValue(benchmark.percentiles.p50);

  const compMixData = hasBreakdown
    ? [
        { name: "Basic Salary", value: Math.round((p50 * breakdown.basicSalaryPct) / 100) },
        { name: "Housing", value: Math.round((p50 * breakdown.housingPct) / 100) },
        { name: "Transport", value: Math.round((p50 * breakdown.transportPct) / 100) },
        { name: "Other Allowances", value: Math.round((p50 * breakdown.otherAllowancesPct) / 100) },
      ]
    : hasEmployerCost
      ? [
          { name: "Cash Compensation", value: p50 },
          {
            name: "Employer Contributions",
            value: convertValue(
              (benchmark.nationalsCostBreakdown?.gpssaAmount || 0) + (benchmark.nationalsCostBreakdown?.nafisAmount || 0),
            ),
          },
        ]
      : [{ name: "Cash Compensation", value: p50 }];

  const totalComp = compMixData.reduce((sum, item) => sum + item.value, 0);

  const getColor = (name: string) => {
    switch (name) {
      case "Basic Salary": return "bg-brand-500";
      case "Housing": return "bg-teal-400";
      case "Transport": return "bg-amber-400";
      case "Other Allowances": return "bg-pink-400";
      case "Employer Contributions": return "bg-emerald-500";
      default: return "bg-gray-500";
    }
  };

  const getColorLight = (name: string) => {
    switch (name) {
      case "Basic Salary": return "bg-brand-100 text-brand-700";
      case "Housing": return "bg-teal-100 text-teal-700";
      case "Transport": return "bg-amber-100 text-amber-700";
      case "Other Allowances": return "bg-pink-100 text-pink-700";
      case "Employer Contributions": return "bg-emerald-100 text-emerald-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bench-section">
      <h3 className="bench-section-header">Compensation Mix</h3>

      <p className="text-xs text-brand-500 mb-4">
        Typical breakdown for {level.name} at P50
      </p>

      {isLoading ? (
        <ModuleStateBanner
          variant="loading"
          message="Qeemly AI is preparing the compensation mix for this market view."
        />
      ) : (
        <>
          <div className="h-8 rounded-full overflow-hidden flex mb-4">
            {compMixData.map((item) => {
              const percentage = totalComp > 0 ? (item.value / totalComp) * 100 : 0;
              return (
                <div
                  key={item.name}
                  className={`h-full ${getColor(item.name)} transition-all`}
                  style={{ width: `${percentage}%` }}
                  title={`${item.name}: ${formatAED(item.value)}`}
                />
              );
            })}
          </div>

          <div className="space-y-3">
            {compMixData.map((item) => {
              const percentage = totalComp > 0 ? (item.value / totalComp) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getColor(item.name)}`} />
                    <div>
                      <span className="text-sm font-medium text-brand-700">{item.name}</span>
                      {item.name === "Housing" ? (
                        <div className="text-[10px] text-brand-400">Accommodation allowance (shown as Housing).</div>
                      ) : null}
                      {item.name === "Transport" ? (
                        <div className="text-[10px] text-brand-400">Transport allowance component.</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getColorLight(item.name)}`}>
                      {percentage.toFixed(0)}%
                    </span>
                    <span className="text-sm font-bold text-brand-900 w-20 text-right">
                      {formatAED(item.value)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">Total Compensation</span>
            <span className="text-lg font-bold text-brand-900">{formatAED(totalComp)}</span>
          </div>
        </>
      )}

      {!isLoading && !hasBreakdown && !hasEmployerCost && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 text-xs text-amber-700">
          {mod?.message ?? "Detailed compensation component splits are not yet available for this workspace."}
        </div>
      )}

      {!isLoading && !hasBreakdown && hasEmployerCost && (
        <div className="mt-4 p-3 rounded-xl bg-purple-50 text-xs text-purple-700">
          Employer contribution components are included where available for this benchmark row.
        </div>
      )}

      <SharedAiCallout section={mod?.narrative} />
    </div>
  );
}
