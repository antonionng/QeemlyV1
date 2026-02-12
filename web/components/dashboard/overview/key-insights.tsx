"use client";

import { AlertCircle, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ArrowRight, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import clsx from "clsx";
import { type CompanyMetrics, type DepartmentSummary, formatAEDCompact } from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";

interface KeyInsightsProps {
  metrics: CompanyMetrics;
  departmentSummaries: DepartmentSummary[];
}

interface Insight {
  type: "warning" | "info" | "success" | "danger";
  icon: typeof AlertCircle;
  message: string;
  impact?: string;
  actionLabel?: string;
  actionHref?: string;
  priority: number; // 1 = highest priority
}

export function KeyInsights({ metrics, departmentSummaries }: KeyInsightsProps) {
  const { salaryView } = useSalaryView();
  const fmt = (v: number) => formatAEDCompact(applyViewMode(v, salaryView));

  // Generate insights based on metrics
  const insights: Insight[] = [];

  // Roles outside band
  if (metrics.rolesOutsideBand > 0) {
    const estimatedImpact = metrics.rolesOutsideBand * 35000; // Avg impact per employee
    insights.push({
      type: metrics.rolesOutsideBand > 20 ? "danger" : "warning",
      icon: AlertCircle,
      message: `${metrics.rolesOutsideBand} employees outside compensation band`,
      impact: `Potential ${fmt(estimatedImpact)} adjustment needed`,
      actionLabel: "Review employees",
      actionHref: "/dashboard/salary-review?filter=outside-band",
      priority: metrics.rolesOutsideBand > 20 ? 1 : 2,
    });
  }

  // Departments over benchmark (cost risk)
  const overBenchmarkDepts = departmentSummaries.filter(d => d.avgVsMarket > 5);
  if (overBenchmarkDepts.length > 0) {
    const deptName = overBenchmarkDepts[0].department;
    const avgOver = overBenchmarkDepts[0].avgVsMarket;
    const deptPayroll = overBenchmarkDepts[0].totalPayroll;
    const excessCost = Math.round(deptPayroll * (avgOver / 100));
    insights.push({
      type: "info",
      icon: TrendingUp,
      message: `${deptName} is ${avgOver.toFixed(0)}% above market benchmark`,
      impact: `~${fmt(excessCost)} above market rate`,
      actionLabel: `View ${deptName}`,
      actionHref: `/dashboard/salary-review?department=${deptName}`,
      priority: 3,
    });
  }

  // Departments under benchmark (retention risk)
  const underBenchmarkDepts = departmentSummaries.filter(d => d.avgVsMarket < -5);
  if (underBenchmarkDepts.length > 0) {
    const deptName = underBenchmarkDepts[0].department;
    const avgUnder = Math.abs(underBenchmarkDepts[0].avgVsMarket);
    insights.push({
      type: "warning",
      icon: TrendingDown,
      message: `${deptName} is ${avgUnder.toFixed(0)}% below market`,
      impact: `High turnover risk - consider retention adjustments`,
      actionLabel: `View ${deptName}`,
      actionHref: `/dashboard/salary-review?department=${deptName}`,
      priority: 2,
    });
  }

  // Payroll risk flags
  if (metrics.payrollRiskFlags > 0) {
    const savingsEstimate = metrics.payrollRiskFlags * 50000 * 0.6;
    insights.push({
      type: metrics.payrollRiskFlags > 10 ? "danger" : "warning",
      icon: AlertTriangle,
      message: `${metrics.payrollRiskFlags} payroll risk indicators detected`,
      impact: `Addressing could save ${fmt(savingsEstimate)}${salaryView === "monthly" ? "/mo" : "/year"}`,
      actionLabel: "View risks",
      actionHref: "/dashboard/salary-review?filter=above-band",
      priority: metrics.payrollRiskFlags > 10 ? 1 : 2,
    });
  }

  // Health score insight
  if (metrics.healthScore >= 80) {
    insights.push({
      type: "success",
      icon: CheckCircle,
      message: "Excellent compensation health score",
      impact: `Score: ${metrics.healthScore}/100 - Top quartile performance`,
      priority: 5,
    });
  } else if (metrics.healthScore < 60) {
    insights.push({
      type: "warning",
      icon: Zap,
      message: `Compensation health needs attention`,
      impact: `Score: ${metrics.healthScore}/100 - Review recommended`,
      actionLabel: "Run analysis",
      actionHref: "/dashboard/reports",
      priority: 2,
    });
  }

  // Sort by priority
  insights.sort((a, b) => a.priority - b.priority);

  // If everything looks good
  if (insights.length === 0) {
    insights.push({
      type: "success",
      icon: CheckCircle,
      message: "All compensation metrics are within healthy ranges",
      impact: "No immediate actions required",
      priority: 5,
    });
  }

  const getTypeStyles = (type: Insight["type"]) => {
    switch (type) {
      case "danger":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      case "success":
        return "bg-emerald-50 border-emerald-200";
    }
  };

  const getIconStyles = (type: Insight["type"]) => {
    switch (type) {
      case "danger":
        return "text-red-500 bg-red-100";
      case "warning":
        return "text-amber-500 bg-amber-100";
      case "info":
        return "text-blue-500 bg-blue-100";
      case "success":
        return "text-emerald-500 bg-emerald-100";
    }
  };

  const getTextStyles = (type: Insight["type"]) => {
    switch (type) {
      case "danger":
        return "text-red-800";
      case "warning":
        return "text-amber-800";
      case "info":
        return "text-blue-800";
      case "success":
        return "text-emerald-800";
    }
  };

  const getSubtextStyles = (type: Insight["type"]) => {
    switch (type) {
      case "danger":
        return "text-red-600";
      case "warning":
        return "text-amber-600";
      case "info":
        return "text-blue-600";
      case "success":
        return "text-emerald-600";
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-900">Key Insights</h3>
        <span className="text-xs text-brand-500">{insights.length} items</span>
      </div>
      <div className="space-y-3">
        {insights.slice(0, 5).map((insight, index) => (
          <div
            key={index}
            className={clsx(
              "rounded-xl border p-4 transition-all",
              getTypeStyles(insight.type)
            )}
          >
            <div className="flex items-start gap-3">
              <div className={clsx("rounded-lg p-1.5 flex-shrink-0", getIconStyles(insight.type))}>
                <insight.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx("text-sm font-medium", getTextStyles(insight.type))}>
                  {insight.message}
                </p>
                {insight.impact && (
                  <p className={clsx("text-xs mt-1", getSubtextStyles(insight.type))}>
                    {insight.impact}
                  </p>
                )}
                {insight.actionHref && (
                  <Link href={insight.actionHref}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={clsx(
                        "mt-2 h-7 px-2 text-xs gap-1",
                        getTextStyles(insight.type),
                        "hover:bg-white/50"
                      )}
                    >
                      {insight.actionLabel}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
