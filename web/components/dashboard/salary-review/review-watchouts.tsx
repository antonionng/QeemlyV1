"use client";

import { AlertTriangle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SalaryReviewWatchout } from "@/lib/salary-review/insights";

export function ReviewWatchouts({ items }: { items: SalaryReviewWatchout[] }) {
  if (items.length === 0) {
    return (
      <Card className="dash-card border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">No immediate watchouts</h3>
            <p className="mt-1 text-sm text-emerald-800">
              Budget and benchmark signals are currently stable for the visible review set.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="dash-card p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-accent-950">Review Watchouts</h3>
      </div>
      <p className="mt-2 text-sm text-accent-600">
        Use these signals to decide what needs attention before approval.
      </p>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.title}-${item.body}`}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <p className="text-sm font-semibold text-amber-950">{item.title}</p>
            <p className="mt-1 text-sm text-amber-800">{item.body}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
