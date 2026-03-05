"use client";

import { useState, useCallback, useEffect } from "react";
import { Settings, RefreshCw, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500 mx-auto" />
          <p className="mt-3 text-brand-600">Loading company data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header (reference: large title + pill buttons inline) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-title">
          Company Overview
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 rounded-full bg-accent-800 px-5 text-white hover:bg-accent-700 border-0"
          >
            <RefreshCw className={clsx("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Link href="/dashboard/settings">
            <Button
              size="sm"
              className="h-9 rounded-full bg-accent-800 px-5 text-white hover:bg-accent-700 border-0"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Configuration prompt if not configured */}
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

      {/* Shortcuts row (reference: first content block) */}
      <ShortcutsRow />

      {/* Key metrics: Health Score (left) + Stat Cards 2x2 (right) per reference */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <HealthScore metrics={metrics} />
        </div>
        <div className="lg:col-span-2">
          <StatCards metrics={metrics} benchmarkCoverage={benchmarkCoverage} />
        </div>
      </div>

      {/* Quick Actions row */}
      <QuickActions />

      {/* Data Health */}
      <DataHealthCard benchmarkCoverage={benchmarkCoverage} />

      {/* Charts Row - Payroll Trend and Band Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PayrollTrend metrics={metrics} />
        <BandDistributionChart metrics={metrics} departmentSummaries={departmentSummaries} />
      </div>

      {/* Insights + Risk row */}
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

      {/* Department breakdown gets its own full-width row for readability */}
      <DepartmentTabs summaries={departmentSummaries} />

      {/* Qeemly Advisory - Employee Risk Highlights */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-accent-900">Qeemly Advisory</h2>
        <p className="text-sm text-accent-500">
          Structured decision-support ranked by highest compensation risk and impact.
          Expand each panel for full analysis.
        </p>
        <div className="space-y-3">
          {advisoryCandidates.map((employee) => (
            <AdvisoryPanel key={employee.id} employee={employee} />
          ))}
        </div>
      </div>

      {/* Live indicator - subtle */}
      <div className="flex items-center gap-2 text-xs text-accent-500">
        <div className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>
        <span>{getRefreshText()}</span>
      </div>

      {/* Upload Modal */}
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
