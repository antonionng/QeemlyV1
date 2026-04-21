"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { buildBenchmarkTrustLabels } from "@/lib/benchmarks/trust";
import type { Employee } from "@/lib/employees";
import { DropdownItem, DropdownMenu } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCurrencyFormatter } from "@/lib/utils/currency";
import { VisaBadge, classifyVisa } from "./visa-badge";

type Props = {
  employees: Employee[];
  onOpenDetails: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  selectedIds: string[];
  onToggleSelect: (employeeId: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onBulkArchive: () => void;
  mutating: boolean;
};

function bandBadgeClass(position: Employee["bandPosition"]) {
  if (position === "below") return "bg-red-50 text-red-600 border-red-100";
  if (position === "above") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-emerald-50 text-emerald-700 border-emerald-100";
}

function visaBadge(employee: Employee) {
  return classifyVisa(employee.visaExpiryDate);
}

export function PeopleTable({
  employees,
  onOpenDetails,
  onEditEmployee,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onBulkArchive,
  mutating,
}: Props) {
  const allSelected = employees.length > 0 && employees.every((employee) => selectedIds.includes(employee.id));
  const { defaultCurrency, convertToDefault } = useCurrencyFormatter();
  const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

  const formatSalaryNumber = (value: number, sourceCurrency: string) =>
    numberFormatter.format(Math.round(convertToDefault(value, sourceCurrency)));

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-sm shadow-brand-100/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-accent-50/80 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
          {selectedIds.length} selected
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={selectedIds.length === 0 || mutating}
          onClick={onBulkArchive}
          className="h-9 rounded-full px-4 text-xs"
        >
          Archive Selected
        </Button>
      </div>
      <div className="responsive-scroll-x" data-testid="people-table-scroller">
        <table className="w-full min-w-full lg:min-w-[1320px]">
          <thead className="bg-accent-50/60">
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-accent-500">
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
              <th className="px-4 py-3 font-semibold">{`Salary (${defaultCurrency})`}</th>
              <th className="px-4 py-3 font-semibold">Band</th>
              <th className="px-4 py-3 font-semibold">Market Data</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Level</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.map((employee) => {
              const visa = visaBadge(employee);
              const benchmarkTrust = buildBenchmarkTrustLabels(employee.benchmarkContext);
              const employeeLabel = employee.displayName || `${employee.firstName} ${employee.lastName}`.trim();
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
                    aria-label={`Select ${employeeLabel}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {employee.avatar ? (
                      <img
                        src={employee.avatar}
                        alt={employeeLabel}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {employee.firstName[0]}
                        {employee.lastName[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-900">
                        {employeeLabel}
                      </p>
                      <p className="truncate text-xs text-accent-500">{employee.email || "No email"}</p>
                      {visa && (
                        <span className="mt-1 inline-flex">
                          <VisaBadge visa={visa} />
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-brand-800">
                  <div className="min-w-[180px] max-w-[220px]">
                    <p className="truncate font-medium">{employee.role.title}</p>
                    <p className="truncate text-xs text-accent-500">{employee.role.family}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-brand-800">
                  <span className="inline-flex rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
                    {employee.department}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-brand-800">
                  <p className="font-medium">{employee.location.city}</p>
                  <p className="text-xs text-accent-500">{employee.location.country}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-brand-900">
                      {formatSalaryNumber(employee.totalComp, employee.location.currency)}
                    </p>
                    <p className="text-[11px] text-accent-500">
                      Basic {formatSalaryNumber(employee.baseSalary, employee.location.currency)}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {employee.hasBenchmark ? (
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${bandBadgeClass(employee.bandPosition)}`}>
                      {employee.bandPosition}
                    </span>
                  ) : (
                    <span className="rounded-full border border-accent-200 px-2 py-1 text-[10px] font-semibold uppercase text-accent-500">
                      Benchmark pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {employee.hasBenchmark ? (
                    <div className="min-w-[180px] space-y-1">
                      <p className={`text-sm font-semibold ${employee.marketComparison > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {employee.marketComparison > 0 ? "+" : ""}
                        {employee.marketComparison}%
                      </p>
                      {benchmarkTrust && (
                        <>
                          <p className="text-[11px] font-medium text-brand-700">
                            {benchmarkTrust.sourceLabel}
                          </p>
                          <p className="text-[11px] text-accent-500">
                            {benchmarkTrust.matchLabel}
                            {benchmarkTrust.freshnessLabel ? ` · ${benchmarkTrust.freshnessLabel}` : ""}
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="min-w-[180px] space-y-1">
                      <p className="text-sm font-semibold text-accent-500">Not mapped</p>
                      <p className="text-[10px] text-accent-400">Awaiting benchmark coverage</p>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-brand-800 capitalize">
                  <span className="inline-flex rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
                    {employee.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-brand-800">
                  <p className="font-medium">{employee.level.name}</p>
                  <p className="text-xs text-accent-500">{employee.level.category}</p>
                </td>
                <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-brand-200 px-4 text-sm font-medium text-brand-700 hover:bg-brand-50"
                      onClick={() => onEditEmployee(employee)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <DropdownMenu
                      trigger={
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-accent-500 hover:bg-accent-50">
                          <MoreHorizontal className="h-4 w-4" />
                        </span>
                      }
                    >
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

