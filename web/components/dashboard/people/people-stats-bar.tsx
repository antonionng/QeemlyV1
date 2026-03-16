"use client";

import { summarizeBenchmarkTrust } from "@/lib/benchmarks/trust";
import type { Employee } from "@/lib/employees";

type Props = {
  employees: Employee[];
};

function formatPct(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function PeopleStatsBar({ employees }: Props) {
  const totalEmployees = employees.length;
  const departments = new Set(employees.map((employee) => employee.department)).size;
  const benchmarkedEmployees = employees.filter((employee) => employee.hasBenchmark);
  const avgMarket =
    benchmarkedEmployees.length > 0
      ? benchmarkedEmployees.reduce((sum, employee) => sum + employee.marketComparison, 0) /
        benchmarkedEmployees.length
      : 0;
  const below = benchmarkedEmployees.filter((employee) => employee.bandPosition === "below").length;
  const inBand = benchmarkedEmployees.filter((employee) => employee.bandPosition === "in-band").length;
  const above = benchmarkedEmployees.filter((employee) => employee.bandPosition === "above").length;
  const benchmarkTrust = summarizeBenchmarkTrust(employees);
  const trustFreshness = benchmarkTrust.freshestAt
    ? new Date(benchmarkTrust.freshestAt).toLocaleDateString("en-GB")
    : "Unknown";

  const denom = Math.max(1, benchmarkedEmployees.length);
  const belowPct = Math.round((below / denom) * 100);
  const inBandPct = Math.round((inBand / denom) * 100);
  const abovePct = Math.max(0, 100 - belowPct - inBandPct);
  const cards = [
    {
      label: "Headcount",
      value: totalEmployees.toString(),
      meta: "active employees",
    },
    {
      label: "Departments",
      value: departments.toString(),
      meta: "with employee data",
    },
    {
      label: "Avg vs Market",
      value: formatPct(avgMarket),
      meta: benchmarkedEmployees.length > 0 ? "across benchmarked employees" : "awaiting benchmark matches",
    },
  ];

  return (
    <div
      data-testid="people-stats-grid"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className="min-h-[132px] rounded-3xl border border-border/70 bg-white p-5 shadow-sm shadow-brand-100/20"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-500">{card.label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-brand-900">{card.value}</p>
          <p className="mt-2 text-sm text-accent-500">{card.meta}</p>
        </div>
      ))}

      <div className="min-h-[132px] rounded-3xl border border-border/70 bg-white p-5 shadow-sm shadow-brand-100/20">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-500">Band Split</p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-accent-100">
          <div className="flex h-full w-full">
            <div className="bg-red-500" style={{ width: `${belowPct}%` }} />
            <div className="bg-emerald-500" style={{ width: `${inBandPct}%` }} />
            <div className="bg-amber-500" style={{ width: `${abovePct}%` }} />
          </div>
        </div>
        <p className="mt-3 text-sm text-accent-500">
          {below} below • {inBand} in-band • {above} above
        </p>
        <p className="mt-1 text-xs text-accent-400">{benchmarkedEmployees.length} benchmarked employees</p>
      </div>

      <div className="min-h-[132px] rounded-3xl border border-border/70 bg-white p-5 shadow-sm shadow-brand-100/20">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-500">Benchmark Trust</p>
        <p className="mt-3 text-lg font-bold leading-tight text-brand-900">{benchmarkTrust.primarySourceLabel}</p>
        <p className="mt-2 text-sm text-accent-500">
          {benchmarkTrust.exactMatches} exact • {benchmarkTrust.fallbackMatches} fallback
        </p>
        <p className="mt-1 text-sm text-accent-500">Freshness: {trustFreshness}</p>
      </div>
    </div>
  );
}

