"use client";

import { useState } from "react";
import { Settings, RefreshCw, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCards, KeyInsights, DepartmentTabs } from "@/components/dashboard/overview";
import { UploadModal } from "@/components/dashboard/upload";
import { getCompanyMetrics, getDepartmentSummaries } from "@/lib/employees";
import { useCompanySettings } from "@/lib/company";

export default function CompanyOverviewPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { companyName, isConfigured } = useCompanySettings();
  const metrics = getCompanyMetrics();
  const departmentSummaries = getDepartmentSummaries();

  return (
    <div className="space-y-8">
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
            <Button variant="ghost" onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Employees
            </Button>
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="h-11 bg-white hover:bg-brand-50 border border-border/40 px-5">
                <Settings className="mr-2 h-4 w-4 text-brand-600" />
                Edit Settings
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
        <div className="mt-6 flex items-center gap-2 text-sm text-brand-500">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Data refreshed just now</span>
        </div>
      </div>

      {/* Stat Cards */}
      <StatCards metrics={metrics} />

      {/* Two column layout for insights and departments */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <KeyInsights metrics={metrics} departmentSummaries={departmentSummaries} />
        </div>
        <div className="lg:col-span-2">
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
