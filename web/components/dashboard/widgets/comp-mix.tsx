"use client";

import { BarChart, DonutChart } from "@tremor/react";
import { useState } from "react";
import {
  LOCATIONS,
  ROLES,
  LEVELS,
  getCompMix,
  formatCurrency,
  getLocation,
} from "@/lib/dashboard/dummy-data";
import { useSalaryView } from "@/lib/salary-view-store";

export function CompMixWidget() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0].id);
  const [selectedLevel, setSelectedLevel] = useState("ic3");

  const data = getCompMix(selectedRole, selectedLocation, selectedLevel);
  const location = getLocation(selectedLocation);
  const { salaryView } = useSalaryView();
  const multiplier = salaryView === "annual" ? 12 : 1;

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
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="rounded-lg border border-border/50 bg-white px-3 py-1.5 text-xs font-medium text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <DonutChart
          data={data}
          index="name"
          category="value"
          valueFormatter={(v) => formatCurrency(location?.currency || "AED", v * multiplier)}
          colors={["brand-600", "amber-500", "violet-500"]}
          className="h-48"
        />
        
        <div className="mt-6 grid grid-cols-3 gap-8 w-full">
          {data.map((item, i) => {
            const colors = ["bg-brand-600", "bg-amber-500", "bg-violet-500"];
            const textColors = ["text-brand-600", "text-amber-600", "text-violet-600"];
            const total = data.reduce((acc, curr) => acc + curr.value, 0);
            const percentage = ((item.value / total) * 100).toFixed(0);
            
            return (
              <div key={item.name} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className={`h-2 w-2 rounded-full ${colors[i]}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500">{item.name}</span>
                </div>
                <p className={`text-lg font-bold ${textColors[i]}`}>{percentage}%</p>
                <p className="text-[10px] text-brand-400 font-medium">
                  {formatCurrency(location?.currency || "AED", item.value * multiplier)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
