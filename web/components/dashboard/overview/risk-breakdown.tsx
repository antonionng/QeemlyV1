"use client";

import { BarList } from "@tremor/react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, AlertOctagon, Info, ArrowRight } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { type CompanyMetrics, type DepartmentSummary, formatAEDCompact } from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";

interface RiskBreakdownProps {
  metrics: CompanyMetrics;
  departmentSummaries: DepartmentSummary[];
  benchmarkCoverage?: {
    activeEmployees: number;
    benchmarkedEmployees: number;
  };
}

export function RiskBreakdown({ metrics, departmentSummaries, benchmarkCoverage }: RiskBreakdownProps) {
  const { salaryView } = useSalaryView();
  const coveragePct =
    benchmarkCoverage && benchmarkCoverage.activeEmployees > 0
      ? Math.round((benchmarkCoverage.benchmarkedEmployees / benchmarkCoverage.activeEmployees) * 100)
      : null;
  const coverageTextClass =
    typeof coveragePct !== "number"
      ? ""
      : coveragePct >= 90
        ? "text-emerald-600"
        : coveragePct >= 60
          ? "text-amber-600"
          : "text-rose-600";
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
  const ringSegments = activeRisks.map((risk) => ({
    value: risk.count,
    color:
      risk.severity === "critical"
        ? "var(--danger)"
        : risk.severity === "high"
          ? "var(--warning)"
          : "var(--color-brand-300)",
  }));
  const totalRing = ringSegments.reduce((sum, seg) => sum + seg.value, 0) || 1;
  const ringGradientParts = ringSegments.reduce<{ cursor: number; parts: string[] }>(
    (acc, segment) => {
      const start = (acc.cursor / totalRing) * 360;
      const nextCursor = acc.cursor + segment.value;
      const end = (nextCursor / totalRing) * 360;
      acc.parts.push(`${segment.color} ${start}deg ${end}deg`);
      return { cursor: nextCursor, parts: acc.parts };
    },
    { cursor: 0, parts: [] },
  );
  const ringGradient = ringGradientParts.parts.join(", ");

  return (
    <Card className="dash-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-accent-900">Risk Analysis</h3>
          <p className="text-xs text-accent-500 mt-0.5">
            Compensation risk indicators
            {typeof coveragePct === "number" && (
              <span className={clsx("font-semibold", coverageTextClass)}>
                {` · Coverage ${coveragePct}%`}
              </span>
            )}
          </p>
        </div>
        {totalRiskEmployees > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1">
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
            <div className="relative h-24 w-24 shrink-0">
              <div
                className="h-full w-full rounded-full"
                style={{
                  background: `conic-gradient(${ringGradient})`,
                }}
              />
              <div className="absolute inset-[16%] rounded-full bg-white" />
            </div>
            <div className="flex-1 space-y-2">
              {activeRisks.map((risk) => {
                const Icon = getSeverityIcon(risk.severity);
                const colors = getSeverityColor(risk.severity);
                return (
                  <div
                    key={risk.severity}
                    className={clsx("flex items-center justify-between rounded-lg p-2", colors.bg)}
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
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-rose-700">Estimated Annual Overpayment</p>
                <p className="text-lg font-bold text-rose-800">
                  {formatAEDCompact(applyViewMode(estimatedOverpayment, salaryView))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-rose-600">
                  Addressing these risks could save
                </p>
                <p className="text-xs font-semibold text-rose-700">
                  up to {formatAEDCompact(applyViewMode(estimatedOverpayment * 0.6, salaryView))} {salaryView === "monthly" ? "monthly" : "annually"}
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
            className="group flex items-center justify-between rounded-xl bg-brand-50 p-3 transition-colors hover:bg-brand-100"
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
