"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useSalaryReview, type ReviewEmployee, type ColumnKey } from "@/lib/salary-review";
import { formatAED, computeTenure, type Department } from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";
import { EmployeeDetailPanel } from "./employee-detail-panel";
import { ColumnSettings } from "./column-settings";

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
type PoolFilter = "all" | "leadership" | "general";

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

export function ReviewTable() {
  const { employees, updateEmployeeIncrease, toggleEmployeeSelection, visibleColumns } = useSalaryReview();
  const { salaryView } = useSalaryView();
  const show = (col: ColumnKey) => visibleColumns.includes(col);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<Department | "all">("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [poolFilter, setPoolFilter] = useState<PoolFilter>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Get unique departments and locations
  const departments = [...new Set(employees.map((e) => e.department))];
  const locations = [...new Set(employees.map((e) => e.location.city))].sort();

  // Determine if an employee is in the leadership pool
  const isLeadership = (emp: ReviewEmployee) =>
    LEADERSHIP_LEVELS.some(
      (lvl) =>
        emp.level.name.includes(lvl) ||
        emp.role.title.includes(lvl) ||
        emp.level.category === "Executive"
    );

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.title.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;
    const matchesLocation = locationFilter === "all" || emp.location.city === locationFilter;
    const matchesPool =
      poolFilter === "all" ||
      (poolFilter === "leadership" && isLeadership(emp)) ||
      (poolFilter === "general" && !isLeadership(emp));
    const matchesStartDate =
      !startDateFilter || emp.hireDate >= new Date(startDateFilter);
    return matchesSearch && matchesDepartment && matchesLocation && matchesPool && matchesStartDate;
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
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border/50">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-400" />
            <Input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-accent-50"
              fullWidth
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value as Department | "all")}
            className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <select
            value={poolFilter}
            onChange={(e) => setPoolFilter(e.target.value as PoolFilter)}
            className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
          >
            <option value="all">All Pools</option>
            <option value="leadership">Leadership</option>
            <option value="general">General</option>
          </select>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
          />
          <ColumnSettings />
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-accent-50/50">
          <span className="text-xs text-accent-500">
            {sortedEmployees.length} of {employees.length} employees
          </span>
          {(departmentFilter !== "all" ||
            locationFilter !== "all" ||
            poolFilter !== "all" ||
            startDateFilter) && (
            <button
              type="button"
              onClick={() => {
                setDepartmentFilter("all");
                setLocationFilter("all");
                setPoolFilter("all");
                setStartDateFilter("");
              }}
              className="text-xs font-medium text-brand-500 hover:text-brand-700"
            >
              Clear filters
            </button>
          )}
        </div>

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
                            <div className="text-xs text-accent-500">{employee.level.name}</div>
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
                        {getBandBadge(employee.bandPosition)}
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
