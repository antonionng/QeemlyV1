"use client";

import { DonutChart, BarList } from "@tremor/react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, AlertOctagon, Info, ArrowRight } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { type CompanyMetrics, type DepartmentSummary, formatAEDCompact } from "@/lib/employees";

interface RiskBreakdownProps {
  metrics: CompanyMetrics;
  departmentSummaries: DepartmentSummary[];
}

export function RiskBreakdown({ metrics, departmentSummaries }: RiskBreakdownProps) {
  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return AlertOctagon;
      case "high": return AlertTriangle;
      case "medium": return AlertCircle;
      default: return Info;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" };
      case "high": return { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" };
      case "medium": return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
      default: return { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" };
    }
  };

  // Filter to only show non-zero risk items
  const activeRisks = metrics.riskBreakdown.filter(r => r.count > 0);
  const totalRiskEmployees = activeRisks.reduce((sum, r) => sum + r.count, 0);

  // Prepare donut data
  const donutData = activeRisks.map(r => ({
    name: r.severity.charAt(0).toUpperCase() + r.severity.slice(1),
    value: r.count,
  }));

  // Calculate risk by department
  const deptRiskData = departmentSummaries
    .map(d => ({
      name: d.department,
      value: d.aboveBandCount,
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Estimate cost impact (rough calculation)
  const estimatedOverpayment = totalRiskEmployees * 50000; // Assume avg 50k AED overpayment per risk employee

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-900">Risk Analysis</h3>
          <p className="text-xs text-brand-500 mt-0.5">Compensation risk indicators</p>
        </div>
        {totalRiskEmployees > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span className="text-xs font-semibold text-rose-700">
              {totalRiskEmployees} at risk
            </span>
          </div>
        )}
      </div>

      {totalRiskEmployees === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-emerald-100 p-3 mb-3">
            <AlertCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <h4 className="text-sm font-semibold text-brand-900">No Risk Flags</h4>
          <p className="text-xs text-brand-500 mt-1">
            All employees are within acceptable compensation ranges
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Severity breakdown with donut */}
          <div className="flex items-center gap-6">
            <DonutChart
              data={donutData}
              category="value"
              index="name"
              colors={["rose", "orange", "amber", "yellow"]}
              className="h-24 w-24 flex-shrink-0"
              showLabel={false}
              showAnimation={true}
            />
            <div className="flex-1 space-y-2">
              {activeRisks.map(risk => {
                const Icon = getSeverityIcon(risk.severity);
                const colors = getSeverityColor(risk.severity);
                return (
                  <div
                    key={risk.severity}
                    className={clsx("flex items-center justify-between p-2 rounded-lg", colors.bg)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={clsx("h-4 w-4", colors.text)} />
                      <span className={clsx("text-xs font-medium", colors.text)}>
                        {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
                      </span>
                    </div>
                    <span className={clsx("text-sm font-bold", colors.text)}>
                      {risk.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost impact callout */}
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-rose-700">Estimated Annual Overpayment</p>
                <p className="text-lg font-bold text-rose-800">
                  {formatAEDCompact(estimatedOverpayment)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-rose-600">
                  Addressing these risks could save
                </p>
                <p className="text-xs font-semibold text-rose-700">
                  up to {formatAEDCompact(estimatedOverpayment * 0.6)} annually
                </p>
              </div>
            </div>
          </div>

          {/* Risk by department */}
          {deptRiskData.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-3">
                By Department
              </h4>
              <BarList
                data={deptRiskData}
                color="rose"
                showAnimation={true}
              />
            </div>
          )}

          {/* Action link */}
          <Link 
            href="/dashboard/salary-review?filter=above-band"
            className="flex items-center justify-between p-3 rounded-xl bg-brand-50 hover:bg-brand-100 transition-colors group"
          >
            <span className="text-sm font-medium text-brand-700">
              Review all risk employees
            </span>
            <ArrowRight className="h-4 w-4 text-brand-500 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </Card>
  );
}
