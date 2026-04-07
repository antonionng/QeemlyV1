"use client";

import { useState } from "react";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import {
  annualizeBenchmarkValue,
  applyBenchmarkViewMode,
  resolveBenchmarkPayPeriod,
} from "@/lib/benchmarks/pay-period";
import { useCompanySettings } from "@/lib/company";
import { useSalaryView } from "@/lib/salary-view-store";
import { ModuleStateBanner } from "../module-state-banner";
import { SharedAiCallout } from "../shared-ai-callout";

interface LevelTableViewProps {
  result: BenchmarkResult;
}

export function LevelTableView({ result }: LevelTableViewProps) {
  const { level } = result;
  const [showBasic, setShowBasic] = useState(false);
  const companySettings = useCompanySettings();
  const { salaryView } = useSalaryView();
  const benchmarkPayPeriod = resolveBenchmarkPayPeriod(
    result.benchmark.payPeriod ?? result.benchmark.sourcePayPeriod,
    result.benchmark.percentiles,
  );

  const mod = result.detailSurface?.modules.levelTable;
  const rows = mod?.data.rows ?? [];
  const breakdown = mod?.data.breakdown;
  const basicSalaryPct = breakdown?.basicSalaryPct ?? companySettings.compSplitBasicPct;
  const basicMultiplier = basicSalaryPct / 100;

  const convertValue = (value: number, payPeriod = benchmarkPayPeriod) => {
    const annualValue = annualizeBenchmarkValue(value, payPeriod);
    const viewValue = applyBenchmarkViewMode(annualValue, salaryView);
    return salaryView === "annual"
      ? Math.round(viewValue / 1000) * 1000
      : Math.round(viewValue / 100) * 100;
  };

  const formatAED = (value: number) => {
    if (value >= 1000) return `AED ${(value / 1000).toFixed(0)}k`;
    return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value);
  };
  const getDisplayValue = (value: number) =>
    convertValue(showBasic ? value * basicMultiplier : value, "annual");
  const basicModeDescription = breakdown
    ? `Estimated basic salary using ${basicSalaryPct}% AI package split.`
    : `Estimated basic salary using your workspace ${basicSalaryPct}% package split.`;

  const isLoading = !mod || result.detailSurfaceStatus === "loading";

  return (
    <div className="bench-section p-0 overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-4">
        <h3 className="bench-section-header pb-0">Level Data</h3>
        <div className="bench-toggle text-xs">
          <button type="button" data-active={!showBasic} onClick={() => setShowBasic(false)}>
            Total
          </button>
          <button type="button" data-active={showBasic} onClick={() => setShowBasic(true)}>
            Basic
          </button>
        </div>
      </div>

      {showBasic && <p className="px-5 pt-2 text-xs text-brand-500">{basicModeDescription}</p>}

      {isLoading ? <ModuleStateBanner variant="loading" message="Loading level data..." className="mx-5 mb-3" /> : null}
      {mod?.status === "error" ? (
        <ModuleStateBanner variant="error" message={mod.message ?? "Unable to load level data."} className="mx-5 mb-3" />
      ) : null}
      {mod?.status === "empty" ? (
        <ModuleStateBanner
          variant="info"
          message={mod.message ?? "No level data is available for this module yet."}
          className="mx-5 mb-3"
        />
      ) : null}
      <div className="overflow-x-auto mt-3">
        <table className="bench-table">
          <thead>
            <tr>
              <th>Level</th>
              <th className="text-right">P25</th>
              <th className="text-right">P50</th>
              <th className="text-right">P75</th>
              <th className="text-right">P85</th>
              <th className="text-right">P90</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = row.levelId === level.id;
              return (
                <tr key={row.levelId} className={isSelected ? "bench-row-highlight" : ""}>
                  <td>
                    <span className={`font-medium ${isSelected ? "text-brand-900" : "text-brand-700"}`}>
                      {row.levelName}
                    </span>
                  </td>
                  <td className="text-right">{formatAED(getDisplayValue(row.p25))}</td>
                  <td className="text-right font-medium">{formatAED(getDisplayValue(row.p50))}</td>
                  <td className="text-right">{formatAED(getDisplayValue(row.p75))}</td>
                  <td className="text-right">{formatAED(getDisplayValue(row.p85))}</td>
                  <td className="text-right">{formatAED(getDisplayValue(row.p90))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 pb-5">
        <SharedAiCallout section={mod?.narrative} />
      </div>
    </div>
  );
}
