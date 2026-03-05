"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";
import type { Department, Employee, PerformanceRating } from "@/lib/employees";

type Props = {
  employee: Employee | null;
  open: boolean;
  mutating?: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  roleId: string;
  levelId: string;
  locationId: string;
  baseSalary: string;
  bonus: string;
  equity: string;
  status: "active" | "inactive";
  employmentType: "national" | "expat";
  performanceRating: PerformanceRating;
  hireDate: string;
};

const DEPARTMENTS: Department[] = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "HR",
];

const DEFAULT_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  department: "Engineering",
  roleId: "swe",
  levelId: "ic3",
  locationId: "dubai",
  baseSalary: "0",
  bonus: "0",
  equity: "0",
  status: "active",
  employmentType: "national",
  performanceRating: "meets",
  hireDate: "",
};

export function EmployeeDrawer({ employee, open, mutating, onClose, onSave, onDelete }: Props) {
  const toFormState = (current: Employee | null): FormState => {
    if (!current) return DEFAULT_FORM;
    return {
      firstName: current.firstName,
      lastName: current.lastName,
      email: current.email || "",
      department: current.department,
      roleId: current.role.id,
      levelId: current.level.id,
      locationId: current.location.id,
      baseSalary: String(current.baseSalary || 0),
      bonus: String(current.bonus || 0),
      equity: String(current.equity || 0),
      status: current.status,
      employmentType: current.employmentType,
      performanceRating: current.performanceRating || "meets",
      hireDate: current.hireDate.toISOString().slice(0, 10),
    };
  };
  const [form, setForm] = useState<FormState>(() => toFormState(employee));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const changeSet = useMemo(() => {
    if (!employee) return {};
    const updates: Record<string, unknown> = {};
    if (form.firstName !== employee.firstName) updates.firstName = form.firstName;
    if (form.lastName !== employee.lastName) updates.lastName = form.lastName;
    if ((form.email || "") !== (employee.email || "")) updates.email = form.email;
    if (form.department !== employee.department) updates.department = form.department;
    if (form.roleId !== employee.role.id) updates.roleId = form.roleId;
    if (form.levelId !== employee.level.id) updates.levelId = form.levelId;
    if (form.locationId !== employee.location.id) updates.locationId = form.locationId;
    if (Number(form.baseSalary || 0) !== Number(employee.baseSalary || 0)) updates.baseSalary = Number(form.baseSalary || 0);
    if (Number(form.bonus || 0) !== Number(employee.bonus || 0)) updates.bonus = Number(form.bonus || 0);
    if (Number(form.equity || 0) !== Number(employee.equity || 0)) updates.equity = Number(form.equity || 0);
    if (form.status !== employee.status) updates.status = form.status;
    if (form.employmentType !== employee.employmentType) updates.employmentType = form.employmentType;
    if ((form.performanceRating || "meets") !== (employee.performanceRating || "meets")) {
      updates.performanceRating = form.performanceRating;
    }
    if (form.hireDate !== employee.hireDate.toISOString().slice(0, 10)) updates.hireDate = form.hireDate;
    return updates;
  }, [employee, form]);

  if (!open || !employee) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close employee drawer"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l border-border bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-brand-900">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-accent-500">{employee.role.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-accent-500 hover:bg-accent-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          <section className="rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold text-brand-900">Profile</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} fullWidth />
              <Input value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} fullWidth />
              <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} fullWidth className="sm:col-span-2" />
              <select
                value={form.department}
                onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value as Department }))}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
              >
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <select
                value={form.locationId}
                onChange={(e) => setForm((prev) => ({ ...prev, locationId: e.target.value }))}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
              >
                {LOCATIONS.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.city}
                  </option>
                ))}
              </select>
              <select
                value={form.roleId}
                onChange={(e) => setForm((prev) => ({ ...prev, roleId: e.target.value }))}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
              >
                {ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
              <select
                value={form.levelId}
                onChange={(e) => setForm((prev) => ({ ...prev, levelId: e.target.value }))}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
              >
                {LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold text-brand-900">Compensation</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Input type="number" value={form.baseSalary} onChange={(e) => setForm((prev) => ({ ...prev, baseSalary: e.target.value }))} fullWidth />
              <Input type="number" value={form.bonus} onChange={(e) => setForm((prev) => ({ ...prev, bonus: e.target.value }))} fullWidth />
              <Input type="number" value={form.equity} onChange={(e) => setForm((prev) => ({ ...prev, equity: e.target.value }))} fullWidth />
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold text-brand-900">Employment</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "active" | "inactive" }))}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={form.employmentType}
                onChange={(e) => setForm((prev) => ({ ...prev, employmentType: e.target.value as "national" | "expat" }))}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
              >
                <option value="national">National</option>
                <option value="expat">Expat</option>
              </select>
              <select
                value={form.performanceRating}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, performanceRating: e.target.value as PerformanceRating }))
                }
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="meets">Meets</option>
                <option value="exceeds">Exceeds</option>
                <option value="exceptional">Exceptional</option>
              </select>
              <Input type="date" value={form.hireDate} onChange={(e) => setForm((prev) => ({ ...prev, hireDate: e.target.value }))} fullWidth />
            </div>
          </section>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {!confirmDelete ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                onClick={() => setConfirmDelete(true)}
              >
                <AlertTriangle className="h-4 w-4" />
                Delete Employee
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                Confirm delete?
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={async () => {
                    await onDelete(employee.id);
                    onClose();
                  }}
                >
                  Yes
                </button>
                <button type="button" className="font-semibold underline" onClick={() => setConfirmDelete(false)}>
                  No
                </button>
              </div>
            )}
          </div>

          <Button
            size="sm"
            isLoading={Boolean(mutating)}
            disabled={Object.keys(changeSet).length === 0}
            onClick={async () => {
              await onSave(employee.id, changeSet);
            }}
            className="h-10 px-5"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </aside>
    </div>
  );
}

