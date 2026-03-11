"use client";

import { useMemo, useState } from "react";
import { Check, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { buildBenchmarkTrustLabels } from "@/lib/benchmarks/trust";
import type { Department, Employee } from "@/lib/employees";
import { formatAEDCompact } from "@/lib/employees";
import { DropdownItem, DropdownMenu } from "@/components/ui/dropdown-menu";
import { LOCATIONS, LEVELS } from "@/lib/dashboard/dummy-data";
import { Button } from "@/components/ui/button";

type Props = {
  employees: Employee[];
  onOpenDetails: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  selectedIds: string[];
  onToggleSelect: (employeeId: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onBulkArchive: () => void;
  onInlineSave: (
    employeeId: string,
    updates: Partial<{
      department: Department;
      levelId: string;
      locationId: string;
      baseSalary: number;
      status: "active" | "inactive";
    }>
  ) => Promise<void>;
  mutating: boolean;
};

function bandBadgeClass(position: Employee["bandPosition"]) {
  if (position === "below") return "bg-red-50 text-red-600 border-red-100";
  if (position === "above") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-emerald-50 text-emerald-700 border-emerald-100";
}

function visaBadge(employee: Employee) {
  if (!employee.visaExpiryDate) return null;
  const days = Math.ceil((employee.visaExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 30) return { label: "Expiring <=30d", cls: "bg-red-50 text-red-700 border-red-200" };
  if (days <= 60) return { label: "Expiring <=60d", cls: "bg-orange-50 text-orange-700 border-orange-200" };
  if (days <= 90) return { label: "Expiring <=90d", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Valid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

export function PeopleTable({
  employees,
  onOpenDetails,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onBulkArchive,
  onInlineSave,
  mutating,
}: Props) {
  const [edits, setEdits] = useState<
    Record<string, { department: Department; levelId: string; locationId: string; baseSalary: number; status: "active" | "inactive" }>
  >({});

  const departments: Department[] = useMemo(
    () => ["Engineering", "Product", "Design", "Data", "Sales", "Marketing", "Operations", "Finance", "HR"],
    []
  );
  const allSelected = employees.length > 0 && employees.every((employee) => selectedIds.includes(employee.id));

  const readDraft = (employee: Employee) =>
    edits[employee.id] || {
      department: employee.department,
      levelId: employee.level.id,
      locationId: employee.location.id,
      baseSalary: employee.baseSalary,
      status: employee.status,
    };

  const updateDraft = (
    employee: Employee,
    employeeId: string,
    patch: Partial<{ department: Department; levelId: string; locationId: string; baseSalary: number; status: "active" | "inactive" }>
  ) => {
    const current = readDraft(employee);
    setEdits((prev) => ({
      ...prev,
      [employeeId]: {
        department: patch.department || current.department,
        levelId: patch.levelId || current.levelId,
        locationId: patch.locationId || current.locationId,
        baseSalary: patch.baseSalary ?? current.baseSalary,
        status: patch.status || current.status,
      },
    }));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-accent-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">
          {selectedIds.length} selected
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={selectedIds.length === 0 || mutating}
          onClick={onBulkArchive}
          className="h-8 px-3 text-xs"
        >
          Archive Selected
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1250px] w-full">
          <thead className="bg-accent-50">
            <tr className="text-left text-xs uppercase tracking-wider text-accent-500">
              <th className="px-4 py-3 font-semibold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => onToggleSelectAll(event.target.checked)}
                  aria-label="Select all employees"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Department</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Salary</th>
              <th className="px-4 py-3 font-semibold">Band</th>
              <th className="px-4 py-3 font-semibold">Market %</th>
              <th className="px-4 py-3 font-semibold">Status / Level</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.map((employee) => {
              const visa = visaBadge(employee);
              const benchmarkTrust = buildBenchmarkTrustLabels(employee.benchmarkContext);
              return (
              <tr
                key={employee.id}
                className="cursor-pointer hover:bg-accent-50/70"
                onClick={() => onOpenDetails(employee)}
              >
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(employee.id)}
                    onChange={() => onToggleSelect(employee.id)}
                    aria-label={`Select ${employee.firstName} ${employee.lastName}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {employee.avatar ? (
                      <img
                        src={employee.avatar}
                        alt={`${employee.firstName} ${employee.lastName}`}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {employee.firstName[0]}
                        {employee.lastName[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-brand-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-accent-500">{employee.email || "No email"}</p>
                      {visa && (
                        <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${visa.cls}`}>
                          {visa.label}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-brand-800">
                  <p className="font-medium">{employee.role.title}</p>
                  <p className="text-xs text-accent-500">{employee.level.name}</p>
                </td>
                <td className="px-4 py-3 text-sm text-brand-800" onClick={(event) => event.stopPropagation()}>
                  <select
                    value={readDraft(employee).department}
                    onChange={(event) =>
                      updateDraft(employee, employee.id, { department: event.target.value as Department })
                    }
                    className="h-8 rounded-lg border border-border px-2 text-xs"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-brand-800" onClick={(event) => event.stopPropagation()}>
                  <select
                    value={readDraft(employee).locationId}
                    onChange={(event) => updateDraft(employee, employee.id, { locationId: event.target.value })}
                    className="h-8 rounded-lg border border-border px-2 text-xs"
                  >
                    {LOCATIONS.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.city}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-brand-900" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="number"
                    value={readDraft(employee).baseSalary}
                    onChange={(event) =>
                      updateDraft(employee, employee.id, { baseSalary: Number(event.target.value || 0) })
                    }
                    className="h-8 w-28 rounded-lg border border-border px-2 text-xs"
                  />
                  <p className="mt-1 text-[10px] text-accent-500">{formatAEDCompact(employee.totalComp)} total</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${bandBadgeClass(employee.bandPosition)}`}>
                    {employee.bandPosition}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className={`text-sm font-semibold ${employee.marketComparison > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {employee.marketComparison > 0 ? "+" : ""}
                      {employee.marketComparison}%
                    </p>
                    <div className="h-1.5 w-20 rounded-full bg-accent-100">
                      <div
                        className={`h-full rounded-full ${employee.marketComparison > 8 ? "bg-red-500" : employee.marketComparison < -3 ? "bg-emerald-500" : "bg-brand-500"}`}
                        style={{ width: `${Math.min(100, Math.max(10, Math.abs(employee.marketComparison) * 3))}%` }}
                      />
                    </div>
                    {benchmarkTrust && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                          {benchmarkTrust.sourceLabel}
                        </span>
                        <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-600">
                          {benchmarkTrust.matchLabel}
                        </span>
                        {benchmarkTrust.freshnessLabel && (
                          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-600">
                            {benchmarkTrust.freshnessLabel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-brand-800 capitalize" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <select
                      value={readDraft(employee).status}
                      onChange={(event) =>
                        updateDraft(employee, employee.id, {
                          status: event.target.value as "active" | "inactive",
                        })
                      }
                      className="h-8 rounded-lg border border-border px-2 text-xs"
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                    <select
                      value={readDraft(employee).levelId}
                      onChange={(event) => updateDraft(employee, employee.id, { levelId: event.target.value })}
                      className="h-8 rounded-lg border border-border px-2 text-xs"
                    >
                      {LEVELS.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 disabled:opacity-60"
                    onClick={async () => {
                      const draft = readDraft(employee);
                      await onInlineSave(employee.id, draft);
                      setEdits((prev) => {
                        const next = { ...prev };
                        delete next[employee.id];
                        return next;
                      });
                    }}
                    title="Save inline edits"
                    disabled={mutating}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <DropdownMenu
                    trigger={
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-accent-500 hover:bg-accent-50">
                        <MoreHorizontal className="h-4 w-4" />
                      </span>
                    }
                  >
                    <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => onOpenDetails(employee)}>
                      Edit Employee
                    </DropdownItem>
                    <DropdownItem
                      icon={<Trash2 className="h-4 w-4" />}
                      variant="danger"
                      onClick={() => onDelete(employee)}
                    >
                      Delete Employee
                    </DropdownItem>
                  </DropdownMenu>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

