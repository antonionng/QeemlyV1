"use client";

import { useState } from "react";
import {
  LOCATIONS,
  ROLES,
  getExperienceMatrix,
  formatCurrencyK,
  getLocation,
} from "@/lib/dashboard/dummy-data";
import clsx from "clsx";

export function ExperienceMatrixWidget() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0].id);

  const data = getExperienceMatrix(selectedRole, selectedLocation);
  const location = getLocation(selectedLocation);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="rounded-lg border border-border/50 bg-white px-3 py-1.5 text-xs font-medium text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {ROLES.slice(0, 8).map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="rounded-lg border border-border/50 bg-white px-3 py-1.5 text-xs font-medium text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.city}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-border/40">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-brand-50/80 backdrop-blur-sm">
            <tr>
              <th className="p-3 font-bold text-brand-900">Level</th>
              <th className="p-3 font-bold text-brand-900 text-center">P25</th>
              <th className="p-3 font-bold text-brand-900 text-center">Median (P50)</th>
              <th className="p-3 font-bold text-brand-900 text-center">P75</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {data.map((row, i) => (
              <tr key={row.level} className="hover:bg-brand-50/30 transition-colors">
                <td className="p-3 font-semibold text-brand-800 whitespace-nowrap">{row.level}</td>
                <td className="p-3 text-center text-brand-600 font-medium">
                  {formatCurrencyK(location?.currency || "AED", row.p25)}
                </td>
                <td className="p-3 text-center">
                   <span className={clsx(
                     "inline-block px-3 py-1 rounded-full font-bold text-brand-900",
                     i < 3 ? "bg-brand-100" : i < 6 ? "bg-brand-200" : "bg-brand-300"
                   )}>
                    {formatCurrencyK(location?.currency || "AED", row.p50)}
                   </span>
                </td>
                <td className="p-3 text-center text-brand-600 font-medium">
                  {formatCurrencyK(location?.currency || "AED", row.p75)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
