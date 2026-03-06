"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowRight, Loader2, RefreshCw, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  StatCards,
  DataHealthCard,
  KeyInsights,
  DepartmentTabs,
  HealthScore,
  PayrollTrend,
  BandDistributionChart,
  RiskBreakdown,
  QuickActions,
  ShortcutsRow,
  AdvisoryPanel,
} from "@/components/dashboard/overview";
import { UploadModal } from "@/components/dashboard/upload";
import {
  getCompanyMetricsAsync,
  getDepartmentSummariesAsync,
  getEmployees,
  invalidateEmployeeCache,
  type CompanyMetrics,
  type DepartmentSummary,
  type Employee,
} from "@/lib/employees";
import { useCompanySettings } from "@/lib/company";
import { buildCompanyOverviewHeadlineCards } from "@/lib/company-vs-market";
import clsx from "clsx";

export default function CompanyOverviewPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { companyName, isConfigured } = useCompanySettings();

  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null);
  const [departmentSummaries, setDepartmentSummaries] = useState<DepartmentSummary[]>([]);
  const [advisoryCandidates, setAdvisoryCandidates] = useState<Employee[]>([]);
  const [benchmarkCoverage, setBenchmarkCoverage] = useState({
    activeEmployees: 0,
    benchmarkedEmployees: 0,
  });

  const loadData = useCallback(async () => {
    try {
      const [metricsData, deptData, employees] = await Promise.all([
        getCompanyMetricsAsync(),
        getDepartmentSummariesAsync(),
        getEmployees(),
      ]);

      setMetrics(metricsData);
      setDepartmentSummaries(deptData);

      const activeEmployees = employees.filter((employee) => employee.status === "active");
      const benchmarkedEmployees = activeEmployees.filter((employee) => employee.hasBenchmark);
      setBenchmarkCoverage({
        activeEmployees: activeEmployees.length,
        benchmarkedEmployees: benchmarkedEmployees.length,
      });

      const advisory = employees
        .filter((employee) => employee.status === "active" && employee.hasBenchmark)
        .map((employee) => {
          let riskScore = 0;
          if (employee.bandPosition === "below") riskScore += 20;
          if (employee.bandPosition === "above") riskScore += 8;
          if (employee.performanceRating === "exceptional") riskScore += 20;
          if (employee.performanceRating === "exceeds") riskScore += 12;
          if (employee.performanceRating === "low") riskScore += 16;
          if (employee.marketComparison < 0) riskScore += Math.min(30, Math.abs(employee.marketComparison));
          if (employee.marketComparison > 10) riskScore += 8;
          return { employee, riskScore };
        })
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5)
        .map((entry) => entry.employee);
      setAdvisoryCandidates(advisory);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to load metrics:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    invalidateEmployeeCache();
    loadData();
  }, [loadData]);

  const getRefreshText = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Data refreshed just now";
    if (diffMins === 1) return "Data refreshed 1 minute ago";
    if (diffMins < 60) return `Data refreshed ${diffMins} minutes ago`;
    return `Data refreshed ${Math.floor(diffMins / 60)} hours ago`;
  };

  if (loading || !metrics) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
          <p className="mt-3 text-brand-600">Loading company data...</p>
        </div>
      </div>
    );
  }

  const headlineCards = buildCompanyOverviewHeadlineCards(metrics, benchmarkCoverage);
  const headlineToneClasses = {
    neutral: "border-accent-200 bg-white text-accent-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
    market: "border-brand-200 bg-brand-50 text-brand-900",
    overlay: "border-sky-200 bg-sky-50 text-sky-900",
  } as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="page-title">Company Overview</h1>
          <p className="text-sm text-accent-500">
            Review {companyName || "your company"} pay health, actions, and benchmark coverage in one place.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 rounded-full border-0 bg-accent-800 px-5 text-white hover:bg-accent-700"
          >
            <RefreshCw className={clsx("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Link href="/dashboard/settings">
            <Button
              size="sm"
              className="h-9 rounded-full border-0 bg-accent-800 px-5 text-white hover:bg-accent-700"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <Card className="dash-card border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-accent-900">Executive summary</h2>
            <p className="mt-1 max-w-2xl text-sm text-accent-600">
              Keep this page focused on internal company performance. Use Market Overview for Qeemly dataset signals and Benchmarking for detailed market drill-downs.
            </p>
          </div>
          <Link href="/dashboard/market">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-border bg-white px-4 text-accent-700 hover:bg-accent-50"
            >
              Open Market Overview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {headlineCards.map((card) => (
            <div
              key={card.label}
              className={clsx("rounded-2xl border p-4", headlineToneClasses[card.tone])}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-current/70">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-current">{card.value}</p>
              <p className="mt-1 text-sm text-current/75">{card.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {!isConfigured && (
        <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-lg bg-amber-100 p-2">
              <Settings className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">Complete your setup</h3>
              <p className="text-sm text-amber-700">
                Configure your company settings to get accurate market comparisons.
              </p>
            </div>
            <Link href="/dashboard/settings">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                Configure
              </Button>
            </Link>
          </div>
        </div>
      )}

      <ShortcutsRow />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <HealthScore metrics={metrics} />
        </div>
        <div className="lg:col-span-2">
          <StatCards metrics={metrics} benchmarkCoverage={benchmarkCoverage} />
        </div>
      </div>

      <QuickActions />

      <DataHealthCard benchmarkCoverage={benchmarkCoverage} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PayrollTrend metrics={metrics} />
        <BandDistributionChart metrics={metrics} departmentSummaries={departmentSummaries} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <KeyInsights
          metrics={metrics}
          departmentSummaries={departmentSummaries}
          benchmarkCoverage={benchmarkCoverage}
        />
        <RiskBreakdown
          metrics={metrics}
          departmentSummaries={departmentSummaries}
          benchmarkCoverage={benchmarkCoverage}
        />
      </div>

      <DepartmentTabs summaries={departmentSummaries} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-accent-900">Qeemly Advisory</h2>
            <p className="text-sm text-accent-500">
              Structured decision support ranked by highest compensation risk and impact.
            </p>
          </div>
          <Link
            href="/dashboard/market"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Open Market Overview
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {advisoryCandidates.map((employee) => (
            <AdvisoryPanel key={employee.id} employee={employee} />
          ))}
          {advisoryCandidates.length === 0 && (
            <Card className="dash-card p-5 text-sm text-accent-500">
              Advisory recommendations will appear here once benchmarked employees are available.
            </Card>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-accent-500">
        <div className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>
        <span>{getRefreshText()}</span>
      </div>

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        type="employees"
        onSuccess={() => {
          invalidateEmployeeCache();
          loadData();
          setShowUploadModal(false);
        }}
      />
    </div>
  );
}
