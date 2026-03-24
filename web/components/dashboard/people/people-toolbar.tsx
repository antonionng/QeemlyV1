"use client";

import { Download, LayoutGrid, List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOCATIONS } from "@/lib/dashboard/dummy-data";
import type { Department, PerformanceRating } from "@/lib/employees";
import type { PeopleFilters, PeopleSortKey, PeopleViewMode } from "@/lib/people/use-people";

type Props = {
  filters: PeopleFilters;
  onFiltersChange: (next: PeopleFilters) => void;
  viewMode: PeopleViewMode;
  onViewModeChange: (mode: PeopleViewMode) => void;
  sortBy: PeopleSortKey;
  onSortByChange: (sortBy: PeopleSortKey) => void;
  onAddEmployee: () => void;
  onExportCsv: () => void;
};

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

export function PeopleToolbar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  onAddEmployee,
  onExportCsv,
}: Props) {
  return (
    <div className="rounded-3xl border border-border/70 bg-white p-4 shadow-sm shadow-brand-100/20 md:p-5">
      <div className="space-y-3">
        <div
          data-testid="people-toolbar-filters"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.45fr)_repeat(2,minmax(0,0.9fr))]"
        >
          <div className="relative md:col-span-2 xl:col-span-1">
            <label htmlFor="people-search" className="sr-only">
              Search employees
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-400" />
            <Input
              id="people-search"
              value={filters.search}
              onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
              className="h-11 pl-9"
              placeholder="Search employees, emails, roles..."
              fullWidth
            />
          </div>

          <select
            value={filters.department}
            onChange={(event) =>
              onFiltersChange({ ...filters, department: event.target.value as Department | "all" })
            }
            className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <select
            value={filters.locationId}
            onChange={(event) => onFiltersChange({ ...filters, locationId: event.target.value })}
            className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
          >
            <option value="all">All Locations</option>
            {LOCATIONS.map((location) => (
              <option key={location.id} value={location.id}>
                {location.city}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="grid gap-3 md:grid-cols-2 xl:min-w-0 xl:grid-cols-3">
            <select
              value={filters.band}
              onChange={(event) =>
                onFiltersChange({ ...filters, band: event.target.value as PeopleFilters["band"] })
              }
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
            >
              <option value="all">All Bands</option>
              <option value="outside-band">Outside band</option>
              <option value="below">Below band</option>
              <option value="in-band">In band</option>
              <option value="above">Above band</option>
            </select>

            <select
              value={filters.performance}
              onChange={(event) =>
                onFiltersChange({
                  ...filters,
                  performance: event.target.value as PeopleFilters["performance"],
                })
              }
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
            >
              <option value="all">All Performance</option>
              <option value="low">Low</option>
              <option value="meets">Meets</option>
              <option value="exceeds">Exceeds</option>
              <option value="exceptional">Exceptional</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => onSortByChange(event.target.value as PeopleSortKey)}
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
            >
              <option value="name">Sort: Name</option>
              <option value="department">Sort: Department</option>
              <option value="totalComp">Sort: Salary</option>
              <option value="marketComparison">Sort: Market %</option>
              <option value="hireDate">Sort: Hire Date</option>
            </select>
          </div>

          <div
            data-testid="people-toolbar-actions"
            className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end"
          >
            <div className="flex w-full overflow-hidden rounded-xl border border-border bg-white sm:w-auto">
              <button
                type="button"
                className={`inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-medium ${
                  viewMode === "table"
                    ? "bg-brand-500 text-white"
                    : "bg-white text-accent-600 hover:bg-accent-50"
                }`}
                onClick={() => onViewModeChange("table")}
              >
                <List className="h-4 w-4" />
                Table
              </button>
              <button
                type="button"
                className={`inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-medium ${
                  viewMode === "grid"
                    ? "bg-brand-500 text-white"
                    : "bg-white text-accent-600 hover:bg-accent-50"
                }`}
                onClick={() => onViewModeChange("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
                Grid
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={onExportCsv}
              className="h-11 w-full px-5 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button size="sm" onClick={onAddEmployee} className="h-11 w-full px-5 sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

