"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BrainCircuit, BriefcaseBusiness, Landmark, MapPin, Save, ShieldCheck, X } from "lucide-react";
import { AdvisoryPanel } from "@/components/dashboard/overview/advisory-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";
import { formatAEDCompact, type Department, type Employee, type PerformanceRating } from "@/lib/employees";

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

  useEffect(() => {
    setForm(toFormState(employee));
    setConfirmDelete(false);
  }, [employee]);

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

  const employeeLabel = employee.displayName || `${employee.firstName} ${employee.lastName}`.trim();
  const benchmarkLabel = employee.hasBenchmark ? "Benchmark linked" : "Benchmark pending";
  const benchmarkTone = employee.hasBenchmark
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close employee drawer"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l border-border bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-500">
              Employee profile
            </p>
            <h3 className="mt-2 truncate text-xl font-semibold text-brand-900">{employeeLabel}</h3>
            <p className="mt-1 text-sm text-accent-500">{employee.role.title}</p>
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
          <section className="overflow-hidden rounded-2xl border border-brand-100 bg-[linear-gradient(180deg,rgba(108,92,231,0.08),rgba(108,92,231,0.02))] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/80 bg-white px-3 py-1 text-[11px] font-semibold text-brand-700 shadow-sm">
                    {employee.level.name}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/80 bg-white px-3 py-1 text-[11px] font-semibold text-accent-600 shadow-sm">
                    {employee.department}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm ${benchmarkTone}`}>
                    {benchmarkLabel}
                  </span>
                </div>
                <div className="grid gap-2 text-sm text-accent-600 sm:grid-cols-2">
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand-500" />
                    <span>
                      {employee.location.city}, {employee.location.country}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 text-brand-500" />
                    <span>{employee.email || "No work email yet"}</span>
                  </div>
                </div>
              </div>
              <div className="grid min-w-[220px] gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                    Base
                  </p>
                  <p className="mt-2 text-sm font-semibold text-brand-900">
                    {formatAEDCompact(employee.baseSalary)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                    Total
                  </p>
                  <p className="mt-2 text-sm font-semibold text-brand-900">
                    {formatAEDCompact(employee.totalComp)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                    Market
                  </p>
                  <p className={`mt-2 text-sm font-semibold ${employee.marketComparison > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {employee.marketComparison > 0 ? "+" : ""}
                    {employee.marketComparison}%
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border p-4">
            <div className="mb-4 flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-900">Qeemly Advisory</h4>
                <p className="mt-1 text-sm text-accent-500">
                  Ask about compensation, fairness, or retention risks for this employee.
                </p>
              </div>
            </div>
            <AdvisoryPanel employee={employee} />
          </section>

          <section className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-500" />
              <h4 className="text-sm font-semibold text-brand-900">Profile</h4>
            </div>
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
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-brand-500" />
              <h4 className="text-sm font-semibold text-brand-900">Compensation</h4>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Input type="number" value={form.baseSalary} onChange={(e) => setForm((prev) => ({ ...prev, baseSalary: e.target.value }))} fullWidth />
              <Input type="number" value={form.bonus} onChange={(e) => setForm((prev) => ({ ...prev, bonus: e.target.value }))} fullWidth />
              <Input type="number" value={form.equity} onChange={(e) => setForm((prev) => ({ ...prev, equity: e.target.value }))} fullWidth />
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 text-brand-500" />
              <h4 className="text-sm font-semibold text-brand-900">Employment</h4>
            </div>
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

