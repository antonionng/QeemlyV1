"use client";

import { useState } from "react";
import { Search, ChevronDown, ArrowRight, Loader2 } from "lucide-react";
import { RolePickerModal } from "@/components/dashboard/benchmarks/role-picker-modal";
import {
  useBenchmarkState,
  BENCHMARK_LOCATIONS,
} from "@/lib/benchmarks/benchmark-state";
import { ROLES, LEVELS, INDUSTRIES, COMPANY_SIZES } from "@/lib/dashboard/dummy-data";
import { useCompanySettings, FUNDING_STAGES, type TargetPercentile } from "@/lib/company";
import { useSalaryView } from "@/lib/salary-view-store";

export function BenchmarkForm() {
  const {
    formData,
    isFormComplete,
    isSubmitting,
    submissionError,
    updateFormField,
    runBenchmark,
  } = useBenchmarkState();

  const companySettings = useCompanySettings();
  const { salaryView, setSalaryView } = useSalaryView();
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormComplete) runBenchmark();
  };

  const selectedRole = ROLES.find((r) => r.id === formData.roleId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Role Details ── */}
      <div className="bench-section">
        <h3 className="bench-section-header">Role Details</h3>

        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-brand-400" />
          <button
            type="button"
            onClick={() => setIsRolePickerOpen(true)}
            aria-haspopup="dialog"
            data-testid="benchmark-role-picker-trigger"
            className="bench-role-trigger w-full pl-11 text-left"
          >
            <span className={selectedRole ? "text-text-primary" : "text-text-tertiary"}>
              {selectedRole?.title || "Role title"}
            </span>
            {selectedRole ? (
              <span className="ml-3 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">
                {selectedRole.family}
              </span>
            ) : null}
          </button>
        </div>

        {/* Pill selects row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={formData.levelId || ""}
              onChange={(e) => updateFormField("levelId", e.target.value || null)}
              className="bench-pill-select pr-8"
            >
              <option value="">Level</option>
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="relative">
            <select
              value={formData.locationId || ""}
              onChange={(e) => updateFormField("locationId", e.target.value || null)}
              className="bench-pill-select pr-8"
            >
              <option value="">Location</option>
              {BENCHMARK_LOCATIONS.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.city}, {location.country}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="relative">
            <select
              value={formData.employmentType}
              onChange={(e) => updateFormField("employmentType", e.target.value as "national" | "expat")}
              className="bench-pill-select min-w-[128px] pr-11"
              data-testid="benchmark-employment-type-select"
            >
              <option value="national">National</option>
              <option value="expat">Expat</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="ml-auto bench-toggle">
            <button
              type="button"
              data-active={salaryView === "annual"}
              onClick={() => setSalaryView("annual")}
            >
              Annual
            </button>
            <button
              type="button"
              data-active={salaryView === "monthly"}
              onClick={() => setSalaryView("monthly")}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* ── Market Filters ── */}
      <div className="bench-section">
        <h3 className="bench-section-header pb-1">Market Filters</h3>
        <p className="mb-4 text-xs text-brand-400">
          Company defaults pre-selected. Changes will not effect company settings.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={formData.industry || companySettings.industry}
              onChange={(e) => updateFormField("industry", e.target.value || null)}
              className="bench-pill-select pr-8"
            >
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="relative">
            <select
              value={formData.companySize || companySettings.companySize}
              onChange={(e) => updateFormField("companySize", e.target.value || null)}
              className="bench-pill-select pr-8"
            >
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s}>{s} Employees</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="relative">
            <select
              value={formData.fundingStage || companySettings.fundingStage}
              onChange={(e) => updateFormField("fundingStage", e.target.value || null)}
              className="bench-pill-select pr-8"
            >
              {FUNDING_STAGES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>

          <div className="relative">
            <select
              value={formData.targetPercentile || companySettings.targetPercentile}
              onChange={(e) =>
                updateFormField(
                  "targetPercentile",
                  e.target.value ? (Number(e.target.value) as TargetPercentile) : null,
                )
              }
              className="bench-pill-select min-w-[170px] pr-11"
              data-testid="benchmark-target-percentile-select"
            >
              <option value="25">25th Percentile</option>
              <option value="50">50th Percentile</option>
              <option value="75">75th Percentile</option>
              <option value="90">90th Percentile</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <button type="submit" disabled={!isFormComplete || isSubmitting} className="bench-cta">
        {isSubmitting ? (
          <>
            Searching benchmark <Loader2 className="h-4 w-4 animate-spin" />
          </>
        ) : (
          <>
            Run Benchmark Search <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {submissionError ? (
        <p className="text-sm text-amber-700" role="status">
          {submissionError}
        </p>
      ) : null}
      <RolePickerModal
        open={isRolePickerOpen}
        selectedRoleId={formData.roleId}
        onClose={() => setIsRolePickerOpen(false)}
        onSelect={(roleId) => updateFormField("roleId", roleId)}
      />
    </form>
  );
}
