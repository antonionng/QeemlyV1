"use client";

import { Users, Banknote, Target, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { SparkAreaChart, DonutChart } from "@tremor/react";
import { Card } from "@/components/ui/card";
import { formatAEDCompact, type CompanyMetrics } from "@/lib/employees";
import clsx from "clsx";

interface StatCardsProps {
  metrics: CompanyMetrics;
}

export function StatCards({ metrics }: StatCardsProps) {
  // Prepare sparkline data for headcount
  const headcountSparkData = metrics.headcountTrend.map(d => ({
    month: d.month,
    Headcount: d.value,
  }));

  // Prepare sparkline data for payroll
  const payrollSparkData = metrics.payrollTrend.map(d => ({
    month: d.month,
    Payroll: d.value,
  }));

  // Prepare donut data for band distribution
  const bandDonutData = [
    { name: "In Band", value: metrics.bandDistribution.inBand },
    { name: "Below", value: metrics.bandDistribution.below },
    { name: "Above", value: metrics.bandDistribution.above },
  ];

  // Prepare donut data for risk breakdown
  const riskDonutData = metrics.riskBreakdown
    .filter(r => r.count > 0)
    .map(r => ({
      name: r.label,
      value: r.count,
    }));

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
      chartType: "sparkline" as const,
      chartData: headcountSparkData,
      chartCategory: "Headcount",
      chartColor: "violet" as const,
    },
    {
      label: "Total Payroll",
      value: formatAEDCompact(metrics.totalPayroll),
      subtext: "Annual compensation",
      icon: Banknote,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: metrics.payrollChange,
      changeLabel: "vs last year",
      chartType: "sparkline" as const,
      chartData: payrollSparkData,
      chartCategory: "Payroll",
      chartColor: "emerald" as const,
    },
    {
      label: "In Band",
      value: `${metrics.inBandPercentage}%`,
      subtext: `${metrics.outOfBandPercentage}% outside band`,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: metrics.inBandChange,
      changeLabel: "vs last year",
      chartType: "donut" as const,
      donutData: bandDonutData,
      donutColors: ["emerald", "amber", "rose"] as const,
    },
    {
      label: "Risk Flags",
      value: metrics.payrollRiskFlags.toString(),
      subtext: "Above market employees",
      icon: AlertTriangle,
      color: metrics.payrollRiskFlags > 5 ? "text-red-600" : "text-amber-600",
      bgColor: metrics.payrollRiskFlags > 5 ? "bg-red-50" : "bg-amber-50",
      change: null, // No YoY change for risk flags
      chartType: "donut" as const,
      donutData: riskDonutData,
      donutColors: ["rose", "orange", "amber", "yellow"] as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5 overflow-hidden" glow>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <span className="text-sm font-medium text-brand-600">
                {stat.label}
              </span>
              <span className="text-2xl font-bold text-brand-900">
                {stat.value}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-brand-500">
                  {stat.subtext}
                </span>
              </div>
              {/* Change indicator */}
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
                  <span className="text-xs text-brand-400">
                    {stat.changeLabel}
                  </span>
                </div>
              )}
            </div>
            <div className={`rounded-xl p-2.5 ${stat.bgColor} flex-shrink-0`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
          
          {/* Mini chart */}
          <div className="mt-4 -mx-1">
            {stat.chartType === "sparkline" && stat.chartData && (
              <SparkAreaChart
                data={stat.chartData}
                categories={[stat.chartCategory!]}
                index="month"
                colors={[stat.chartColor!]}
                className="h-10 w-full"
                curveType="monotone"
              />
            )}
            {stat.chartType === "donut" && stat.donutData && stat.donutData.length > 0 && (
              <div className="flex items-center justify-center">
                <DonutChart
                  data={stat.donutData}
                  category="value"
                  index="name"
                  colors={[...stat.donutColors!]}
                  className="h-16 w-16"
                  showLabel={false}
                  showAnimation={true}
                  showTooltip={true}
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
