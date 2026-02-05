"use client";

import { useState } from "react";
import { Calendar, Percent, DollarSign, Sparkles, RefreshCw, Download, AlertTriangle, CheckCircle, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ReviewTable } from "@/components/dashboard/salary-review";
import { UploadModal } from "@/components/dashboard/upload";
import { useSalaryReview, type BudgetType } from "@/lib/salary-review";
import { REVIEW_CYCLES, type ReviewCycle } from "@/lib/company";
import { formatAED, formatAEDCompact } from "@/lib/employees";

export default function SalaryReviewPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const {
    settings,
    employees,
    totalCurrentPayroll,
    totalProposedPayroll,
    totalIncrease,
    budgetUsed,
    budgetRemaining,
    updateSettings,
    applyDefaultIncreases,
    resetReview,
  } = useSalaryReview();

  const [showSettings, setShowSettings] = useState(true);

  const budget = settings.budgetType === "percentage"
    ? totalCurrentPayroll * (settings.budgetPercentage / 100)
    : settings.budgetAbsolute;

  const budgetUsedPercentage = (budgetUsed / budget) * 100;
  const isOverBudget = budgetUsed > budget;

  const selectedCount = employees.filter(e => e.isSelected).length;
  const withIncreaseCount = employees.filter(e => e.proposedIncrease > 0).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-brand-900">
                Salary Review
              </h1>
              <Badge variant="brand" className="bg-brand-500/10 text-brand-600 border-brand-500/20">
                {settings.cycle}
              </Badge>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-brand-700/80 max-w-2xl">
              Plan and execute your compensation review cycle. Set budgets, review employees, and apply increases.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button variant="ghost" onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="ghost" onClick={resetReview}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button variant="ghost">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={applyDefaultIncreases}>
              <Sparkles className="mr-2 h-4 w-4" />
              Auto-Distribute Budget
            </Button>
          </div>
        </div>
      </div>

      {/* Review Settings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-brand-900">Review Settings</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm text-brand-600 hover:text-brand-800"
          >
            {showSettings ? "Hide" : "Show"} settings
          </button>
        </div>

        {showSettings && (
          <div className="grid gap-6 md:grid-cols-4">
            {/* Cycle */}
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-2">
                Review Cycle
              </label>
              <select
                value={settings.cycle}
                onChange={(e) => updateSettings({ cycle: e.target.value as ReviewCycle })}
                className="w-full h-11 rounded-xl border border-border bg-white px-4 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
              >
                {REVIEW_CYCLES.map((cycle) => (
                  <option key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Type */}
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-2">
                Budget Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ budgetType: "percentage" })}
                  className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all ${
                    settings.budgetType === "percentage"
                      ? "bg-brand-500 text-white"
                      : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  }`}
                >
                  <Percent className="h-4 w-4 inline mr-1" />
                  %
                </button>
                <button
                  onClick={() => updateSettings({ budgetType: "absolute" })}
                  className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all ${
                    settings.budgetType === "absolute"
                      ? "bg-brand-500 text-white"
                      : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  }`}
                >
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  AED
                </button>
              </div>
            </div>

            {/* Budget Amount */}
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-2">
                {settings.budgetType === "percentage" ? "Budget %" : "Budget Amount"}
              </label>
              {settings.budgetType === "percentage" ? (
                <div className="relative">
                  <Input
                    type="number"
                    value={settings.budgetPercentage}
                    onChange={(e) => updateSettings({ budgetPercentage: Number(e.target.value) })}
                    className="pr-8 rounded-xl"
                    fullWidth
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-500">%</span>
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500 text-xs">AED</span>
                  <Input
                    type="number"
                    value={settings.budgetAbsolute}
                    onChange={(e) => updateSettings({ budgetAbsolute: Number(e.target.value) })}
                    className="pl-12 rounded-xl"
                    fullWidth
                  />
                </div>
              )}
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-2">
                Effective Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
                <Input
                  type="date"
                  value={settings.effectiveDate}
                  onChange={(e) => updateSettings({ effectiveDate: e.target.value })}
                  className="pl-11 rounded-xl"
                  fullWidth
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Budget Impact */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <div className="text-sm font-medium text-brand-600 mb-1">Current Payroll</div>
          <div className="text-2xl font-bold text-brand-900">{formatAEDCompact(totalCurrentPayroll)}</div>
          <div className="text-xs text-brand-500 mt-1">{employees.length} employees</div>
        </Card>
        
        <Card className="p-5">
          <div className="text-sm font-medium text-brand-600 mb-1">Proposed Payroll</div>
          <div className="text-2xl font-bold text-brand-900">{formatAEDCompact(totalProposedPayroll)}</div>
          <div className="text-xs text-emerald-600 mt-1">
            +{formatAEDCompact(totalIncrease)} increase
          </div>
        </Card>
        
        <Card className="p-5">
          <div className="text-sm font-medium text-brand-600 mb-1">Budget Allocation</div>
          <div className="text-2xl font-bold text-brand-900">{formatAEDCompact(budget)}</div>
          <div className="text-xs text-brand-500 mt-1">
            {settings.budgetType === "percentage" ? `${settings.budgetPercentage}%` : "Fixed"} budget
          </div>
        </Card>
        
        <Card className={`p-5 ${isOverBudget ? "ring-2 ring-red-500" : ""}`}>
          <div className="text-sm font-medium text-brand-600 mb-1">Budget Status</div>
          <div className={`text-2xl font-bold ${isOverBudget ? "text-red-600" : budgetRemaining < budget * 0.1 ? "text-amber-600" : "text-emerald-600"}`}>
            {isOverBudget ? "-" : ""}{formatAEDCompact(Math.abs(budgetRemaining))}
          </div>
          <div className="text-xs mt-1 flex items-center gap-1">
            {isOverBudget ? (
              <>
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-red-600">Over budget</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600">Within budget</span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Budget Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-brand-700">Budget Usage</span>
          <span className="text-sm font-medium text-brand-900">
            {formatAED(budgetUsed)} / {formatAED(budget)} ({budgetUsedPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="h-3 bg-brand-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isOverBudget 
                ? "bg-red-500" 
                : budgetUsedPercentage > 90 
                ? "bg-amber-500" 
                : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-brand-500">
          <span>{selectedCount} employees selected</span>
          <span>{withIncreaseCount} with proposed increases</span>
        </div>
      </Card>

      {/* Review Table */}
      <ReviewTable />

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        type="compensation"
        onSuccess={() => {
          // Refresh data after upload
          window.location.reload();
        }}
      />
    </div>
  );
}
