"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp } from "lucide-react";
import { RelocationResult, getComparisonText } from "@/lib/relocation/calculator";

interface ColIndexWidgetProps {
  result: RelocationResult | null;
}

export function ColIndexWidget({ result }: ColIndexWidgetProps) {
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-accent-400">Select locations to see comparison</p>
      </div>
    );
  }

  const colRatio = result.colRatio;
  const percentDiff = Math.round((colRatio - 1) * 100);
  const isMoreExpensive = colRatio > 1;
  const isSimilar = Math.abs(percentDiff) < 5;

  return (
    <div className="flex flex-col p-2">
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-extrabold text-brand-900">
          {colRatio.toFixed(2)}x
        </span>
        {!isSimilar && (
          <span
            className={clsx(
              "flex items-center gap-1 text-base font-bold",
              isMoreExpensive ? "text-rose-600" : "text-emerald-600"
            )}
          >
            {isMoreExpensive ? (
              <ArrowUp className="h-5 w-5" />
            ) : (
              <ArrowDown className="h-5 w-5" />
            )}
            {Math.abs(percentDiff)}%
          </span>
        )}
      </div>

      <p className="mt-3 text-base text-accent-600">
        {result.targetCity.name} is <strong>{getComparisonText(colRatio)}</strong> than{" "}
        {result.homeCity.name}
      </p>
      
      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 ring-1 ring-brand-100">
          <span className="text-2xl">{result.homeCity.flag}</span>
          <span className="text-xs font-bold text-brand-700">
            {result.homeCity.name}: {result.homeCity.colIndex}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 ring-1 ring-brand-100">
          <span className="text-2xl">{result.targetCity.flag}</span>
          <span className="text-xs font-bold text-brand-700">
            {result.targetCity.name}: {result.targetCity.colIndex}
          </span>
        </div>
      </div>
    </div>
  );
}
