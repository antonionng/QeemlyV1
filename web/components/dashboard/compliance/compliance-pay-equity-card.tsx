"use client";

import { Users, TrendingDown, TrendingUp, Minus, Info } from "lucide-react";
import { useComplianceContext } from "@/lib/compliance/context";

export function CompliancePayEquityCard() {
  const { payEquityKpis, equityLevels } = useComplianceContext();
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold text-brand-900">Pay Equity Audit</h3>

      {/* KPI row */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        {payEquityKpis.map((kpi) => (
          <div
            key={kpi.id}
            className="rounded-xl border border-border bg-accent-50/50 p-4"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-accent-500">
              {kpi.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brand-900">
                {kpi.value}
              </span>
              {kpi.delta && (
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                  <TrendingDown className="h-3 w-3" />
                  {kpi.delta}
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-accent-500">{kpi.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Equity distribution (dark card) */}
      <div className="mt-5 rounded-2xl bg-brand-900 p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h5 className="text-sm font-bold">Equity distribution</h5>
              <p className="text-[11px] text-brand-200">
                Statistical parity by level
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
            Healthy
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {equityLevels.map((item) => (
            <div key={item.level} className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-brand-100">
                  {item.level}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{item.gap} gap</span>
                  {item.direction === "up" ? (
                    <TrendingUp className="h-3 w-3 text-red-400" />
                  ) : item.direction === "down" ? (
                    <TrendingDown className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Minus className="h-3 w-3 text-brand-400" />
                  )}
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-white/40"
                  style={{ width: `${item.barPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info callout */}
      <div className="mt-5 flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-brand-700">
        <Info className="h-4 w-4 shrink-0 text-brand-500" />
        <p className="text-[11px] leading-tight">
          Your current pay gap is{" "}
          <span className="font-bold">
            below the industry median
          </span>{" "}
          for technology companies in the UAE.
        </p>
      </div>
    </div>
  );
}
