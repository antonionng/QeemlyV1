"use client";

import { Users, Banknote, Target, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatAEDCompact, type CompanyMetrics } from "@/lib/employees";

interface StatCardsProps {
  metrics: CompanyMetrics;
}

export function StatCards({ metrics }: StatCardsProps) {
  const stats = [
    {
      label: "Active Employees",
      value: metrics.activeEmployees.toString(),
      subtext: `${metrics.totalEmployees} total`,
      icon: Users,
      color: "text-brand-600",
      bgColor: "bg-brand-50",
    },
    {
      label: "Total Payroll",
      value: formatAEDCompact(metrics.totalPayroll),
      subtext: "Annual compensation",
      icon: Banknote,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "In Band",
      value: `${metrics.inBandPercentage}%`,
      subtext: `${metrics.outOfBandPercentage}% outside band`,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Risk Flags",
      value: metrics.payrollRiskFlags.toString(),
      subtext: "Above market employees",
      icon: AlertTriangle,
      color: metrics.payrollRiskFlags > 5 ? "text-red-600" : "text-amber-600",
      bgColor: metrics.payrollRiskFlags > 5 ? "bg-red-50" : "bg-amber-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-5" glow>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-brand-600">
                {stat.label}
              </span>
              <span className="text-2xl font-bold text-brand-900">
                {stat.value}
              </span>
              <span className="text-xs text-brand-500">
                {stat.subtext}
              </span>
            </div>
            <div className={`rounded-xl p-2.5 ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
