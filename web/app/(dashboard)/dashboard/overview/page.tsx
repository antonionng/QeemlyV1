"use client";

import { useState, useCallback } from "react";
import { Settings, RefreshCw, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  StatCards, 
  KeyInsights, 
  DepartmentTabs,
  HealthScore,
  PayrollTrend,
  BandDistributionChart,
  RiskBreakdown,
  QuickActions,
} from "@/components/dashboard/overview";
import { UploadModal } from "@/components/dashboard/upload";
import { getCompanyMetrics, getDepartmentSummaries } from "@/lib/employees";
import { useCompanySettings } from "@/lib/company";
import clsx from "clsx";

export default function CompanyOverviewPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { companyName, isConfigured } = useCompanySettings();
  const metrics = getCompanyMetrics();
  const departmentSummaries = getDepartmentSummaries();

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh - in real app this would refetch data
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefresh(new Date());
    }, 1000);
  }, []);

  const getRefreshText = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Data refreshed just now";
    if (diffMins === 1) return "Data refreshed 1 minute ago";
    if (diffMins < 60) return `Data refreshed ${diffMins} minutes ago`;
    return `Data refreshed ${Math.floor(diffMins / 60)} hours ago`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Title & Description */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-brand-900">
                Company Overview
              </h1>
              <Badge variant="brand" className="bg-brand-500/10 text-brand-600 border-brand-500/20">
                {companyName}
              </Badge>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-brand-700/80 max-w-2xl">
              Instant understanding of your company&apos;s compensation health across{" "}
              <span className="font-semibold text-brand-900">{metrics.activeEmployees}</span> active employees.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button 
              variant="ghost" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-brand-600"
            >
              <RefreshCw className={clsx("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="ghost" onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="h-11 bg-white hover:bg-brand-50 border border-border/40 px-5">
                <Settings className="mr-2 h-4 w-4 text-brand-600" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Configuration prompt if not configured */}
        {!isConfigured && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-4">
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

        {/* Live indicator */}
        <div className="mt-4 flex items-center gap-2 text-sm text-brand-500">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span>{getRefreshText()}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <StatCards metrics={metrics} />

      {/* Health Score - Full width prominent widget */}
      <HealthScore metrics={metrics} />

      {/* Charts Row - Payroll Trend and Band Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PayrollTrend metrics={metrics} />
        <BandDistributionChart metrics={metrics} departmentSummaries={departmentSummaries} />
      </div>

      {/* Three column layout for insights, departments, and actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <KeyInsights metrics={metrics} departmentSummaries={departmentSummaries} />
          <QuickActions />
        </div>
        <div className="lg:col-span-1">
          <RiskBreakdown metrics={metrics} departmentSummaries={departmentSummaries} />
        </div>
        <div className="lg:col-span-1">
          <DepartmentTabs summaries={departmentSummaries} />
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        type="employees"
        onSuccess={() => {
          // Refresh data after upload
          window.location.reload();
        }}
      />
    </div>
  );
}
