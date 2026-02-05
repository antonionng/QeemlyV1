"use client";

import { useState } from "react";
import { ArrowLeft, Download, Bookmark, ArrowRight, Sparkles, CheckCircle, AlertCircle, Info, SlidersHorizontal, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBenchmarkState, type BenchmarkResult } from "@/lib/benchmarks/benchmark-state";
import { useCompanySettings, getCompanyInitials } from "@/lib/company";
import { useCurrencyFormatter, convertCurrency, monthlyToAnnual, roundToThousand } from "@/lib/utils/currency";
import { generateSalaryBreakdown } from "@/lib/dashboard/dummy-data";
import { FilterSidebar } from "./filter-sidebar";

interface BenchmarkResultsProps {
  result: BenchmarkResult;
}

export function BenchmarkResults({ result }: BenchmarkResultsProps) {
  const { goToStep, clearResult, saveCurrentFilter } = useBenchmarkState();
  const companySettings = useCompanySettings();
  const currency = useCurrencyFormatter();
  const [showFilters, setShowFilters] = useState(true);
  
  const { benchmark, role, level, location, formData, isOverridden } = result;
  const targetPercentile = formData.targetPercentile || companySettings.targetPercentile;
  
  // Convert from source currency (AED monthly) to company default currency (annual)
  const sourceCurrency = benchmark.currency || "AED";
  const convertAndRound = (monthlyValue: number) => {
    const annualValue = monthlyToAnnual(monthlyValue);
    const convertedValue = convertCurrency(annualValue, sourceCurrency, currency.defaultCurrency);
    return roundToThousand(convertedValue);
  };
  
  const percentiles = {
    p10: convertAndRound(benchmark.percentiles.p10),
    p25: convertAndRound(benchmark.percentiles.p25),
    p50: convertAndRound(benchmark.percentiles.p50),
    p75: convertAndRound(benchmark.percentiles.p75),
    p90: convertAndRound(benchmark.percentiles.p90),
  };
  
  // Get target value based on percentile
  const targetValue = percentiles[`p${targetPercentile}` as keyof typeof percentiles];
  
  // Calculate position as percentage for the chart
  const minVal = percentiles.p10;
  const maxVal = percentiles.p90;
  const range = maxVal - minVal;
  
  const getPosition = (value: number) => {
    return Math.max(0, Math.min(100, ((value - minVal) / range) * 100));
  };
  
  // Use company currency for formatting
  const formatValue = (value: number) => currency.format(value);
  
  // Company branding
  const hasCompanyLogo = !!companySettings.companyLogo;
  const companyInitials = getCompanyInitials(companySettings.companyName);
  
  // Generate insights based on context
  const getInsights = () => {
    const insights: { type: "success" | "warning" | "info"; message: string }[] = [];
    
    if (formData.context === "existing" && formData.currentSalaryHigh) {
      const currentSalary = (formData.currentSalaryLow! + formData.currentSalaryHigh) / 2;
      const diff = ((currentSalary - percentiles.p50) / percentiles.p50) * 100;
      
      if (diff > 10) {
        insights.push({ type: "warning", message: `Current salary is ${Math.abs(diff).toFixed(0)}% above market median` });
      } else if (diff < -10) {
        insights.push({ type: "warning", message: `Current salary is ${Math.abs(diff).toFixed(0)}% below market median` });
      } else {
        insights.push({ type: "success", message: "Current salary is aligned with market" });
      }
    } else if (formData.context === "new-hire") {
      insights.push({ type: "info", message: `Target offer at ${targetPercentile}th percentile: ${formatValue(targetValue)}` });
    }
    
    // Band position insight
    if (targetPercentile === 75) {
      insights.push({ type: "success", message: "Targeting above market to attract top talent" });
    } else if (targetPercentile === 50) {
      insights.push({ type: "info", message: "Targeting market median for competitive positioning" });
    }
    
    // Confidence insight
    if (benchmark.confidence === "High") {
      insights.push({ type: "success", message: `High confidence data (${benchmark.sampleSize} data points)` });
    } else if (benchmark.confidence === "Low") {
      insights.push({ type: "warning", message: "Limited data available - use with caution" });
    }
    
    return insights;
  };
  
  const insights = getInsights();

  return (
    <div className="flex gap-6">
      {/* Filter Sidebar */}
      {showFilters && <FilterSidebar />}

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={clearResult}
              className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to form
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-xs font-medium text-brand-700 hover:bg-brand-100"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {showFilters ? "Hide" : "Show"} Filters
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-brand-900">{role.title}</span>
            <span className="text-sm text-brand-500">•</span>
            <span className="text-sm text-brand-600">{level.name}</span>
            <span className="text-sm text-brand-500">•</span>
            <span className="text-sm text-brand-600">{location.city}, {location.country}</span>
          </div>
        </div>

        {/* Company Branding Header */}
        {companySettings.isConfigured && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              {hasCompanyLogo ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-border overflow-hidden">
                  <img 
                    src={companySettings.companyLogo!} 
                    alt={companySettings.companyName}
                    className="h-full w-full object-contain p-1"
                  />
                </div>
              ) : (
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: companySettings.primaryColor }}
                >
                  {companyInitials}
                </div>
              )}
              <div className="flex-1">
                <div className="text-sm font-semibold text-brand-900">
                  Benchmark for {companySettings.companyName}
                </div>
                <div className="text-xs text-brand-500">
                  {companySettings.industry} • {companySettings.companySize} employees • {companySettings.fundingStage}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {currency.defaultCurrency}
              </Badge>
            </div>
          </Card>
        )}

        {/* Override indicator */}
        {isOverridden && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <Info className="h-3.5 w-3.5" />
            <span>Using custom settings for this search</span>
            <button 
              onClick={clearResult}
              className="ml-auto text-amber-700 hover:text-amber-900 font-medium"
            >
              Reset
            </button>
          </div>
        )}

        {/* Target Percentile Display */}
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="text-sm font-medium text-brand-600 mb-1">Your Target</div>
            <div className="text-2xl font-bold text-brand-900">
              {targetPercentile}th Percentile
            </div>
            <div className="text-3xl font-bold text-brand-500 mt-2">
              {formatValue(targetValue)}
            </div>
          </div>

          {/* Percentile Chart */}
          <div className="relative pt-8 pb-4">
            {/* Background track */}
            <div className="h-3 bg-gradient-to-r from-brand-100 via-brand-200 to-brand-300 rounded-full" />
            
            {/* Percentile markers */}
            <div className="absolute top-0 left-0 right-0 flex justify-between px-2">
              {[
                { label: "P25", value: percentiles.p25, position: getPosition(percentiles.p25) },
                { label: "P50", value: percentiles.p50, position: getPosition(percentiles.p50) },
                { label: "P75", value: percentiles.p75, position: getPosition(percentiles.p75) },
              ].map((marker) => (
                <div
                  key={marker.label}
                  className="flex flex-col items-center"
                  style={{ position: "absolute", left: `${marker.position}%`, transform: "translateX(-50%)" }}
                >
                  <div className={`text-xs font-semibold ${
                    marker.label === `P${targetPercentile}` ? "text-brand-600" : "text-brand-400"
                  }`}>
                    {marker.label}
                    {marker.label === `P${targetPercentile}` && (
                      <span className="ml-1 text-brand-500">◀</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Target indicator */}
            <div
              className="absolute top-6 w-4 h-4 bg-brand-500 rounded-full border-2 border-white shadow-lg"
              style={{ left: `${getPosition(targetValue)}%`, transform: "translateX(-50%)" }}
            />
            
            {/* Value labels */}
            <div className="flex justify-between mt-4 text-xs text-brand-600">
              <span>{formatValue(percentiles.p25)}</span>
              <span>{formatValue(percentiles.p50)}</span>
              <span>{formatValue(percentiles.p75)}</span>
            </div>
          </div>
        </Card>

        {/* Insights */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-brand-900 mb-4">Summary</h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                  insight.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : insight.type === "warning"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {insight.type === "success" ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : insight.type === "warning" ? (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Info className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="text-sm font-medium">{insight.message}</span>
              </div>
            ))}
          </div>
          
          {/* Data quality indicator */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-brand-500">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Estimated</span>
              <span className="text-brand-300">•</span>
              <span>{benchmark.sampleSize} data points</span>
              <span className="text-brand-300">•</span>
              <span>{benchmark.confidence} confidence</span>
            </div>
          </div>
        </Card>

        {/* Quick Reference Table */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-brand-900 mb-4">Quick Reference</h3>
          
          {/* Total Salary Row */}
          <div className="mb-2">
            <div className="text-xs font-medium text-brand-600 mb-2">Total Salary</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "P25", value: percentiles.p25 },
                { label: "P50", value: percentiles.p50 },
                { label: "P75", value: percentiles.p75 },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`text-center p-4 rounded-xl ${
                    item.label === `P${targetPercentile}`
                      ? "bg-brand-500 text-white"
                      : "bg-brand-50"
                  }`}
                >
                  <div className={`text-xs font-medium ${
                    item.label === `P${targetPercentile}` ? "text-brand-100" : "text-brand-500"
                  }`}>
                    {item.label}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${
                    item.label === `P${targetPercentile}` ? "text-white" : "text-brand-900"
                  }`}>
                    {formatValue(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Basic Salary Row - UAE Breakdown */}
          {(() => {
            // Generate basic salary breakdowns for each percentile
            const p25Breakdown = generateSalaryBreakdown(benchmark.percentiles.p25, level.id);
            const p50Breakdown = generateSalaryBreakdown(benchmark.percentiles.p50, level.id);
            const p75Breakdown = generateSalaryBreakdown(benchmark.percentiles.p75, level.id);
            
            const basicPercentiles = {
              p25: convertAndRound(p25Breakdown.basic),
              p50: convertAndRound(p50Breakdown.basic),
              p75: convertAndRound(p75Breakdown.basic),
            };
            
            return (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-medium text-brand-600">Basic Salary</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                    ~{p50Breakdown.basicPercent}% of total
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "P25", value: basicPercentiles.p25 },
                    { label: "P50", value: basicPercentiles.p50 },
                    { label: "P75", value: basicPercentiles.p75 },
                  ].map((item) => (
                    <div
                      key={`basic-${item.label}`}
                      className={`text-center p-3 rounded-xl ${
                        item.label === `P${targetPercentile}`
                          ? "bg-blue-100 border border-blue-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className={`text-xs font-medium ${
                        item.label === `P${targetPercentile}` ? "text-blue-600" : "text-brand-400"
                      }`}>
                        {item.label}
                      </div>
                      <div className={`text-base font-semibold mt-1 ${
                        item.label === `P${targetPercentile}` ? "text-blue-700" : "text-brand-700"
                      }`}>
                        {formatValue(item.value)}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-brand-400 mt-2">
                  Basic salary is used for end-of-service benefit calculations in UAE
                </p>
              </div>
            );
          })()}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => saveCurrentFilter()}>
              <Bookmark className="mr-2 h-4 w-4" />
              Save Filter
            </Button>
            <Button variant="ghost">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          <Button onClick={() => goToStep("detail")}>
            View Detailed
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
