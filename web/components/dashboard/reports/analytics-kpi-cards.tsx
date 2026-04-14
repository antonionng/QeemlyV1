"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Target,
  TrendingUp,
  Wallet,
  Loader2,
} from "lucide-react";
import type { AnalyticsPayload } from "@/lib/reports/analytics";

function formatCompactCurrency(value: number, currency: string): string {
  if (value >= 1_000_000) return `${currency} ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${currency} ${(value / 1_000).toFixed(0)}K`;
  return `${currency} ${value.toLocaleString()}`;
}

type KpiDef = {
  id: string;
  label: string;
  icon: React.ElementType;
  format: (payload: AnalyticsPayload) => string;
  sub: (payload: AnalyticsPayload) => string;
};

const KPI_DEFS: KpiDef[] = [
  {
    id: "employees",
    label: "Active Employees",
    icon: Users,
    format: (p) => String(p.activeEmployees),
    sub: (p) =>
      p.activeEmployees > 0
        ? `${p.departmentCount} departments`
        : "upload employee data to begin",
  },
  {
    id: "coverage",
    label: "Benchmark Coverage",
    icon: Target,
    format: (p) =>
      p.activeEmployees > 0
        ? `${Math.round((p.benchmarkedEmployees / p.activeEmployees) * 100)}%`
        : "0%",
    sub: (p) =>
      p.benchmarkedEmployees > 0
        ? `${p.benchmarkedEmployees} of ${p.activeEmployees} matched`
        : "no employees benchmarked yet",
  },
  {
    id: "market",
    label: "Avg. vs Market",
    icon: TrendingUp,
    format: (p) =>
      p.benchmarkedEmployees > 0
        ? `${p.avgMarketComparison >= 0 ? "+" : ""}${p.avgMarketComparison.toFixed(1)}%`
        : "N/A",
    sub: (p) =>
      p.marketRowsCount > 0
        ? `${p.marketRowsCount} market rows`
        : "no market data available",
  },
  {
    id: "payroll",
    label: "Total Payroll",
    icon: Wallet,
    format: (p) =>
      p.totalPayroll > 0
        ? formatCompactCurrency(p.totalPayroll, p.currency)
        : "N/A",
    sub: (p) =>
      p.totalPayroll > 0
        ? `across ${p.departmentCount} departments`
        : "no payroll data yet",
  },
];

export function AnalyticsKpiCards() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/reports/analytics");
        if (!res.ok) throw new Error("Failed");
        const json = (await res.json()) as { analytics: AnalyticsPayload };
        if (!cancelled) setData(json.analytics);
      } catch {
        // leave data null
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_DEFS.map((kpi) => (
          <div
            key={kpi.id}
            className="flex items-center justify-center rounded-[16px] bg-white p-5 h-[110px]"
            style={{
              border: "1px solid #EEF1F6",
              boxShadow: "0 2px 8px rgba(16,24,40,0.04)",
            }}
          >
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#9CA3AF" }} />
          </div>
        ))}
      </div>
    );
  }

  const payload: AnalyticsPayload = data ?? {
    currency: "AED",
    activeEmployees: 0,
    benchmarkedEmployees: 0,
    departmentCount: 0,
    totalPayroll: 0,
    avgMarketComparison: 0,
    marketRowsCount: 0,
    marketFreshnessAt: null,
    benchmarkTrustLabel: "None",
    marketBackedEmployees: 0,
    departments: [],
    benchmarkSourceBreakdown: [],
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_DEFS.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="rounded-[16px] bg-white p-5"
            style={{
              border: "1px solid #EEF1F6",
              boxShadow: "0 2px 8px rgba(16,24,40,0.04)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "rgba(168,155,255,0.12)" }}
              >
                <Icon className="h-4 w-4" style={{ color: "#6C5CE7" }} />
              </div>
              <p className="text-xs font-semibold" style={{ color: "#969799" }}>
                {kpi.label}
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "#111233" }}>
              {kpi.format(payload)}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: "#969799" }}>
              {kpi.sub(payload)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
