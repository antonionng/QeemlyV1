"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { ArrowLeft, BadgeDollarSign, CalendarClock, CircleUserRound, Landmark, Loader2, Pencil, Save, ShieldCheck, Sparkles, TrendingUp, Upload, X, FileClock, FilePlus2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { formatOptionalLabel, formatTimelineEventType, formatVisaStatus, formatVisaType } from "@/lib/people/format-display";

type DbEmployee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  department: string;
  role_id: string;
  level_id: string;
  location_id: string;
  base_salary: number;
  bonus: number | null;
  equity: number | null;
  currency: string | null;
  status: "active" | "inactive";
  employment_type: "national" | "expat";
  hire_date: string | null;
};

type TimelineEvent = {
  id: string;
  event_type: string;
  actor_name: string | null;
  occurred_at: string;
  payload: Record<string, unknown>;
};

type ProfileAggregate = {
  employee: DbEmployee;
  profileEnrichment: {
    avatar_url?: string | null;
    preferred_name?: string | null;
    legal_name?: string | null;
    manager_name?: string | null;
  } | null;
  compensationHistory: Array<{
    id: string;
    effectiveDate: string;
    baseSalary: number;
    bonus: number;
    equity: number;
    currency: string;
    changeReason: string | null;
  }>;
  contributionSnapshots: Array<Record<string, unknown>>;
  equityGrants: Array<Record<string, unknown>>;
  visaRecords: Array<Record<string, unknown>>;
  timeline: TimelineEvent[];
};

type SuggestionSeverity = "high" | "medium" | "low";

type DraftSuggestion = {
  id: string;
  title: string;
  category: string;
  severity: SuggestionSeverity;
  summary: string;
  rationale: string;
  applyLabel: string;
};

function getBonusTargetPercent(levelValue: unknown): number {
  const normalized = String(levelValue || "").toLowerCase();
  if (!normalized) return 0.1;
  if (normalized.includes("director") || normalized.includes("principal") || normalized.includes("lead")) return 0.2;
  if (normalized.includes("senior") || normalized.includes("ic4") || normalized.includes("ic5")) return 0.15;
  if (normalized.includes("mid") || normalized.includes("ic2") || normalized.includes("ic3")) return 0.1;
  if (normalized.includes("junior") || normalized.includes("associate") || normalized.includes("ic1")) return 0.06;
  return 0.1;
}

function daysSinceDate(value: unknown): number | null {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMoney(value: number, currency = "AED") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function toIsoDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function sectionTitle(
  icon: ReactNode,
  title: string,
  subtitle: string
) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-brand-50 p-2 text-brand-600">{icon}</div>
        <div>
          <h2 className="text-sm font-semibold text-accent-900">{title}</h2>
          <p className="text-xs text-accent-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const [employeeId, setEmployeeId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProfileAggregate | null>(null);
  const [employeeForm, setEmployeeForm] = useState<Record<string, unknown>>({});
  const [profileForm, setProfileForm] = useState<Record<string, unknown>>({});
  const [visaRows, setVisaRows] = useState<Array<Record<string, unknown>>>([]);
  const [contributionRows, setContributionRows] = useState<Array<Record<string, unknown>>>([]);
  const [equityRows, setEquityRows] = useState<Array<Record<string, unknown>>>([]);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const hydrateForms = (payload: ProfileAggregate) => {
    setData(payload);
    setEmployeeForm({
      first_name: payload.employee.first_name || "",
      last_name: payload.employee.last_name || "",
      email: payload.employee.email || "",
      department: payload.employee.department || "",
      role_id: payload.employee.role_id || "",
      level_id: payload.employee.level_id || "",
      location_id: payload.employee.location_id || "",
      base_salary: payload.employee.base_salary || 0,
      bonus: payload.employee.bonus || 0,
      equity: payload.employee.equity || 0,
      status: payload.employee.status || "active",
      employment_type: payload.employee.employment_type || "national",
      hire_date: toIsoDate(payload.employee.hire_date),
    });
    setProfileForm({
      avatar_url: payload.profileEnrichment?.avatar_url || "",
      preferred_name: payload.profileEnrichment?.preferred_name || "",
      legal_name: payload.profileEnrichment?.legal_name || "",
      manager_name: payload.profileEnrichment?.manager_name || "",
    });
    setVisaRows(payload.visaRecords || []);
    setContributionRows(payload.contributionSnapshots || []);
    setEquityRows(payload.equityGrants || []);
  };

  useEffect(() => {
    params.then((resolved) => setEmployeeId(resolved.id));
  }, [params]);

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/people/${employeeId}/profile`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Failed to load profile");
        if (!mounted) return;
        hydrateForms(payload as ProfileAggregate);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const visaStatus = useMemo(() => {
    if (!visaRows.length) return "No Visa Records";
    const now = Date.now();
    let minDays = Number.POSITIVE_INFINITY;
    for (const row of visaRows) {
      const expiry = row.expiry_date ? new Date(String(row.expiry_date)).getTime() : NaN;
      if (!Number.isFinite(expiry)) continue;
      const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      minDays = Math.min(minDays, days);
    }
    if (!Number.isFinite(minDays)) return "Expiry Date Missing";
    if (minDays <= 30) return "Expires Within 30 Days";
    if (minDays <= 60) return "Expires Within 60 Days";
    if (minDays <= 90) return "Expires Within 90 Days";
    return "Valid";
  }, [visaRows]);

  const saveAll = async () => {
    if (!employeeId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/people/${employeeId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeUpdates: {
            ...employeeForm,
            base_salary: Number(employeeForm.base_salary || 0),
            bonus: Number(employeeForm.bonus || 0),
            equity: Number(employeeForm.equity || 0),
          },
          profileEnrichment: profileForm,
          visaRecords: visaRows,
          contributionSnapshots: contributionRows,
          equityGrants: equityRows,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save profile");
      hydrateForms(payload as ProfileAggregate);
      setIsEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const currency = data?.employee.currency || "AED";
  const baseSalary = Number(employeeForm.base_salary || 0);
  const bonus = Number(employeeForm.bonus || 0);
  const equity = Number(employeeForm.equity || 0);
  const totalComp = baseSalary + bonus + equity;
  const avatar = String(profileForm.avatar_url || "").trim();
  const initials = `${String(employeeForm.first_name || "").charAt(0)}${String(employeeForm.last_name || "").charAt(0)}`.toUpperCase();
  const fieldSelectClass =
    "h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-accent-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
  const cancelEdit = () => {
    if (data) hydrateForms(data);
    setIsEditMode(false);
  };

  const applySuggestion = (suggestionId: string) => {
    setIsEditMode(true);
    if (suggestionId === "set-market-bonus-target") {
      setEmployeeForm((prev) => {
        const currentBase = Number(prev.base_salary || 0);
        const targetPct = getBonusTargetPercent(prev.level_id);
        const targetBonus = Math.max(Math.round(currentBase * targetPct), 1000);
        return { ...prev, bonus: targetBonus };
      });
      return;
    }
    if (suggestionId === "add-contribution-snapshot") {
      setContributionRows((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            effective_date: new Date().toISOString().slice(0, 10),
            currency: String(employeeForm.currency || currency || "AED"),
            employer_pension_amount: 0,
            employee_pension_amount: 0,
          },
        ];
      });
      return;
    }
    if (suggestionId === "refresh-contribution-snapshot") {
      setContributionRows((prev) => {
        const last = prev[0];
        return [
          {
            effective_date: new Date().toISOString().slice(0, 10),
            currency: String(last?.currency || employeeForm.currency || currency || "AED"),
            employer_pension_amount: Number(last?.employer_pension_amount || 0),
            employee_pension_amount: Number(last?.employee_pension_amount || 0),
          },
          ...prev,
        ];
      });
      return;
    }
    if (suggestionId === "add-equity-grant") {
      setEquityRows((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            grant_type: "option",
            grant_date: new Date().toISOString().slice(0, 10),
            total_units: 0,
            status: "active",
          },
        ];
      });
      return;
    }
    if (suggestionId === "add-visa-record") {
      setVisaRows((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            visa_type: "work_permit",
            visa_status: "active",
            issue_date: "",
            expiry_date: "",
            issuing_country: "UAE",
          },
        ];
      });
      return;
    }
    if (suggestionId === "mark-visa-for-renewal") {
      setVisaRows((prev) => {
        if (!prev.length) return prev;
        let soonestIndex = 0;
        let soonestExpiry = Number.POSITIVE_INFINITY;
        prev.forEach((row, index) => {
          const expiry = row.expiry_date ? new Date(String(row.expiry_date)).getTime() : NaN;
          if (Number.isFinite(expiry) && expiry < soonestExpiry) {
            soonestExpiry = expiry;
            soonestIndex = index;
          }
        });
        return prev.map((row, index) => (
          index === soonestIndex
            ? { ...row, visa_status: "expiring" }
            : row
        ));
      });
      return;
    }
    if (suggestionId === "complete-profile-ownership") {
      setProfileForm((prev) => ({
        ...prev,
        manager_name: String(prev.manager_name || "").trim() || "Hiring Manager",
        preferred_name: String(prev.preferred_name || "").trim() || String(employeeForm.first_name || ""),
      }));
    }
  };

  const suggestions = useMemo<DraftSuggestion[]>(() => {
    const generated: DraftSuggestion[] = [];
    const targetBonusPct = getBonusTargetPercent(employeeForm.level_id);
    const targetBonus = Math.round(baseSalary * targetBonusPct);
    const lastContributionAgeDays = contributionRows.length ? daysSinceDate(contributionRows[0]?.effective_date) : null;
    const mostRecentCompDate = data?.compensationHistory[0]?.effectiveDate || null;
    const compReviewAgeDays = daysSinceDate(mostRecentCompDate);
    const visaDaysToExpiry = visaRows
      .map((row) => {
        const expiry = row.expiry_date ? new Date(String(row.expiry_date)).getTime() : NaN;
        if (!Number.isFinite(expiry)) return null;
        return Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
      })
      .filter((value): value is number => value !== null);

    if (baseSalary > 0 && bonus < targetBonus) {
      generated.push({
        id: "set-market-bonus-target",
        title: "Align bonus to level target",
        category: "Compensation",
        severity: "high",
        summary: `Current bonus is below the level target (${Math.round(targetBonusPct * 100)}% of base pay).`,
        rationale:
          "Model signal: level-aligned variable pay improves benchmarking quality and creates clearer differentiation for performance outcomes.",
        applyLabel: "Apply to Draft",
      });
    }
    if (contributionRows.length === 0) {
      generated.push({
        id: "add-contribution-snapshot",
        title: "Start contribution tracking",
        category: "Contributions",
        severity: "medium",
        summary: "No contribution snapshot exists yet.",
        rationale:
          "Model signal: missing employer/employee contribution data hides true total cost and creates blind spots during budget cycles.",
        applyLabel: "Apply to Draft",
      });
    } else if (lastContributionAgeDays !== null && lastContributionAgeDays > 120) {
      generated.push({
        id: "refresh-contribution-snapshot",
        title: "Refresh contribution cadence",
        category: "Contributions",
        severity: "medium",
        summary: `Latest contribution snapshot is ${lastContributionAgeDays} days old.`,
        rationale:
          "Model signal: stale contribution snapshots reduce confidence in current employer-cost forecasting.",
        applyLabel: "Apply to Draft",
      });
    }
    if (equityRows.length === 0) {
      generated.push({
        id: "add-equity-grant",
        title: "Capture equity ownership",
        category: "Equity",
        severity: "medium",
        summary: "No equity grants are on file.",
        rationale:
          "Model signal: ownership data is a major input for comp calibration and promotion readiness discussions.",
        applyLabel: "Apply to Draft",
      });
    }
    if (visaRows.length === 0) {
      generated.push({
        id: "add-visa-record",
        title: "Add work authorization record",
        category: "Visa",
        severity: String(employeeForm.employment_type || "") === "expat" ? "high" : "low",
        summary: "No visa record is available.",
        rationale:
          "Model signal: immigration risk should be surfaced early to avoid payroll, renewal, and mobility disruptions.",
        applyLabel: "Apply to Draft",
      });
    } else if (visaDaysToExpiry.length > 0) {
      const nearestExpiry = Math.min(...visaDaysToExpiry);
      if (nearestExpiry <= 60) {
        generated.push({
          id: "mark-visa-for-renewal",
          title: "Flag visa renewal risk",
          category: "Visa",
          severity: nearestExpiry <= 30 ? "high" : "medium",
          summary: `Earliest visa expiry is in ${Math.max(nearestExpiry, 0)} days.`,
          rationale:
            "Model signal: surfacing renewal intent early helps avoid compliance and payroll interruptions.",
          applyLabel: "Apply to Draft",
        });
      }
    }
    if (compReviewAgeDays !== null && compReviewAgeDays > 365) {
      generated.push({
        id: "set-market-bonus-target",
        title: "Refresh annual comp intent",
        category: "Compensation",
        severity: "medium",
        summary: `Last compensation history event was ${compReviewAgeDays} days ago.`,
        rationale:
          "Model signal: a stale compensation review trail makes progression and market adjustment decisions harder to justify.",
        applyLabel: "Apply to Draft",
      });
    }
    if (!String(profileForm.manager_name || "").trim() || !String(profileForm.preferred_name || "").trim()) {
      generated.push({
        id: "complete-profile-ownership",
        title: "Complete ownership metadata",
        category: "Profile",
        severity: "low",
        summary: "Manager and preferred-name metadata are incomplete.",
        rationale:
          "Model signal: complete reporting metadata improves approval routing and communication quality across compensation workflows.",
        applyLabel: "Apply to Draft",
      });
    }
    return generated.slice(0, 4);
  }, [baseSalary, bonus, contributionRows, data, employeeForm.employment_type, employeeForm.level_id, equityRows.length, profileForm.manager_name, profileForm.preferred_name, visaRows]);

  if (loading) {
    return <div className="p-6 text-sm text-accent-500">Loading profile...</div>;
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
        <Link href="/dashboard/people" className="mt-4 inline-flex text-sm text-brand-600 underline">
          Back to People
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      if (!isEditMode) return;
      setError(null);
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Please choose an image to upload.");
      }
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop() || "png";
      const filePath = `employees/${employeeId}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        upsert: true,
      });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setProfileForm((prev) => ({ ...prev, avatar_url: publicUrl }));
    } catch (uploadErr) {
      setError(uploadErr instanceof Error ? uploadErr.message : "Avatar upload failed.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5 bg-gradient-to-b from-brand-50/30 to-transparent p-4 sm:p-6">
      <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/people" className="inline-flex items-center gap-2 text-sm text-accent-500 hover:text-accent-700">
            <ArrowLeft className="h-4 w-4" />
            Back to People
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-accent-50 px-3 py-1 text-xs text-accent-700">{visaStatus}</span>
            {!isEditMode ? (
              <Button size="sm" onClick={() => setIsEditMode(true)} className="h-10 px-4">
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={cancelEdit} className="h-10 px-4">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" isLoading={saving} onClick={saveAll} className="h-10 px-4">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-violet-50 p-4">
            <div className="flex items-center gap-3">
              {avatar ? (
                <img src={avatar} alt="Profile avatar" className="h-14 w-14 rounded-2xl border border-white object-cover shadow-sm" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-200 bg-white text-lg font-bold text-brand-700 shadow-sm">
                  {initials || "?"}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute ml-10 mt-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-accent-900">
                  {String(employeeForm.first_name || "")} {String(employeeForm.last_name || "")}
                </h1>
                <p className="mt-1 text-sm text-accent-600">
                  Compensation profile, equity, visa, and timeline view.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-accent-700">{formatOptionalLabel(employeeForm.department, "Department")}</span>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-accent-700">{formatOptionalLabel(employeeForm.status, "Active")}</span>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-accent-700">{formatOptionalLabel(employeeForm.employment_type, "National")}</span>
                  <button
                    type="button"
                    disabled={!isEditMode || uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-brand-700 disabled:opacity-50"
                  >
                    <Upload className="h-3 w-3" />
                    Upload Avatar
                  </button>
                </div>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadAvatar}
              disabled={!isEditMode || uploadingAvatar}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-accent-50/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-accent-500">Total Compensation</p>
              <p className="mt-1 text-sm font-semibold text-accent-900">{formatMoney(totalComp, currency)}</p>
            </div>
            <div className="rounded-xl border border-border bg-accent-50/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-accent-500">Timeline Events</p>
              <p className="mt-1 text-sm font-semibold text-accent-900">{data.compensationHistory.length} events</p>
            </div>
            <div className="rounded-xl border border-border bg-accent-50/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-accent-500">Equity Grants</p>
              <p className="mt-1 text-sm font-semibold text-accent-900">{equityRows.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-accent-50/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-accent-500">Visa Records</p>
              <p className="mt-1 text-sm font-semibold text-accent-900">{visaRows.length}</p>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">{error}</p>}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="space-y-5 xl:col-span-2">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            {sectionTitle(<CircleUserRound className="h-4 w-4" />, "Profile", "Core identity and reporting fields")}
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input disabled={!isEditMode} value={String(employeeForm.first_name || "")} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, first_name: e.target.value }))} fullWidth />
              <Input disabled={!isEditMode} value={String(employeeForm.last_name || "")} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, last_name: e.target.value }))} fullWidth />
              <Input disabled={!isEditMode} value={String(employeeForm.email || "")} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))} fullWidth className="md:col-span-2" />
              <Input disabled={!isEditMode} value={String(profileForm.preferred_name || "")} onChange={(e) => setProfileForm((prev) => ({ ...prev, preferred_name: e.target.value }))} placeholder="Preferred Name" fullWidth />
              <Input disabled={!isEditMode} value={String(profileForm.manager_name || "")} onChange={(e) => setProfileForm((prev) => ({ ...prev, manager_name: e.target.value }))} placeholder="Manager Name" fullWidth />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            {sectionTitle(<BadgeDollarSign className="h-4 w-4" />, "Compensation", "Base, bonus, equity, and historical changes")}
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input disabled={!isEditMode} type="number" value={String(employeeForm.base_salary || 0)} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, base_salary: Number(e.target.value || 0) }))} fullWidth />
              <Input disabled={!isEditMode} type="number" value={String(employeeForm.bonus || 0)} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, bonus: Number(e.target.value || 0) }))} fullWidth />
              <Input disabled={!isEditMode} type="number" value={String(employeeForm.equity || 0)} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, equity: Number(e.target.value || 0) }))} fullWidth />
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-accent-50/70">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-accent-500">Effective</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-accent-500">Base</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-accent-500">Bonus</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-accent-500">Equity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.compensationHistory.slice(0, 8).map((entry) => (
                    <tr key={entry.id} className="border-t border-border">
                      <td className="px-3 py-2">{entry.effectiveDate}</td>
                      <td className="px-3 py-2">{formatMoney(entry.baseSalary, entry.currency)}</td>
                      <td className="px-3 py-2">{formatMoney(entry.bonus, entry.currency)}</td>
                      <td className="px-3 py-2">{formatMoney(entry.equity, entry.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-accent-900">Contributions</h2>
                <p className="text-xs text-accent-500">Employer and employee contribution snapshots</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!isEditMode}
                onClick={() =>
                  setContributionRows((prev) => [
                    ...prev,
                    { effective_date: new Date().toISOString().slice(0, 10), currency: "AED", employer_pension_amount: 0, employee_pension_amount: 0 },
                  ])
                }
              >
                Add Snapshot
              </Button>
            </div>
            <div className="space-y-2">
              {contributionRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-accent-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white p-2 text-accent-500"><FilePlus2 className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium text-accent-800">No contribution snapshots yet.</p>
                      <p className="text-xs text-accent-500">Add the first record to start tracking employer cost.</p>
                    </div>
                  </div>
                </div>
              ) : contributionRows.map((row, index) => (
                <div key={`contrib-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  {isEditMode ? (
                    <>
                      <Input type="date" value={String(row.effective_date || "")} onChange={(e) => setContributionRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, effective_date: e.target.value } : entry)))} fullWidth />
                      <Input type="number" value={String(row.employer_pension_amount || 0)} onChange={(e) => setContributionRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, employer_pension_amount: Number(e.target.value || 0) } : entry)))} fullWidth />
                      <Input type="number" value={String(row.employee_pension_amount || 0)} onChange={(e) => setContributionRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, employee_pension_amount: Number(e.target.value || 0) } : entry)))} fullWidth />
                      <Button variant="ghost" size="sm" onClick={() => setContributionRows((prev) => prev.filter((_, i) => i !== index))}>
                        Remove
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-800">{String(row.effective_date || "Not set")}</div>
                      <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-800">Employer: {formatMoney(Number(row.employer_pension_amount || 0), currency)}</div>
                      <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-800">Employee: {formatMoney(Number(row.employee_pension_amount || 0), currency)}</div>
                      <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-500">Snapshot {index + 1}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-accent-900">Equity Grants</h2>
                <p className="text-xs text-accent-500">Grant type, date, and total units</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!isEditMode}
                onClick={() =>
                  setEquityRows((prev) => [
                    ...prev,
                    { grant_type: "option", grant_date: new Date().toISOString().slice(0, 10), total_units: 0, status: "active" },
                  ])
                }
              >
                Add Grant
              </Button>
            </div>
            <div className="space-y-2">
              {equityRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-accent-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white p-2 text-accent-500"><FilePlus2 className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium text-accent-800">No equity grants on file.</p>
                      <p className="text-xs text-accent-500">Add a grant to track vesting and ownership.</p>
                    </div>
                  </div>
                </div>
              ) : equityRows.map((row, index) => (
                <div key={`equity-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  {isEditMode ? (
                    <>
                      <Input value={String(row.grant_type || "")} onChange={(e) => setEquityRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, grant_type: e.target.value } : entry)))} fullWidth />
                      <Input type="date" value={String(row.grant_date || "")} onChange={(e) => setEquityRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, grant_date: e.target.value } : entry)))} fullWidth />
                      <Input type="number" value={String(row.total_units || 0)} onChange={(e) => setEquityRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, total_units: Number(e.target.value || 0) } : entry)))} fullWidth />
                      <Button variant="ghost" size="sm" onClick={() => setEquityRows((prev) => prev.filter((_, i) => i !== index))}>
                        Remove
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-800">{formatOptionalLabel(row.grant_type, "Grant Type")}</div>
                      <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-800">{String(row.grant_date || "Not set")}</div>
                      <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-800">{Number(row.total_units || 0).toLocaleString()} units</div>
                      <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-500">Grant {index + 1}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-accent-900">Visa & Work Authorization</h2>
                  <p className="text-xs text-accent-500">Status, issue/expiry dates, and sponsorship details</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!isEditMode}
                onClick={() =>
                  setVisaRows((prev) => [
                    ...prev,
                    { visa_type: "work_permit", visa_status: "active", issue_date: "", expiry_date: "", issuing_country: "UAE" },
                  ])
                }
              >
                Add Visa
              </Button>
            </div>
            <div className="space-y-2">
              {visaRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-accent-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white p-2 text-emerald-600"><ShieldAlert className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium text-accent-800">No visa records yet.</p>
                      <p className="text-xs text-accent-500">Add a visa/work authorization record to monitor expiry risk.</p>
                    </div>
                  </div>
                </div>
              ) : visaRows.map((row, index) => (
                <div key={`visa-${index}`} className="rounded-xl border border-border p-3">
                  <div className="grid grid-cols-1 gap-2">
                    {isEditMode ? (
                      <>
                        <select
                          className={fieldSelectClass}
                          value={String(row.visa_type || "work_permit")}
                          onChange={(e) => setVisaRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, visa_type: e.target.value } : entry)))}
                        >
                          <option value="work_permit">Work Permit</option>
                          <option value="employment_visa">Employment Visa</option>
                          <option value="residence_visa">Residence Visa</option>
                          <option value="transfer_visa">Transfer Visa</option>
                          {row.visa_type && !["work_permit", "employment_visa", "residence_visa", "transfer_visa"].includes(String(row.visa_type)) ? (
                            <option value={String(row.visa_type)}>{formatVisaType(row.visa_type)}</option>
                          ) : null}
                        </select>
                        <select
                          className={fieldSelectClass}
                          value={String(row.visa_status || "active")}
                          onChange={(e) => setVisaRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, visa_status: e.target.value } : entry)))}
                        >
                          <option value="active">Active</option>
                          <option value="expiring">Expiring</option>
                          <option value="expired">Expired</option>
                          <option value="pending">Pending</option>
                          <option value="cancelled">Cancelled</option>
                          {row.visa_status && !["active", "expiring", "expired", "pending", "cancelled"].includes(String(row.visa_status)) ? (
                            <option value={String(row.visa_status)}>{formatVisaStatus(row.visa_status)}</option>
                          ) : null}
                        </select>
                        <Input type="date" value={String(row.issue_date || "")} onChange={(e) => setVisaRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, issue_date: e.target.value } : entry)))} fullWidth />
                        <Input type="date" value={String(row.expiry_date || "")} onChange={(e) => setVisaRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, expiry_date: e.target.value } : entry)))} fullWidth />
                        <Button variant="ghost" size="sm" onClick={() => setVisaRows((prev) => prev.filter((_, i) => i !== index))}>
                          Remove
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-800">{formatVisaType(row.visa_type)}</div>
                        <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-800">{formatVisaStatus(row.visa_status)}</div>
                        <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-800">Issued: {String(row.issue_date || "Not set")}</div>
                        <div className="rounded-xl border border-border bg-accent-50/40 px-3 py-2 text-sm text-accent-800">Expires: {String(row.expiry_date || "Not set")}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            {sectionTitle(<CalendarClock className="h-4 w-4" />, "Timeline", "Recent compensation/profile events")}
            <div className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {data.timeline.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-accent-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white p-2 text-accent-500"><FileClock className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium text-accent-800">No events yet.</p>
                      <p className="text-xs text-accent-500">Changes to profile, pay, equity, and visa will appear here.</p>
                    </div>
                  </div>
                </div>
              )}
              {data.timeline.map((event) => (
                <div key={event.id} className="rounded-xl border border-border bg-accent-50/50 p-3">
                  <p className="text-xs font-semibold text-accent-500">{formatTimelineEventType(event.event_type)}</p>
                  <p className="mt-1 text-sm text-accent-700">{new Date(event.occurred_at).toLocaleString()}</p>
                  <p className="text-xs text-accent-500">By {event.actor_name || "System"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-accent-900">AI Suggestions</h3>
              </div>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-brand-700">{suggestions.length} suggestions</span>
            </div>
            {suggestions.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-brand-200 bg-white/70 p-3 text-xs text-accent-600">
                Profile looks healthy. New suggestions will appear as compensation, equity, contribution, and visa data changes.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {suggestions.map((suggestion) => {
                  const severityStyle =
                    suggestion.severity === "high"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : suggestion.severity === "medium"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700";
                  return (
                    <div key={suggestion.id} className="rounded-xl border border-brand-100 bg-white/90 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-accent-900">{suggestion.title}</p>
                          <p className="mt-0.5 text-[11px] text-accent-500">{suggestion.category}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityStyle}`}>
                          {suggestion.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-accent-700">{suggestion.summary}</p>
                      <p className="mt-1 text-[11px] text-accent-500">{suggestion.rationale}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-8"
                        onClick={() => applySuggestion(suggestion.id)}
                      >
                        {suggestion.applyLabel}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-3 space-y-1 text-[11px] text-accent-600">
              <p className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Suggestions apply draft-only changes and never auto-save.</p>
              <p className="flex items-center gap-1"><Landmark className="h-3 w-3" /> Review and edit details before saving.</p>
              <p className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Signals combine profile rules with AI-style rationale.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
