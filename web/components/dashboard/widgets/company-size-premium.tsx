"use client";

import { BarChart } from "@tremor/react";
import { useState } from "react";
import {
  LOCATIONS,
  ROLES,
  LEVELS,
  getCompanySizePremium,
  formatCurrencyK,
  getLocation,
} from "@/lib/dashboard/dummy-data";

export function CompanySizePremiumWidget() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0].id);

  const data = getCompanySizePremium(selectedRole, selectedLocation, "ic3");
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

      <div className="flex-1 min-h-[220px]">
        <BarChart
          className="h-full"
          data={data}
          index="size"
          categories={["median"]}
          colors={["emerald"]}
          valueFormatter={(v) => formatCurrencyK(location?.currency || "AED", v)}
          showLegend={false}
          showGridLines={true}
          yAxisWidth={70}
        />
      </div>
    </div>
  );
}
