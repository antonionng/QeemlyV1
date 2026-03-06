"use client";

import clsx from "clsx";
import { Database, Upload } from "lucide-react";
import type { BenchmarkSource } from "@/lib/dashboard/dummy-data";

type BenchmarkSourceBadgeProps = {
  source?: BenchmarkSource;
  className?: string;
};

export function BenchmarkSourceBadge({ source, className }: BenchmarkSourceBadgeProps) {
  if (!source || source === "dummy") return null;

  const isMarket = source === "market";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        isMarket
          ? "bg-brand-50 text-brand-600 ring-1 ring-brand-200"
          : "bg-accent-50 text-accent-600 ring-1 ring-accent-200",
        className
      )}
      title={isMarket ? "From the Qeemly market data pool" : "Uploaded by your organisation"}
    >
      {isMarket ? (
        <Database className="h-2.5 w-2.5" />
      ) : (
        <Upload className="h-2.5 w-2.5" />
      )}
      {isMarket ? "Market" : "Your Data"}
    </span>
  );
}
