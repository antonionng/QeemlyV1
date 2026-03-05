"use client";

import { Card } from "@/components/ui/card";
import { ArrowUp, Minus } from "lucide-react";
import type { CompensationHistoryEntry } from "@/lib/employee";

interface CompTimelineProps {
  history: CompensationHistoryEntry[];
  currency: string;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function CompTimeline({ history, currency }: CompTimelineProps) {
  const reversed = [...history].reverse();

  if (reversed.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-brand-700 mb-2">Compensation Timeline</h3>
        <p className="text-sm text-brand-500">No compensation changes recorded yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-brand-700 mb-5">Compensation Timeline</h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-brand-200" />

        <div className="space-y-5">
          {reversed.map((entry, idx) => {
            const pct = entry.changePercentage;
            const isIncrease = pct != null && pct > 0;

            return (
              <div key={entry.id} className="relative flex gap-4 pl-0">
                {/* Dot */}
                <div className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 border-white bg-brand-100 shadow-sm">
                  {isIncrease ? (
                    <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 text-brand-400" />
                  )}
                </div>

                <div className="flex-1 pb-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-brand-900">
                        {formatCurrency(entry.baseSalary, currency)}
                      </p>
                      {entry.changeReason && (
                        <p className="text-xs text-brand-600 mt-0.5">{entry.changeReason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-brand-500">
                        {new Date(entry.effectiveDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {pct != null && pct !== 0 && (
                        <p className={`text-xs font-semibold mt-0.5 ${isIncrease ? "text-emerald-600" : "text-red-500"}`}>
                          {isIncrease ? "+" : ""}
                          {pct.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
