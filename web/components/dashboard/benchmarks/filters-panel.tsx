"use client";

import clsx from "clsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Check, MapPin, Layers, Building2, Briefcase, Clock, Shield, BarChart3, Users } from "lucide-react";
import type { BenchmarkFilters } from "@/lib/benchmarks/filters";

type FilterOption = { id: string; label: string };

type FiltersPanelProps = {
  filters: BenchmarkFilters;
  onChange: (next: BenchmarkFilters) => void;
  onClose: () => void;
  onClear: () => void;
  options: {
    families: FilterOption[];
    locations: FilterOption[];
    levels: FilterOption[];
    industries: FilterOption[];
    companySizes: FilterOption[];
    experienceBands: FilterOption[];
    compTypes: FilterOption[];
    confidences: FilterOption[];
    timeRanges: Array<{ id: string; label: string; days: number }>;
  };
};

function FilterSection({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
          {icon}
        </span>
        <p className="text-sm font-bold text-brand-900">{label}</p>
      </div>
      {children}
    </div>
  );
}

function TogglePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
        active
          ? "border-brand-400 bg-brand-500 text-white shadow-sm"
          : "border-brand-200 bg-white text-brand-700 hover:border-brand-400 hover:bg-brand-50"
      )}
    >
      {active && <Check className="h-3 w-3" />}
      {label}
    </button>
  );
}

export function FiltersPanel({ filters, onChange, onClose, onClear, options }: FiltersPanelProps) {
  const activeCount =
    filters.roleFamilies.length +
    filters.locationIds.length +
    filters.levelIds.length +
    filters.industries.length +
    filters.companySizes.length +
    filters.experienceBands.length +
    filters.compTypes.length +
    filters.confidences.length +
    (filters.minSampleSize != null ? 1 : 0) +
    (filters.timeRangeDays != null ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-brand-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-brand-900">Filter Benchmarks</h3>
          <p className="mt-1 text-sm text-accent-600">
            Refine by role, market, company size, and data quality.
          </p>
          {activeCount > 0 && (
            <p className="mt-2 text-sm font-medium text-brand-600">
              {activeCount} filter{activeCount > 1 ? "s" : ""} active
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-accent-500 hover:bg-brand-100 hover:text-brand-700"
          aria-label="Close filters"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Filter Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FilterSection icon={<Briefcase className="h-4 w-4" />} label="Role Family">
          <div className="flex flex-wrap gap-2">
            {options.families.map((opt) => (
              <TogglePill
                key={opt.id}
                label={opt.label}
                active={filters.roleFamilies.includes(opt.id)}
                onClick={() =>
                  onChange({
                    ...filters,
                    roleFamilies: filters.roleFamilies.includes(opt.id)
                      ? filters.roleFamilies.filter((v) => v !== opt.id)
                      : [...filters.roleFamilies, opt.id],
                  })
                }
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection icon={<MapPin className="h-4 w-4" />} label="Location">
          <div className="flex flex-wrap gap-2">
            {options.locations.map((opt) => (
              <TogglePill
                key={opt.id}
                label={opt.label}
                active={filters.locationIds.includes(opt.id)}
                onClick={() =>
                  onChange({
                    ...filters,
                    locationIds: filters.locationIds.includes(opt.id)
                      ? filters.locationIds.filter((v) => v !== opt.id)
                      : [...filters.locationIds, opt.id],
                  })
                }
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection icon={<Layers className="h-4 w-4" />} label="Level">
          <div className="flex flex-wrap gap-2">
            {options.levels.map((opt) => (
              <TogglePill
                key={opt.id}
                label={opt.label}
                active={filters.levelIds.includes(opt.id)}
                onClick={() =>
                  onChange({
                    ...filters,
                    levelIds: filters.levelIds.includes(opt.id)
                      ? filters.levelIds.filter((v) => v !== opt.id)
                      : [...filters.levelIds, opt.id],
                  })
                }
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection icon={<BarChart3 className="h-4 w-4" />} label="Industry">
          <div className="flex flex-wrap gap-2">
            {options.industries.map((opt) => (
              <TogglePill
                key={opt.id}
                label={opt.label}
                active={filters.industries.includes(opt.id)}
                onClick={() =>
                  onChange({
                    ...filters,
                    industries: filters.industries.includes(opt.id)
                      ? filters.industries.filter((v) => v !== opt.id)
                      : [...filters.industries, opt.id],
                  })
                }
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection icon={<Building2 className="h-4 w-4" />} label="Company Size">
          <div className="flex flex-wrap gap-2">
            {options.companySizes.map((opt) => (
              <TogglePill
                key={opt.id}
                label={opt.label}
                active={filters.companySizes.includes(opt.id)}
                onClick={() =>
                  onChange({
                    ...filters,
                    companySizes: filters.companySizes.includes(opt.id)
                      ? filters.companySizes.filter((v) => v !== opt.id)
                      : [...filters.companySizes, opt.id],
                  })
                }
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection icon={<Users className="h-4 w-4" />} label="Experience">
          <div className="flex flex-wrap gap-2">
            {options.experienceBands.map((opt) => (
              <TogglePill
                key={opt.id}
                label={opt.label}
                active={filters.experienceBands.includes(opt.id)}
                onClick={() =>
                  onChange({
                    ...filters,
                    experienceBands: filters.experienceBands.includes(opt.id)
                      ? filters.experienceBands.filter((v) => v !== opt.id)
                      : [...filters.experienceBands, opt.id],
                  })
                }
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection icon={<Shield className="h-4 w-4" />} label="Confidence">
          <div className="flex flex-wrap gap-2">
            {options.confidences.map((opt) => (
              <TogglePill
                key={opt.id}
                label={opt.label}
                active={filters.confidences.includes(
                  opt.id as BenchmarkFilters["confidences"][number]
                )}
                onClick={() =>
                  onChange({
                    ...filters,
                    confidences: filters.confidences.includes(
                      opt.id as BenchmarkFilters["confidences"][number]
                    )
                      ? filters.confidences.filter((v) => v !== opt.id)
                      : [
                          ...filters.confidences,
                          opt.id as BenchmarkFilters["confidences"][number],
                        ],
                  })
                }
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection icon={<Clock className="h-4 w-4" />} label="Data Freshness">
          <div className="flex flex-wrap gap-2">
            {options.timeRanges.map((opt) => {
              const isActive = filters.timeRangeDays === opt.days;
              return (
                <TogglePill
                  key={opt.id}
                  label={opt.label}
                  active={isActive}
                  onClick={() =>
                    onChange({
                      ...filters,
                      timeRangeDays: isActive ? null : opt.days,
                    })
                  }
                />
              );
            })}
          </div>
        </FilterSection>

        <FilterSection icon={<BarChart3 className="h-4 w-4" />} label="Min Sample Size">
          <Input
            type="number"
            min={0}
            placeholder="e.g. 20"
            fullWidth
            value={filters.minSampleSize ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                minSampleSize: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="h-10 rounded-xl"
          />
          <p className="mt-2 text-xs text-accent-500">
            Only show benchmarks with at least this many data points.
          </p>
        </FilterSection>
      </div>

      {/* Tip */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <p className="text-sm font-semibold text-amber-800">Pro tip</p>
        <p className="mt-1 text-sm text-amber-700">
          Combine filters to compare benchmarks across different markets. For example, select
          multiple locations to see regional salary differences for the same role.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-100 pt-4">
        <Button variant="ghost" onClick={onClear} className="text-accent-600 hover:text-rose-600">
          <X className="mr-2 h-4 w-4" />
          Clear all filters
        </Button>
        <Button onClick={onClose} size="lg">
          <Check className="mr-2 h-4 w-4" />
          Apply {activeCount > 0 ? `(${activeCount})` : ""}
        </Button>
      </div>
    </div>
  );
}
