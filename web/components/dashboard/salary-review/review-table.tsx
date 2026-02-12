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
import { useSalaryReview, type ReviewEmployee } from "@/lib/salary-review";
import { formatAED, computeTenure, type Department } from "@/lib/employees";
import { useSalaryView, applyViewMode } from "@/lib/salary-view-store";
import { generateSalaryBreakdown } from "@/lib/dashboard/dummy-data";
import { EmployeeDetailPanel } from "./employee-detail-panel";

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
  const { employees, updateEmployeeIncrease, toggleEmployeeSelection } = useSalaryReview();
  const { salaryView } = useSalaryView();
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
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
      <Card className="p-0 overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
            <Input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-lg"
              fullWidth
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value as Department | "all")}
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
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
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
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
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
          >
            <option value="all">All Pools</option>
            <option value="leadership">Leadership</option>
            <option value="general">General</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-brand-600 whitespace-nowrap">
              Started after
            </label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-brand-50/30">
          <div className="text-sm text-brand-600">
            Showing {sortedEmployees.length} of {employees.length} employees
          </div>
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
              Clear all filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-brand-50/50">
                <th className="w-8 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={employees.every((e) => e.isSelected)}
                    onChange={(e) =>
                      e.target.checked
                        ? useSalaryReview.getState().selectAll()
                        : useSalaryReview.getState().deselectAll()
                    }
                    className="h-4 w-4 rounded border-brand-300 text-brand-500 focus:ring-brand-500"
                  />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider cursor-pointer hover:bg-brand-100/50"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider cursor-pointer hover:bg-brand-100/50"
                  onClick={() => handleSort("department")}
                >
                  <div className="flex items-center gap-1">
                    Role <SortIcon field="department" />
                  </div>
                </th>
                <th
                  className="text-left px-3 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider cursor-pointer hover:bg-brand-100/50"
                  onClick={() => handleSort("department")}
                >
                  <div className="flex items-center gap-1">
                    Department <SortIcon field="department" />
                  </div>
                </th>
                <th
                  className="text-left px-3 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider cursor-pointer hover:bg-brand-100/50"
                  onClick={() => handleSort("location")}
                >
                  <div className="flex items-center gap-1">
                    Location <SortIcon field="location" />
                  </div>
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider cursor-pointer hover:bg-brand-100/50"
                  onClick={() => handleSort("current")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Current <SortIcon field="current" />
                  </div>
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                  Basic
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                  Housing
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                  Transport
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                  Other
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider cursor-pointer hover:bg-brand-100/50"
                  onClick={() => handleSort("proposed")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Proposed <SortIcon field="proposed" />
                  </div>
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider cursor-pointer hover:bg-brand-100/50"
                  onClick={() => handleSort("increase")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Increase <SortIcon field="increase" />
                  </div>
                </th>
                <th
                  className="text-center px-4 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider cursor-pointer hover:bg-brand-100/50"
                  onClick={() => handleSort("band")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Band <SortIcon field="band" />
                  </div>
                </th>
                <th
                  className="text-center px-3 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider cursor-pointer hover:bg-brand-100/50"
                  onClick={() => handleSort("performance")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Perf <SortIcon field="performance" />
                  </div>
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sortedEmployees.map((employee) => {
                const tenure = computeTenure(employee.hireDate);
                const isNew = tenure.totalMonths < 12;

                return (
                  <tr
                    key={employee.id}
                    className={`cursor-pointer hover:bg-brand-50/30 transition-colors ${
                      !employee.isSelected ? "opacity-50" : ""
                    } ${selectedEmployeeId === employee.id ? "bg-brand-50/50" : ""}`}
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
                        className="h-4 w-4 rounded border-brand-300 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-xs">
                          {employee.firstName[0]}
                          {employee.lastName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-brand-900">
                              {employee.firstName} {employee.lastName}
                            </span>
                            {isNew && (
                              <span className="inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase leading-none bg-sky-100 text-sky-700">
                                New
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-brand-500">{employee.level.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-brand-900">{employee.role.title}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-brand-700">{employee.department}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-brand-700 whitespace-nowrap">
                        {employee.location.city}, {employee.location.country}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-brand-900">
                        {formatAED(applyViewMode(employee.baseSalary, salaryView))}
                      </div>
                    </td>
                    {(() => {
                      const breakdown = generateSalaryBreakdown(
                        employee.baseSalary / 12,
                        employee.level.id
                      );
                      return (
                        <>
                          <td className="px-3 py-3 text-right">
                            <div className="text-xs text-brand-700">
                              {formatAED(
                                applyViewMode(Math.round(breakdown.basic * 12), salaryView)
                              )}
                            </div>
                            <div className="text-[10px] text-brand-400">
                              {breakdown.basicPercent}%
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="text-xs text-brand-700">
                              {formatAED(
                                applyViewMode(Math.round(breakdown.housing * 12), salaryView)
                              )}
                            </div>
                            <div className="text-[10px] text-brand-400">
                              {breakdown.housingPercent}%
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="text-xs text-brand-700">
                              {formatAED(
                                applyViewMode(Math.round(breakdown.transport * 12), salaryView)
                              )}
                            </div>
                            <div className="text-[10px] text-brand-400">
                              {breakdown.transportPercent}%
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="text-xs text-brand-700">
                              {formatAED(
                                applyViewMode(Math.round(breakdown.other * 12), salaryView)
                              )}
                            </div>
                            <div className="text-[10px] text-brand-400">
                              {breakdown.otherPercent}%
                            </div>
                          </td>
                        </>
                      );
                    })()}
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        value={employee.newSalary}
                        onChange={(e) => {
                          const newSalary = Number(e.target.value);
                          const increase = newSalary - employee.baseSalary;
                          updateEmployeeIncrease(employee.id, increase);
                        }}
                        disabled={!employee.isSelected}
                        className="w-28 h-8 text-right rounded-lg border border-border bg-white px-2 text-sm font-medium text-brand-900 focus:border-brand-300 focus:outline-none disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {employee.proposedIncrease > 0 ? (
                        <div className="flex items-center justify-end gap-1 text-sm font-medium text-emerald-600">
                          <TrendingUp className="h-3 w-3" />+
                          {employee.proposedPercentage.toFixed(1)}%
                        </div>
                      ) : (
                        <span className="text-sm text-brand-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getBandBadge(employee.bandPosition)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {employee.performanceRating ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${PERF_BADGE[employee.performanceRating].bg} ${PERF_BADGE[employee.performanceRating].text}`}
                        >
                          {PERF_BADGE[employee.performanceRating].label}
                        </span>
                      ) : (
                        <span className="text-xs text-brand-300">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {employee.guidance && (
                        <div className="group relative">
                          {getGuidanceIcon(employee.guidance)}
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-brand-900 text-white text-xs rounded-lg shadow-lg z-10">
                            {employee.guidance.message}
                          </div>
                        </div>
                      )}
                    </td>
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
