"use client";

import { useState } from "react";
import { Wallet, Home, Building2, Car, PiggyBank } from "lucide-react";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import {
  annualizeBenchmarkValue,
  applyBenchmarkViewMode,
  resolveBenchmarkPayPeriod,
} from "@/lib/benchmarks/pay-period";
import { useSalaryView } from "@/lib/salary-view-store";
import { ModuleStateBanner } from "../module-state-banner";
import { SharedAiCallout } from "../shared-ai-callout";

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
  const { level, location, benchmark } = result;
  const [selectedPercentile, setSelectedPercentile] = useState<PercentileKey>("p50");
  const { salaryView } = useSalaryView();
  const benchmarkPayPeriod = resolveBenchmarkPayPeriod(
    benchmark.payPeriod ?? benchmark.sourcePayPeriod,
    benchmark.percentiles,
  );

  const mod = result.detailSurface?.modules.salaryBreakdown;
  const isLoading = !mod || result.detailSurfaceStatus === "loading";
  const breakdown = mod?.data.breakdown;

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

  const getPercentileValue = (key: PercentileKey): number => benchmark.percentiles[key];
  const totalMonthly = getPercentileValue(selectedPercentile);
  const totalValue = convertValue(totalMonthly);

  const employerContribMonthly =
    (benchmark.nationalsCostBreakdown?.gpssaAmount || 0) + (benchmark.nationalsCostBreakdown?.nafisAmount || 0);
  const hasEmployerBreakdown = employerContribMonthly > 0;
  const totalWithContrib = totalMonthly + employerContribMonthly;
  const basePercent = hasEmployerBreakdown ? Math.round((totalMonthly / totalWithContrib) * 100) : 100;
  const contribPercent = 100 - basePercent;

  const hasAiBreakdown = breakdown && mod?.status === "ready" && breakdown.basicSalaryPct > 0;

  const breakdownData = hasAiBreakdown
    ? [
        {
          name: "Basic Salary",
          value: Math.round((totalValue * breakdown.basicSalaryPct) / 100),
          percent: breakdown.basicSalaryPct,
          icon: Wallet,
          ...COLORS[0],
          range: null as { min: number; max: number } | null,
        },
        {
          name: "Housing",
          value: Math.round((totalValue * breakdown.housingPct) / 100),
          percent: breakdown.housingPct,
          icon: Building2,
          ...COLORS[1],
          range: null as { min: number; max: number } | null,
        },
        {
          name: "Transport",
          value: Math.round((totalValue * breakdown.transportPct) / 100),
          percent: breakdown.transportPct,
          icon: Car,
          ...COLORS[2],
          range: null as { min: number; max: number } | null,
        },
        {
          name: "Other Allowances",
          value:
            totalValue
            - Math.round((totalValue * breakdown.basicSalaryPct) / 100)
            - Math.round((totalValue * breakdown.housingPct) / 100)
            - Math.round((totalValue * breakdown.transportPct) / 100),
          percent: breakdown.otherAllowancesPct,
          icon: PiggyBank,
          ...COLORS[3],
          range: null as { min: number; max: number } | null,
        },
      ]
    : [
        {
          name: "Cash Compensation",
          value: totalValue,
          percent: basePercent,
          icon: Wallet,
          ...COLORS[0],
          range: null as { min: number; max: number } | null,
        },
        ...(hasEmployerBreakdown
          ? [
              {
                name: "Employer Contributions",
                value: convertValue(employerContribMonthly, "annual"),
                percent: contribPercent,
                icon: Home,
                ...COLORS[1],
                range: null as { min: number; max: number } | null,
              },
            ]
          : []),
      ];

  const totalDisplay = breakdownData.reduce((sum, item) => sum + item.value, 0);

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

      {isLoading ? (
        <ModuleStateBanner
          variant="loading"
          message="Qeemly AI is preparing package split guidance for this module."
          className="mb-4 text-xs"
        />
      ) : null}
      {mod?.status === "empty" && !isLoading ? (
        <ModuleStateBanner
          variant="info"
          message={mod.message ?? "AI package split is unavailable. Showing benchmark-based compensation mix."}
          className="mb-4 text-xs"
        />
      ) : null}

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
                    {item.name === "Housing" ? "Accommodation allowance (shown as Housing)." : null}
                    {item.name === "Transport" ? "Transport allowance component." : null}
                    {item.name !== "Housing" && item.name !== "Transport"
                      ? hasAiBreakdown
                        ? "AI-derived package split for the selected percentile"
                        : "Live data from selected benchmark row"
                      : null}
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

      <div className="pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-900">
          Total {salaryView === "annual" ? "Annual" : "Monthly"} Salary
        </span>
        <span className="text-lg font-bold text-brand-900">{formatAED(totalDisplay)}</span>
      </div>

      <SharedAiCallout section={mod?.narrative} />
    </div>
  );
}
