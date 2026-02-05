"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { LEVELS, generateBenchmark, generateSalaryBreakdown } from "@/lib/dashboard/dummy-data";

interface LevelTableViewProps {
  result: BenchmarkResult;
}

export function LevelTableView({ result }: LevelTableViewProps) {
  const { role, level, location } = result;
  const [showBasic, setShowBasic] = useState(false);
  
  // Convert from monthly AED to annual AED
  const convertToAnnual = (value: number) => Math.round(value * 12 / 1000) * 1000;
  
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

  // Generate level comparison data with breakdown
  const levelData = LEVELS.filter(l => l.category === "IC" || l.category === "Manager").slice(0, 6).map(lvl => {
    const bench = generateBenchmark(role.id, location.id === "london" ? "dubai" : location.id, lvl.id);
    
    // Generate breakdowns for each percentile
    const p25Breakdown = generateSalaryBreakdown(bench.percentiles.p25, lvl.id);
    const p50Breakdown = generateSalaryBreakdown(bench.percentiles.p50, lvl.id);
    const p75Breakdown = generateSalaryBreakdown(bench.percentiles.p75, lvl.id);
    const p85Total = bench.percentiles.p75 * 1.08;
    const p85Breakdown = generateSalaryBreakdown(p85Total, lvl.id);
    const p90Breakdown = generateSalaryBreakdown(bench.percentiles.p90, lvl.id);
    
    return {
      level: lvl,
      // Total salary values
      p25Total: convertToAnnual(bench.percentiles.p25),
      p50Total: convertToAnnual(bench.percentiles.p50),
      p75Total: convertToAnnual(bench.percentiles.p75),
      p85Total: convertToAnnual(p85Total),
      p90Total: convertToAnnual(bench.percentiles.p90),
      // Basic salary values
      p25Basic: convertToAnnual(p25Breakdown.basic),
      p50Basic: convertToAnnual(p50Breakdown.basic),
      p75Basic: convertToAnnual(p75Breakdown.basic),
      p85Basic: convertToAnnual(p85Breakdown.basic),
      p90Basic: convertToAnnual(p90Breakdown.basic),
      // Basic percentage (for display)
      basicPercent: p50Breakdown.basicPercent,
      isSelected: lvl.id === level.id,
    };
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-900">Percentile by Level</h3>
        {/* Total/Basic Toggle */}
        <div className="flex items-center gap-1 p-1 bg-brand-50 rounded-lg">
          <button
            onClick={() => setShowBasic(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !showBasic
                ? "bg-white text-brand-900 shadow-sm"
                : "text-brand-600 hover:text-brand-800"
            }`}
          >
            Total Salary
          </button>
          <button
            onClick={() => setShowBasic(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              showBasic
                ? "bg-white text-brand-900 shadow-sm"
                : "text-brand-600 hover:text-brand-800"
            }`}
          >
            Basic Salary
          </button>
        </div>
      </div>
      
      {showBasic && (
        <p className="text-xs text-brand-500 mb-3">
          Showing basic salary component only (typically 50-65% of total). Used for end-of-service benefit calculations.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                Level
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                P25{showBasic && " (Basic)"}
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                P50{showBasic && " (Basic)"}
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                P75{showBasic && " (Basic)"}
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                P85{showBasic && " (Basic)"}
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                P90{showBasic && " (Basic)"}
              </th>
            </tr>
          </thead>
          <tbody>
            {levelData.map((row) => (
              <tr
                key={row.level.id}
                className={`border-b border-border/50 ${
                  row.isSelected ? "bg-brand-50" : "hover:bg-muted/50"
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${row.isSelected ? "text-brand-900" : "text-brand-700"}`}>
                      {row.level.name}
                    </span>
                    {row.isSelected && (
                      <Badge variant="brand" className="text-xs">
                        Selected
                      </Badge>
                    )}
                    {showBasic && (
                      <span className="text-[10px] text-brand-400">
                        {row.basicPercent}%
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-right py-3 px-4 text-sm text-brand-700">
                  {formatAED(showBasic ? row.p25Basic : row.p25Total)}
                </td>
                <td className="text-right py-3 px-4 text-sm font-medium text-brand-900">
                  {formatAED(showBasic ? row.p50Basic : row.p50Total)}
                </td>
                <td className="text-right py-3 px-4 text-sm text-brand-700">
                  {formatAED(showBasic ? row.p75Basic : row.p75Total)}
                </td>
                <td className="text-right py-3 px-4 text-sm text-brand-700">
                  {formatAED(showBasic ? row.p85Basic : row.p85Total)}
                </td>
                <td className="text-right py-3 px-4 text-sm text-brand-700">
                  {formatAED(showBasic ? row.p90Basic : row.p90Total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
