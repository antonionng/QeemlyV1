"use client";

import { useState } from "react";
import { Sparkles, Wallet, Home } from "lucide-react";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useSalaryView } from "@/lib/salary-view-store";

interface SalaryBreakdownViewProps {
  result: BenchmarkResult;
}

type PercentileKey = "p25" | "p50" | "p75" | "p90";

const COLORS = [
  { bg: "bg-brand-500", light: "bg-brand-100 text-brand-700" },
  { bg: "bg-teal-400", light: "bg-teal-100 text-teal-700" },
  { bg: "bg-amber-400", light: "bg-amber-100 text-amber-700" },
  { bg: "bg-gray-400", light: "bg-gray-100 text-gray-700" },
];

export function SalaryBreakdownView({ result }: SalaryBreakdownViewProps) {
  const { role, level, location, benchmark } = result;
  const [selectedPercentile, setSelectedPercentile] = useState<PercentileKey>("p50");
  const { salaryView } = useSalaryView();

  const convertValue = (value: number) =>
    salaryView === "annual"
      ? Math.round((value * 12) / 1000) * 1000
      : Math.round(value / 100) * 100;

  const formatAED = (value: number) => {
    if (value >= 1000) return `AED ${(value / 1000).toFixed(0)}k`;
    return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value);
  };

  const getPercentileValue = (key: PercentileKey): number => benchmark.percentiles[key];

  const totalMonthly = getPercentileValue(selectedPercentile);
  const employerContribMonthly =
    (benchmark.nationalsCostBreakdown?.gpssaAmount || 0) + (benchmark.nationalsCostBreakdown?.nafisAmount || 0);
  const hasBreakdown = employerContribMonthly > 0;
  const totalWithContrib = totalMonthly + employerContribMonthly;
  const basePercent = hasBreakdown ? Math.round((totalMonthly / totalWithContrib) * 100) : 100;
  const contribPercent = 100 - basePercent;

  const breakdownData = [
    {
      name: "Cash Compensation",
      value: convertValue(totalMonthly),
      percent: basePercent,
      icon: Wallet,
      ...COLORS[0],
      range: null as { min: number; max: number } | null,
    },
    ...(hasBreakdown
      ? [
          {
            name: "Employer Contributions",
            value: convertValue(employerContribMonthly),
            percent: contribPercent,
            icon: Home,
            ...COLORS[1],
            range: null as { min: number; max: number } | null,
          },
        ]
      : []),
  ];

  const totalDisplay = convertValue(totalWithContrib);

  const percentileOptions: { key: PercentileKey; label: string }[] = [
    { key: "p25", label: "P25" },
    { key: "p50", label: "P50" },
    { key: "p75", label: "P75" },
    { key: "p90", label: "P90" },
  ];

  return (
    <div className="bench-section">
      <div className="flex items-center justify-between pb-4">
        <h3 className="bench-section-header pb-0">Salary Breakdown</h3>
        <div className="bench-toggle text-xs">
          {percentileOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              data-active={selectedPercentile === opt.key}
              onClick={() => setSelectedPercentile(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-brand-500 mb-4">
        Typical breakdown for {level.name} at {selectedPercentile.toUpperCase()} in {location.city}
      </p>

      {/* Stacked bar */}
      <div className="h-7 rounded-full overflow-hidden flex mb-5">
        {breakdownData.map((item) => (
          <div
            key={item.name}
            className={`h-full ${item.bg} transition-all`}
            style={{ width: `${item.percent}%` }}
            title={`${item.name}: ${formatAED(item.value)} (${item.percent}%)`}
          />
        ))}
      </div>

      {/* Legend rows */}
      <div className="space-y-3 mb-4">
        {breakdownData.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <span className="text-sm font-medium text-brand-700">{item.name}</span>
                  <div className="text-[10px] text-brand-400">
                    {item.range ? `Market range: ${item.range.min}–${item.range.max}%` : "Live data from selected benchmark row"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.light}`}>
                  {item.percent}%
                </span>
                <span className="text-sm font-bold text-brand-900 w-20 text-right">
                  {formatAED(item.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-900">
          Total {salaryView === "annual" ? "Annual" : "Monthly"} Salary
        </span>
        <span className="text-lg font-bold text-brand-900">{formatAED(totalDisplay)}</span>
      </div>

      {/* AI Insight */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-brand-100">
            <Sparkles className="h-4 w-4 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-brand-800 mb-1">AI Market Insight</p>
            <p className="text-xs text-brand-600 leading-relaxed">
              At {selectedPercentile.toUpperCase()} for {role.title} ({level.name}) in {location.city}, compensation is shown from real benchmark rows.
              {hasBreakdown
                ? ` Employer contribution overlays are included (${benchmark.nationalsCostBreakdown?.gpssaPct || 0}% GPSSA and ${benchmark.nationalsCostBreakdown?.nafisPct || 0}% NAFIS where applicable).`
                : " Detailed component-level split is not available in this workspace yet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
