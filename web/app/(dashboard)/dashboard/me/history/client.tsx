"use client";

import { GrowthChart, CompTimeline } from "@/components/employee";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { EmployeeDashboardData } from "@/lib/employee";

interface HistoryClientProps {
  data: EmployeeDashboardData;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function HistoryClient({ data }: HistoryClientProps) {
  const { profile, history } = data;
  const currency = profile.currency;

  const firstSalary = history.length > 0 ? history[0].baseSalary : profile.baseSalary;
  const totalGrowthPct =
    firstSalary > 0
      ? ((profile.baseSalary - firstSalary) / firstSalary) * 100
      : 0;
  const totalGrowthAbs = profile.baseSalary - firstSalary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-accent-800">
          My History
        </h1>
        <p className="mt-1 text-[15px] text-brand-600/80">
          Your compensation journey over time.
        </p>
      </div>

      {/* Headline stats */}
      {history.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs font-medium text-brand-500 uppercase tracking-wide mb-1">
              Current Salary
            </p>
            <p className="text-2xl font-bold text-brand-900">
              {formatCurrency(profile.baseSalary, currency)}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-medium text-brand-500 uppercase tracking-wide mb-1">
              Starting Salary
            </p>
            <p className="text-2xl font-bold text-brand-900">
              {formatCurrency(firstSalary, currency)}
            </p>
          </Card>
          <Card className="relative overflow-hidden p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent" />
            <div className="relative">
              <p className="text-xs font-medium text-brand-500 uppercase tracking-wide mb-1">
                Total Growth
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-emerald-700">
                  +{totalGrowthPct.toFixed(1)}%
                </p>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-xs text-emerald-600 mt-0.5">
                +{formatCurrency(totalGrowthAbs, currency)}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Chart */}
      <GrowthChart
        history={history}
        currentSalary={profile.baseSalary}
        currency={currency}
      />

      {/* Timeline */}
      <CompTimeline history={history} currency={currency} />
    </div>
  );
}
