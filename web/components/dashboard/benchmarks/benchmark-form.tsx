"use client";

import { useState } from "react";
import { Search, ChevronDown, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useBenchmarkState,
  EXTENDED_LOCATIONS,
} from "@/lib/benchmarks/benchmark-state";
import { ROLES, LEVELS, INDUSTRIES, COMPANY_SIZES } from "@/lib/dashboard/dummy-data";
import { useCompanySettings, FUNDING_STAGES, type TargetPercentile } from "@/lib/company";
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Role Details ── */}
      <div className="bench-section">
        <h3 className="bench-section-header">Role Details</h3>

        {/* Role search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
          <Input
            type="text"
            placeholder="Role title"
            value={roleSearch || selectedRole?.title || ""}
            onChange={(e) => {
              setRoleSearch(e.target.value);
              if (!e.target.value) updateFormField("roleId", null);
            }}
            className="pl-11 w-full"
            fullWidth
          />
          {/* Dropdown */}
          {roleSearch && (
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
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <span className="font-medium text-brand-900">{role.title}</span>
                    <span className="ml-2 text-xs text-brand-400">{role.family}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Pill selects row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Level */}
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
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
          </div>

          {/* Location */}
          <div className="relative">
            <select
              value={formData.locationId || ""}
              onChange={(e) => updateFormField("locationId", e.target.value || null)}
              className="bench-pill-select pr-8"
            >
              <option value="">Location</option>
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
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
          </div>

          {/* Employment */}
          <div className="relative">
            <select
              value={formData.employmentType}
              onChange={(e) => updateFormField("employmentType", e.target.value as "national" | "expat")}
              className="bench-pill-select pr-8"
            >
              <option value="national">National</option>
              <option value="expat">Expat</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
          </div>

          {/* Annual/Monthly toggle */}
          <div className="bench-toggle ml-auto">
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
        <p className="text-xs text-brand-400 mb-4">
          Company defaults pre-selected. Changes will not effect company settings.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {/* Industry */}
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
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
          </div>

          {/* Company Size */}
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
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
          </div>

          {/* Funding Stage */}
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
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
          </div>

          {/* Target Percentile */}
          <div className="relative">
            <select
              value={formData.targetPercentile || companySettings.targetPercentile}
              onChange={(e) =>
                updateFormField(
                  "targetPercentile",
                  e.target.value ? (Number(e.target.value) as TargetPercentile) : null,
                )
              }
              className="bench-pill-select pr-8"
            >
              <option value="25">25th Percentile</option>
              <option value="50">50th Percentile</option>
              <option value="75">75th Percentile</option>
              <option value="90">90th Percentile</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <button type="submit" disabled={!isFormComplete} className="bench-cta">
        Run Benchmark Search <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
