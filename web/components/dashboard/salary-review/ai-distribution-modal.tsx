"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import {
  type SalaryReviewAiPlanRequest,
  type SalaryReviewAiPlanResponse,
  type SalaryReviewAiScenarioResponse,
  type SalaryReviewAiScenario,
  type SalaryReviewAiObjective,
  type SalaryReviewAiBudgetIntent,
  type SalaryReviewAiBudgetType,
  type SalaryReviewAiPopulationRules,
} from "@/lib/salary-review";
import { formatAED, formatAEDCompact } from "@/lib/employees";
import { useSalaryReview } from "@/lib/salary-review/state";
import { buildSalaryReviewBudgetModel } from "@/lib/salary-review/workspace-budget";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type AiDistributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  request: SalaryReviewAiPlanRequest;
  onApprove: (args: { plan: SalaryReviewAiPlanResponse; selectedEmployeeIds?: string[] }) => void;
  onApproveScenario?: (args: { scenario: SalaryReviewAiScenario }) => void;
};

// ---------------------------------------------------------------------------
// Internal state machine
// ---------------------------------------------------------------------------

type ModalStep = "preferences" | "loading" | "scenarios" | "detail" | "error";

type PreferencesState = {
  objective: SalaryReviewAiObjective;
  budgetIntent: SalaryReviewAiBudgetIntent;
  budgetType: SalaryReviewAiBudgetType;
  budgetPercentage: number;
  budgetAbsolute: number;
  populationRules: SalaryReviewAiPopulationRules;
  contextNotes: string;
  selectedEmployeeIds: Set<string>;
};

type ScenarioLoadState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "ready"; response: SalaryReviewAiScenarioResponse };

function buildDefaultPreferences(request: SalaryReviewAiPlanRequest): PreferencesState {
  return {
    objective: "balanced",
    budgetIntent: "target",
    budgetType: request.budgetType,
    budgetPercentage: request.budgetPercentage ?? 0,
    budgetAbsolute: request.budgetAbsolute ?? 0,
    populationRules: {},
    contextNotes: "",
    selectedEmployeeIds: new Set(request.selectedEmployeeIds ?? []),
  };
}

const PERCENTAGE_SUGGESTIONS = [2, 3, 5, 8, 10];
const ABSOLUTE_SUGGESTIONS = [25_000, 50_000, 100_000, 250_000, 500_000];

// ---------------------------------------------------------------------------
// Small shared components
// ---------------------------------------------------------------------------

function ConfidenceBadge({ value }: { value: number }) {
  const tone =
    value >= 80
      ? "bg-emerald-100 text-emerald-700"
      : value >= 60
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  return <span className={clsx("rounded-full px-2 py-0.5 text-xs font-semibold", tone)}>{value}%</span>;
}

function ProvenanceBadge({
  provenance,
}: {
  provenance: SalaryReviewAiPlanResponse["items"][number]["benchmark"]["provenance"];
}) {
  const label = provenance === "workspace" ? "Workspace" : provenance === "ingestion" ? "Qeemly Ingestion" : "No Match";
  const tone =
    provenance === "workspace"
      ? "bg-brand-100 text-brand-700"
      : provenance === "ingestion"
        ? "bg-sky-100 text-sky-700"
        : "bg-accent-100 text-accent-600";

  return <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold", tone)}>{label}</span>;
}

// ---------------------------------------------------------------------------
// Preferences step
// ---------------------------------------------------------------------------

const OBJECTIVE_OPTIONS: { value: SalaryReviewAiObjective; label: string; icon: typeof Sparkles; description: string }[] = [
  { value: "balanced", label: "Balanced", icon: Users, description: "Weight market, performance, and tenure evenly." },
  { value: "retention", label: "Retention", icon: Shield, description: "Prioritize employees furthest below market." },
  { value: "performance", label: "Performance", icon: Zap, description: "Reward top performers with larger shares." },
  { value: "equity", label: "Market Alignment", icon: TrendingUp, description: "Close the largest market gaps first." },
];

const BUDGET_INTENT_OPTIONS: { value: SalaryReviewAiBudgetIntent; label: string; description: string }[] = [
  { value: "strict_cap", label: "Strict Cap", description: "Never exceed the set budget." },
  { value: "target", label: "Target", description: "Stay near the budget; small overages are acceptable." },
  { value: "show_ideal", label: "Show Ideal", description: "Include a scenario showing what full market alignment costs." },
];

function EmployeePicker({
  selectedIds,
  onChange,
}: {
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const employees = useSalaryReview((s) => s.employees);
  const [expanded, setExpanded] = useState(false);

  const allSelected = employees.length > 0 && employees.every((e) => selectedIds.has(e.id));
  const noneSelected = selectedIds.size === 0;

  const toggleAll = () => {
    if (allSelected) {
      onChange(new Set());
    } else {
      onChange(new Set(employees.map((e) => e.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next);
  };

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort();

  return (
    <div className="rounded-2xl border border-accent-200 bg-accent-50/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent-500" />
          <span className="text-sm font-semibold text-accent-900">
            {selectedIds.size} of {employees.length} employee{employees.length !== 1 ? "s" : ""} included
          </span>
          {noneSelected && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              Select at least 1
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-accent-500 hover:text-accent-700"
          >
            {expanded ? "Collapse" : "Edit Selection"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-accent-200 bg-white p-2">
          {departments.map((dept) => {
            const deptEmployees = employees.filter((e) => e.department === dept);
            const allDeptSelected = deptEmployees.every((e) => selectedIds.has(e.id));
            return (
              <div key={dept}>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(selectedIds);
                    for (const e of deptEmployees) {
                      if (allDeptSelected) {
                        next.delete(e.id);
                      } else {
                        next.add(e.id);
                      }
                    }
                    onChange(next);
                  }}
                  className="w-full px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wider text-accent-400 hover:text-accent-600"
                >
                  {dept}
                </button>
                {deptEmployees.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-accent-700 hover:bg-accent-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(emp.id)}
                      onChange={() => toggle(emp.id)}
                      className="h-3.5 w-3.5 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="truncate">
                      {emp.firstName} {emp.lastName}
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-accent-400">
                      {formatAEDCompact(emp.baseSalary)}
                    </span>
                  </label>
                ))}
              </div>
            );
          })}
          {employees.filter((e) => !e.department).length > 0 && (
            <div>
              <span className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-400">
                No Department
              </span>
              {employees
                .filter((e) => !e.department)
                .map((emp) => (
                  <label
                    key={emp.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-accent-700 hover:bg-accent-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(emp.id)}
                      onChange={() => toggle(emp.id)}
                      className="h-3.5 w-3.5 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="truncate">
                      {emp.firstName} {emp.lastName}
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-accent-400">
                      {formatAEDCompact(emp.baseSalary)}
                    </span>
                  </label>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PreferencesStep({
  preferences,
  onChange,
  onGenerate,
}: {
  preferences: PreferencesState;
  onChange: (next: PreferencesState) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Step 1</p>
        <h3 className="mt-1 text-lg font-semibold text-accent-900">AI Review Preferences</h3>
        <p className="mt-1 text-sm text-accent-600">
          Tell the AI what matters most. It will generate multiple scenarios you can compare before applying.
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Employees</p>
        <EmployeePicker
          selectedIds={preferences.selectedEmployeeIds}
          onChange={(next) => onChange({ ...preferences, selectedEmployeeIds: next })}
        />
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Objective</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {OBJECTIVE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = preferences.objective === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...preferences, objective: opt.value })}
                className={clsx(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  isActive ? "border-brand-400 bg-brand-50" : "border-accent-200 bg-white hover:bg-accent-50",
                )}
              >
                <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", isActive ? "bg-brand-100 text-brand-600" : "bg-accent-100 text-accent-500")}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-accent-900">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-accent-500">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Budget</p>
        <div className="rounded-2xl border border-accent-200 bg-accent-50/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex overflow-hidden rounded-xl border border-accent-200 bg-white">
              <button
                type="button"
                onClick={() => onChange({ ...preferences, budgetType: "percentage" })}
                className={clsx(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  preferences.budgetType === "percentage"
                    ? "bg-brand-500 text-white"
                    : "bg-white text-accent-600 hover:bg-accent-50",
                )}
              >
                % of Payroll
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...preferences, budgetType: "absolute" })}
                className={clsx(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  preferences.budgetType === "absolute"
                    ? "bg-brand-500 text-white"
                    : "bg-white text-accent-600 hover:bg-accent-50",
                )}
              >
                Fixed Amount
              </button>
            </div>
            <input
              type="number"
              min={0}
              step={preferences.budgetType === "percentage" ? 0.5 : 1000}
              value={
                preferences.budgetType === "percentage"
                  ? preferences.budgetPercentage || ""
                  : preferences.budgetAbsolute || ""
              }
              onChange={(e) => {
                const raw = e.target.value;
                const val = raw === "" ? 0 : Number(raw);
                if (!Number.isFinite(val)) return;
                if (preferences.budgetType === "percentage") {
                  onChange({ ...preferences, budgetPercentage: val });
                } else {
                  onChange({ ...preferences, budgetAbsolute: val });
                }
              }}
              placeholder={preferences.budgetType === "percentage" ? "e.g. 5" : "e.g. 100,000"}
              className="h-10 w-36 rounded-xl border border-accent-200 bg-white px-3 text-sm text-accent-900 outline-none focus:border-brand-300"
            />
            <span className="text-sm font-medium text-accent-600">
              {preferences.budgetType === "percentage" ? "%" : "AED"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(preferences.budgetType === "percentage" ? PERCENTAGE_SUGGESTIONS : ABSOLUTE_SUGGESTIONS).map(
              (val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    if (preferences.budgetType === "percentage") {
                      onChange({ ...preferences, budgetPercentage: val });
                    } else {
                      onChange({ ...preferences, budgetAbsolute: val });
                    }
                  }}
                  className={clsx(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    (preferences.budgetType === "percentage" ? preferences.budgetPercentage : preferences.budgetAbsolute) === val
                      ? "border-brand-400 bg-brand-50 text-brand-700"
                      : "border-accent-200 bg-white text-accent-600 hover:bg-accent-50",
                  )}
                >
                  {preferences.budgetType === "percentage" ? `${val}%` : formatAEDCompact(val)}
                </button>
              ),
            )}
          </div>
          {preferences.budgetType === "percentage" && preferences.budgetPercentage === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              A 0% budget will generate a hold scenario showing unresolved market risk.
            </p>
          )}
          {preferences.budgetType === "absolute" && preferences.budgetAbsolute === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              A zero budget will generate a hold scenario showing unresolved market risk.
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Budget Intent</p>
        <div className="flex flex-wrap gap-2">
          {BUDGET_INTENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...preferences, budgetIntent: opt.value })}
              className={clsx(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                preferences.budgetIntent === opt.value
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-accent-200 bg-white text-accent-700 hover:bg-accent-50",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-accent-500">
          {BUDGET_INTENT_OPTIONS.find((o) => o.value === preferences.budgetIntent)?.description}
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Population Rules</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-accent-700">
            <input
              type="checkbox"
              checked={Boolean(preferences.populationRules.excludeRecentHires)}
              onChange={(e) =>
                onChange({
                  ...preferences,
                  populationRules: { ...preferences.populationRules, excludeRecentHires: e.target.checked },
                })
              }
              className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
            />
            Exclude recent hires (less than 1 year)
          </label>
          <label className="flex items-center gap-2 text-sm text-accent-700">
            <input
              type="checkbox"
              checked={Boolean(preferences.populationRules.excludeLowPerformers)}
              onChange={(e) =>
                onChange({
                  ...preferences,
                  populationRules: { ...preferences.populationRules, excludeLowPerformers: e.target.checked },
                })
              }
              className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
            />
            Exclude low performers
          </label>
          <label className="flex items-center gap-2 text-sm text-accent-700">
            <input
              type="checkbox"
              checked={Boolean(preferences.populationRules.exactBenchmarkOnly)}
              onChange={(e) =>
                onChange({
                  ...preferences,
                  populationRules: { ...preferences.populationRules, exactBenchmarkOnly: e.target.checked },
                })
              }
              className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
            />
            Only include employees with exact benchmark match
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm text-accent-700">Max increase per person:</label>
            <input
              type="number"
              min={1}
              max={100}
              placeholder="e.g. 15"
              value={preferences.populationRules.maxIncreasePercent ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                onChange({
                  ...preferences,
                  populationRules: { ...preferences.populationRules, maxIncreasePercent: value },
                });
              }}
              className="h-9 w-20 rounded-xl border border-accent-200 bg-white px-3 text-sm text-accent-900 outline-none focus:border-brand-300"
            />
            <span className="text-sm text-accent-500">%</span>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">
          Context Notes (optional)
        </p>
        <textarea
          value={preferences.contextNotes}
          onChange={(e) => onChange({ ...preferences, contextNotes: e.target.value })}
          maxLength={2000}
          rows={3}
          placeholder="Any additional context for the AI, e.g. 'Focus on Engineering retention' or 'We are preparing for a funding round'."
          className="w-full rounded-xl border border-accent-200 bg-white px-4 py-3 text-sm text-accent-900 placeholder:text-accent-400 outline-none focus:border-brand-300"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onGenerate} disabled={preferences.selectedEmployeeIds.size === 0} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate Scenarios
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario comparison step
// ---------------------------------------------------------------------------

function ScenarioCard({
  scenario,
  isSelected,
  onSelect,
  onDrillDown,
}: {
  scenario: SalaryReviewAiScenario;
  isSelected: boolean;
  onSelect: () => void;
  onDrillDown: () => void;
}) {
  const risk = scenario.riskSummary;
  const hasIncreases = scenario.items.some((i) => i.proposedIncrease > 0);

  return (
    <div
      className={clsx(
        "relative flex flex-col rounded-2xl border p-5 transition-colors",
        isSelected ? "border-brand-400 bg-brand-50/60 shadow-sm" : "border-accent-200 bg-white hover:bg-accent-50/60",
      )}
    >
      {scenario.isRecommended && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-brand-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Recommended
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-base font-semibold text-accent-900">{scenario.label}</h4>
          <p className="mt-1 text-xs text-accent-600">{scenario.description}</p>
        </div>
        <input
          type="radio"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 h-4 w-4 shrink-0 border-accent-300 text-brand-500 focus:ring-brand-500"
        />
      </div>

      {scenario.strategicSummary && (
        <p className="mt-3 text-sm leading-relaxed text-accent-700">{scenario.strategicSummary}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-500">Budget Used</p>
          <p className="mt-0.5 font-semibold text-accent-900">{formatAED(scenario.summary.budgetUsed)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-500">Employees</p>
          <p className="mt-0.5 font-semibold text-accent-900">
            {hasIncreases ? `${scenario.items.filter((i) => i.proposedIncrease > 0).length} with increases` : "No increases"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-500">Below Market</p>
          <p className={clsx("mt-0.5 font-semibold", risk.belowMarketCount > 0 ? "text-amber-700" : "text-emerald-700")}>
            {risk.belowMarketCount} employee{risk.belowMarketCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-500">Retention Risk</p>
          <p className={clsx("mt-0.5 font-semibold", risk.retentionRiskCount > 0 ? "text-red-700" : "text-emerald-700")}>
            {risk.retentionRiskCount} employee{risk.retentionRiskCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {scenario.warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {scenario.warnings.map((w) => (
            <p key={w} className="flex items-start gap-1.5 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{w}</span>
            </p>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onDrillDown}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          View employee details
          <ArrowRight className="ml-1 inline h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function ScenarioComparisonStep({
  response,
  selectedScenarioId,
  onSelectScenario,
  onDrillDown,
  onBack,
}: {
  response: SalaryReviewAiScenarioResponse;
  selectedScenarioId: string | null;
  onSelectScenario: (id: string) => void;
  onDrillDown: (id: string) => void;
  onBack: () => void;
}) {
  const cohort = response.cohortContext;

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Step 2</p>
          <h3 className="mt-1 text-lg font-semibold text-accent-900">Compare Scenarios</h3>
          <p className="mt-1 text-sm text-accent-600">
            Review the trade-offs, then select the scenario that best fits your strategy.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Change Preferences
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Employees</div>
          <div className="mt-1 text-lg font-bold text-accent-900">{cohort.totalEmployees}</div>
        </div>
        <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Current Payroll</div>
          <div className="mt-1 text-lg font-bold text-accent-900">{formatAED(cohort.totalCurrentPayroll)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Benchmark Coverage</div>
          <div className="mt-1 text-lg font-bold text-accent-900">{cohort.benchmarkCoverage}%</div>
        </div>
        <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Avg Market Gap</div>
          <div className={clsx("mt-1 text-lg font-bold", cohort.avgMarketGapPercent > 0 ? "text-amber-700" : "text-emerald-700")}>
            {cohort.avgMarketGapPercent > 0 ? "+" : ""}{cohort.avgMarketGapPercent}%
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {response.scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isSelected={selectedScenarioId === scenario.id}
            onSelect={() => onSelectScenario(scenario.id)}
            onDrillDown={() => onDrillDown(scenario.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario detail (employee table) step
// ---------------------------------------------------------------------------

function ScenarioDetailStep({
  scenario,
  selected,
  setSelected,
  onBack,
}: {
  scenario: SalaryReviewAiScenario;
  selected: Record<string, boolean>;
  setSelected: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onBack: () => void;
}) {
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected],
  );

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to scenarios
          </button>
          <h3 className="mt-2 text-lg font-semibold text-accent-900">{scenario.label}</h3>
          <p className="mt-1 text-sm text-accent-600">{scenario.description}</p>
        </div>
        <div className="rounded-2xl border border-accent-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">Budget used</p>
          <p className="mt-1 text-base font-semibold text-accent-950">
            {formatAED(scenario.summary.budgetUsed)} of {formatAED(scenario.summary.budget)}
          </p>
        </div>
      </div>

      {scenario.strategicSummary && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">
                Analyst briefing
              </p>
              <p className="mt-2 text-sm leading-relaxed text-violet-950">{scenario.strategicSummary}</p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
        <table className="w-full">
          <thead className="bg-accent-50">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={scenario.items.length > 0 && selectedIds.length === scenario.items.length}
                  onChange={(e) => {
                    setSelected(Object.fromEntries(scenario.items.map((item) => [item.employeeId, e.target.checked])));
                  }}
                  className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-accent-500">Employee</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-accent-500">Current</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-accent-500">Increase</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-accent-500">Proposed</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-accent-500">Source</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-accent-500">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 bg-white">
            {scenario.items.map((item) => (
              <tr key={item.employeeId}>
                <td className="px-3 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[item.employeeId])}
                    onChange={() => setSelected((prev) => ({ ...prev, [item.employeeId]: !prev[item.employeeId] }))}
                    className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                  />
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="text-sm font-semibold text-accent-900">{item.employeeName}</div>
                  <details className="mt-2 rounded-xl border border-accent-100 bg-accent-50/60 px-3 py-2">
                    <summary className="cursor-pointer text-xs font-semibold text-accent-600">
                      Why AI suggested this
                    </summary>
                    <div className="mt-2 space-y-2 text-xs text-accent-600">
                      <p className="text-sm leading-relaxed text-accent-700">
                        {item.aiRationale ?? item.rationale.join(" ")}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.factors.map((factor) => (
                          <span
                            key={factor.key}
                            className="rounded-full border border-accent-200 bg-white px-2.5 py-1 text-[11px] font-medium text-accent-700"
                          >
                            {factor.label}: {factor.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </details>
                  {item.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {item.warnings.map((warning) => (
                        <div key={warning} className="flex items-start gap-1.5 text-xs text-amber-700">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 align-top text-right text-sm text-accent-700">{formatAED(item.currentSalary)}</td>
                <td className="px-3 py-3 align-top text-right text-sm font-semibold text-emerald-600">
                  +{formatAED(item.proposedIncrease)}
                  <div className="text-xs font-normal text-accent-500">{item.proposedPercentage.toFixed(1)}%</div>
                </td>
                <td className="px-3 py-3 align-top text-right text-sm font-semibold text-accent-900">{formatAED(item.proposedSalary)}</td>
                <td className="px-3 py-3 align-top">
                  <div className="space-y-1">
                    <ProvenanceBadge provenance={item.benchmark.provenance} />
                    <div className="text-xs text-accent-500">{item.benchmark.sourceName ?? "No data source"}</div>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="space-y-1">
                    <ConfidenceBadge value={item.confidence} />
                    <div className="text-xs text-accent-500">
                      Match: {item.benchmark.matchQuality.replaceAll("_", " ")}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legacy single-plan view (backward compat for requests without strategy)
// ---------------------------------------------------------------------------

function LegacyPlanView({
  plan,
  request,
  selected,
  setSelected,
}: {
  plan: SalaryReviewAiPlanResponse;
  request: SalaryReviewAiPlanRequest;
  selected: Record<string, boolean>;
  setSelected: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected],
  );
  const budgetModel = buildSalaryReviewBudgetModel({
    budgetType: request.budgetType,
    budgetPercentage: request.budgetPercentage ?? 0,
    budgetAbsolute: request.budgetAbsolute ?? 0,
    totalCurrentPayroll: plan.summary.totalCurrentPayroll,
    budgetUsed: plan.summary.budgetUsed,
    selectedEmployees: plan.summary.employeesConsidered,
    proposedEmployees: plan.items.filter((item) => item.proposedIncrease > 0).length,
  });

  return (
    <div className="space-y-5 p-6">
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-r from-brand-50/70 via-white to-accent-50/50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">AI review summary</p>
            <h3 className="mt-2 text-lg font-semibold text-accent-900">
              Review the policy, budget impact, and benchmark rationale before applying any proposal.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-accent-700">
              {plan.strategicSummary ?? `${budgetModel.policyLabel} ${budgetModel.allocationLabel}`}
            </p>
          </div>
          <div className="rounded-2xl border border-accent-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">Current policy</p>
            <p className="mt-1 text-base font-semibold text-accent-950">
              {request.budgetType === "percentage"
                ? `${request.budgetPercentage ?? 0}% of payroll`
                : formatAED(request.budgetAbsolute ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Current payroll</div>
          <div className="mt-1 text-lg font-bold text-accent-900">{formatAED(plan.summary.totalCurrentPayroll)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Proposed payroll</div>
          <div className="mt-1 text-lg font-bold text-accent-900">{formatAED(plan.summary.totalProposedPayroll)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Allocated</div>
          <div className="mt-1 text-lg font-bold text-accent-900">
            {formatAED(plan.summary.budgetUsed)} ({plan.summary.budgetUsedPercentage.toFixed(1)}%)
          </div>
          <div className="mt-1 text-xs text-accent-500">{budgetModel.allocationLabel}</div>
        </div>
        <div className="rounded-2xl border border-border bg-accent-50/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">Remaining</div>
          <div className={clsx("mt-1 text-lg font-bold", plan.summary.budgetRemaining < 0 ? "text-red-600" : "text-emerald-600")}>
            {plan.summary.budgetRemaining < 0 ? "-" : ""}
            {formatAED(Math.abs(plan.summary.budgetRemaining))}
          </div>
          <div className="mt-1 text-xs text-accent-500">{budgetModel.remainingLabel}</div>
        </div>
      </div>

      {plan.warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-700">AI warnings</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {plan.warnings.map((warning) => (
              <li key={warning} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
        <table className="w-full">
          <thead className="bg-accent-50">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={plan.items.length > 0 && selectedIds.length === plan.items.length}
                  onChange={(e) => {
                    setSelected(Object.fromEntries(plan.items.map((item) => [item.employeeId, e.target.checked])));
                  }}
                  className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-accent-500">Employee</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-accent-500">Current</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-accent-500">Increase</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-accent-500">Proposed</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-accent-500">Source</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-accent-500">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 bg-white">
            {plan.items.map((item) => (
              <tr key={item.employeeId}>
                <td className="px-3 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[item.employeeId])}
                    onChange={() => setSelected((prev) => ({ ...prev, [item.employeeId]: !prev[item.employeeId] }))}
                    className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                  />
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="text-sm font-semibold text-accent-900">{item.employeeName}</div>
                  <details className="mt-2 rounded-xl border border-accent-100 bg-accent-50/60 px-3 py-2">
                    <summary className="cursor-pointer text-xs font-semibold text-accent-600">
                      Why AI suggested this
                    </summary>
                    <div className="mt-2 space-y-2 text-xs text-accent-600">
                      <p className="text-sm leading-relaxed text-accent-700">
                        {item.aiRationale ?? item.rationale.join(" ")}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.factors.map((factor) => (
                          <span
                            key={factor.key}
                            className="rounded-full border border-accent-200 bg-white px-2.5 py-1 text-[11px] font-medium text-accent-700"
                          >
                            {factor.label}: {factor.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </details>
                  {item.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {item.warnings.map((warning) => (
                        <div key={warning} className="flex items-start gap-1.5 text-xs text-amber-700">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 align-top text-right text-sm text-accent-700">{formatAED(item.currentSalary)}</td>
                <td className="px-3 py-3 align-top text-right text-sm font-semibold text-emerald-600">
                  +{formatAED(item.proposedIncrease)}
                  <div className="text-xs font-normal text-accent-500">{item.proposedPercentage.toFixed(1)}%</div>
                </td>
                <td className="px-3 py-3 align-top text-right text-sm font-semibold text-accent-900">{formatAED(item.proposedSalary)}</td>
                <td className="px-3 py-3 align-top">
                  <div className="space-y-1">
                    <ProvenanceBadge provenance={item.benchmark.provenance} />
                    <div className="text-xs text-accent-500">{item.benchmark.sourceName ?? "No data source"}</div>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="space-y-1">
                    <ConfidenceBadge value={item.confidence} />
                    <div className="text-xs text-accent-500">
                      Match: {item.benchmark.matchQuality.replaceAll("_", " ")}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

function isScenarioResponse(data: unknown): data is SalaryReviewAiScenarioResponse {
  return Boolean(data && typeof data === "object" && "scenarios" in data && Array.isArray((data as SalarioResponse).scenarios));
}
type SalarioResponse = { scenarios: unknown[] };

export function AiDistributionModal({ isOpen, onClose, request, onApprove, onApproveScenario }: AiDistributionModalProps) {
  const [step, setStep] = useState<ModalStep>("preferences");
  const [preferences, setPreferences] = useState<PreferencesState>(() => buildDefaultPreferences(request));
  const [scenarioState, setScenarioState] = useState<ScenarioLoadState>({ type: "idle" });
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [detailScenarioId, setDetailScenarioId] = useState<string | null>(null);
  const [detailSelected, setDetailSelected] = useState<Record<string, boolean>>({});

  // Legacy single-plan state
  const [legacyPlan, setLegacyPlan] = useState<SalaryReviewAiPlanResponse | null>(null);
  const [legacySelected, setLegacySelected] = useState<Record<string, boolean>>({});

  const resetState = useCallback(() => {
    setStep("preferences");
    setPreferences(buildDefaultPreferences(request));
    setScenarioState({ type: "idle" });
    setSelectedScenarioId(null);
    setDetailScenarioId(null);
    setDetailSelected({});
    setLegacyPlan(null);
    setLegacySelected({});
  }, [request]);

  useEffect(() => {
    if (!isOpen) resetState();
  }, [isOpen, resetState]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const generateScenarios = useCallback(async () => {
    setStep("loading");
    setScenarioState({ type: "loading" });

    try {
      const enrichedRequest: SalaryReviewAiPlanRequest = {
        ...request,
        selectedEmployeeIds: Array.from(preferences.selectedEmployeeIds),
        budgetType: preferences.budgetType,
        budgetPercentage: preferences.budgetPercentage,
        budgetAbsolute: preferences.budgetAbsolute,
        objective: preferences.objective,
        budgetIntent: preferences.budgetIntent,
        populationRules: preferences.populationRules,
        contextNotes: preferences.contextNotes || undefined,
      };

      const res = await fetch("/api/salary-review/ai-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrichedRequest),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to generate AI scenarios");
      }

      const data = await res.json();

      if (isScenarioResponse(data)) {
        const response = data as SalaryReviewAiScenarioResponse;
        setScenarioState({ type: "ready", response });
        const recommended = response.scenarios.find((s) => s.isRecommended);
        setSelectedScenarioId(recommended?.id ?? response.scenarios[0]?.id ?? null);
        setStep("scenarios");
      } else {
        const plan = data as SalaryReviewAiPlanResponse;
        setLegacyPlan(plan);
        setLegacySelected(Object.fromEntries(plan.items.map((item) => [item.employeeId, true])));
        setStep("detail");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate AI proposal";
      setScenarioState({ type: "error", message });
      setStep("error");
    }
  }, [request, preferences]);

  const currentScenarioResponse = scenarioState.type === "ready" ? scenarioState.response : null;
  const selectedScenario = currentScenarioResponse?.scenarios.find((s) => s.id === selectedScenarioId) ?? null;
  const detailScenario = currentScenarioResponse?.scenarios.find((s) => s.id === detailScenarioId) ?? null;

  const handleDrillDown = useCallback(
    (id: string) => {
      const scenario = currentScenarioResponse?.scenarios.find((s) => s.id === id);
      if (!scenario) return;
      setDetailScenarioId(id);
      setDetailSelected(Object.fromEntries(scenario.items.map((item) => [item.employeeId, true])));
      setStep("detail");
    },
    [currentScenarioResponse],
  );

  const handleApplyScenario = useCallback(() => {
    if (!selectedScenario) return;

    if (onApproveScenario) {
      onApproveScenario({ scenario: selectedScenario });
    } else {
      const asLegacyPlan: SalaryReviewAiPlanResponse = {
        generatedAt: currentScenarioResponse?.generatedAt ?? new Date().toISOString(),
        strategicSummary: selectedScenario.strategicSummary,
        summary: selectedScenario.summary,
        items: selectedScenario.items,
        warnings: selectedScenario.warnings,
      };
      onApprove({ plan: asLegacyPlan });
    }
    onClose();
  }, [selectedScenario, currentScenarioResponse, onApprove, onApproveScenario, onClose]);

  const handleLegacyApplyAll = useCallback(() => {
    if (!legacyPlan) return;
    onApprove({ plan: legacyPlan });
    onClose();
  }, [legacyPlan, onApprove, onClose]);

  const handleLegacyApplySelected = useCallback(() => {
    if (!legacyPlan) return;
    const ids = Object.entries(legacySelected)
      .filter(([, v]) => v)
      .map(([id]) => id);
    onApprove({ plan: legacyPlan, selectedEmployeeIds: ids });
    onClose();
  }, [legacyPlan, legacySelected, onApprove, onClose]);

  const legacySelectedIds = useMemo(
    () => Object.entries(legacySelected).filter(([, v]) => v).map(([id]) => id),
    [legacySelected],
  );

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close AI proposal modal"
        className="absolute inset-0 bg-accent-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl border border-border bg-white shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-brand-500 via-brand-400 to-sky-500" />
        <div className="border-b border-border/50 bg-brand-50/40 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-accent-900">
                  {step === "preferences" ? "AI Scenario Planning" : "AI Distribution Review"}
                </h2>
                <p className="text-sm text-accent-600">
                  {step === "preferences"
                    ? "Set your strategy, then compare AI-generated scenarios before applying."
                    : "Benchmark-grounded recommendations. Use this draft as a starting point."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-accent-500 hover:bg-accent-100 hover:text-accent-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-170px)] overflow-y-auto">
          {step === "preferences" && (
            <PreferencesStep
              preferences={preferences}
              onChange={setPreferences}
              onGenerate={() => void generateScenarios()}
            />
          )}

          {step === "loading" && (
            <div className="flex min-h-[300px] items-center justify-center p-6">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
                <p className="mt-3 text-sm text-accent-600">
                  Building AI scenarios from benchmarks and employee context...
                </p>
              </div>
            </div>
          )}

          {step === "error" && scenarioState.type === "error" && (
            <div className="p-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-700">Could not build AI scenarios</p>
                    <p className="mt-1 text-sm text-red-600">{scenarioState.message}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setStep("preferences")}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Change Preferences
                </Button>
                <Button onClick={() => void generateScenarios()}>Retry</Button>
              </div>
            </div>
          )}

          {step === "scenarios" && currentScenarioResponse && (
            <ScenarioComparisonStep
              response={currentScenarioResponse}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={setSelectedScenarioId}
              onDrillDown={handleDrillDown}
              onBack={() => setStep("preferences")}
            />
          )}

          {step === "detail" && detailScenario && (
            <ScenarioDetailStep
              scenario={detailScenario}
              selected={detailSelected}
              setSelected={setDetailSelected}
              onBack={() => setStep("scenarios")}
            />
          )}

          {step === "detail" && legacyPlan && !detailScenario && (
            <LegacyPlanView
              plan={legacyPlan}
              request={request}
              selected={legacySelected}
              setSelected={setLegacySelected}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/50 bg-white px-6 py-4">
          <div className="text-sm text-accent-500">
            {step === "preferences" && "Configure your strategy to generate AI scenarios."}
            {step === "loading" && "Generating scenarios..."}
            {step === "error" && "Adjust preferences and try again."}
            {step === "scenarios" &&
              (selectedScenario
                ? `"${selectedScenario.label}" selected. Apply to start drafting.`
                : "Select a scenario to apply.")}
            {step === "detail" && detailScenario && "Reviewing employee-level details. Go back to select a different scenario."}
            {step === "detail" && legacyPlan && !detailScenario &&
              `${legacySelectedIds.length} selected for draft apply. Changes still need review and submission after this step.`}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              {step === "preferences" ? "Cancel" : "Reject"}
            </Button>

            {step === "scenarios" && (
              <Button onClick={handleApplyScenario} disabled={!selectedScenario}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Apply Scenario
              </Button>
            )}

            {step === "detail" && detailScenario && (
              <Button
                onClick={() => {
                  if (detailScenario) {
                    setSelectedScenarioId(detailScenario.id);
                  }
                  setStep("scenarios");
                }}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Scenarios
              </Button>
            )}

            {step === "detail" && legacyPlan && !detailScenario && (
              <>
                <Button
                  variant="outline"
                  onClick={handleLegacyApplySelected}
                  disabled={legacySelectedIds.length === 0}
                >
                  Use Selected Recommendations
                </Button>
                <Button onClick={handleLegacyApplyAll}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Use AI Draft
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}
