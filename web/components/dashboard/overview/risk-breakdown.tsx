"use client";

import { BarList } from "@tremor/react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, AlertOctagon, Info, ArrowRight } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { type CompanyMetrics } from "@/lib/employees";
import type { OverviewRiskSummary } from "@/lib/dashboard/company-overview";
import { getRiskCardPresentation } from "@/lib/dashboard/overview-card-helpers";

interface RiskBreakdownProps {
  metrics: CompanyMetrics;
  summary: OverviewRiskSummary;
  benchmarkCoverage?: {
    activeEmployees: number;
    benchmarkedEmployees: number;
  };
}

export function RiskBreakdown({ metrics, summary, benchmarkCoverage }: RiskBreakdownProps) {
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
      case "critical": return { border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500" };
      case "high": return { border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" };
      case "medium": return { border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" };
      default: return { border: "border-accent-200", text: "text-accent-700", dot: "bg-accent-400" };
    }
  };

  const activeRisks = metrics.riskBreakdown.filter(r => r.count > 0);
  const totalRiskEmployees = summary.totalAtRisk;
  const presentation = getRiskCardPresentation(metrics, summary);

  return (
    <Card className="dash-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-accent-900">{presentation.title}</h3>
          <p className="text-xs text-accent-500 mt-0.5">
            {presentation.subtitle}
            {typeof coveragePct === "number" && (
              <span className={clsx("font-semibold", coverageTextClass)}>
                {` · Coverage ${coveragePct}%`}
              </span>
            )}
          </p>
        </div>
        {totalRiskEmployees > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span className="text-xs font-semibold text-rose-700">
              {presentation.badgeLabel}
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
          <div className="rounded-xl border border-accent-200 bg-accent-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-500">
              Primary Focus
            </p>
            <p className="mt-2 text-base font-semibold text-accent-900">
              {presentation.primaryFocusTitle}
            </p>
            <p className="mt-1 text-sm text-accent-600">
              {presentation.primaryFocusDescription}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-500">
              Severity Breakdown
            </h4>
            <div className="space-y-2">
              {activeRisks.map((risk) => {
                const Icon = getSeverityIcon(risk.severity);
                const colors = getSeverityColor(risk.severity);
                return (
                  <div
                    key={risk.severity}
                    className={clsx(
                      "flex items-center justify-between rounded-xl border bg-white px-3 py-2.5",
                      colors.border,
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={clsx("h-2.5 w-2.5 rounded-full", colors.dot)} />
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

          <div className="rounded-xl border border-accent-200 bg-accent-50 p-3">
            <p className="text-xs font-medium text-accent-700">Methodology</p>
            <p className="mt-1 text-sm text-accent-900">{summary.methodologyLabel}</p>
            <p className="mt-1 text-xs text-accent-600">{summary.coverageNote}</p>
          </div>

          {summary.departmentRows.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-3">
                Where To Start
              </h4>
              <BarList
                data={summary.departmentRows}
                color="indigo"
                showAnimation={true}
              />
            </div>
          )}

          {/* Action link */}
          <Link
            href="/dashboard/salary-review?filter=above-band"
            className="group flex items-center justify-between rounded-xl border border-brand-200 bg-white p-3 transition-colors hover:bg-brand-50"
          >
            <span className="text-sm font-medium text-brand-700">
              {presentation.actionLabel}
            </span>
            <ArrowRight className="h-4 w-4 text-brand-500 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </Card>
  );
}
