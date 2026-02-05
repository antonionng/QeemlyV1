"use client";

import { useState } from "react";
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  RefreshCw,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  useBenchmarkState, 
  EXTENDED_LOCATIONS, 
  type BenchmarkContext,
  type BenchmarkFormData,
} from "@/lib/benchmarks/benchmark-state";
import { ROLES, LEVELS, INDUSTRIES, COMPANY_SIZES } from "@/lib/dashboard/dummy-data";
import { useCompanySettings, FUNDING_STAGES, type TargetPercentile } from "@/lib/company";

interface FilterSidebarProps {
  className?: string;
}

export function FilterSidebar({ className }: FilterSidebarProps) {
  const { 
    formData, 
    isFormComplete,
    updateFormField,
    runBenchmark,
  } = useBenchmarkState();
  
  const companySettings = useCompanySettings();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  const handleFieldChange = <K extends keyof BenchmarkFormData>(
    field: K, 
    value: BenchmarkFormData[K]
  ) => {
    updateFormField(field, value);
    setHasChanges(true);
  };

  // Filter roles based on search
  const filteredRoles = ROLES.filter(role => 
    role.title.toLowerCase().includes(roleSearch.toLowerCase()) ||
    role.family.toLowerCase().includes(roleSearch.toLowerCase())
  ).slice(0, 8); // Limit to 8 for sidebar

  const handleUpdateResults = () => {
    if (isFormComplete) {
      runBenchmark();
      setHasChanges(false);
    }
  };

  // Collapsed state
  if (isCollapsed) {
    return (
      <div className={clsx("w-12 flex-shrink-0", className)}>
        <div className="sticky top-6 rounded-2xl border border-border bg-white p-2 shadow-sm">
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-600 hover:bg-brand-50"
            title="Show filters"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="mt-2 flex flex-col items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-brand-400" />
            {hasChanges && (
              <div className="h-2 w-2 rounded-full bg-amber-500" title="Unsaved changes" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("w-72 flex-shrink-0", className)}>
      <div className="sticky top-6 rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-brand-50/50">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-brand-900">Filters</h3>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-brand-500 hover:bg-brand-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Context */}
          <div>
            <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
              Context
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: "existing", label: "Existing" },
                { value: "new-hire", label: "New Hire" },
                { value: "relocating", label: "Relocating" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFieldChange("context", option.value as BenchmarkContext)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    formData.context === option.value
                      ? "bg-brand-500 text-white"
                      : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
              Role
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
                fullWidth
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
              {filteredRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleFieldChange("roleId", role.id)}
                  className={clsx(
                    "p-2 rounded-lg text-left transition-all text-xs",
                    formData.roleId === role.id
                      ? "bg-brand-500 text-white"
                      : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  )}
                >
                  <div className="font-medium truncate">{role.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
              Level
            </label>
            <div className="relative">
              <select
                value={formData.levelId || ""}
                onChange={(e) => handleFieldChange("levelId", e.target.value || null)}
                className="w-full h-9 rounded-lg border border-border bg-white px-3 pr-8 text-sm text-brand-900 focus:border-brand-300 focus:outline-none appearance-none"
              >
                <option value="">Select level...</option>
                {LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
              Location
            </label>
            <div className="relative">
              <select
                value={formData.locationId || ""}
                onChange={(e) => handleFieldChange("locationId", e.target.value || null)}
                className="w-full h-9 rounded-lg border border-border bg-white px-3 pr-8 text-sm text-brand-900 focus:border-brand-300 focus:outline-none appearance-none"
              >
                <option value="">Select location...</option>
                <optgroup label="United Kingdom">
                  {EXTENDED_LOCATIONS.filter(l => l.countryCode === "GB").map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.city}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="GCC">
                  {EXTENDED_LOCATIONS.filter(l => l.countryCode !== "GB").map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.city}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-400 pointer-events-none" />
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
              Employment
            </label>
            <div className="flex gap-1.5">
              {[
                { value: "local", label: "Local" },
                { value: "expat", label: "Expat" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFieldChange("employmentType", option.value as "local" | "expat")}
                  className={clsx(
                    "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    formData.employmentType === option.value
                      ? "bg-brand-500 text-white"
                      : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-xs font-semibold text-brand-600 uppercase tracking-wider"
            >
              <span>Market Filters</span>
              <ChevronDown className={clsx(
                "h-3.5 w-3.5 transition-transform",
                showAdvanced && "rotate-180"
              )} />
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg">
                <Info className="h-3 w-3 flex-shrink-0" />
                <span>Overrides for this search only</span>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-xs font-medium text-brand-700 mb-1.5">
                  Industry
                </label>
                <select
                  value={formData.industry || ""}
                  onChange={(e) => handleFieldChange("industry", e.target.value || null)}
                  className="w-full h-8 rounded-lg border border-border bg-white px-2.5 text-xs text-brand-900 focus:border-brand-300 focus:outline-none"
                >
                  <option value="">Default ({companySettings.industry})</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Size */}
              <div>
                <label className="block text-xs font-medium text-brand-700 mb-1.5">
                  Company Size
                </label>
                <select
                  value={formData.companySize || ""}
                  onChange={(e) => handleFieldChange("companySize", e.target.value || null)}
                  className="w-full h-8 rounded-lg border border-border bg-white px-2.5 text-xs text-brand-900 focus:border-brand-300 focus:outline-none"
                >
                  <option value="">Default ({companySettings.companySize})</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Funding Stage */}
              <div>
                <label className="block text-xs font-medium text-brand-700 mb-1.5">
                  Funding Stage
                </label>
                <select
                  value={formData.fundingStage || ""}
                  onChange={(e) => handleFieldChange("fundingStage", e.target.value || null)}
                  className="w-full h-8 rounded-lg border border-border bg-white px-2.5 text-xs text-brand-900 focus:border-brand-300 focus:outline-none"
                >
                  <option value="">Default ({companySettings.fundingStage})</option>
                  {FUNDING_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Percentile */}
              <div>
                <label className="block text-xs font-medium text-brand-700 mb-1.5">
                  Target Percentile
                </label>
                <select
                  value={formData.targetPercentile || ""}
                  onChange={(e) => handleFieldChange("targetPercentile", e.target.value ? Number(e.target.value) as TargetPercentile : null)}
                  className="w-full h-8 rounded-lg border border-border bg-white px-2.5 text-xs text-brand-900 focus:border-brand-300 focus:outline-none"
                >
                  <option value="">Default (P{companySettings.targetPercentile})</option>
                  <option value="25">P25 - Below Market</option>
                  <option value="50">P50 - Market Median</option>
                  <option value="75">P75 - Above Market</option>
                  <option value="90">P90 - Premium</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Update Button */}
        <div className="p-4 border-t border-border bg-brand-50/50">
          <Button
            onClick={handleUpdateResults}
            disabled={!isFormComplete}
            className="w-full"
            size="sm"
          >
            <RefreshCw className={clsx("mr-2 h-3.5 w-3.5", hasChanges && "animate-spin")} />
            Update Results
          </Button>
          {hasChanges && (
            <p className="text-center text-xs text-amber-600 mt-2">
              You have unsaved changes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
