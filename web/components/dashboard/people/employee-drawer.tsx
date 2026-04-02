"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  BriefcaseBusiness,
  Landmark,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import { AdvisoryPanel } from "@/components/dashboard/overview/advisory-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";
import { formatAEDCompact, type Department, type Employee, type PerformanceRating } from "@/lib/employees";
import type {
  EmployeeProfileAggregate,
  EmployeeVisaRecordInput,
  UpdateEmployeeProfileInput,
} from "@/lib/people/use-people";

type Props = {
  employee: Employee | null;
  open: boolean;
  mutating?: boolean;
  onClose: () => void;
  onLoadProfile: (id: string) => Promise<EmployeeProfileAggregate>;
  onSave: (id: string, updates: UpdateEmployeeProfileInput) => Promise<void>;
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
  legalName: string;
  preferredName: string;
  managerName: string;
  avatarUrl: string;
  visaStatus: string;
  visaExpiryDate: string;
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
  legalName: "",
  preferredName: "",
  managerName: "",
  avatarUrl: "",
  visaStatus: "",
  visaExpiryDate: "",
};

type ProfileSnapshot = {
  legalName: string;
  preferredName: string;
  managerName: string;
  avatarUrl: string;
  visaStatus: string;
  visaExpiryDate: string;
  visaRecords: EmployeeVisaRecordInput[];
  timeline: Array<Record<string, unknown>>;
};

const DEFAULT_PROFILE_SNAPSHOT: ProfileSnapshot = {
  legalName: "",
  preferredName: "",
  managerName: "",
  avatarUrl: "",
  visaStatus: "",
  visaExpiryDate: "",
  visaRecords: [],
  timeline: [],
};

function formatTimelineEventLabel(eventType: string | null | undefined) {
  return (eventType || "profile_updated")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toProfileSnapshot(aggregate: EmployeeProfileAggregate | null): ProfileSnapshot {
  if (!aggregate) return DEFAULT_PROFILE_SNAPSHOT;

  const enrichment = (aggregate.profileEnrichment || {}) as Record<string, unknown>;
  const visaRecord = ((aggregate.visaRecords || [])[0] || {}) as Record<string, unknown>;

  return {
    legalName: String(enrichment.legal_name || ""),
    preferredName: String(enrichment.preferred_name || ""),
    managerName: String(enrichment.manager_name || ""),
    avatarUrl: String(enrichment.avatar_url || ""),
    visaStatus: String(visaRecord.visa_status || ""),
    visaExpiryDate: String(visaRecord.expiry_date || ""),
    visaRecords: (aggregate.visaRecords || []).map((record) => {
      const row = record as Record<string, unknown>;
      return {
        id: row.id ? String(row.id) : undefined,
        visaStatus: row.visa_status ? String(row.visa_status) : "",
        expiryDate: row.expiry_date ? String(row.expiry_date) : "",
      };
    }),
    timeline: aggregate.timeline || [],
  };
}

export function EmployeeDrawer({
  employee,
  open,
  mutating,
  onClose,
  onLoadProfile,
  onSave,
  onDelete,
}: Props) {
  const toFormState = (current: Employee | null, profile: ProfileSnapshot = DEFAULT_PROFILE_SNAPSHOT): FormState => {
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
      legalName: profile.legalName,
      preferredName: profile.preferredName,
      managerName: profile.managerName,
      avatarUrl: profile.avatarUrl,
      visaStatus: profile.visaStatus || current.visaStatus || "",
      visaExpiryDate: profile.visaExpiryDate || (current.visaExpiryDate?.toISOString().slice(0, 10) || ""),
    };
  };
  const [form, setForm] = useState<FormState>(() => toFormState(employee));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [profileSnapshot, setProfileSnapshot] = useState<ProfileSnapshot>(DEFAULT_PROFILE_SNAPSHOT);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [hasStartedEditing, setHasStartedEditing] = useState(false);

  useEffect(() => {
    setProfileSnapshot(DEFAULT_PROFILE_SNAPSHOT);
    setForm(toFormState(employee));
    setConfirmDelete(false);
    setHasStartedEditing(false);
  }, [employee]);

  useEffect(() => {
    if (!open || !employee) return;

    let cancelled = false;
    setProfileLoading(true);
    setProfileError(null);

    void onLoadProfile(employee.id)
      .then((aggregate) => {
        if (cancelled) return;
        const snapshot = toProfileSnapshot(aggregate);
        setProfileSnapshot(snapshot);
        if (!hasStartedEditing) {
          setForm(toFormState(employee, snapshot));
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setProfileError(error instanceof Error ? error.message : "Failed to load employee profile.");
      })
      .finally(() => {
        if (!cancelled) {
          setProfileLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [employee, hasStartedEditing, onLoadProfile, open]);

  const employeeChangeSet = useMemo(() => {
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

  const profileEnrichmentChangeSet = useMemo(() => {
    const updates: Record<string, string> = {};
    if (form.legalName !== profileSnapshot.legalName) updates.legalName = form.legalName;
    if (form.preferredName !== profileSnapshot.preferredName) updates.preferredName = form.preferredName;
    if (form.managerName !== profileSnapshot.managerName) updates.managerName = form.managerName;
    if (form.avatarUrl !== profileSnapshot.avatarUrl) updates.avatarUrl = form.avatarUrl;
    return updates;
  }, [form, profileSnapshot]);

  const visaRecordChanged =
    form.visaStatus !== profileSnapshot.visaStatus || form.visaExpiryDate !== profileSnapshot.visaExpiryDate;

  if (!open || !employee) return null;

  const employeeLabel = employee.displayName || `${employee.firstName} ${employee.lastName}`.trim();
  const benchmarkLabel = employee.hasBenchmark ? "Benchmark linked" : "Benchmark pending";
  const benchmarkTone = employee.hasBenchmark
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
  const benchmarkSourceLabel =
    employee.benchmarkContext?.source === "uploaded"
      ? "Your Data"
      : employee.benchmarkContext?.source === "ai-estimated"
        ? "Qeemly AI Benchmark"
      : employee.hasBenchmark
        ? "Market"
        : "Unmapped";
  const timelinePreview = profileSnapshot.timeline.slice(0, 3);
  const primaryVisaRecord = profileSnapshot.visaRecords[0] || null;
  const inputDisabled = profileLoading;
  const canSave =
    Object.keys(employeeChangeSet).length > 0 ||
    Object.keys(profileEnrichmentChangeSet).length > 0 ||
    visaRecordChanged;

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setHasStartedEditing(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-100 text-lg font-semibold text-brand-700">
                  {form.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.avatarUrl} alt={employeeLabel} className="h-full w-full object-cover" />
                  ) : (
                    <>
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </>
                  )}
                </div>
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
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-900">Market Position</h4>
                <p className="mt-1 text-sm text-accent-500">
                  Benchmark positioning updates automatically from role, level, location, and pay inputs.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-accent-50/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                  Benchmark Source
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-900">{benchmarkSourceLabel}</p>
              </div>
              <div className="rounded-xl border border-border bg-accent-50/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                  Band Position
                </p>
                <p className="mt-2 text-sm font-semibold capitalize text-brand-900">
                  {employee.hasBenchmark ? employee.bandPosition : "Pending"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-accent-50/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
                  Market Percentile
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-900">
                  {employee.hasBenchmark ? `${employee.bandPercentile}th percentile` : "Pending"}
                </p>
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
              <Input value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} fullWidth disabled={inputDisabled} />
              <Input value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} fullWidth disabled={inputDisabled} />
              <Input value={form.email} onChange={(e) => updateField("email", e.target.value)} fullWidth className="sm:col-span-2" disabled={inputDisabled} />
              <select
                value={form.department}
                onChange={(e) => updateField("department", e.target.value as Department)}
                disabled={inputDisabled}
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
                onChange={(e) => updateField("locationId", e.target.value)}
                disabled={inputDisabled}
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
                onChange={(e) => updateField("roleId", e.target.value)}
                disabled={inputDisabled}
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
                onChange={(e) => updateField("levelId", e.target.value)}
                disabled={inputDisabled}
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
              <UserCircle2 className="h-4 w-4 text-brand-500" />
              <h4 className="text-sm font-semibold text-brand-900">Platform Identity</h4>
            </div>
            <p className="mt-2 text-sm text-accent-500">
              Keep the person record rich enough for Qeemly insights without turning this into a full HR suite.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                value={form.preferredName}
                onChange={(e) => updateField("preferredName", e.target.value)}
                placeholder="Preferred name"
                fullWidth
                disabled={inputDisabled}
              />
              <Input
                value={form.legalName}
                onChange={(e) => updateField("legalName", e.target.value)}
                placeholder="Legal name"
                fullWidth
                disabled={inputDisabled}
              />
              <Input
                value={form.managerName}
                onChange={(e) => updateField("managerName", e.target.value)}
                placeholder="Manager name"
                fullWidth
                disabled={inputDisabled}
              />
              <Input
                value={form.avatarUrl}
                onChange={(e) => updateField("avatarUrl", e.target.value)}
                placeholder="Avatar URL"
                fullWidth
                disabled={inputDisabled}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-brand-500" />
              <h4 className="text-sm font-semibold text-brand-900">Compensation</h4>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Input type="number" value={form.baseSalary} onChange={(e) => updateField("baseSalary", e.target.value)} fullWidth disabled={inputDisabled} />
              <Input type="number" value={form.bonus} onChange={(e) => updateField("bonus", e.target.value)} fullWidth disabled={inputDisabled} />
              <Input type="number" value={form.equity} onChange={(e) => updateField("equity", e.target.value)} fullWidth disabled={inputDisabled} />
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
                onChange={(e) => updateField("status", e.target.value as "active" | "inactive")}
                disabled={inputDisabled}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={form.employmentType}
                onChange={(e) => updateField("employmentType", e.target.value as "national" | "expat")}
                disabled={inputDisabled}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
              >
                <option value="national">National</option>
                <option value="expat">Expat</option>
              </select>
              <select
                value={form.performanceRating}
                onChange={(e) => updateField("performanceRating", e.target.value as PerformanceRating)}
                disabled={inputDisabled}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="meets">Meets</option>
                <option value="exceeds">Exceeds</option>
                <option value="exceptional">Exceptional</option>
              </select>
              <Input type="date" value={form.hireDate} onChange={(e) => updateField("hireDate", e.target.value)} fullWidth disabled={inputDisabled} />
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-500" />
              <h4 className="text-sm font-semibold text-brand-900">Visa &amp; Mobility</h4>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select
                value={form.visaStatus}
                onChange={(e) => updateField("visaStatus", e.target.value)}
                disabled={inputDisabled}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-accent-700 focus:border-brand-300 focus:outline-none"
              >
                <option value="">No visa record</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Input
                type="date"
                value={form.visaExpiryDate}
                onChange={(e) => updateField("visaExpiryDate", e.target.value)}
                fullWidth
                disabled={inputDisabled}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 text-brand-500" />
              <h4 className="text-sm font-semibold text-brand-900">Recent Activity</h4>
            </div>
            {profileLoading ? (
              <p className="mt-3 text-sm text-accent-500">Loading profile activity...</p>
            ) : timelinePreview.length > 0 ? (
              <div className="mt-3 space-y-2">
                {timelinePreview.map((event, index) => (
                  <div key={String(event.id || index)} className="rounded-xl border border-border bg-accent-50/60 p-3">
                    <p className="text-sm font-semibold text-brand-900">
                      {formatTimelineEventLabel(String(event.event_type || ""))}
                    </p>
                    <p className="mt-1 text-xs text-accent-500">
                      {String(event.actor_name || "Qeemly")} • {String(event.occurred_at || "")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-accent-500">No recent employee activity recorded yet.</p>
            )}
          </section>

          {profileError && (
            <section className="rounded-xl border border-amber-200 bg-[#FFF4E5] p-4 text-sm text-amber-800">
              {profileError}
            </section>
          )}
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
            disabled={!canSave || profileLoading}
            onClick={async () => {
              await onSave(employee.id, {
                employeeUpdates: employeeChangeSet,
                profileEnrichment: profileEnrichmentChangeSet,
                visaRecords: visaRecordChanged
                  ? [
                      ...(form.visaStatus || form.visaExpiryDate
                        ? [
                            {
                              id: primaryVisaRecord?.id,
                              visaStatus: form.visaStatus,
                              expiryDate: form.visaExpiryDate,
                            },
                          ]
                        : []),
                      ...profileSnapshot.visaRecords.slice(1),
                    ]
                  : undefined,
              });
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

