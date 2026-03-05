"use client";

import { Card } from "@/components/ui/card";

interface CompBreakdownProps {
  baseSalary: number;
  bonus: number | null;
  equity: number | null;
  currency: string;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function CompBreakdown({ baseSalary, bonus, equity, currency }: CompBreakdownProps) {
  const total = baseSalary + (bonus ?? 0) + (equity ?? 0);
  const items = [
    { label: "Base Salary", value: baseSalary, color: "bg-brand-500" },
    ...(bonus ? [{ label: "Bonus", value: bonus, color: "bg-emerald-500" }] : []),
    ...(equity ? [{ label: "Equity", value: equity, color: "bg-violet-500" }] : []),
  ];

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-brand-700 mb-5">Compensation Breakdown</h3>

      {/* Stacked bar */}
      <div className="flex h-4 w-full overflow-hidden rounded-full mb-6">
        {items.map((item) => (
          <div
            key={item.label}
            className={`${item.color} transition-all`}
            style={{ width: `${(item.value / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`h-3 w-3 rounded-full ${item.color}`} />
              <span className="text-sm text-brand-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-brand-900">
                {formatCurrency(item.value, currency)}
              </span>
              <span className="text-xs text-brand-500 w-10 text-right">
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
