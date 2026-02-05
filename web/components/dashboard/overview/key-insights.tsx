"use client";

import { AlertCircle, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { type CompanyMetrics, type DepartmentSummary } from "@/lib/employees";

interface KeyInsightsProps {
  metrics: CompanyMetrics;
  departmentSummaries: DepartmentSummary[];
}

interface Insight {
  type: "warning" | "info" | "success" | "danger";
  icon: typeof AlertCircle;
  message: string;
}

export function KeyInsights({ metrics, departmentSummaries }: KeyInsightsProps) {
  // Generate insights based on metrics
  const insights: Insight[] = [];

  // Roles outside band
  if (metrics.rolesOutsideBand > 0) {
    insights.push({
      type: metrics.rolesOutsideBand > 20 ? "danger" : "warning",
      icon: AlertCircle,
      message: `${metrics.rolesOutsideBand} employees outside compensation band`,
    });
  }

  // Departments over benchmark
  const overBenchmarkDepts = departmentSummaries.filter(d => d.avgVsMarket > 5);
  if (overBenchmarkDepts.length > 0) {
    const deptName = overBenchmarkDepts[0].department;
    const avgOver = overBenchmarkDepts[0].avgVsMarket;
    insights.push({
      type: "info",
      icon: TrendingUp,
      message: `${deptName} is ${avgOver.toFixed(0)}% above market benchmark`,
    });
  }

  // Departments under benchmark
  const underBenchmarkDepts = departmentSummaries.filter(d => d.avgVsMarket < -5);
  if (underBenchmarkDepts.length > 0) {
    const deptName = underBenchmarkDepts[0].department;
    const avgUnder = Math.abs(underBenchmarkDepts[0].avgVsMarket);
    insights.push({
      type: "warning",
      icon: TrendingDown,
      message: `${deptName} is ${avgUnder.toFixed(0)}% below market - retention risk`,
    });
  }

  // Payroll risk flags
  if (metrics.payrollRiskFlags > 0) {
    insights.push({
      type: metrics.payrollRiskFlags > 10 ? "danger" : "warning",
      icon: AlertTriangle,
      message: `${metrics.payrollRiskFlags} payroll risk indicators detected`,
    });
  }

  // If everything looks good
  if (insights.length === 0) {
    insights.push({
      type: "success",
      icon: AlertCircle,
      message: "All compensation metrics are within healthy ranges",
    });
  }

  const getTypeStyles = (type: Insight["type"]) => {
    switch (type) {
      case "danger":
        return "bg-red-50 border-red-200 text-red-700";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "success":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
    }
  };

  const getIconStyles = (type: Insight["type"]) => {
    switch (type) {
      case "danger":
        return "text-red-500";
      case "warning":
        return "text-amber-500";
      case "info":
        return "text-blue-500";
      case "success":
        return "text-emerald-500";
    }
  };

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-brand-900 mb-4">Key Insights</h3>
      <div className="space-y-3">
        {insights.slice(0, 4).map((insight, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${getTypeStyles(insight.type)}`}
          >
            <insight.icon className={`h-4 w-4 flex-shrink-0 ${getIconStyles(insight.type)}`} />
            <span className="text-sm font-medium">{insight.message}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
