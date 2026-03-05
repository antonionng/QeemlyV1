"use client";

import { MapPin, Pencil, Trash2 } from "lucide-react";
import type { Employee } from "@/lib/employees";
import { formatAEDCompact } from "@/lib/employees";

type Props = {
  employees: Employee[];
  onOpenDetails: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
};

const DEPARTMENT_COLORS: Record<string, string> = {
  Engineering: "bg-blue-100 text-blue-700",
  Product: "bg-violet-100 text-violet-700",
  Design: "bg-pink-100 text-pink-700",
  Data: "bg-cyan-100 text-cyan-700",
  Sales: "bg-emerald-100 text-emerald-700",
  Marketing: "bg-orange-100 text-orange-700",
  Operations: "bg-amber-100 text-amber-700",
  Finance: "bg-lime-100 text-lime-700",
  HR: "bg-rose-100 text-rose-700",
};

function visaBadge(employee: Employee) {
  if (!employee.visaExpiryDate) return null;
  const days = Math.ceil((employee.visaExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 30) return { label: "Expiring <=30d", cls: "bg-red-50 text-red-700 border-red-200" };
  if (days <= 60) return { label: "Expiring <=60d", cls: "bg-orange-50 text-orange-700 border-orange-200" };
  if (days <= 90) return { label: "Expiring <=90d", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Valid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

export function PeopleCardGrid({ employees, onOpenDetails, onDelete }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {employees.map((employee) => {
        const visa = visaBadge(employee);
        return (
        <div
          key={employee.id}
          className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <button
              type="button"
              className="text-left"
              onClick={() => onOpenDetails(employee)}
            >
              <div className="flex items-center gap-3">
                {employee.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="h-11 w-11 rounded-xl object-cover"
                  />
                ) : (
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold ${DEPARTMENT_COLORS[employee.department] || "bg-brand-100 text-brand-700"}`}>
                    {employee.firstName[0]}
                    {employee.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-brand-900">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-xs text-accent-500">{employee.role.title}</p>
                </div>
              </div>
            </button>
            <span className="rounded-full bg-accent-50 px-2 py-1 text-[10px] font-semibold text-accent-600">
              {employee.level.id.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs text-accent-600">
            <p className="font-medium text-brand-800">{employee.department}</p>
            <p className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {employee.location.city}, {employee.location.country}
            </p>
            <p>
              Salary: <span className="font-semibold text-brand-900">{formatAEDCompact(employee.totalComp)}</span>
            </p>
            <p>
              Market:{" "}
              <span className={`font-semibold ${employee.marketComparison > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {employee.marketComparison > 0 ? "+" : ""}
                {employee.marketComparison}%
              </span>
            </p>
            {visa && (
              <p className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${visa.cls}`}>
                {visa.label}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onOpenDetails(employee)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium text-accent-600 hover:bg-accent-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(employee)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      );
      })}
    </div>
  );
}

