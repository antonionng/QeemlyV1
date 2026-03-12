"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SalaryReviewQueryState } from "@/lib/salary-review/url-state";

type ReviewToolbarProps = {
  query: SalaryReviewQueryState;
  departments: string[];
  locations: string[];
  resultCount: number;
  totalCount: number;
  onChange: (updates: Partial<SalaryReviewQueryState>) => void;
  onClear: () => void;
  actions?: ReactNode;
};

export function ReviewToolbar({
  query,
  departments,
  locations,
  resultCount,
  totalCount,
  onChange,
  onClear,
  actions,
}: ReviewToolbarProps) {
  const hasActiveFilters =
    query.department !== "all" ||
    query.location !== "all" ||
    query.pool !== "all" ||
    query.bandFilter !== "all" ||
    query.performance !== "all" ||
    query.benchmarkStatus !== "all" ||
    query.workflowStatus !== "all" ||
    Boolean(query.search);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border/50">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-400" />
          <Input
            type="text"
            placeholder="Search employees..."
            value={query.search}
            onChange={(event) => onChange({ search: event.target.value })}
            className="pl-10 h-10 rounded-xl bg-accent-50"
            fullWidth
          />
        </div>

        <select
          value={query.department}
          onChange={(event) => onChange({ department: event.target.value })}
          className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
        >
          <option value="all">All Departments</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>

        <select
          value={query.location}
          onChange={(event) => onChange({ location: event.target.value })}
          className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
        >
          <option value="all">All Locations</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>

        <select
          value={query.bandFilter}
          onChange={(event) => onChange({ bandFilter: event.target.value as SalaryReviewQueryState["bandFilter"] })}
          className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
        >
          <option value="all">All Band Positions</option>
          <option value="outside-band">Outside Band</option>
          <option value="below">Below Band</option>
          <option value="above">Above Band</option>
        </select>

        <select
          value={query.performance}
          onChange={(event) => onChange({ performance: event.target.value as SalaryReviewQueryState["performance"] })}
          className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
        >
          <option value="all">All Performance</option>
          <option value="exceptional">Exceptional</option>
          <option value="exceeds">Exceeds</option>
          <option value="meets">Meets</option>
          <option value="low">Low</option>
        </select>

        <select
          value={query.benchmarkStatus}
          onChange={(event) =>
            onChange({ benchmarkStatus: event.target.value as SalaryReviewQueryState["benchmarkStatus"] })
          }
          className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
        >
          <option value="all">All Benchmark Matches</option>
          <option value="exact">Exact Match</option>
          <option value="fallback">Fallback Match</option>
          <option value="missing">No Match</option>
        </select>

        <select
          value={query.workflowStatus}
          onChange={(event) =>
            onChange({ workflowStatus: event.target.value as SalaryReviewQueryState["workflowStatus"] })
          }
          className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
        >
          <option value="all">All Workflow States</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={query.pool}
          onChange={(event) => onChange({ pool: event.target.value as SalaryReviewQueryState["pool"] })}
          className="h-10 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
        >
          <option value="all">All Pools</option>
          <option value="leadership">Leadership</option>
          <option value="general">General</option>
        </select>

        {actions}
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-accent-50/50">
        <span className="text-xs text-accent-500">
          {resultCount} of {totalCount} employees visible
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-brand-500 hover:text-brand-700"
          >
            Clear filters
          </button>
        )}
      </div>
    </>
  );
}
