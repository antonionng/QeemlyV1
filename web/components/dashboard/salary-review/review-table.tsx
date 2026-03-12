"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  Star,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { buildBenchmarkTrustLabels } from "@/lib/benchmarks/trust";
import { useSalaryReview, type ReviewEmployee, type ColumnKey } from "@/lib/salary-review";
import { formatAED, computeTenure, type Department } from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";
import { applySalaryReviewFilters } from "@/lib/salary-review/filters";
import {
  DEFAULT_SALARY_REVIEW_QUERY_STATE,
  type SalaryReviewQueryState,
} from "@/lib/salary-review/url-state";
import { EmployeeDetailPanel } from "./employee-detail-panel";
import { ColumnSettings } from "./column-settings";
import { ReviewToolbar } from "./review-toolbar";

type SortField =
  | "name"
  | "department"
  | "location"
  | "current"
  | "proposed"
  | "increase"
  | "band"
  | "performance";
type SortDirection = "asc" | "desc";

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) {
  if (sortField !== field) return null;
  return sortDirection === "asc" ? (
    <ChevronUp className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  );
}

const LEADERSHIP_LEVELS = ["Director", "VP", "C-Level", "Head of"];

const PERF_ORDER: Record<string, number> = {
  exceptional: 4,
  exceeds: 3,
  meets: 2,
  low: 1,
};

const PERF_BADGE: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  exceptional: { bg: "bg-purple-100", text: "text-purple-700", label: "Exceptional" },
  exceeds: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Exceeds" },
  meets: { bg: "bg-blue-100", text: "text-blue-700", label: "Meets" },
  low: { bg: "bg-red-100", text: "text-red-700", label: "Low" },
};

function getWorkflowStatus(employee: ReviewEmployee, workflow?: {
  managerFollowUpDone: boolean;
  calibrationNeeded: boolean;
  recommendationReady: boolean;
}, proposalStatus?: string, hasPersistedItem?: boolean) {
  if (proposalStatus && hasPersistedItem) return proposalStatus;
  if (workflow?.recommendationReady) return "approved";
  if (employee.proposedIncrease <= 0) return "draft";
  if (workflow?.managerFollowUpDone && !workflow.calibrationNeeded) return "submitted";
  if (workflow?.calibrationNeeded || workflow?.managerFollowUpDone) return "in_review";
  return "draft";
}

function getWorkflowBadge(status: ReturnType<typeof getWorkflowStatus>) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "submitted":
      return "bg-sky-100 text-sky-700";
    case "in_review":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-accent-100 text-accent-600";
  }
}

export function ReviewTable({
  initialQueryState = DEFAULT_SALARY_REVIEW_QUERY_STATE,
}: {
  initialQueryState?: SalaryReviewQueryState;
}) {
  const {
    employees,
    workflowByEmployee,
    activeProposal,
    proposalItemsByEmployee,
    updateEmployeeIncrease,
    toggleEmployeeSelection,
    visibleColumns,
  } = useSalaryReview();
  const { salaryView } = useSalaryView();
  const show = (col: ColumnKey) => visibleColumns.includes(col);
  const [queryState, setQueryState] = useState<SalaryReviewQueryState>(initialQueryState);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    setQueryState(initialQueryState);
  }, [initialQueryState]);

  // Get unique departments and locations
  const departments = [...new Set(employees.map((e) => e.department))];
  const locations = [...new Set(employees.map((e) => e.location.city))].sort();

  const filteredEmployees = applySalaryReviewFilters(employees, queryState).filter((employee) => {
    if (queryState.workflowStatus === "all") return true;
    return (
      getWorkflowStatus(
        employee,
        workflowByEmployee[employee.id],
        activeProposal?.status,
        Boolean(proposalItemsByEmployee[employee.id])
      ) === queryState.workflowStatus
    );
  });

  // Sort employees
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        break;
      case "department":
        comparison = a.department.localeCompare(b.department);
        break;
      case "location":
        comparison = `${a.location.city}, ${a.location.country}`.localeCompare(
          `${b.location.city}, ${b.location.country}`
        );
        break;
      case "current":
        comparison = a.baseSalary - b.baseSalary;
        break;
      case "proposed":
        comparison = a.newSalary - b.newSalary;
        break;
      case "increase":
        comparison = a.proposedPercentage - b.proposedPercentage;
        break;
      case "band": {
        const bandOrder = { below: 0, "in-band": 1, above: 2 };
        comparison = bandOrder[a.bandPosition] - bandOrder[b.bandPosition];
        break;
      }
      case "performance":
        comparison =
          (PERF_ORDER[a.performanceRating ?? ""] ?? 0) -
          (PERF_ORDER[b.performanceRating ?? ""] ?? 0);
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getBandBadge = (position: ReviewEmployee["bandPosition"]) => {
    switch (position) {
      case "below":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            Below
          </span>
        );
      case "in-band":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
            In Band
          </span>
        );
      case "above":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            Above
          </span>
        );
    }
  };

  const getGuidanceIcon = (guidance: ReviewEmployee["guidance"]) => {
    if (!guidance) return null;
    switch (guidance.type) {
      case "promotion-signal":
        return <Star className="h-4 w-4 text-brand-500" />;
      case "retention-risk":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "flag":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const selectedEmployee = selectedEmployeeId
    ? sortedEmployees.find((e) => e.id === selectedEmployeeId) ?? null
    : null;

  return (
    <>
      <Card className="dash-card p-0 overflow-hidden">
        <ReviewToolbar
          query={queryState}
          departments={departments}
          locations={locations}
          resultCount={sortedEmployees.length}
          totalCount={employees.length}
          onChange={(updates) => setQueryState((current) => ({ ...current, ...updates }))}
          onClear={() => setQueryState(DEFAULT_SALARY_REVIEW_QUERY_STATE)}
          actions={<ColumnSettings />}
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-accent-50">
                <th className="w-8 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={employees.every((e) => e.isSelected)}
                    onChange={(e) =>
                      e.target.checked
                        ? useSalaryReview.getState().selectAll()
                        : useSalaryReview.getState().deselectAll()
                    }
                    className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                  />
                </th>
                {show("name") && (
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider cursor-pointer hover:text-accent-700" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      Name <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                  </th>
                )}
                {show("role") && (
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider cursor-pointer hover:text-accent-700" onClick={() => handleSort("department")}>
                    <div className="flex items-center gap-1">
                      Role <SortIcon field="department" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                  </th>
                )}
                {show("department") && (
                  <th className="text-left px-3 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider cursor-pointer hover:text-accent-700" onClick={() => handleSort("department")}>
                    <div className="flex items-center gap-1">
                      Department <SortIcon field="department" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                  </th>
                )}
                {show("location") && (
                  <th className="text-left px-3 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider cursor-pointer hover:text-accent-700" onClick={() => handleSort("location")}>
                    <div className="flex items-center gap-1">
                      Location <SortIcon field="location" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                  </th>
                )}
                {show("current") && (
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider cursor-pointer hover:text-accent-700" onClick={() => handleSort("current")}>
                    <div className="flex items-center justify-end gap-1">
                      Current <SortIcon field="current" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                  </th>
                )}
                {show("basic") && <th className="text-right px-3 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider">Basic</th>}
                {show("housing") && <th className="text-right px-3 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider">Housing</th>}
                {show("transport") && <th className="text-right px-3 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider">Transport</th>}
                {show("other") && <th className="text-right px-3 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider">Other</th>}
                {show("proposed") && (
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider cursor-pointer hover:text-accent-700" onClick={() => handleSort("proposed")}>
                    <div className="flex items-center justify-end gap-1">
                      Proposed <SortIcon field="proposed" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                  </th>
                )}
                {show("increase") && (
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider cursor-pointer hover:text-accent-700" onClick={() => handleSort("increase")}>
                    <div className="flex items-center justify-end gap-1">
                      Increase <SortIcon field="increase" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                  </th>
                )}
                {show("band") && (
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider cursor-pointer hover:text-accent-700" onClick={() => handleSort("band")}>
                    <div className="flex items-center justify-center gap-1">
                      Band <SortIcon field="band" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                  </th>
                )}
                {show("performance") && (
                  <th className="text-center px-3 py-3 text-[11px] font-semibold text-accent-500 uppercase tracking-wider cursor-pointer hover:text-accent-700" onClick={() => handleSort("performance")}>
                    <div className="flex items-center justify-center gap-1">
                      Perf <SortIcon field="performance" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                  </th>
                )}
                {show("guidance") && <th className="w-10 px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {sortedEmployees.map((employee) => {
                const tenure = computeTenure(employee.hireDate);
                const isNew = tenure.totalMonths < 12;
                const benchmarkTrust = buildBenchmarkTrustLabels(employee.benchmarkContext);
                const workflowStatus = getWorkflowStatus(
                  employee,
                  workflowByEmployee[employee.id],
                  activeProposal?.status,
                  Boolean(proposalItemsByEmployee[employee.id])
                );

                return (
                  <tr
                    key={employee.id}
                    className={`cursor-pointer hover:bg-accent-50/60 transition-colors ${
                      !employee.isSelected ? "opacity-40" : ""
                    } ${selectedEmployeeId === employee.id ? "bg-brand-50/40" : ""}`}
                    onClick={() => setSelectedEmployeeId(employee.id)}
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={employee.isSelected}
                        onChange={() => toggleEmployeeSelection(employee.id)}
                        className="h-4 w-4 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                    {show("name") && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-xs shrink-0">
                            {employee.firstName[0]}
                            {employee.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-accent-900 truncate">
                                {employee.firstName} {employee.lastName}
                              </span>
                              {isNew && (
                                <span className="inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase leading-none bg-sky-100 text-sky-700">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <span className="text-xs text-accent-500">{employee.level.name}</span>
                              {!employee.isSelected && (
                                <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-600">
                                  Excluded
                                </span>
                              )}
                              {employee.proposedIncrease > 0 && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                  Proposed
                                </span>
                              )}
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getWorkflowBadge(workflowStatus)}`}
                              >
                                {workflowStatus.replaceAll("_", " ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    {show("role") && (
                      <td className="px-4 py-3">
                        <div className="text-sm text-accent-700">{employee.role.title}</div>
                      </td>
                    )}
                    {show("department") && (
                      <td className="px-3 py-3">
                        <div className="text-sm text-accent-600">{employee.department}</div>
                      </td>
                    )}
                    {show("location") && (
                      <td className="px-3 py-3">
                        <div className="text-sm text-accent-600 whitespace-nowrap">
                          {employee.location.city}, {employee.location.country}
                        </div>
                      </td>
                    )}
                    {show("current") && (
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-medium text-accent-900">
                          {formatAED(applyViewMode(employee.baseSalary, salaryView))}
                        </div>
                      </td>
                    )}
                    <>
                      {show("basic") && (
                        <td className="px-3 py-3 text-right">
                          <div className="text-xs text-accent-400">-</div>
                          <div className="text-[10px] text-accent-400">n/a</div>
                        </td>
                      )}
                      {show("housing") && (
                        <td className="px-3 py-3 text-right">
                          <div className="text-xs text-accent-400">-</div>
                          <div className="text-[10px] text-accent-400">n/a</div>
                        </td>
                      )}
                      {show("transport") && (
                        <td className="px-3 py-3 text-right">
                          <div className="text-xs text-accent-400">-</div>
                          <div className="text-[10px] text-accent-400">n/a</div>
                        </td>
                      )}
                      {show("other") && (
                        <td className="px-3 py-3 text-right">
                          <div className="text-xs text-accent-400">-</div>
                          <div className="text-[10px] text-accent-400">n/a</div>
                        </td>
                      )}
                    </>
                    {show("proposed") && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step={500}
                          min={0}
                          value={employee.newSalary}
                          onChange={(e) => {
                            const newSalary = Number(e.target.value);
                            const increase = newSalary - employee.baseSalary;
                            updateEmployeeIncrease(employee.id, increase);
                          }}
                          disabled={!employee.isSelected}
                          className="w-28 h-8 text-right rounded-lg border border-border bg-white px-2 text-sm font-medium text-accent-900 focus:border-brand-300 focus:outline-none disabled:opacity-50"
                        />
                      </td>
                    )}
                    {show("increase") && (
                      <td className="px-4 py-3 text-right">
                        {employee.proposedIncrease > 0 ? (
                          <div className="flex items-center justify-end gap-1 text-sm font-medium text-emerald-600">
                            <TrendingUp className="h-3 w-3" />+
                            {employee.proposedPercentage.toFixed(1)}%
                          </div>
                        ) : (
                          <span className="text-sm text-accent-400">-</span>
                        )}
                      </td>
                    )}
                    {show("band") && (
                      <td className="px-4 py-3 text-center">
                        <div className="space-y-1">
                          {getBandBadge(employee.bandPosition)}
                          {benchmarkTrust && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                                {benchmarkTrust.sourceLabel}
                              </span>
                              <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-600">
                                {benchmarkTrust.matchLabel}
                              </span>
                              {benchmarkTrust.confidenceLabel && (
                                <span className="text-[10px] text-accent-500">{benchmarkTrust.confidenceLabel}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {show("performance") && (
                      <td className="px-3 py-3 text-center">
                        {employee.performanceRating ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${PERF_BADGE[employee.performanceRating].bg} ${PERF_BADGE[employee.performanceRating].text}`}
                          >
                            {PERF_BADGE[employee.performanceRating].label}
                          </span>
                        ) : (
                          <span className="text-xs text-accent-300">--</span>
                        )}
                      </td>
                    )}
                    {show("guidance") && (
                      <td className="px-4 py-3">
                        {employee.guidance && (
                          <div className="group relative">
                            {getGuidanceIcon(employee.guidance)}
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-accent-900 text-white text-xs rounded-lg shadow-lg z-10">
                              {employee.guidance.message}
                            </div>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Employee detail slide-out panel */}
      {selectedEmployee && (
        <EmployeeDetailPanel
          employee={selectedEmployee}
          onClose={() => setSelectedEmployeeId(null)}
        />
      )}
    </>
  );
}
