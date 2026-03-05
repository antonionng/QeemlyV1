"use client";

import { useEffect, useState } from "react";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { LEVELS } from "@/lib/dashboard/dummy-data";
import { useSalaryView } from "@/lib/salary-view-store";
import { getBenchmark } from "@/lib/benchmarks/data-service";

interface LevelTableViewProps {
  result: BenchmarkResult;
}

export function LevelTableView({ result }: LevelTableViewProps) {
  const { role, level, location } = result;
  const [showBasic, setShowBasic] = useState(false);
  const [rows, setRows] = useState<
    Array<{
      level: (typeof LEVELS)[number];
      p25: number;
      p50: number;
      p75: number;
      p85: number;
      p90: number;
      isSelected: boolean;
    }>
  >([]);
  const { salaryView } = useSalaryView();

  const convertValue = (value: number) =>
    salaryView === "annual"
      ? Math.round((value * 12) / 1000) * 1000
      : Math.round(value / 100) * 100;

  const formatAED = (value: number) => {
    if (value >= 1000) return `AED ${(value / 1000).toFixed(0)}k`;
    return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value);
  };

  useEffect(() => {
    const run = async () => {
      const sourceLocationId =
        location.id === "london" || location.id === "manchester" ? "dubai" : location.id;
      const targetLevels = LEVELS.filter((l) => l.category === "IC" || l.category === "Manager").slice(0, 6);
      const benchmarks = await Promise.all(
        targetLevels.map(async (lvl) => ({
          level: lvl,
          benchmark: await getBenchmark(role.id, sourceLocationId, lvl.id),
        })),
      );
      const nextRows = benchmarks
        .filter((entry) => entry.benchmark)
        .map((entry) => {
          const benchmark = entry.benchmark!;
          const p85 = benchmark.percentiles.p75 + (benchmark.percentiles.p90 - benchmark.percentiles.p75) * 0.5;
          return {
            level: entry.level,
            p25: benchmark.percentiles.p25,
            p50: benchmark.percentiles.p50,
            p75: benchmark.percentiles.p75,
            p85,
            p90: benchmark.percentiles.p90,
            isSelected: entry.level.id === level.id,
          };
        });
      setRows(nextRows);
    };
    void run();
  }, [level.id, location.id, role.id]);

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
                <td className="text-right">{formatAED(convertValue(row.p25))}</td>
                <td className="text-right font-medium">{formatAED(convertValue(row.p50))}</td>
                <td className="text-right">{formatAED(convertValue(row.p75))}</td>
                <td className="text-right">{formatAED(convertValue(row.p85))}</td>
                <td className="text-right">{formatAED(convertValue(row.p90))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
