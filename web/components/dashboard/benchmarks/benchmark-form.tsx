"use client";

import { useState } from "react";
import { Search, ChevronDown, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useBenchmarkState,
  EXTENDED_LOCATIONS,
} from "@/lib/benchmarks/benchmark-state";
import {
  getBenchmarkCohortValueLabel,
  getBenchmarkFormCompletionMessage,
  getRoleSelectionState,
  getBenchmarkWorkspaceDefaultLabel,
} from "@/lib/benchmarks/form-presentation";
import { ROLES, LEVELS, INDUSTRIES, COMPANY_SIZES } from "@/lib/dashboard/dummy-data";
import { useCompanySettings, type TargetPercentile } from "@/lib/company";
import { useSalaryView } from "@/lib/salary-view-store";

export function BenchmarkForm() {
  const {
    formData,
    isFormComplete,
    updateFormField,
    runBenchmark,
  } = useBenchmarkState();

  const companySettings = useCompanySettings();
  const { salaryView, setSalaryView } = useSalaryView();
  const [roleSearch, setRoleSearch] = useState("");

  const filteredRoles = ROLES.filter(
    (role) =>
      role.title.toLowerCase().includes(roleSearch.toLowerCase()) ||
      role.family.toLowerCase().includes(roleSearch.toLowerCase()),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormComplete) runBenchmark();
  };

  const selectedRole = ROLES.find((r) => r.id === formData.roleId);
  const roleSelectionState = getRoleSelectionState({
    roleId: formData.roleId,
    roleSearch,
  });
  const completionMessage = getBenchmarkFormCompletionMessage({
    roleId: formData.roleId,
    levelId: formData.levelId,
    locationId: formData.locationId,
  });
  const resolvedIndustryLabel = getBenchmarkCohortValueLabel(formData.industry || companySettings.industry);
  const resolvedCompanySizeLabel = getBenchmarkCohortValueLabel(
    formData.companySize || companySettings.companySize,
  );

  const handleRoleSearchChange = (value: string) => {
    setRoleSearch(value);
    if (formData.roleId) {
      updateFormField("roleId", null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bench-section">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
            Price a role quickly
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-600">
            Start with just the role, level, location, and employment type. Everything else can
            happen after you get a usable market point.
          </p>
        </div>

        <h3 className="bench-section-header">Role Details</h3>

        <div className="space-y-4">
          {roleSelectionState === "selected" && selectedRole ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Role selected
                  </div>
                  <p className="mt-1 text-base font-semibold text-brand-900">
                    {selectedRole.title}
                  </p>
                  <p className="text-sm text-emerald-700">{selectedRole.family}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateFormField("roleId", null);
                    setRoleSearch("");
                  }}
                  className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700"
                >
                  Change role
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
                Search role
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
                <Input
                  type="text"
                  placeholder="Type a role and pick it from the list"
                  value={roleSearch}
                  onChange={(e) => handleRoleSearchChange(e.target.value)}
                  className="w-full pl-11"
                  fullWidth
                />
                {roleSelectionState === "searching" && (
                  <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-2xl border border-border bg-white shadow-lg">
                    {filteredRoles.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-brand-400">No roles found</div>
                    ) : (
                      filteredRoles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => {
                            updateFormField("roleId", role.id);
                            setRoleSearch("");
                          }}
                          className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-brand-50 first:rounded-t-2xl last:rounded-b-2xl"
                        >
                          <span className="font-medium text-brand-900">{role.title}</span>
                          <span className="ml-2 text-xs text-brand-400">{role.family}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-brand-500">
                Start typing, then click one of the suggested roles to lock it in.
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
                Level
              </label>
              <div className="relative">
                <select
                  value={formData.levelId || ""}
                  onChange={(e) => updateFormField("levelId", e.target.value || null)}
                  className="bench-pill-select w-full min-w-0 pr-10"
                >
                  <option value="">Select level</option>
                  {LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
                Location
              </label>
              <div className="relative">
                <select
                  value={formData.locationId || ""}
                  onChange={(e) => updateFormField("locationId", e.target.value || null)}
                  className="bench-pill-select w-full min-w-0 pr-10"
                >
                  <option value="">Select location</option>
                  <optgroup label="United Kingdom">
                    {EXTENDED_LOCATIONS.filter((l) => l.countryCode === "GB").map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.city}, {loc.country}</option>
                    ))}
                  </optgroup>
                  <optgroup label="GCC">
                    {EXTENDED_LOCATIONS.filter((l) => l.countryCode !== "GB").map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.city}, {loc.country}</option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
                Employment type
              </label>
              <div className="relative">
                <select
                  value={formData.employmentType}
                  onChange={(e) => updateFormField("employmentType", e.target.value as "national" | "expat")}
                  className="bench-pill-select w-full min-w-0 pr-10"
                >
                  <option value="national">National</option>
                  <option value="expat">Expat</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
                Salary view
              </label>
              <div className="bench-toggle w-full justify-between">
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
        </div>
      </div>

      <div className="bench-section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="bench-section-header pb-1">Market Filters</h3>
            <p className="text-xs text-brand-400 mb-4">
              Industry and company size are live now. Funding stage stays hidden until its market
              cohorts are supported end to end.
            </p>
          </div>
          <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Shared market pool
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 md:items-start">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
              Target percentile
            </label>
            <div className="relative">
              <select
                value={formData.targetPercentile || companySettings.targetPercentile}
                onChange={(e) =>
                  updateFormField(
                    "targetPercentile",
                    e.target.value ? (Number(e.target.value) as TargetPercentile) : null,
                  )
                }
                className="bench-pill-select w-full min-w-0 pr-10"
              >
                <option value="25">25th Percentile</option>
                <option value="50">50th Percentile</option>
                <option value="75">75th Percentile</option>
                <option value="90">90th Percentile</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
              Industry cohort
            </label>
            <div className="relative">
              <select
                value={formData.industry || "__workspace__"}
                onChange={(e) =>
                  updateFormField("industry", e.target.value === "__workspace__" ? null : e.target.value)
                }
                className="bench-pill-select w-full min-w-0 pr-10"
              >
                <option value="__workspace__">
                  {getBenchmarkWorkspaceDefaultLabel(companySettings.industry)}
                </option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
              Company size cohort
            </label>
            <div className="relative">
              <select
                value={formData.companySize || "__workspace__"}
                onChange={(e) =>
                  updateFormField("companySize", e.target.value === "__workspace__" ? null : e.target.value)
                }
                className="bench-pill-select w-full min-w-0 pr-10"
              >
                <option value="__workspace__">
                  {getBenchmarkWorkspaceDefaultLabel(companySettings.companySize)}
                </option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-3 text-sm text-brand-700">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <div>
              <p className="font-medium text-brand-800">Funding stage remains hidden for now</p>
              <p className="mt-1 text-xs leading-relaxed text-brand-600">
                This MVP supports industry and company-size segmentation with base-market fallback.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 rounded-2xl bg-surface-1 p-4 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-3 text-sm text-brand-700">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <div>
                <p className="font-medium text-brand-800">Requested cohort</p>
                <p className="mt-1 text-xs leading-relaxed text-brand-600">
                  {resolvedIndustryLabel} industry • {resolvedCompanySizeLabel} company size
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-3 text-sm text-brand-700">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <div>
                <p className="font-medium text-brand-800">Fallback behavior</p>
                <p className="mt-1 text-xs leading-relaxed text-brand-600">
                  If no exact cohort exists, Qeemly falls back to the broader shared market row and
                  labels that result explicitly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
              Pricing status
            </p>
            <p className={`mt-1 text-sm ${isFormComplete ? "text-emerald-700" : "text-brand-600"}`}>
              {completionMessage}
            </p>
          </div>
          {isFormComplete && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Ready
            </span>
          )}
        </div>
        {!isFormComplete && roleSelectionState === "searching" && (
          <p className="mt-2 text-xs text-brand-500">
            The role field is still in search mode. Click a suggested role to enable pricing.
          </p>
        )}
        <button type="submit" disabled={!isFormComplete} className="bench-cta mt-4">
          Price This Role <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
