"use client";

import { useState } from "react";
import { Sparkles, Wallet, Home, Car, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { generateSalaryBreakdown, getMarketBreakdownAverages, LEVELS } from "@/lib/dashboard/dummy-data";

interface SalaryBreakdownViewProps {
  result: BenchmarkResult;
}

type PercentileKey = "p25" | "p50" | "p75" | "p90";

export function SalaryBreakdownView({ result }: SalaryBreakdownViewProps) {
  const { role, level, location, benchmark } = result;
  const [selectedPercentile, setSelectedPercentile] = useState<PercentileKey>("p50");
  
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

  // Get the salary for the selected percentile
  const getPercentileValue = (key: PercentileKey): number => {
    switch (key) {
      case "p25": return benchmark.percentiles.p25;
      case "p50": return benchmark.percentiles.p50;
      case "p75": return benchmark.percentiles.p75;
      case "p90": return benchmark.percentiles.p90;
    }
  };

  const totalMonthly = getPercentileValue(selectedPercentile);
  const breakdown = generateSalaryBreakdown(totalMonthly, level.id);
  const marketAverages = getMarketBreakdownAverages(level.id);

  // Convert breakdown values to annual AED
  const breakdownData = [
    { 
      name: "Basic Salary", 
      value: convertToAnnual(breakdown.basic), 
      percent: breakdown.basicPercent,
      icon: Wallet,
      color: "bg-brand-500",
      lightColor: "bg-brand-100 text-brand-700",
      range: marketAverages.basicRange,
    },
    { 
      name: "Housing", 
      value: convertToAnnual(breakdown.housing), 
      percent: breakdown.housingPercent,
      icon: Home,
      color: "bg-blue-500",
      lightColor: "bg-blue-100 text-blue-700",
      range: marketAverages.housingRange,
    },
    { 
      name: "Transport", 
      value: convertToAnnual(breakdown.transport), 
      percent: breakdown.transportPercent,
      icon: Car,
      color: "bg-amber-500",
      lightColor: "bg-amber-100 text-amber-700",
      range: marketAverages.transportRange,
    },
    { 
      name: "Other Allowances", 
      value: convertToAnnual(breakdown.other), 
      percent: breakdown.otherPercent,
      icon: MoreHorizontal,
      color: "bg-gray-400",
      lightColor: "bg-gray-100 text-gray-700",
      range: marketAverages.otherRange,
    },
  ];

  const totalAnnual = convertToAnnual(breakdown.total);
  const levelIndex = LEVELS.findIndex(l => l.id === level.id);

  // Percentile options for the selector
  const percentileOptions: { key: PercentileKey; label: string }[] = [
    { key: "p25", label: "P25" },
    { key: "p50", label: "P50" },
    { key: "p75", label: "P75" },
    { key: "p90", label: "P90" },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-brand-900">UAE Salary Breakdown</h3>
        </div>
        {/* Percentile Selector */}
        <div className="flex items-center gap-1 p-1 bg-brand-50 rounded-lg">
          {percentileOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedPercentile(option.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedPercentile === option.key
                  ? "bg-white text-brand-900 shadow-sm"
                  : "text-brand-600 hover:text-brand-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <p className="text-xs text-brand-500 mb-4">
        Typical breakdown for {level.name} at {selectedPercentile.toUpperCase()} in {location.city}
      </p>

      {/* Horizontal stacked bar */}
      <div className="h-8 rounded-full overflow-hidden flex mb-4">
        {breakdownData.map((item) => (
          <div
            key={item.name}
            className={`h-full ${item.color} transition-all`}
            style={{ width: `${item.percent}%` }}
            title={`${item.name}: ${formatAED(item.value)} (${item.percent}%)`}
          />
        ))}
      </div>

      {/* Legend and values */}
      <div className="space-y-3">
        {breakdownData.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-medium text-brand-700">{item.name}</span>
                  <div className="text-[10px] text-brand-400">
                    Market range: {item.range.min}-{item.range.max}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.lightColor}`}>
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
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-900">Total Annual Salary</span>
        <span className="text-lg font-bold text-brand-900">{formatAED(totalAnnual)}</span>
      </div>

      {/* AI Guidance Panel */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-brand-100">
            <Sparkles className="h-4 w-4 text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-brand-800 mb-1">AI Market Insight</p>
            <p className="text-xs text-brand-600 leading-relaxed">
              At {selectedPercentile.toUpperCase()} for {role.title} ({level.name}) in {location.city}, 
              the typical breakdown is: <strong>{breakdown.basicPercent}% Basic</strong> / {breakdown.housingPercent}% Housing / {breakdown.transportPercent}% Transport / {breakdown.otherPercent}% Other.
              {levelIndex >= 4 && (
                <> Senior roles like {level.name} typically have higher basic percentages (up to 65%) to maximize end-of-service benefits.</>
              )}
              {levelIndex < 4 && (
                <> Junior and mid-level roles typically see 50-60% basic, with more allocation to allowances.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* End of Service Note */}
      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
        <div className="flex items-start gap-2">
          <div className="w-1 h-full bg-amber-400 rounded-full" />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-0.5">End-of-Service Benefits</p>
            <p className="text-[11px] text-amber-700">
              UAE end-of-service gratuity is calculated on <strong>basic salary only</strong>. 
              At {breakdown.basicPercent}% basic, the annual basic is {formatAED(convertToAnnual(breakdown.basic))}.
              Companies typically aim for 50-65% basic to balance competitive offers with exit costs.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
