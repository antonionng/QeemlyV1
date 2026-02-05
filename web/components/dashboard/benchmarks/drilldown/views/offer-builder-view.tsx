"use client";

import { useState } from "react";
import clsx from "clsx";
import { Sparkles, Target, Calculator, Wallet, Home, Car, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings, getCompanyInitials } from "@/lib/company";
import { useCurrencyFormatter, convertCurrency, monthlyToAnnual, roundToThousand } from "@/lib/utils/currency";
import { getMarketBreakdownAverages } from "@/lib/dashboard/dummy-data";

interface OfferBuilderViewProps {
  result: BenchmarkResult;
}

const PERCENTILE_LABELS: Record<number, string> = {
  25: "Entry-level",
  50: "Market median",
  75: "Competitive",
  90: "Premium",
};

const PERCENTILE_DESCRIPTIONS: Record<number, string> = {
  25: "Suitable for entry-level or budget-constrained hiring",
  50: "Matches market expectations for typical candidates",
  75: "Attracts experienced candidates and reduces time-to-fill",
  90: "Secures top talent in competitive markets",
};

export function OfferBuilderView({ result }: OfferBuilderViewProps) {
  const { benchmark, role, level } = result;
  const companySettings = useCompanySettings();
  const currency = useCurrencyFormatter();
  const [offerTarget, setOfferTarget] = useState<number>(companySettings.targetPercentile);
  
  // Get market averages for the level
  const marketAverages = getMarketBreakdownAverages(level.id);
  const [basicPercent, setBasicPercent] = useState<number>(marketAverages.basicRange.typical);
  
  // Company branding
  const hasCompanyLogo = !!companySettings.companyLogo;
  const companyInitials = getCompanyInitials(companySettings.companyName);
  
  // Convert from monthly AED to company's default currency (annual)
  const convertToDefault = (value: number) => {
    const annualValue = monthlyToAnnual(value);
    return roundToThousand(convertCurrency(annualValue, "AED", currency.defaultCurrency));
  };
  
  const formatValue = (value: number) => currency.format(value);

  // Calculate offer value based on percentile
  const getOfferValue = (percentile: number): number => {
    const p25 = benchmark.percentiles.p25;
    const p50 = benchmark.percentiles.p50;
    const p75 = benchmark.percentiles.p75;
    const p90 = benchmark.percentiles.p90;
    
    // Linear interpolation
    if (percentile <= 25) return p25;
    if (percentile <= 50) return p25 + ((p50 - p25) * (percentile - 25) / 25);
    if (percentile <= 75) return p50 + ((p75 - p50) * (percentile - 50) / 25);
    if (percentile <= 90) return p75 + ((p90 - p75) * (percentile - 75) / 15);
    return p90;
  };

  const offerValue = convertToDefault(getOfferValue(offerTarget));
  const negotiationBuffer = 0.04; // 4%
  const offerRange = {
    low: Math.round(offerValue * (1 - negotiationBuffer)),
    high: Math.round(offerValue * (1 + negotiationBuffer)),
  };

  // Map slider value to nearest percentile label
  const displayPercentile = offerTarget >= 90 ? 90 : offerTarget >= 75 ? 75 : offerTarget >= 50 ? 50 : 25;

  return (
    <Card className="p-6">
      {/* Header with company branding */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-brand-900">Offer Builder</h3>
        </div>
        <div className="flex items-center gap-2">
          {companySettings.isConfigured && (
            hasCompanyLogo ? (
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
            )
          )}
          <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">
            P{displayPercentile}
          </span>
        </div>
      </div>

      <p className="text-xs text-brand-500 mb-4">
        {role.title} - {level.name} • {companySettings.companyName}
      </p>

      {/* Slider */}
      <div className="rounded-xl bg-brand-50 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-brand-600">Target Percentile</span>
          <span className="text-xs font-semibold text-brand-700">
            {PERCENTILE_LABELS[displayPercentile]}
          </span>
        </div>
        <input
          type="range"
          min={25}
          max={90}
          step={1}
          value={offerTarget}
          onChange={(e) => setOfferTarget(Number(e.target.value))}
          className="mt-2 w-full accent-brand-500"
        />
        <div className="mt-1 flex justify-between text-[10px] text-brand-400">
          <span>P25</span>
          <span>P50</span>
          <span>P75</span>
          <span>P90</span>
        </div>
      </div>

      {/* Offer value */}
      <div className="rounded-xl bg-white p-4 ring-1 ring-brand-200 mb-4">
        <p className="text-xs font-medium text-brand-600">Recommended Offer</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-brand-900">
            {formatValue(offerValue)}
          </span>
          <span className="text-sm text-brand-500">/year</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-brand-500">Negotiation range:</span>
          <span className="text-xs font-semibold text-brand-700">
            {formatValue(offerRange.low)} – {formatValue(offerRange.high)}
          </span>
        </div>
      </div>

      {/* Guidance */}
      <div
        className={clsx(
          "flex items-start gap-3 rounded-xl p-3 mb-4",
          displayPercentile >= 75 ? "bg-emerald-50" : displayPercentile >= 50 ? "bg-amber-50" : "bg-rose-50"
        )}
      >
        <Sparkles
          className={clsx(
            "mt-0.5 h-4 w-4 shrink-0",
            displayPercentile >= 75 ? "text-emerald-600" : displayPercentile >= 50 ? "text-amber-600" : "text-rose-600"
          )}
        />
        <div>
          <p
            className={clsx(
              "text-xs font-semibold",
              displayPercentile >= 75 ? "text-emerald-800" : displayPercentile >= 50 ? "text-amber-800" : "text-rose-800"
            )}
          >
            {PERCENTILE_LABELS[displayPercentile]}
          </p>
          <p
            className={clsx(
              "mt-0.5 text-xs",
              displayPercentile >= 75 ? "text-emerald-700" : displayPercentile >= 50 ? "text-amber-700" : "text-rose-700"
            )}
          >
            {PERCENTILE_DESCRIPTIONS[displayPercentile]}
          </p>
        </div>
      </div>

      {/* Percentile quick select */}
      <div className="grid grid-cols-4 gap-1 mb-6">
        {[25, 50, 75, 90].map((p) => (
          <button
            key={p}
            onClick={() => setOfferTarget(p)}
            className={clsx(
              "rounded-lg py-2 text-xs font-semibold transition-colors",
              displayPercentile === p
                ? "bg-brand-500 text-white"
                : "bg-brand-50 text-brand-700 hover:bg-brand-100"
            )}
          >
            P{p}
          </button>
        ))}
      </div>

      {/* UAE Salary Breakdown Preview */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-brand-900">Salary Breakdown Preview</h4>
        </div>
        
        {/* Basic % Slider */}
        <div className="rounded-xl bg-blue-50 p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-700">Basic Salary Percentage</span>
            <span className="text-xs font-bold text-blue-800">{basicPercent}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={65}
            step={1}
            value={basicPercent}
            onChange={(e) => setBasicPercent(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-blue-400">
            <span>50% (Lower exit costs)</span>
            <span>65% (Higher EOS)</span>
          </div>
        </div>

        {/* Breakdown Calculation */}
        {(() => {
          // Calculate breakdown based on basic percentage
          const remainingPercent = 100 - basicPercent;
          // Distribute remaining: ~60% housing, ~25% transport, ~15% other
          const housingPercent = Math.round(remainingPercent * 0.6);
          const transportPercent = Math.round(remainingPercent * 0.25);
          const otherPercent = remainingPercent - housingPercent - transportPercent;
          
          const basicAmount = Math.round(offerValue * basicPercent / 100);
          const housingAmount = Math.round(offerValue * housingPercent / 100);
          const transportAmount = Math.round(offerValue * transportPercent / 100);
          const otherAmount = offerValue - basicAmount - housingAmount - transportAmount;
          
          const breakdownItems = [
            { name: "Basic", icon: Wallet, percent: basicPercent, amount: basicAmount, color: "bg-brand-500", textColor: "text-brand-700" },
            { name: "Housing", icon: Home, percent: housingPercent, amount: housingAmount, color: "bg-blue-500", textColor: "text-blue-700" },
            { name: "Transport", icon: Car, percent: transportPercent, amount: transportAmount, color: "bg-amber-500", textColor: "text-amber-700" },
            { name: "Other", icon: MoreHorizontal, percent: otherPercent, amount: otherAmount, color: "bg-gray-400", textColor: "text-gray-700" },
          ];
          
          return (
            <>
              {/* Stacked bar */}
              <div className="h-6 rounded-full overflow-hidden flex mb-3">
                {breakdownItems.map((item) => (
                  <div
                    key={item.name}
                    className={`h-full ${item.color} transition-all`}
                    style={{ width: `${item.percent}%` }}
                    title={`${item.name}: ${formatValue(item.amount)}`}
                  />
                ))}
              </div>
              
              {/* Breakdown table */}
              <div className="space-y-2">
                {breakdownItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded ${item.color} flex items-center justify-center`}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        <span className={`font-medium ${item.textColor}`}>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-brand-400">{item.percent}%</span>
                        <span className="font-semibold text-brand-900 w-20 text-right">
                          {formatValue(item.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* EOS Note */}
              <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-[10px] text-amber-700">
                  <strong>End-of-Service:</strong> Based on {formatValue(basicAmount)} annual basic 
                  ({formatValue(Math.round(basicAmount / 12))} monthly)
                </p>
              </div>
            </>
          );
        })()}
      </div>
    </Card>
  );
}
