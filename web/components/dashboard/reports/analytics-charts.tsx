"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { AnalyticsPayload } from "@/lib/reports/analytics";

const PALETTE = {
  brand: "#6C5CE7",
  brandLight: "#8B7CF6",
  green: "#00BC7D",
  greenBg: "rgba(0,188,125,0.1)",
  amber: "#FE9A00",
  amberBg: "rgba(254,154,0,0.1)",
  red: "#FF2056",
  redBg: "rgba(255,32,86,0.1)",
  grid: "#F3F4F6",
  axis: "#9CA3AF",
  tooltipBg: "#111827",
  heading: "#111233",
  muted: "#969799",
  cardBorder: "#EEF1F6",
  cardShadow: "0px 2px 8px rgba(16,24,40,0.04)",
  neutral: "#E5E7EB",
};

const DEPT_COLORS = [
  PALETTE.brand,
  PALETTE.brandLight,
  "#4C5CE7",
  "#A78BFA",
  "#7C3AED",
  "#818CF8",
  "#6366F1",
  "#C084FC",
];

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function ChartTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-white shadow-[0_8px_24px_rgba(17,24,39,0.16)]"
      style={{ background: PALETTE.tooltipBg }}
    >
      {children}
    </div>
  );
}

function DeptCompChart({
  departments,
  currency,
}: {
  departments: AnalyticsPayload["departments"];
  currency: string;
}) {
  if (departments.length === 0) {
    return (
      <EmptyChart message="No department data yet. Upload employee data to see a department breakdown." />
    );
  }

  const data = departments.slice(0, 8).map((d) => ({
    name: d.name.length > 14 ? d.name.slice(0, 12) + "..." : d.name,
    fullName: d.name,
    headcount: d.headcount,
    totalComp: d.totalComp,
    avgVsMarket: d.avgMarketComparison,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: PALETTE.axis }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: PALETTE.axis }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${currency} ${formatCompact(v)}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const item = payload[0].payload as (typeof data)[0];
            return (
              <ChartTooltip>
                <p className="text-[13px] font-medium">{item.fullName}</p>
                <p className="mt-1 text-[12px] text-white/70">
                  {item.headcount} employees
                </p>
                <p className="mt-0.5 text-[12px] text-white/70">
                  Total comp: {currency} {item.totalComp.toLocaleString()}
                </p>
                <p className="mt-0.5 text-[12px] text-white/70">
                  Avg vs market: {item.avgVsMarket}%
                </p>
              </ChartTooltip>
            );
          }}
        />
        <Bar dataKey="totalComp" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function CoverageDonut({
  benchmarked,
  total,
}: {
  benchmarked: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <EmptyChart message="No employees uploaded yet. Coverage will appear once employee data is available." />
    );
  }

  const unbenchmarked = total - benchmarked;
  const pct = Math.round((benchmarked / total) * 100);
  const data = [
    { name: "Benchmarked", value: benchmarked },
    { name: "Not Benchmarked", value: unbenchmarked },
  ];
  const colors = [PALETTE.brand, PALETTE.neutral];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={colors[i]} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={28}
            iconSize={10}
            iconType="circle"
            formatter={(value: string) => (
              <span style={{ color: PALETTE.muted, fontSize: 12 }}>
                {value}
              </span>
            )}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0];
              return (
                <ChartTooltip>
                  <p className="text-[12px]">
                    {item.name}: {String(item.value)} employees
                  </p>
                </ChartTooltip>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ marginBottom: 28 }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: PALETTE.heading }}>
            {pct}%
          </p>
          <p className="text-[10px]" style={{ color: PALETTE.muted }}>
            covered
          </p>
        </div>
      </div>
    </div>
  );
}

function MarketPositionChart({
  departments,
}: {
  departments: AnalyticsPayload["departments"];
}) {
  if (departments.length === 0) {
    return (
      <EmptyChart message="No benchmark comparisons available yet." />
    );
  }

  const data = departments
    .filter((d) => d.benchmarkedCount > 0)
    .slice(0, 8)
    .map((d) => ({
      name: d.name.length > 14 ? d.name.slice(0, 12) + "..." : d.name,
      fullName: d.name,
      avgVsMarket: d.avgMarketComparison,
    }));

  if (data.length === 0) {
    return (
      <EmptyChart message="No departments have benchmark data yet." />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={PALETTE.grid}
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: PALETTE.axis }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 11, fill: PALETTE.axis }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const item = payload[0].payload as (typeof data)[0];
            return (
              <ChartTooltip>
                <p className="text-[13px] font-medium">{item.fullName}</p>
                <p className="mt-1 text-[12px] text-white/70">
                  {item.avgVsMarket >= 0 ? "+" : ""}
                  {item.avgVsMarket}% vs market
                </p>
              </ChartTooltip>
            );
          }}
        />
        <Bar dataKey="avgVsMarket" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {data.map((d, i) => (
            <Cell
              key={`cell-${i}`}
              fill={d.avgVsMarket >= 0 ? PALETTE.green : PALETTE.red}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center">
      <p
        className="max-w-[240px] text-center text-xs italic"
        style={{ color: PALETTE.muted }}
      >
        {message}
      </p>
    </div>
  );
}

export function AnalyticsCharts() {
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex h-[340px] items-center justify-center rounded-[16px] bg-white"
            style={{
              border: `1px solid ${PALETTE.cardBorder}`,
              boxShadow: PALETTE.cardShadow,
            }}
          >
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: PALETTE.axis }} />
          </div>
        ))}
      </div>
    );
  }

  const payload = data;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div
        className="rounded-[16px] bg-white p-5"
        style={{
          border: `1px solid ${PALETTE.cardBorder}`,
          boxShadow: PALETTE.cardShadow,
        }}
      >
        <h4
          className="text-sm font-semibold mb-3"
          style={{ color: PALETTE.heading }}
        >
          Department Compensation
        </h4>
        <DeptCompChart
          departments={payload?.departments ?? []}
          currency={payload?.currency ?? "AED"}
        />
      </div>

      <div
        className="rounded-[16px] bg-white p-5"
        style={{
          border: `1px solid ${PALETTE.cardBorder}`,
          boxShadow: PALETTE.cardShadow,
        }}
      >
        <h4
          className="text-sm font-semibold mb-3"
          style={{ color: PALETTE.heading }}
        >
          Benchmark Coverage
        </h4>
        <CoverageDonut
          benchmarked={payload?.benchmarkedEmployees ?? 0}
          total={payload?.activeEmployees ?? 0}
        />
      </div>

      <div
        className="rounded-[16px] bg-white p-5"
        style={{
          border: `1px solid ${PALETTE.cardBorder}`,
          boxShadow: PALETTE.cardShadow,
        }}
      >
        <h4
          className="text-sm font-semibold mb-3"
          style={{ color: PALETTE.heading }}
        >
          Market Position by Department
        </h4>
        <MarketPositionChart departments={payload?.departments ?? []} />
      </div>
    </div>
  );
}
