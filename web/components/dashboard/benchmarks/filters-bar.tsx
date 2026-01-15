"use client";

import { Button } from "@/components/ui/button";
import { Filter, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import clsx from "clsx";

export type FilterChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

type FiltersBarProps = {
  chips: FilterChip[];
  onOpenFilters: () => void;
  onClearAll: () => void;
  activeCount: number;
};

export function FiltersBar({ chips, onOpenFilters, onClearAll, activeCount }: FiltersBarProps) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-white to-brand-50/50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Main filter toggle button */}
          <button
            type="button"
            onClick={onOpenFilters}
            className={clsx(
              "inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all",
              activeCount > 0
                ? "border-brand-400 bg-brand-500 text-white shadow-md hover:bg-brand-600"
                : "border-brand-200 bg-white text-brand-700 hover:border-brand-400 hover:bg-brand-50"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-brand-600">
                {activeCount}
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-60" />
          </button>

          {/* Active filter chips */}
          {chips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {chips.slice(0, 5).map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-800 shadow-sm"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    aria-label={`Remove ${chip.label}`}
                    className="rounded-full p-0.5 text-accent-400 hover:bg-brand-100 hover:text-brand-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {chips.length > 5 && (
                <button
                  type="button"
                  onClick={onOpenFilters}
                  className="rounded-full bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-200"
                >
                  +{chips.length - 5} more
                </button>
              )}
            </div>
          ) : (
            <span className="text-sm text-accent-500">Click Filters to refine your search</span>
          )}
        </div>

        {/* Clear all */}
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-accent-500 hover:text-rose-600"
          >
            <X className="mr-1.5 h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
