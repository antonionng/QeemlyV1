"use client";

import { useEffect, useMemo, useState } from "react";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import {
  annualizeBenchmarkValue,
  applyBenchmarkViewMode,
  resolveBenchmarkPayPeriod,
} from "@/lib/benchmarks/pay-period";
import { LEVELS } from "@/lib/dashboard/dummy-data";
import { useSalaryView } from "@/lib/salary-view-store";
import { getBenchmarksBatch, makeBenchmarkLookupKey } from "@/lib/benchmarks/data-service";
import { SharedAiCallout } from "../shared-ai-callout";

interface LevelTableViewProps {
  result: BenchmarkResult;
}

export function LevelTableView({ result }: LevelTableViewProps) {
  const { role, level, location } = result;
  const [showBasic, setShowBasic] = useState(false);
  const [rows, setRows] = useState<
    Array<{
      level: Pick<(typeof LEVELS)[number], "id" | "name">;
      p25: number;
      p50: number;
      p75: number;
      p85: number;
      p90: number;
      isSelected: boolean;
    }>
  >([]);
  const { salaryView } = useSalaryView();
  const benchmarkPayPeriod = resolveBenchmarkPayPeriod(
    result.benchmark.payPeriod ?? result.benchmark.sourcePayPeriod,
    result.benchmark.percentiles,
  );
  const aiLevelBands = result.aiDetailBriefing?.views.levelTable.levelBands ?? null;

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

  const aiRows = useMemo(
    () =>
      aiLevelBands?.map((band) => {
        const p85 = band.p75 + (band.p90 - band.p75) * 0.5;
        return {
          level: {
            id: band.levelId,
            name: band.levelName,
          },
          p25: band.p25,
          p50: band.p50,
          p75: band.p75,
          p85,
          p90: band.p90,
          isSelected: band.levelId === level.id,
        };
      }) ?? [],
    [aiLevelBands, level.id],
  );

  useEffect(() => {
    if (aiRows.length > 0) {
      setRows(aiRows);
      return;
    }

    const run = async () => {
      const sourceLocationId =
        location.id === "london" || location.id === "manchester" ? "dubai" : location.id;
      const targetLevels = LEVELS.filter((l) => l.category === "IC" || l.category === "Manager").slice(0, 6);
      const batchEntries = targetLevels.map((lvl) => ({
        roleId: role.id,
        locationId: sourceLocationId,
        levelId: lvl.id,
        industry: result.formData.industry,
        companySize: result.formData.companySize,
      }));
      const benchmarks = await getBenchmarksBatch(batchEntries);
      const nextRows = targetLevels
        .map((entry) => {
          const benchmark = benchmarks[makeBenchmarkLookupKey({
            roleId: role.id,
            locationId: sourceLocationId,
            levelId: entry.id,
            industry: result.formData.industry,
            companySize: result.formData.companySize,
          })];
          if (!benchmark) return null;
          const p85 = benchmark.percentiles.p75 + (benchmark.percentiles.p90 - benchmark.percentiles.p75) * 0.5;
          return {
            level: entry,
            p25: benchmark.percentiles.p25,
            p50: benchmark.percentiles.p50,
            p75: benchmark.percentiles.p75,
            p85,
            p90: benchmark.percentiles.p90,
            isSelected: entry.id === level.id,
          };
        })
        .filter(Boolean) as typeof rows;
      setRows(nextRows);
    };
    void run();
  }, [aiRows, level.id, location.id, result.formData.companySize, result.formData.industry, role.id]);

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

      {showBasic && <p className="text-xs text-brand-500 px-5 pt-2">Basic split unavailable for this workspace dataset.</p>}

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
            {rows.map((row) => (
              <tr key={row.level.id} className={row.isSelected ? "bench-row-highlight" : ""}>
                <td>
                  <span className={`font-medium ${row.isSelected ? "text-brand-900" : "text-brand-700"}`}>
                    {row.level.name}
                  </span>
                </td>
                <td className="text-right">{formatAED(convertValue(row.p25, "annual"))}</td>
                <td className="text-right font-medium">{formatAED(convertValue(row.p50, "annual"))}</td>
                <td className="text-right">{formatAED(convertValue(row.p75, "annual"))}</td>
                <td className="text-right">{formatAED(convertValue(row.p85, "annual"))}</td>
                <td className="text-right">{formatAED(convertValue(row.p90, "annual"))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 pb-5">
        <SharedAiCallout section={result.aiDetailBriefing?.views.levelTable} />
      </div>
    </div>
  );
}
