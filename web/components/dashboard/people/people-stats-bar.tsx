"use client";

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
  const avgMarket =
    employees.length > 0
      ? employees.reduce((sum, employee) => sum + employee.marketComparison, 0) / employees.length
      : 0;
  const below = employees.filter((employee) => employee.bandPosition === "below").length;
  const inBand = employees.filter((employee) => employee.bandPosition === "in-band").length;
  const above = employees.filter((employee) => employee.bandPosition === "above").length;

  const denom = Math.max(1, totalEmployees);
  const belowPct = Math.round((below / denom) * 100);
  const inBandPct = Math.round((inBand / denom) * 100);
  const abovePct = Math.max(0, 100 - belowPct - inBandPct);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-500">Headcount</p>
        <p className="mt-2 text-2xl font-bold text-brand-900">{totalEmployees}</p>
        <p className="mt-1 text-xs text-accent-500">active employees</p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-500">Departments</p>
        <p className="mt-2 text-2xl font-bold text-brand-900">{departments}</p>
        <p className="mt-1 text-xs text-accent-500">with employee data</p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-500">Avg vs Market</p>
        <p className="mt-2 text-2xl font-bold text-brand-900">{formatPct(avgMarket)}</p>
        <p className="mt-1 text-xs text-accent-500">across all employees</p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-500">Band Split</p>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-accent-100">
          <div className="flex h-full w-full">
            <div className="bg-red-500" style={{ width: `${belowPct}%` }} />
            <div className="bg-emerald-500" style={{ width: `${inBandPct}%` }} />
            <div className="bg-amber-500" style={{ width: `${abovePct}%` }} />
          </div>
        </div>
        <p className="mt-2 text-xs text-accent-500">
          {below} below • {inBand} in-band • {above} above
        </p>
      </div>
    </div>
  );
}

