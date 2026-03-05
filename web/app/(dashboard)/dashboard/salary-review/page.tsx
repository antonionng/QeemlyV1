"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Calendar, RefreshCw, Download, Upload, Loader2, Sparkles, UserPlus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiDistributionModal, ReviewTable } from "@/components/dashboard/salary-review";
import { UploadModal } from "@/components/dashboard/upload";
import { useSalaryReview, type SalaryReviewAiPlanRequest } from "@/lib/salary-review";
import { REVIEW_CYCLES, type ReviewCycle } from "@/lib/company";
import { formatAED, formatAEDCompact, type Department } from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";
import { LOCATIONS, LEVELS, ROLES } from "@/lib/dashboard/dummy-data";
import { createEmployee } from "./actions";

const PERCENTAGE_BUDGET_SUGGESTIONS = [2, 3, 5, 8, 10];
const ABSOLUTE_BUDGET_SUGGESTIONS = [25000, 50000, 100000, 250000, 500000];
const DEPARTMENTS: Department[] = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "HR",
];

type AddEmployeeForm = {
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  roleId: string;
  levelId: string;
  locationId: string;
  baseSalary: string;
  hireDate: string;
};

const DEFAULT_ADD_EMPLOYEE_FORM: AddEmployeeForm = {
  firstName: "",
  lastName: "",
  email: "",
  department: DEPARTMENTS[0],
  roleId: ROLES[0]?.id ?? "",
  levelId: LEVELS[0]?.id ?? "",
  locationId: LOCATIONS[0]?.id ?? "",
  baseSalary: "",
  hireDate: "",
};

export default function SalaryReviewPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [addAnotherOnSave, setAddAnotherOnSave] = useState(false);
  const [addEmployeeForm, setAddEmployeeForm] = useState<AddEmployeeForm>(DEFAULT_ADD_EMPLOYEE_FORM);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const {
    settings,
    employees,
    isLoading,
    totalCurrentPayroll,
    totalProposedPayroll,
    totalIncrease,
    budgetUsed,
    budgetRemaining,
    updateSettings,
    applyDefaultIncreases,
    applyAiProposal,
    resetReview,
    loadEmployeesFromDb,
  } = useSalaryReview();

  // Load employees from database on mount
  useEffect(() => {
    loadEmployeesFromDb();
  }, [loadEmployeesFromDb]);

  const { salaryView } = useSalaryView();
  const [showSettings, setShowSettings] = useState(true);
  const [budgetInput, setBudgetInput] = useState(
    settings.budgetType === "percentage"
      ? (settings.budgetPercentage === 0 ? "" : String(settings.budgetPercentage))
      : (settings.budgetAbsolute === 0 ? "" : String(settings.budgetAbsolute))
  );

  const budget = settings.budgetType === "percentage"
    ? totalCurrentPayroll * (settings.budgetPercentage / 100)
    : settings.budgetAbsolute;

  const budgetUsedPercentage = budget > 0 ? (budgetUsed / budget) * 100 : 0;
  const isOverBudget = budgetUsed > budget;

  const selectedCount = employees.filter(e => e.isSelected).length;
  const selectedEmployeeIds = employees.filter((employee) => employee.isSelected).map((employee) => employee.id);
  const withIncreaseCount = employees.filter(e => e.proposedIncrease > 0).length;
  const currentBudgetSuggestions = settings.budgetType === "percentage"
    ? PERCENTAGE_BUDGET_SUGGESTIONS
    : ABSOLUTE_BUDGET_SUGGESTIONS;
  const aiPlanRequest: SalaryReviewAiPlanRequest = {
    mode: "assistive",
    cycle: settings.cycle,
    budgetType: settings.budgetType,
    budgetPercentage: settings.budgetPercentage,
    budgetAbsolute: settings.budgetAbsolute,
    selectedEmployeeIds,
  };

  const handleBudgetInputChange = (value: string) => {
    const normalizedValue = value.replace(/,/g, "").trim();
    if (!/^\d*\.?\d*$/.test(normalizedValue)) return;

    setBudgetInput(normalizedValue);

    if (normalizedValue === "") {
      if (settings.budgetType === "percentage") {
        updateSettings({ budgetPercentage: 0 });
      } else {
        updateSettings({ budgetAbsolute: 0 });
      }
      return;
    }

    const parsedValue = Number(normalizedValue);
    if (!Number.isFinite(parsedValue)) return;

    if (settings.budgetType === "percentage") {
      updateSettings({ budgetPercentage: parsedValue });
    } else {
      updateSettings({ budgetAbsolute: parsedValue });
    }
  };

  const handleAddEmployee = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    setIsCreatingEmployee(true);

    const result = await createEmployee({
      firstName: addEmployeeForm.firstName,
      lastName: addEmployeeForm.lastName,
      email: addEmployeeForm.email || undefined,
      department: addEmployeeForm.department,
      roleId: addEmployeeForm.roleId,
      levelId: addEmployeeForm.levelId,
      locationId: addEmployeeForm.locationId,
      baseSalary: Number(addEmployeeForm.baseSalary),
      hireDate: addEmployeeForm.hireDate || undefined,
    });

    if (!result.success) {
      setFeedback({ type: "error", message: result.error });
      setIsCreatingEmployee(false);
      return;
    }

    if (addAnotherOnSave) {
      setFeedback({ type: "success", message: "Employee added. Add the next one." });
      setAddEmployeeForm((prev) => ({
        ...prev,
        firstName: "",
        lastName: "",
        email: "",
        baseSalary: "",
      }));
    } else {
      setFeedback({ type: "success", message: "Employee added successfully." });
      setShowAddEmployeeModal(false);
      setAddEmployeeForm(DEFAULT_ADD_EMPLOYEE_FORM);
    }
    await loadEmployeesFromDb();
    setIsCreatingEmployee(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500 mx-auto" />
          <p className="mt-3 text-brand-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Page Header (reference: title + pill buttons inline) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">
          Salary Review
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setShowAddEmployeeModal(true)}
            className="h-9 rounded-full bg-brand-500 px-5 text-white hover:bg-brand-600"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetReview}
            className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Salary Cadence Toggle - Prominent */}
      <div className="flex items-center justify-between rounded-2xl border-2 border-brand-200 bg-gradient-to-r from-brand-50 to-white p-4">
        <div>
          <h3 className="text-sm font-semibold text-accent-900">Salary View</h3>
          <p className="text-xs text-accent-500 mt-0.5">Switch between monthly and annual salary figures</p>
        </div>
        <div className="flex rounded-xl border-2 border-brand-200 overflow-hidden">
          <button
            onClick={() => updateSettings({ cycle: "monthly" as ReviewCycle })}
            className={`px-6 py-2.5 text-sm font-semibold transition-all ${
              settings.cycle === "monthly"
                ? "bg-brand-500 text-white shadow-inner"
                : "bg-white text-accent-600 hover:bg-brand-50"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => updateSettings({ cycle: "annual" as ReviewCycle })}
            className={`px-6 py-2.5 text-sm font-semibold transition-all ${
              settings.cycle === "annual"
                ? "bg-brand-500 text-white shadow-inner"
                : "bg-white text-accent-600 hover:bg-brand-50"
            }`}
          >
            Annual
          </button>
        </div>
      </div>

      {/* Review Settings */}
      <Card className="dash-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-accent-900">Review Settings</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowAiModal(true)}
              className="h-8 rounded-full bg-brand-500 text-white px-4 text-xs hover:bg-brand-600"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Review AI Proposal
            </Button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs font-medium text-accent-500 hover:text-accent-700 transition-colors"
            >
              {showSettings ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="grid items-start gap-4 md:grid-cols-4">
            {/* Cycle */}
            <div>
              <select
                value={settings.cycle}
                onChange={(e) => updateSettings({ cycle: e.target.value as ReviewCycle })}
                className="w-full h-11 rounded-xl border border-border bg-white px-4 text-sm text-accent-900 focus:border-brand-300 focus:outline-none"
              >
                {REVIEW_CYCLES.map((cycle) => (
                  <option key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Amount */}
            <div>
              <Input
                type="text"
                inputMode="decimal"
                value={budgetInput}
                onFocus={() => {
                  if (budgetInput === "0") setBudgetInput("");
                }}
                onChange={(e) => handleBudgetInputChange(e.target.value)}
                placeholder={settings.budgetType === "percentage" ? "Enter budget %" : "Enter budget in AED"}
                className="rounded-xl"
                fullWidth
              />
              <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
                {currentBudgetSuggestions.map((value) => (
                  <button
                    key={`${settings.budgetType}-${value}`}
                    type="button"
                    onClick={() => {
                      const nextValue = String(value);
                      setBudgetInput(nextValue);
                      if (settings.budgetType === "percentage") {
                        updateSettings({ budgetPercentage: value });
                      } else {
                        updateSettings({ budgetAbsolute: value });
                      }
                    }}
                    className="shrink-0 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-accent-600 transition-colors hover:bg-accent-50"
                  >
                    {settings.budgetType === "percentage" ? `${value}%` : formatAEDCompact(value)}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Type Toggle */}
            <div className="self-start flex rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => {
                  setBudgetInput(settings.budgetPercentage === 0 ? "" : String(settings.budgetPercentage));
                  updateSettings({ budgetType: "percentage" });
                }}
                className={`flex-1 h-11 text-sm font-medium transition-colors ${
                  settings.budgetType === "percentage"
                    ? "bg-brand-500 text-white"
                    : "bg-white text-accent-600 hover:bg-accent-50"
                }`}
              >
                %
              </button>
              <button
                onClick={() => {
                  setBudgetInput(settings.budgetAbsolute === 0 ? "" : String(settings.budgetAbsolute));
                  updateSettings({ budgetType: "absolute" });
                }}
                className={`flex-1 h-11 text-sm font-medium transition-colors ${
                  settings.budgetType === "absolute"
                    ? "bg-brand-500 text-white"
                    : "bg-white text-accent-600 hover:bg-accent-50"
                }`}
              >
                AED
              </button>
            </div>

            {/* Effective Date */}
            <div className="relative">
              <Input
                type="date"
                value={settings.effectiveDate}
                onChange={(e) => updateSettings({ effectiveDate: e.target.value })}
                className="rounded-xl pl-3"
                fullWidth
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-400 pointer-events-none" />
            </div>
          </div>
        )}
      </Card>

      {/* Budget Impact KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="dash-card p-5">
          <div className="text-sm font-semibold text-accent-900 mb-0.5">Current Payroll</div>
          <div className="text-xs text-accent-500 mb-3">{employees.length} Employees total</div>
          <div className="text-2xl font-bold text-accent-900">{formatAEDCompact(applyViewMode(totalCurrentPayroll, salaryView))}</div>
        </Card>
        
        <Card className="dash-card p-5">
          <div className="text-sm font-semibold text-accent-900 mb-0.5">Proposed Payroll</div>
          <div className="text-xs text-accent-500 mb-3">
            {totalIncrease > 0 ? `+${formatAEDCompact(applyViewMode(totalIncrease, salaryView))} increase` : "0 AED Increase"}
          </div>
          <div className="text-2xl font-bold text-accent-900">{formatAEDCompact(applyViewMode(totalProposedPayroll, salaryView))}</div>
        </Card>
        
        <Card className="dash-card p-5">
          <div className="text-sm font-semibold text-accent-900 mb-0.5">Budget Allocation</div>
          <div className="text-xs text-accent-500 mb-3">
            {settings.budgetType === "percentage" ? `${settings.budgetPercentage}%` : "Fixed"}
          </div>
          <div className="text-2xl font-bold text-accent-900">{formatAEDCompact(applyViewMode(budget, salaryView))}</div>
        </Card>
        
        <Card className={`dash-card p-5 ${isOverBudget ? "ring-2 ring-red-400" : ""}`}>
          <div className="text-sm font-semibold text-accent-900 mb-0.5">Budget Status</div>
          <div className={`text-xs mb-3 ${isOverBudget ? "text-red-600" : "text-emerald-600"}`}>
            {isOverBudget ? "Over Budget" : "Within Budget"}
          </div>
          <div className={`text-2xl font-bold ${isOverBudget ? "text-red-600" : "text-emerald-600"}`}>
            {isOverBudget ? "-" : ""}{formatAEDCompact(applyViewMode(Math.abs(budgetRemaining), salaryView))}
          </div>
        </Card>
      </div>

      {/* Budget Progress Bar */}
      <Card className="dash-card p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <span className="text-sm font-semibold text-accent-900">Budget Usage</span>
            <span className="text-xs text-accent-500 ml-2">{selectedCount} employees selected</span>
          </div>
          <span className="text-xs text-accent-500">{withIncreaseCount} proposed increase{withIncreaseCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-lg font-bold text-accent-900 whitespace-nowrap">
            {formatAED(applyViewMode(budgetUsed, salaryView))} / {formatAED(applyViewMode(budget, salaryView))}
          </span>
          <span className={`text-sm font-semibold ${isOverBudget ? "text-red-600" : "text-emerald-600"}`}>
            {budgetUsedPercentage.toFixed(1)}%
          </span>
          <div className="flex-1 h-3.5 bg-accent-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget 
                  ? "bg-red-500" 
                  : budgetUsedPercentage > 90 
                  ? "bg-amber-500" 
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Review Table */}
      {employees.length === 0 ? (
        <Card className="dash-card p-8 text-center">
          <div className="mx-auto max-w-xl space-y-3">
            <h3 className="text-lg font-semibold text-accent-900">No employees yet</h3>
            <p className="text-sm text-accent-600">
              Add one employee in seconds, or import a file when you are ready for bulk updates.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => setShowAddEmployeeModal(true)}
                className="h-9 rounded-full bg-brand-500 px-5 text-white hover:bg-brand-600"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadModal(true)}
                className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
              >
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <ReviewTable />
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="Close add employee modal"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!isCreatingEmployee) setShowAddEmployeeModal(false);
            }}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-2xl mx-4">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-accent-900">Add Employee</h3>
                <p className="text-sm text-accent-500">
                  Quick add for one employee without going through the upload flow.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-1.5 text-accent-500 hover:bg-accent-100 hover:text-accent-700"
                onClick={() => setShowAddEmployeeModal(false)}
                disabled={isCreatingEmployee}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={addEmployeeForm.firstName}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First name"
                  required
                  fullWidth
                />
                <Input
                  value={addEmployeeForm.lastName}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last name"
                  required
                  fullWidth
                />
              </div>

              <Input
                type="email"
                value={addEmployeeForm.email}
                onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email (optional)"
                fullWidth
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={addEmployeeForm.department}
                  onChange={(e) =>
                    setAddEmployeeForm((prev) => ({
                      ...prev,
                      department: e.target.value as Department,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
                  required
                >
                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={addEmployeeForm.baseSalary}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, baseSalary: e.target.value }))}
                  placeholder="Base salary (annual)"
                  required
                  fullWidth
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={addEmployeeForm.roleId}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, roleId: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
                  required
                >
                  {ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                    </option>
                  ))}
                </select>
                <select
                  value={addEmployeeForm.levelId}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, levelId: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
                  required
                >
                  {LEVELS.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
                <select
                  value={addEmployeeForm.locationId}
                  onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, locationId: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
                  required
                >
                  {LOCATIONS.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.city}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                type="date"
                value={addEmployeeForm.hireDate}
                onChange={(e) => setAddEmployeeForm((prev) => ({ ...prev, hireDate: e.target.value }))}
                fullWidth
              />

              <label className="inline-flex items-center gap-2 text-sm text-accent-700">
                <input
                  type="checkbox"
                  checked={addAnotherOnSave}
                  onChange={(e) => setAddAnotherOnSave(e.target.checked)}
                  className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                />
                Add another after save
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddEmployeeModal(false)}
                  disabled={isCreatingEmployee}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isCreatingEmployee} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Save Employee
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AiDistributionModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        request={aiPlanRequest}
        onApprove={({ plan, selectedEmployeeIds: approvedIds }) => {
          if (plan.items.length === 0) {
            applyDefaultIncreases();
            return;
          }
          applyAiProposal(plan, approvedIds);
        }}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        type="compensation"
        onSuccess={() => {
          loadEmployeesFromDb();
          setShowUploadModal(false);
        }}
      />
    </div>
  );
}
