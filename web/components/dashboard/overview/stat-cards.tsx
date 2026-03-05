"use client";

import { Users, Banknote, Target, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatAEDCompact, type CompanyMetrics } from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";
import clsx from "clsx";

interface StatCardsProps {
  metrics: CompanyMetrics;
  benchmarkCoverage?: {
    activeEmployees: number;
    benchmarkedEmployees: number;
  };
}

function MiniBarChart({ data, colors }: { data: number[]; colors: string[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-[3px] h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm min-w-[4px]"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            backgroundColor: colors[i % colors.length],
          }}
        />
      ))}
    </div>
  );
}

function StackedBar({ segments }: { segments: { pct: number; color: string }[] }) {
  return (
    <div className="flex h-4 w-full rounded-full overflow-hidden">
      {segments.map((s, i) => (
        <div
          key={i}
          style={{ width: `${s.pct}%`, backgroundColor: s.color }}
          className="transition-all duration-500"
        />
      ))}
    </div>
  );
}

export function StatCards({ metrics, benchmarkCoverage }: StatCardsProps) {
  const { salaryView } = useSalaryView();
  const coveragePct =
    benchmarkCoverage && benchmarkCoverage.activeEmployees > 0
      ? Math.round((benchmarkCoverage.benchmarkedEmployees / benchmarkCoverage.activeEmployees) * 100)
      : null;
  const coverageBadgeClass =
    typeof coveragePct !== "number"
      ? ""
      : coveragePct >= 90
        ? "bg-emerald-100 text-emerald-700"
        : coveragePct >= 60
          ? "bg-amber-100 text-amber-700"
          : "bg-rose-100 text-rose-700";

  const headcountBars = metrics.headcountTrend.slice(-6).map(d => d.value);
  const payrollBars = metrics.payrollTrend.slice(-6).map(d => d.value);

  const headcountColors = [
    "var(--color-brand-200)",
    "var(--color-brand-300)",
    "var(--color-brand-400)",
    "var(--color-brand-100)",
    "var(--color-brand-200)",
    "var(--color-brand-500)",
  ];
  const payrollColors = [
    "var(--color-brand-200)",
    "var(--color-brand-300)",
    "var(--color-brand-500)",
    "var(--color-brand-200)",
    "var(--color-brand-400)",
    "var(--color-brand-600)",
  ];

  const stats = [
    {
      label: "Active Employees",
      value: metrics.activeEmployees.toString(),
      subtext: `${metrics.totalEmployees} total`,
      icon: Users,
      color: "text-brand-600",
      bgColor: "bg-brand-50",
      change: metrics.headcountChange,
      changeLabel: "vs last year",
      chart: <MiniBarChart data={headcountBars} colors={headcountColors} />,
    },
    {
      label: "Total Payroll",
      value: formatAEDCompact(applyViewMode(metrics.totalPayroll, salaryView)),
      subtext: salaryView === "monthly" ? "Monthly compensation" : "Annual compensation",
      icon: Banknote,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: metrics.payrollChange,
      changeLabel: "vs last year",
      chart: <MiniBarChart data={payrollBars} colors={payrollColors} />,
    },
    {
      label: "In Band",
      value: `${metrics.inBandPercentage}%`,
      subtext: `${metrics.outOfBandPercentage}% outside band`,
      coverageBadge: coveragePct,
      icon: Target,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: metrics.inBandChange,
      changeLabel: "vs last year",
      chart: (
        <StackedBar
          segments={[
            { pct: metrics.bandDistribution.inBand, color: "var(--success)" },
            { pct: metrics.bandDistribution.above, color: "var(--warning)" },
            { pct: metrics.bandDistribution.below, color: "var(--danger)" },
          ]}
        />
      ),
    },
    {
      label: "Risk Flags",
      value: metrics.payrollRiskFlags.toString(),
      subtext: "Above market employees",
      coverageBadge: coveragePct,
      icon: AlertTriangle,
      color: metrics.payrollRiskFlags > 5 ? "text-red-600" : "text-amber-600",
      bgColor: metrics.payrollRiskFlags > 5 ? "bg-red-50" : "bg-amber-50",
      change: null,
      changeLabel: "",
      chart: null,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 h-full">
      {stats.map((stat) => (
        <Card key={stat.label} className="dash-card p-5 overflow-hidden flex flex-col" glow>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-sm font-medium text-accent-600">
                {stat.label}
              </span>
              {typeof stat.coverageBadge === "number" && (
                <span
                  className={clsx(
                    "mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    coverageBadgeClass
                  )}
                >
                  Coverage {stat.coverageBadge}%
                </span>
              )}
              <span className="text-xs text-accent-400">
                {stat.subtext}
              </span>
            </div>
            <div className={`rounded-xl p-2 ${stat.bgColor} flex-shrink-0`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3 flex-1">
            <div>
              <span className="text-2xl font-bold text-accent-900">
                {stat.value}
              </span>
              {stat.change !== null && (
                <div className="flex items-center gap-1 mt-1">
                  {stat.change >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-rose-500" />
                  )}
                  <span
                    className={clsx(
                      "text-xs font-medium",
                      stat.change >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {stat.change >= 0 ? "+" : ""}{stat.change}%
                  </span>
                  <span className="text-[10px] text-accent-400">
                    {stat.changeLabel}
                  </span>
                </div>
              )}
            </div>
            {stat.chart && (
              <div className="w-24 shrink-0">
                {stat.chart}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
