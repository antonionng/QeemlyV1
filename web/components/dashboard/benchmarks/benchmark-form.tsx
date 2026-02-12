"use client";

import { useState } from "react";
import { Search, ChevronDown, ArrowRight, Info, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  useBenchmarkState, 
  EXTENDED_LOCATIONS, 
  type BenchmarkContext 
} from "@/lib/benchmarks/benchmark-state";
import { ROLES, LEVELS, INDUSTRIES, COMPANY_SIZES } from "@/lib/dashboard/dummy-data";
import { useCompanySettings, FUNDING_STAGES, type TargetPercentile } from "@/lib/company";

export function BenchmarkForm() {
  const { 
    formData, 
    isFormComplete, 
    updateFormField, 
    runBenchmark,
    resetForm 
  } = useBenchmarkState();
  
  const companySettings = useCompanySettings();
  const [roleSearch, setRoleSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Filter roles based on search
  const filteredRoles = ROLES.filter(role => 
    role.title.toLowerCase().includes(roleSearch.toLowerCase()) ||
    role.family.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const handleContextChange = (context: BenchmarkContext) => {
    updateFormField("context", context);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormComplete) {
      runBenchmark();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Context Selection */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-brand-900 mb-4">Context</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { value: "existing", label: "Existing employee" },
            { value: "new-hire", label: "New hire" },
            { value: "relocating", label: "Relocating employee" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleContextChange(option.value as BenchmarkContext)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                formData.context === option.value
                  ? "bg-brand-500 text-white shadow-md"
                  : "bg-brand-50 text-brand-700 hover:bg-brand-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Role Details */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-brand-900 mb-4">Role Details</h3>
        
        <div className="space-y-4">
          {/* Role Title Search */}
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-2">
              Role Title
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
              <Input
                type="text"
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="pl-11 w-full"
                fullWidth
              />
            </div>
            
            {/* Role selection grid */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {filteredRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => updateFormField("roleId", role.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    formData.roleId === role.id
                      ? "bg-brand-500 text-white ring-2 ring-brand-500 ring-offset-2"
                      : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  }`}
                >
                  <div className="text-sm font-medium truncate">{role.title}</div>
                  <div className={`text-xs ${formData.roleId === role.id ? "text-brand-100" : "text-brand-500"}`}>
                    {role.family}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-2">
              Level
            </label>
            <div className="relative">
              <select
                value={formData.levelId || ""}
                onChange={(e) => updateFormField("levelId", e.target.value || null)}
                className="w-full h-12 rounded-full border border-border bg-white px-4 pr-10 text-sm text-brand-900 focus:border-brand-300 focus:outline-none appearance-none"
              >
                <option value="">Select level...</option>
                {LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400 pointer-events-none" />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-2">
              Location
            </label>
            <div className="relative">
              <select
                value={formData.locationId || ""}
                onChange={(e) => updateFormField("locationId", e.target.value || null)}
                className="w-full h-12 rounded-full border border-border bg-white px-4 pr-10 text-sm text-brand-900 focus:border-brand-300 focus:outline-none appearance-none"
              >
                <option value="">Select location...</option>
                <optgroup label="United Kingdom">
                  {EXTENDED_LOCATIONS.filter(l => l.countryCode === "GB").map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.city}, {location.country}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="GCC">
                  {EXTENDED_LOCATIONS.filter(l => l.countryCode !== "GB").map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.city}, {location.country}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400 pointer-events-none" />
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-sm font-medium text-brand-700 mb-2">
              Employment Type
            </label>
            <div className="flex gap-3">
              {[
                { value: "national", label: "National" },
                { value: "expat", label: "Expat" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateFormField("employmentType", option.value as "national" | "expat")}
                  className={`flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    formData.employmentType === option.value
                      ? "bg-brand-500 text-white"
                      : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Current Salary (for existing/relocating) */}
      {(formData.context === "existing" || formData.context === "relocating") && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-brand-900 mb-4">Current Salary Range</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-2">
                Low
              </label>
              <Input
                type="number"
                placeholder="e.g. 60000"
                value={formData.currentSalaryLow || ""}
                onChange={(e) => updateFormField("currentSalaryLow", e.target.value ? Number(e.target.value) : null)}
                fullWidth
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-2">
                High
              </label>
              <Input
                type="number"
                placeholder="e.g. 75000"
                value={formData.currentSalaryHigh || ""}
                onChange={(e) => updateFormField("currentSalaryHigh", e.target.value ? Number(e.target.value) : null)}
                fullWidth
              />
            </div>
          </div>
        </Card>
      )}

      {/* Market Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-brand-900">Market Filters</h3>
            <Badge variant="muted" className="text-xs">
              Using company defaults
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            <Settings className="h-3.5 w-3.5" />
            {showAdvanced ? "Hide" : "Override"}
          </button>
        </div>

        {/* Default values display */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1.5 rounded-full bg-brand-50 text-xs font-medium text-brand-700">
            {companySettings.industry}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-brand-50 text-xs font-medium text-brand-700">
            {companySettings.companySize}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-brand-50 text-xs font-medium text-brand-700">
            {companySettings.fundingStage}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-brand-50 text-xs font-medium text-brand-700">
            Target: {companySettings.targetPercentile}th percentile
          </span>
        </div>

        {/* Override fields */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              <Info className="h-3.5 w-3.5" />
              <span>Overrides are for this search only and won&apos;t change company defaults.</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  Industry
                </label>
                <select
                  value={formData.industry || ""}
                  onChange={(e) => updateFormField("industry", e.target.value || null)}
                  className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                >
                  <option value="">Use default</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  Company Size
                </label>
                <select
                  value={formData.companySize || ""}
                  onChange={(e) => updateFormField("companySize", e.target.value || null)}
                  className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                >
                  <option value="">Use default</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size} employees
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  Funding Stage
                </label>
                <select
                  value={formData.fundingStage || ""}
                  onChange={(e) => updateFormField("fundingStage", e.target.value || null)}
                  className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                >
                  <option value="">Use default</option>
                  {FUNDING_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  Target Percentile
                </label>
                <select
                  value={formData.targetPercentile || ""}
                  onChange={(e) => updateFormField("targetPercentile", e.target.value ? Number(e.target.value) as TargetPercentile : null)}
                  className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                >
                  <option value="">Use default ({companySettings.targetPercentile}th)</option>
                  <option value="25">25th (Below Market)</option>
                  <option value="50">50th (Market Median)</option>
                  <option value="75">75th (Above Market)</option>
                  <option value="90">90th (Premium)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={resetForm}>
          Reset
        </Button>
        <Button type="submit" disabled={!isFormComplete} className="px-8">
          Run Benchmark
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
