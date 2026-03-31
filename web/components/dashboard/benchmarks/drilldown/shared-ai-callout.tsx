"use client";

import { Sparkles } from "lucide-react";
import type { BenchmarkDetailAiSection } from "@/lib/benchmarks/detail-ai";

interface SharedAiCalloutProps {
  title?: string;
  section: BenchmarkDetailAiSection | null | undefined;
}

export function SharedAiCallout({
  title = "Qeemly AI Advisory",
  section,
}: SharedAiCalloutProps) {
  if (!section) return null;

  return (
    <div className="mt-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-brand-50 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-violet-100 p-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-800">{section.summary}</p>
          {section.action ? (
            <p className="mt-2 text-xs font-medium text-brand-700">Recommended action: {section.action}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
