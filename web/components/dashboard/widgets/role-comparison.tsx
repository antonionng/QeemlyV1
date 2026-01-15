"use client";

import clsx from "clsx";
import { ArrowRight, Plus, X } from "lucide-react";
import { useState } from "react";
import {
  formatCurrency,
  formatPercentage,
  generateBenchmark,
  getRole,
  LEVELS,
  LOCATIONS,
  ROLES,
} from "@/lib/dashboard/dummy-data";

export function RoleComparisonWidget() {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["swe", "pm", "data-scientist"]);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0].id);
  const [selectedLevel, setSelectedLevel] = useState("ic3");

  const location = LOCATIONS.find(l => l.id === selectedLocation)!;

  const comparisons = selectedRoles.map(roleId => {
    const role = getRole(roleId);
    const benchmark = generateBenchmark(roleId, selectedLocation, selectedLevel);
    return { role, benchmark };
  });

  // Find max salary for bar scaling
  const maxSalary = Math.max(...comparisons.map(c => c.benchmark.percentiles.p90));

  const addRole = (roleId: string) => {
    if (selectedRoles.length < 5 && !selectedRoles.includes(roleId)) {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const removeRole = (roleId: string) => {
    if (selectedRoles.length > 1) {
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
    }
  };

  const availableRoles = ROLES.filter(r => !selectedRoles.includes(r.id));

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedLocation}
          onChange={e => setSelectedLocation(e.target.value)}
          className="rounded-lg border border-border/50 bg-white px-3 py-1.5 text-sm font-medium text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {LOCATIONS.map(l => (
            <option key={l.id} value={l.id}>
              {l.city}
            </option>
          ))}
        </select>
        <select
          value={selectedLevel}
          onChange={e => setSelectedLevel(e.target.value)}
          className="rounded-lg border border-border/50 bg-white px-3 py-1.5 text-sm font-medium text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {LEVELS.slice(0, 6).map(l => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        {/* Add role button */}
        {selectedRoles.length < 5 && availableRoles.length > 0 && (
          <select
            value=""
            onChange={e => {
              if (e.target.value) addRole(e.target.value);
            }}
            className="rounded-lg border border-dashed border-brand-300 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">+ Add role</option>
            {availableRoles.slice(0, 10).map(r => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Comparison cards */}
      <div className="flex-1 space-y-3 overflow-auto">
        {comparisons.map(({ role, benchmark }, index) => {
          if (!role) return null;
          
          const rangeWidth = ((benchmark.percentiles.p75 - benchmark.percentiles.p25) / maxSalary) * 100;
          const rangeStart = (benchmark.percentiles.p25 / maxSalary) * 100;
          const medianPosition = (benchmark.percentiles.p50 / maxSalary) * 100;

          return (
            <div
              key={role.id}
              className="group relative rounded-xl border border-border/50 bg-white p-4 transition-shadow hover:shadow-md"
            >
              {/* Remove button */}
              {selectedRoles.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRole(role.id)}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-brand-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Role header */}
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-xs font-bold text-white">
                  {role.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-brand-900">{role.title}</h4>
                  <p className="text-xs text-brand-600">{role.family}</p>
                </div>
              </div>

              {/* Salary range visualization */}
              <div className="mb-2 h-8 w-full rounded-lg bg-brand-100/50 relative overflow-hidden">
                {/* P25-P75 range bar */}
                <div
                  className="absolute top-1 bottom-1 rounded-md bg-brand-500"
                  style={{ left: `${rangeStart}%`, width: `${rangeWidth}%` }}
                />
                {/* Median marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-brand-700"
                  style={{ left: `${medianPosition}%` }}
                />
              </div>

              {/* Values */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-brand-600">P25: </span>
                  <span className="font-semibold text-brand-800">
                    {formatCurrency(benchmark.currency, benchmark.percentiles.p25)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="font-bold text-brand-900">
                    {formatCurrency(benchmark.currency, benchmark.percentiles.p50)}
                  </span>
                  <span
                    className={clsx(
                      "ml-2 text-xs font-semibold",
                      benchmark.yoyChange > 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {formatPercentage(benchmark.yoyChange)}
                  </span>
                </div>
                <div>
                  <span className="text-brand-600">P75: </span>
                  <span className="font-semibold text-brand-800">
                    {formatCurrency(benchmark.currency, benchmark.percentiles.p75)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-brand-600">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded bg-brand-500" />
          <span>P25–P75 Range</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-0.5 bg-brand-700" />
          <span>Median</span>
        </div>
      </div>
    </div>
  );
}

