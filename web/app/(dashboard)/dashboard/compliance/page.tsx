"use client";

import { ShieldCheck, Download, RefreshCw, Sparkles, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceProvider, useComplianceContext } from "@/lib/compliance/context";
import { ComplianceLayoutManager } from "@/components/dashboard/compliance/layout-manager";
import { CompliancePresetSwitcher } from "@/components/dashboard/compliance/preset-switcher";
import { ComplianceWidgetPicker } from "@/components/dashboard/compliance/widget-picker";

function ComplianceContent() {
  const {
    currentPresetId,
    activeWidgets,
    layout,
    isCustomized,
    selectedJurisdiction,
    setSelectedJurisdiction,
    applyPreset,
    updateLayout,
    removeWidget,
    toggleWidget,
    resetToDefault,
  } = useComplianceContext();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Title & Description */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-brand-900">
                Compliance & Governance
              </h1>
              <Badge variant="brand" className="bg-brand-500/10 text-brand-600 border-brand-500/20">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Audit Ready
              </Badge>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-brand-700/80 max-w-2xl">
              Monitor regulatory changes, manage essential documentation, and ensure pay equity across all jurisdictions.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <CompliancePresetSwitcher
              currentPresetId={currentPresetId}
              isCustomized={isCustomized}
              onSelectPreset={applyPreset}
              onReset={resetToDefault}
            />
            <ComplianceWidgetPicker
              activeWidgets={activeWidgets}
              onToggleWidget={toggleWidget}
            />
            <div className="hidden h-10 w-px bg-border/60 sm:block mx-1" />
            <Button variant="ghost" className="h-11 bg-white hover:bg-brand-50 border border-border/40 px-5">
              <Download className="mr-2 h-4 w-4 text-brand-600" />
              Audit Report
            </Button>
          </div>
        </div>

        {/* Context bar */}
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-border/40 bg-white/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-5 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 text-[11px] font-bold text-emerald-600 border border-emerald-500/20">
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
              98.2% Compliance Score
            </div>
          </div>
          <div className="h-4 w-px bg-brand-200" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-700">Jurisdiction:</span>
            <select 
              value={selectedJurisdiction}
              onChange={(e) => setSelectedJurisdiction(e.target.value)}
              className="bg-transparent text-sm font-bold text-brand-900 outline-none cursor-pointer hover:text-brand-600 transition-colors"
            >
              <option value="UAE">UAE (Dubai/AD)</option>
              <option value="KSA">Saudi Arabia (KSA)</option>
              <option value="Qatar">Qatar</option>
              <option value="All">Global Overview</option>
            </select>
          </div>
          <div className="h-4 w-px bg-brand-200" />
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-brand-500" />
            <span className="text-sm text-brand-700">
              Filtering: <strong className="text-brand-900">Active Employees</strong>
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 text-brand-500" />
            <span className="text-xs text-brand-500">
              Last audit: 45 minutes ago
            </span>
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <ComplianceLayoutManager
        layout={layout}
        activeWidgets={activeWidgets}
        onLayoutChange={updateLayout}
        onRemoveWidget={removeWidget}
      />

      {/* Empty state */}
      {activeWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand-200 bg-brand-50/30 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-500">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-brand-900">
            Compliance Dashboard is Empty
          </h3>
          <p className="mt-1 text-sm text-brand-600">
            Click "Add Widgets" to start monitoring your regulatory posture.
          </p>
          <Button className="mt-4" onClick={() => toggleWidget("labor-law-tracker")}>
            Add Labor Law Tracker
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CompliancePage() {
  return (
    <ComplianceProvider>
      <ComplianceContent />
    </ComplianceProvider>
  );
}
