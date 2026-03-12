"use client";

import { useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import {
  Calendar,
  ChevronDown,
  Download,
  Search,
  Settings2,
  TrendingUp,
  Upload,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildBenchmarkTrustLabels } from "@/lib/benchmarks/trust";
import {
  ALL_COLUMNS,
  type ColumnKey,
  type ReviewEmployee,
  useSalaryReview,
} from "@/lib/salary-review";
import { applySalaryReviewFilters } from "@/lib/salary-review/filters";
import { buildSalaryReviewBudgetModel } from "@/lib/salary-review/workspace-budget";
import type { SalaryReviewProposalRecord } from "@/lib/salary-review/proposal-types";
import {
  computeAttritionRisk,
  computeTenure,
  formatAED,
  formatAEDCompact,
  generateCompensationHistory,
} from "@/lib/employees";

type SalaryReviewHeaderProps = {
  actionLabel: string;
  onPrimaryAction: () => void;
  onImport: () => void;
  onExport: () => void;
  onReset: () => void;
};

type ReviewSettingsCardProps = {
  title?: string;
  body?: string;
};

type SalaryReviewFiltersProps = {
  actions?: ReactNode;
};

type SalaryReviewTableProps = {
  onSelectEmployee: (employee: ReviewEmployee) => void;
};

type ReviewCycleListCardProps = {
  cycles: SalaryReviewProposalRecord[];
  activeCycleId: string | null;
  onStartWizard: () => void;
  onSelectCycle: (cycleId: string) => void;
};

type SalaryReviewOverviewProps = {
  cycles: SalaryReviewProposalRecord[];
  activeCycle: SalaryReviewProposalRecord | null;
  actionLabel: string;
  onPrimaryAction: () => void;
  onImport: () => void;
  onExport: () => void;
  onReset: () => void;
  onSelectCycle: (cycleId: string) => void;
};

const BAND_STYLES: Record<ReviewEmployee["bandPosition"], string> = {
  "in-band": "bg-[#E6F7EE] text-[#15803D]",
  above: "bg-[#FFF3E8] text-[#C2410C]",
  below: "bg-[#FFE4E6] text-[#BE123C]",
};

const PERFORMANCE_STYLES: Record<string, string> = {
  exceptional: "bg-[#EEE8FF] text-[#6E56CF]",
  exceeds: "bg-[#E6F7EE] text-[#15803D]",
  meets: "bg-[#FFF7E6] text-[#B45309]",
  low: "bg-[#FFE4E6] text-[#BE123C]",
};

function deriveAllowanceBreakdown(currentSalary: number) {
  const basic = Math.round(currentSalary * 0.53);
  const housing = Math.round(currentSalary * 0.28);
  const transport = Math.round(currentSalary * 0.11);
  const other = Math.max(currentSalary - basic - housing - transport, 0);
  return { basic, housing, transport, other };
}

function formatCycleLabel(cycle: SalaryReviewProposalRecord["cycle"]) {
  return cycle === "monthly" ? "Monthly Review" : "Annual Review";
}

function formatStatusLabel(status: SalaryReviewProposalRecord["status"]) {
  return status.replaceAll("_", " ");
}

function getCycleStatusClass(status: SalaryReviewProposalRecord["status"]) {
  switch (status) {
    case "approved":
    case "applied":
      return "bg-[#E6F7EE] text-[#15803D]";
    case "submitted":
    case "in_review":
      return "bg-[#FFF7E6] text-[#B45309]";
    case "rejected":
      return "bg-[#FFE4E6] text-[#BE123C]";
    default:
      return "bg-[#F2EDFF] text-[#6E56CF]";
  }
}

function SummaryCard({
  label,
  value,
  meta,
  valueClassName,
}: {
  label: string;
  value: string;
  meta: string;
  valueClassName?: string;
}) {
  return (
    <Card className="rounded-[14px] border-[#E6E8F0] bg-white p-5 shadow-none">
      <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">{label}</p>
      <p className={clsx("mt-4 text-[28px] font-semibold text-[#1F2430]", valueClassName)}>{value}</p>
      <p className="mt-1 text-xs text-[#8A90A0]">{meta}</p>
    </Card>
  );
}

export function SalaryReviewHeader({
  actionLabel,
  onPrimaryAction,
  onImport,
  onExport,
  onReset,
}: SalaryReviewHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-semibold text-[#1F2430]">Salary Review</h1>
        <p className="mt-2 text-sm text-[#2E3440]">
          Work through salary proposals in the overview workspace, then use the wizard to set up or submit a cycle.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onPrimaryAction}
          className="h-10 rounded-[10px] bg-[linear-gradient(135deg,#6E56CF,#7C6AF2)] px-4 text-white hover:bg-[#5B46C2]"
        >
          {actionLabel}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onImport}
          className="h-10 rounded-[10px] border-[#E6E8F0] bg-[#F4F5FB] px-4 text-[#2E3440]"
        >
          <Upload className="h-4 w-4" />
          Import
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onExport}
          className="h-10 rounded-[10px] border-[#E6E8F0] bg-[#F4F5FB] px-4 text-[#2E3440]"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onReset}
          className="h-10 rounded-[10px] border-[#E6E8F0] bg-[#F4F5FB] px-4 text-[#2E3440]"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}

export function ReviewSettingsCard({
  title = "Review Settings",
  body = "Configure the active review cycle before adjusting employee proposals.",
}: ReviewSettingsCardProps) {
  const { settings, updateSettings } = useSalaryReview();
  const budgetInput =
    settings.budgetType === "percentage"
      ? (settings.budgetPercentage === 0 ? "" : String(settings.budgetPercentage))
      : (settings.budgetAbsolute === 0 ? "" : String(settings.budgetAbsolute));

  return (
    <Card className="rounded-2xl border-[#E6E8F0] bg-white p-6 shadow-none">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[#1F2430]">{title}</h2>
        <p className="mt-1 text-sm text-[#8A90A0]">{body}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">
            Review Cycle
          </label>
          <div className="relative">
            <select
              value={settings.cycle}
              onChange={(event) =>
                updateSettings({
                  cycle: event.target.value === "monthly" ? "monthly" : "annual",
                })
              }
              className="h-11 w-full appearance-none rounded-[10px] border border-[#E6E8F0] bg-white px-4 text-sm text-[#2E3440] focus:border-[#6E56CF] focus:outline-none"
            >
              <option value="annual">Annual Cycle</option>
              <option value="monthly">Monthly Cycle</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A90A0]" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">
            Budget
          </label>
          <div className="rounded-[10px] border border-[#E6E8F0] bg-white p-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={budgetInput}
                onChange={(event) => {
                  const normalized = event.target.value.replace(/,/g, "").trim();
                  if (!/^\d*\.?\d*$/.test(normalized)) return;
                  if (normalized === "") {
                    updateSettings({
                      budgetPercentage: 0,
                      budgetAbsolute: 0,
                    });
                    return;
                  }
                  const parsed = Number(normalized);
                  if (!Number.isFinite(parsed)) return;
                  updateSettings(
                    settings.budgetType === "percentage"
                      ? { budgetPercentage: parsed }
                      : { budgetAbsolute: parsed }
                  );
                }}
                placeholder={settings.budgetType === "percentage" ? "6" : "250000"}
                className="h-9 flex-1 rounded-[8px] border-0 px-3 text-sm text-[#2E3440] outline-none"
              />
              <div className="flex rounded-[8px] bg-[#F4F5FB] p-0.5">
                <button
                  type="button"
                  onClick={() => updateSettings({ budgetType: "percentage" })}
                  className={clsx(
                    "h-9 rounded-[8px] px-4 text-sm font-medium transition-colors",
                    settings.budgetType === "percentage"
                      ? "bg-[#6E56CF] text-white"
                      : "text-[#2E3440]"
                  )}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ budgetType: "absolute" })}
                  className={clsx(
                    "h-9 rounded-[8px] px-4 text-sm font-medium transition-colors",
                    settings.budgetType === "absolute"
                      ? "bg-[#6E56CF] text-white"
                      : "text-[#2E3440]"
                  )}
                >
                  AED
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">
            Effective Date
          </label>
          <div className="relative">
            <Input
              type="date"
              value={settings.effectiveDate}
              onChange={(event) => updateSettings({ effectiveDate: event.target.value })}
              className="h-11 rounded-[10px] border-[#E6E8F0] bg-white pr-10 text-[#2E3440] focus:border-[#6E56CF] focus:ring-[0_0_0_2px_rgba(110,86,207,0.15)]"
              fullWidth
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A90A0]" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PayrollSummaryCards() {
  const {
    employees,
    settings,
    totalCurrentPayroll,
    totalProposedPayroll,
    budgetUsed,
    budgetRemaining,
  } = useSalaryReview();
  const budgetModel = buildSalaryReviewBudgetModel({
    budgetType: settings.budgetType,
    budgetPercentage: settings.budgetPercentage,
    budgetAbsolute: settings.budgetAbsolute,
    totalCurrentPayroll,
    budgetUsed,
    selectedEmployees: employees.filter((employee) => employee.isSelected).length,
    proposedEmployees: employees.filter((employee) => employee.proposedIncrease > 0).length,
  });
  const budgetStatusLabel =
    budgetRemaining >= 0 ? `Within budget by ${formatAEDCompact(budgetRemaining)}` : `Over budget by ${formatAEDCompact(Math.abs(budgetRemaining))}`;

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <SummaryCard label="Current Payroll" value={formatAEDCompact(totalCurrentPayroll)} meta={`${employees.length} employees total`} />
      <SummaryCard label="Proposed Payroll" value={formatAEDCompact(totalProposedPayroll)} meta={`${employees.filter((employee) => employee.proposedIncrease > 0).length} employees adjusted`} />
      <SummaryCard label="Budget Allocation" value={formatAEDCompact(budgetModel.totalBudget)} meta={settings.budgetType === "percentage" ? `${settings.budgetPercentage}% allocation` : "Fixed AED budget"} />
      <SummaryCard label="Budget Status" value={formatAEDCompact(Math.abs(budgetRemaining))} meta={budgetStatusLabel} valueClassName="text-[#16A34A]" />
    </div>
  );
}

export function BudgetUsageBar() {
  const { employees, settings, totalCurrentPayroll, budgetUsed } = useSalaryReview();
  const budgetModel = buildSalaryReviewBudgetModel({
    budgetType: settings.budgetType,
    budgetPercentage: settings.budgetPercentage,
    budgetAbsolute: settings.budgetAbsolute,
    totalCurrentPayroll,
    budgetUsed,
    selectedEmployees: employees.filter((employee) => employee.isSelected).length,
    proposedEmployees: employees.filter((employee) => employee.proposedIncrease > 0).length,
  });
  const percent = budgetModel.totalBudget > 0 ? (budgetUsed / budgetModel.totalBudget) * 100 : 0;

  return (
    <Card className="rounded-2xl border-[#E6E8F0] bg-white p-6 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1F2430]">Budget Usage</h2>
          <p className="mt-1 text-xs text-[#8A90A0]">
            {employees.filter((employee) => employee.isSelected).length} employees selected
          </p>
        </div>
        <p className="text-xs text-[#8A90A0]">
          {employees.filter((employee) => employee.proposedIncrease > 0).length} proposed increase
        </p>
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-4">
        <p className="text-[28px] font-semibold text-[#1F2430]">
          {formatAEDCompact(budgetUsed)} / {formatAEDCompact(budgetModel.totalBudget)}
        </p>
        <p className="pb-1 text-sm font-medium text-[#16A34A]">{percent.toFixed(1)}%</p>
      </div>
      <div className="mt-4 h-2 rounded-full bg-[#EEF0F6]">
        <div
          className="h-2 rounded-full bg-[#16A34A]"
          style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        />
      </div>
    </Card>
  );
}

export function ColumnVisibilityPanel() {
  const { visibleColumns, toggleColumnVisibility } = useSalaryReview();
  const [open, setOpen] = useState(false);
  const visibleColumnKeys = ALL_COLUMNS.filter((column) =>
    ["role", "department", "location", "current", "basic", "housing", "transport", "other", "band", "performance", "increase"].includes(column.key)
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E6E8F0] bg-white text-[#6E56CF] transition-colors hover:bg-[#F4F5FB]"
        aria-label="Column settings"
      >
        <Settings2 className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-20 w-[260px] rounded-2xl border border-[#E6E8F0] bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1F2430]">Show in table</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-[#8A90A0]"
            >
              Close
            </button>
          </div>
          <div className="space-y-3">
            {visibleColumnKeys.map((column) => (
              <label key={column.key} className="flex items-center gap-3 text-sm text-[#2E3440]">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column.key)}
                  onChange={() => toggleColumnVisibility(column.key)}
                  className="h-4 w-4 rounded border border-[#DADFF0] [accent-color:#6E56CF]"
                />
                <span>{column.label.replace(" Salary", "").replace(" Allowances", "")}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SalaryReviewFilters({ actions }: SalaryReviewFiltersProps) {
  const { filters, updateFilters, resetFilters, settings } = useSalaryReview();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA0AE]" />
        <Input
          value={filters.search}
          onChange={(event) => updateFilters({ search: event.target.value })}
          placeholder="Search Employees"
          className="h-10 rounded-full border-[#E6E8F0] bg-white pl-10 text-[#2E3440]"
          fullWidth
        />
      </div>
      <select
        value={filters.department}
        onChange={(event) => updateFilters({ department: event.target.value })}
        className="h-10 min-w-[170px] rounded-full border border-[#E6E8F0] bg-white px-4 text-sm text-[#2E3440] outline-none"
      >
        <option value="all">All Departments</option>
        {Array.from(new Set(useSalaryReview.getState().employees.map((employee) => employee.department))).map((department) => (
          <option key={department} value={department}>
            {department}
          </option>
        ))}
      </select>
      <select
        value={filters.location}
        onChange={(event) => updateFilters({ location: event.target.value })}
        className="h-10 min-w-[170px] rounded-full border border-[#E6E8F0] bg-white px-4 text-sm text-[#2E3440] outline-none"
      >
        <option value="all">All Locations</option>
        {Array.from(new Set(useSalaryReview.getState().employees.map((employee) => employee.location.city))).map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </select>
      <select
        value={filters.pool}
        onChange={(event) => updateFilters({ pool: event.target.value as typeof filters.pool })}
        className="h-10 min-w-[160px] rounded-full border border-[#E6E8F0] bg-white px-4 text-sm text-[#2E3440] outline-none"
      >
        <option value="all">All Pools</option>
        <option value="general">General</option>
        <option value="leadership">Leadership</option>
      </select>
      <div className="relative">
        <Input
          type="date"
          value={settings.effectiveDate}
          onChange={(event) => useSalaryReview.getState().updateSettings({ effectiveDate: event.target.value })}
          className="h-10 min-w-[180px] rounded-full border-[#E6E8F0] pr-10"
        />
        <Calendar className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA0AE]" />
      </div>
      {actions}
      <button
        type="button"
        onClick={resetFilters}
        className="text-sm font-medium text-[#6E56CF]"
      >
        Clear
      </button>
    </div>
  );
}

export function EmployeeDrawer({
  employee,
  onClose,
}: {
  employee: ReviewEmployee | null;
  onClose: () => void;
}) {
  if (!employee) {
    return null;
  }

  const history = generateCompensationHistory(employee).slice(0, 4);
  const attritionRisk = computeAttritionRisk(employee);
  const tenure = computeTenure(employee.hireDate);
  const performanceLabel = employee.performanceRating
    ? employee.performanceRating.charAt(0).toUpperCase() + employee.performanceRating.slice(1)
    : "No performance review on file";
  const bandLabel = employee.bandPosition === "in-band" ? "In Band" : employee.bandPosition === "above" ? "Above Band" : "Below Band";

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20">
      <div className="h-full w-full max-w-[420px] overflow-y-auto bg-white px-6 py-8 shadow-[-24px_0_48px_rgba(0,0,0,0.12)]">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[32px] font-semibold leading-none text-[#1F2430]">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="mt-2 text-sm text-[#2E3440]">{employee.role.title}</p>
            <p className="mt-3 border-t border-[#E6E8F0] pt-3 text-sm text-[#8A90A0]">
              {employee.level.name} • {employee.department} • {employee.location.city} {employee.location.country}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-[#8A90A0]">
            Close
          </button>
        </div>

        <section className="border-t border-[#E6E8F0] py-5">
          <h3 className="text-lg font-semibold text-[#1F2430]">Compensation History</h3>
          <div className="mt-4 space-y-4">
            {history.map((entry) => (
              <div key={`${employee.id}-${entry.effectiveDate.toISOString()}`} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[#8A90A0]">
                    {entry.effectiveDate.toLocaleDateString("en-GB")}
                  </p>
                  <p className="text-[32px] font-semibold leading-none text-[#1F2430]">
                    {formatAEDCompact(entry.baseSalary)}
                  </p>
                  <p className="mt-1 text-sm text-[#16A34A]">+{entry.changePercentage}%</p>
                </div>
                <span className="rounded-full bg-[#F2EDFF] px-3 py-1 text-xs font-medium text-[#6E56CF]">
                  {entry.changeReason.replaceAll("-", " ")}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-[#E6E8F0] py-5">
          <h3 className="text-lg font-semibold text-[#1F2430]">Attrition Risk Indicators</h3>
          <div className="mt-4 rounded-2xl bg-[#FFF1F2] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[28px] font-semibold text-[#EF4444]">
                {attritionRisk.overall === "critical" ? "High Risk" : `${attritionRisk.overall.charAt(0).toUpperCase()}${attritionRisk.overall.slice(1)} Risk`}
              </p>
              <p className="text-sm text-[#1F2430]">{attritionRisk.score}</p>
            </div>
            <div className="mt-3 h-3 rounded-full bg-[#E5E7EB]">
              <div
                className="h-3 rounded-full bg-[#EF4444]"
                style={{ width: `${attritionRisk.score}%` }}
              />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[#FFE4E6] bg-[#FFF1F2] p-4">
              <p className="text-sm font-semibold text-[#BE123C]">Market Position</p>
              <p className="mt-1 text-sm text-[#2E3440]">{employee.marketComparison}% vs market median</p>
            </div>
            <div className="rounded-2xl border border-[#E6E8F0] bg-[#F7F8FC] p-4">
              <p className="text-sm font-semibold text-[#1F2430]">Band</p>
              <p className="mt-1 text-sm text-[#2E3440]">{bandLabel}</p>
            </div>
            <div className="rounded-2xl border border-[#E6E8F0] bg-[#F7F8FC] p-4">
              <p className="text-sm font-semibold text-[#1F2430]">Tenure</p>
              <p className="mt-1 text-sm text-[#2E3440]">{tenure.label}</p>
            </div>
            <div className="rounded-2xl border border-[#E6E8F0] bg-[#F7F8FC] p-4">
              <p className="text-sm font-semibold text-[#1F2430]">Performance Alignment</p>
              <p className="mt-1 text-sm text-[#2E3440]">{performanceLabel}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function SalaryReviewTable({ onSelectEmployee }: SalaryReviewTableProps) {
  const {
    employees,
    filters,
    visibleColumns,
    updateEmployeeIncrease,
    toggleEmployeeSelection,
    selectAll,
    deselectAll,
  } = useSalaryReview();
  const [sortField, setSortField] = useState<"name" | "role" | "department" | "location" | "current" | "proposed" | "increase">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const visibleSet = new Set(visibleColumns);
  const filteredEmployees = useMemo(() => applySalaryReviewFilters(employees, { ...filters, tab: "overview", proposalId: null }), [employees, filters]);
  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((left, right) => {
      const comparison = (() => {
        switch (sortField) {
          case "role":
            return left.role.title.localeCompare(right.role.title);
          case "department":
            return left.department.localeCompare(right.department);
          case "location":
            return left.location.city.localeCompare(right.location.city);
          case "current":
            return left.baseSalary - right.baseSalary;
          case "proposed":
            return left.newSalary - right.newSalary;
          case "increase":
            return left.proposedPercentage - right.proposedPercentage;
          default:
            return `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`);
        }
      })();
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredEmployees, sortDirection, sortField]);

  const showColumn = (column: ColumnKey) => {
    if (column === "name" || column === "proposed") {
      return true;
    }
    return visibleSet.has(column);
  };

  const toggleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-[#E6E8F0] bg-white shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="border-b border-[#F0F2F7] bg-white">
            <tr className="h-12">
              <th className="px-4 text-left">
                <input
                  type="checkbox"
                  checked={employees.length > 0 && employees.every((employee) => employee.isSelected)}
                  onChange={(event) => (event.target.checked ? selectAll() : deselectAll())}
                  className="h-4 w-4 rounded [accent-color:#6E56CF]"
                />
              </th>
              <th className="px-4 text-left text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">
                <button type="button" onClick={() => toggleSort("name")}>Name</button>
              </th>
              {showColumn("role") ? <th className="px-4 text-left text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]"><button type="button" onClick={() => toggleSort("role")}>Role</button></th> : null}
              {showColumn("department") ? <th className="px-4 text-left text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]"><button type="button" onClick={() => toggleSort("department")}>Department</button></th> : null}
              {showColumn("location") ? <th className="px-4 text-left text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]"><button type="button" onClick={() => toggleSort("location")}>Location</button></th> : null}
              {showColumn("current") ? <th className="px-4 text-right text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]"><button type="button" onClick={() => toggleSort("current")}>Current (AED)</button></th> : null}
              {showColumn("basic") ? <th className="px-4 text-right text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Basic (AED)</th> : null}
              {showColumn("housing") ? <th className="px-4 text-right text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Housing (AED)</th> : null}
              {showColumn("transport") ? <th className="px-4 text-right text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Transport (AED)</th> : null}
              {showColumn("other") ? <th className="px-4 text-right text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Other (AED)</th> : null}
              {showColumn("band") ? <th className="px-4 text-center text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Band</th> : null}
              {showColumn("performance") ? <th className="px-4 text-center text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">Perf</th> : null}
              <th className="px-4 text-right text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]">
                <button type="button" onClick={() => toggleSort("proposed")}>Proposed (AED)</button>
              </th>
              {showColumn("increase") ? <th className="px-4 text-right text-xs font-medium uppercase tracking-[0.06em] text-[#7B8190]"><button type="button" onClick={() => toggleSort("increase")}>Increase</button></th> : null}
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.map((employee) => {
              const breakdown = deriveAllowanceBreakdown(employee.baseSalary);
              const trust = buildBenchmarkTrustLabels(employee.benchmarkContext);
              return (
                <tr
                  key={employee.id}
                  className="h-16 border-b border-[#F0F2F7] hover:bg-[#F7F8FC]"
                >
                  <td className="px-4">
                    <input
                      type="checkbox"
                      checked={employee.isSelected}
                      onChange={() => toggleEmployeeSelection(employee.id)}
                      className="h-4 w-4 rounded [accent-color:#6E56CF]"
                    />
                  </td>
                  <td className="px-4">
                    <button
                      type="button"
                      onClick={() => onSelectEmployee(employee)}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2EDFF] text-xs font-semibold text-[#6E56CF]">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#1F2430]">
                            {employee.firstName} {employee.lastName}
                          </span>
                          <span className="rounded-full bg-[#F2EDFF] px-2 py-1 text-[11px] text-[#6E56CF]">
                            {employee.level.name}
                          </span>
                        </div>
                        <p className="text-xs text-[#8A90A0]">{trust?.sourceLabel ?? "Market aligned"}</p>
                      </div>
                    </button>
                  </td>
                  {showColumn("role") ? <td className="px-4 text-sm text-[#2E3440]">{employee.role.title}</td> : null}
                  {showColumn("department") ? <td className="px-4 text-sm text-[#2E3440]">{employee.department}</td> : null}
                  {showColumn("location") ? <td className="px-4 text-sm text-[#2E3440]">{employee.location.city}</td> : null}
                  {showColumn("current") ? <td className="px-4 text-right text-sm text-[#1F2430]">{formatAED(employee.baseSalary)}</td> : null}
                  {showColumn("basic") ? <td className="px-4 text-right text-sm text-[#1F2430]">{formatAED(breakdown.basic)}<div className="text-xs text-[#8A90A0]">53%</div></td> : null}
                  {showColumn("housing") ? <td className="px-4 text-right text-sm text-[#1F2430]">{formatAED(breakdown.housing)}<div className="text-xs text-[#8A90A0]">28%</div></td> : null}
                  {showColumn("transport") ? <td className="px-4 text-right text-sm text-[#1F2430]">{formatAED(breakdown.transport)}<div className="text-xs text-[#8A90A0]">11%</div></td> : null}
                  {showColumn("other") ? <td className="px-4 text-right text-sm text-[#1F2430]">{formatAED(breakdown.other)}<div className="text-xs text-[#8A90A0]">8%</div></td> : null}
                  {showColumn("band") ? (
                    <td className="px-4 text-center">
                      <span className={clsx("inline-flex h-6 items-center rounded-full px-3 text-xs font-medium", BAND_STYLES[employee.bandPosition])}>
                        {employee.bandPosition === "in-band" ? "In Band" : employee.bandPosition === "above" ? "Above" : "Below"}
                      </span>
                    </td>
                  ) : null}
                  {showColumn("performance") ? (
                    <td className="px-4 text-center">
                      {employee.performanceRating ? (
                        <span className={clsx("inline-flex h-6 items-center rounded-full px-3 text-xs font-medium", PERFORMANCE_STYLES[employee.performanceRating])}>
                          {employee.performanceRating.charAt(0).toUpperCase() + employee.performanceRating.slice(1)}
                        </span>
                      ) : (
                        <span className="text-sm text-[#8A90A0]">-</span>
                      )}
                    </td>
                  ) : null}
                  <td className="px-4 text-right">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={Math.round(employee.newSalary)}
                      onChange={(event) => {
                        const nextSalary = Number(event.target.value);
                        updateEmployeeIncrease(employee.id, Math.max(nextSalary - employee.baseSalary, 0));
                      }}
                      className="h-9 w-[110px] rounded-[8px] border border-[#DADFF0] bg-white px-3 text-right text-sm text-[#1F2430] outline-none focus:border-[#6E56CF] focus:shadow-[0_0_0_2px_rgba(110,86,207,0.15)]"
                    />
                  </td>
                  {showColumn("increase") ? (
                    <td className="px-4 text-right">
                      {employee.proposedIncrease > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-[#16A34A]">
                          <TrendingUp className="h-3.5 w-3.5" />
                          +{employee.proposedPercentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-[#8A90A0]">-</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function ReviewCycleListCard({
  cycles,
  activeCycleId,
  onStartWizard,
  onSelectCycle,
}: ReviewCycleListCardProps) {
  return (
    <Card className="rounded-2xl border-[#E6E8F0] bg-white p-6 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1F2430]">Review Cycles</h2>
          <p className="mt-1 text-sm text-[#8A90A0]">Select an existing cycle or start a new review flow.</p>
        </div>
        <Button
          size="sm"
          onClick={onStartWizard}
          className="h-10 rounded-[10px] bg-[linear-gradient(135deg,#6E56CF,#7C6AF2)] px-4 text-white"
        >
          Start New Review Cycle
        </Button>
      </div>
      <div className="mt-5 space-y-3">
        {cycles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E6E8F0] bg-[#F7F8FC] p-4 text-sm text-[#8A90A0]">
            No saved review cycles yet.
          </div>
        ) : (
          cycles.map((cycle) => (
            <button
              key={cycle.id}
              type="button"
              onClick={() => onSelectCycle(cycle.id)}
              className={clsx(
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
                activeCycleId === cycle.id
                  ? "border-[#6E56CF] bg-[#F7F5FF]"
                  : "border-[#E6E8F0] bg-white hover:bg-[#F7F8FC]"
              )}
            >
              <div>
                <p className="text-sm font-semibold text-[#1F2430]">{formatCycleLabel(cycle.cycle)}</p>
                <p className="mt-1 text-xs text-[#8A90A0]">
                  Effective {cycle.effective_date} • {cycle.summary.selectedEmployees} employees
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={clsx("rounded-full px-3 py-1 text-xs font-medium capitalize", getCycleStatusClass(cycle.status))}>
                  {formatStatusLabel(cycle.status)}
                </span>
                <span className="text-sm font-medium text-[#6E56CF]">Open</span>
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}

export function SalaryReviewOverview({
  cycles,
  activeCycle,
  actionLabel,
  onPrimaryAction,
  onImport,
  onExport,
  onReset,
  onSelectCycle,
}: SalaryReviewOverviewProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<ReviewEmployee | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-8 py-8">
      <SalaryReviewHeader
        actionLabel={actionLabel}
        onPrimaryAction={onPrimaryAction}
        onImport={onImport}
        onExport={onExport}
        onReset={onReset}
      />
      <ReviewSettingsCard />
      <PayrollSummaryCards />
      <BudgetUsageBar />
      <ReviewCycleListCard
        cycles={cycles}
        activeCycleId={activeCycle?.id ?? null}
        onStartWizard={onPrimaryAction}
        onSelectCycle={onSelectCycle}
      />
      <Card className="rounded-2xl border-[#E6E8F0] bg-white p-4 shadow-none">
        <SalaryReviewFilters actions={<ColumnVisibilityPanel />} />
        <div className="mt-4">
          <SalaryReviewTable onSelectEmployee={setSelectedEmployee} />
        </div>
      </Card>
      <EmployeeDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </div>
  );
}
