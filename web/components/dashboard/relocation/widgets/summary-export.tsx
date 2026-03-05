"use client";

import { useState } from "react";
import { Check, Download, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RelocationResult, formatCurrency, CompApproach } from "@/lib/relocation/calculator";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";

interface SummaryExportWidgetProps {
  result: RelocationResult | null;
  compApproach: CompApproach;
  hybridCap?: number;
}

const APPROACH_LABELS: Record<CompApproach, string> = {
  local: "Local Market Pay",
  "purchasing-power": "Purchasing Power",
  hybrid: "Hybrid Approach",
};

export function SummaryExportWidget({
  result,
  compApproach,
  hybridCap,
}: SummaryExportWidgetProps) {
  const [copied, setCopied] = useState(false);
  const { salaryView } = useSalaryView();

  const handleCopyLink = async () => {
    if (!result) return;
    const params = new URLSearchParams({
      home: result.homeCity.id,
      target: result.targetCity.id,
      salary: result.baseSalary.toString(),
      approach: compApproach,
      ...(hybridCap && { cap: hybridCap.toString() }),
    });
    const url = `${window.location.origin}/dashboard/relocation?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  if (!result) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-accent-400">Complete inputs to generate summary</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-1">
      {/* Summary card */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{result.homeCity.flag}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
              {result.homeCity.name}
            </span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-xl">{result.targetCity.flag}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
              {result.targetCity.name}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-accent-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">Base Salary</p>
            <p className="text-base font-semibold text-brand-900">
              {formatCurrency(applyViewMode(result.baseSalary, salaryView))}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-brand-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">Recommended</p>
            <p className="text-base font-semibold leading-tight text-brand-900">
              {formatCurrency(applyViewMode(result.recommendedRange.min, salaryView))}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-accent-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">Approach</p>
            <p className="truncate text-xs font-semibold text-brand-900">
              {APPROACH_LABELS[compApproach]}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-accent-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">CoL Ratio</p>
            <p className="text-base font-semibold text-brand-900">
              {result.colRatio.toFixed(2)}x
            </p>
          </div>
        </div>
      </div>

      {/* Export actions */}
      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="outline"
          fullWidth
          onClick={handleCopyLink}
          className="h-10 justify-center gap-2 text-xs font-semibold uppercase tracking-wider bg-white"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600">Link copied!</span>
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 text-brand-500" />
              Copy shareable link
            </>
          )}
        </Button>

        <Button
          variant="outline"
          fullWidth
          className="h-10 justify-center gap-2 text-xs font-semibold uppercase tracking-wider bg-white"
        >
          <Download className="h-4 w-4 text-brand-500" />
          Export as PDF
        </Button>
      </div>
    </div>
  );
}
