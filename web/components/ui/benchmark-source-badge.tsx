"use client";

import clsx from "clsx";
import { Database, Upload, Sparkles } from "lucide-react";
import type { BenchmarkSource } from "@/lib/dashboard/dummy-data";

type BenchmarkSourceBadgeProps = {
  source?: BenchmarkSource;
  className?: string;
};

const CONFIG: Record<
  BenchmarkSource,
  { label: string; title: string; colors: string; icon: typeof Database }
> = {
  market: {
    label: "Market",
    title: "From the Qeemly market data pool",
    colors: "bg-brand-50 text-brand-600 ring-1 ring-brand-200",
    icon: Database,
  },
  uploaded: {
    label: "Your Data",
    title: "Uploaded by your organisation",
    colors: "bg-accent-50 text-accent-600 ring-1 ring-accent-200",
    icon: Upload,
  },
  "ai-estimated": {
    label: "Qeemly AI Advisory",
    title: "AI-generated compensation advisory powered by GPT-5.4",
    colors: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    icon: Sparkles,
  },
};

export function BenchmarkSourceBadge({ source, className }: BenchmarkSourceBadgeProps) {
  if (!source) return null;

  const config = CONFIG[source];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        config.colors,
        className,
      )}
      title={config.title}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}
