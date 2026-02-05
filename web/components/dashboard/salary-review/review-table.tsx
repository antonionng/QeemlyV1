"use client";

import { useState } from "react";
import { Search, ChevronUp, ChevronDown, AlertTriangle, TrendingUp, Star, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSalaryReview, type ReviewEmployee } from "@/lib/salary-review";
import { formatAED, type Department } from "@/lib/employees";

type SortField = "name" | "department" | "current" | "proposed" | "increase" | "band";
type SortDirection = "asc" | "desc";

export function ReviewTable() {
  const { employees, updateEmployeeIncrease, toggleEmployeeSelection } = useSalaryReview();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<Department | "all">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department))];

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.title.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;
    return matchesSearch && matchesDepartment;
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
      case "current":
        comparison = a.baseSalary - b.baseSalary;
        break;
      case "proposed":
        comparison = a.newSalary - b.newSalary;
        break;
      case "increase":
        comparison = a.proposedPercentage - b.proposedPercentage;
        break;
      case "band":
        const bandOrder = { below: 0, "in-band": 1, above: 2 };
        comparison = bandOrder[a.bandPosition] - bandOrder[b.bandPosition];
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" 
      ? <ChevronUp className="h-3 w-3" />
      : <ChevronDown className="h-3 w-3" />;
  };

  const getBandBadge = (position: ReviewEmployee["bandPosition"]) => {
    switch (position) {
      case "below":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Below</span>;
      case "in-band":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">In Band</span>;
      case "above":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">Above</span>;
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

  return (
    <Card className="p-0 overflow-hidden">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-b border-border">
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
        <div className="text-sm text-brand-600">
          Showing {sortedEmployees.length} of {employees.length} employees
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-50/50">
              <th className="w-8 px-4 py-3">
                <input
                  type="checkbox"
                  checked={employees.every(e => e.isSelected)}
                  onChange={(e) => e.target.checked ? useSalaryReview.getState().selectAll() : useSalaryReview.getState().deselectAll()}
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
                className="text-right px-4 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider cursor-pointer hover:bg-brand-100/50"
                onClick={() => handleSort("current")}
              >
                <div className="flex items-center justify-end gap-1">
                  Current <SortIcon field="current" />
                </div>
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
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sortedEmployees.map((employee) => (
              <tr 
                key={employee.id}
                className={`hover:bg-brand-50/30 ${!employee.isSelected ? "opacity-50" : ""}`}
              >
                <td className="px-4 py-3">
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
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-brand-900">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-xs text-brand-500">{employee.level.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-brand-900">{employee.role.title}</div>
                  <div className="text-xs text-brand-500">{employee.department}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="text-sm font-medium text-brand-900">
                    {formatAED(employee.baseSalary)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
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
                      <TrendingUp className="h-3 w-3" />
                      +{employee.proposedPercentage.toFixed(1)}%
                    </div>
                  ) : (
                    <span className="text-sm text-brand-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {getBandBadge(employee.bandPosition)}
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
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
