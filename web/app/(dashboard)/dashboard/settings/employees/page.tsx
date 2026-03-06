"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Send,
  SendHorizonal,
  Mail,
  Search,
  UserPlus,
  Link as LinkIcon,
  Building2,
  Target,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import {
  getInvitableEmployees,
  inviteByEmail,
  inviteAllEmployees,
  type InvitableEmployee,
} from "./actions";

type StatusFilter = "all" | "not_invited" | "invited" | "linked";

export default function EmployeeInvitePage() {
  const [employees, setEmployees] = useState<InvitableEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const result = await getInvitableEmployees();
    setEmployees(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadEmployees();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadEmployees]);

  const filtered = employees.filter((emp) => {
    if (filter === "not_invited" && (emp.invited || emp.linkedProfileId)) return false;
    if (filter === "invited" && !emp.invited) return false;
    if (filter === "linked" && !emp.linkedProfileId) return false;

    if (search) {
      const q = search.toLowerCase();
      const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      return (
        name.includes(q) ||
        (emp.email && emp.email.toLowerCase().includes(q)) ||
        emp.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uninvitedWithEmail = employees.filter(
    (e) => e.email && !e.invited && !e.linkedProfileId
  );

  async function handleInvite(email: string, empId: string) {
    setSending(empId);
    setFeedback(null);
    const result = await inviteByEmail(email);
    if (result.success) {
      setFeedback({ type: "success", message: `Invitation sent to ${email}` });
      await loadEmployees();
    } else {
      setFeedback({ type: "error", message: result.error ?? "Failed to send invite" });
    }
    setSending(null);
  }

  async function handleBulkInvite() {
    setBulkSending(true);
    setFeedback(null);
    const result = await inviteAllEmployees();
    if (result.success) {
      setFeedback({
        type: "success",
        message: `Sent ${result.invited} invitations${result.skipped > 0 ? ` (${result.skipped} skipped)` : ""}`,
      });
      await loadEmployees();
    } else {
      setFeedback({ type: "error", message: result.error ?? "Failed" });
    }
    setBulkSending(false);
  }

  async function handleManualInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!manualEmail.includes("@")) return;
    setSending("manual");
    setFeedback(null);
    const result = await inviteByEmail(manualEmail);
    if (result.success) {
      setFeedback({ type: "success", message: `Invitation sent to ${manualEmail}` });
      setManualEmail("");
      await loadEmployees();
    } else {
      setFeedback({ type: "error", message: result.error ?? "Failed" });
    }
    setSending(null);
  }

  const filterTabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: employees.length },
    {
      value: "not_invited",
      label: "Not Invited",
      count: employees.filter((e) => !e.invited && !e.linkedProfileId).length,
    },
    { value: "invited", label: "Pending", count: employees.filter((e) => e.invited).length },
    { value: "linked", label: "Active", count: employees.filter((e) => e.linkedProfileId).length },
  ];

  const settingsTabs = [
    { id: "profile", label: "Company Profile", icon: Building2, href: "/dashboard/settings?tab=profile" },
    {
      id: "compensation",
      label: "Compensation Defaults",
      icon: Target,
      href: "/dashboard/settings?tab=compensation",
    },
    {
      id: "indices",
      label: "Compensation Index",
      icon: BarChart3,
      href: "/dashboard/settings?tab=indices",
    },
    {
      id: "compliance",
      label: "Workforce Compliance",
      icon: ShieldCheck,
      href: "/dashboard/settings?tab=compliance",
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Settings header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-accent-800 sm:text-3xl">
            Company Settings
          </h1>
          <p className="text-sm text-brand-600/80">
            Configure your company profile, compensation defaults, and workforce compliance rules.
          </p>
        </div>
        {uninvitedWithEmail.length > 0 && (
          <Button onClick={handleBulkInvite} isLoading={bulkSending} className="gap-2">
            <SendHorizonal className="h-4 w-4" />
            Invite All ({uninvitedWithEmail.length})
          </Button>
        )}
      </div>

      {/* Settings tab navigation */}
      <div className="settings-tabs-wrap">
        <div className="settings-tabs">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link key={tab.id} href={tab.href} className="settings-tab">
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
          <span className="settings-tab settings-tab-active">
            <Users className="h-4 w-4" />
            Employee Accounts
          </span>
        </div>
      </div>

      {/* Page title */}
      <div>
        <h2 className="text-xl font-bold text-brand-900">Employee Accounts</h2>
        <p className="text-sm text-brand-600/80">
          Invite employees to view their own compensation data
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={clsx(
            "rounded-xl border px-4 py-3 text-sm font-medium",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {feedback.message}
        </div>
      )}

      {/* Manual invite */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-brand-700">Manual Invite</h3>
        </div>
        <form onSubmit={handleManualInvite} className="flex gap-3">
          <Input
            type="email"
            placeholder="employee@company.com"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            fullWidth
            required
          />
          <Button type="submit" isLoading={sending === "manual"} className="shrink-0 gap-2">
            <Send className="h-4 w-4" />
            Send Invite
          </Button>
        </form>
      </Card>

      {/* Employee list */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border/50 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === tab.value
                    ? "bg-brand-500 text-white"
                    : "text-brand-600 hover:bg-brand-50"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-brand-500">
              Loading employees...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="mb-3 h-10 w-10 text-brand-300" />
              <p className="text-sm font-medium text-brand-700">No employees found</p>
              <p className="mt-1 text-xs text-brand-500">
                Upload employee data first, then invite them here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((emp) => {
                const isLinked = !!emp.linkedProfileId;
                const isInvited = emp.invited;
                const canInvite = !!emp.email && !isLinked && !isInvited;

                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-brand-50/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-semibold text-brand-700">
                        {emp.firstName.charAt(0)}
                        {emp.lastName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="truncate text-xs text-brand-500">
                          {emp.department}
                          {emp.email && ` · ${emp.email}`}
                        </p>
                      </div>
                    </div>

                    <div className="ml-3 shrink-0">
                      {isLinked ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <LinkIcon className="h-3 w-3" />
                          Active
                        </span>
                      ) : isInvited ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <Mail className="h-3 w-3" />
                          Invited
                        </span>
                      ) : canInvite ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          isLoading={sending === emp.id}
                          onClick={() => handleInvite(emp.email!, emp.id)}
                          className="gap-1.5 text-xs"
                        >
                          <Send className="h-3 w-3" />
                          Invite
                        </Button>
                      ) : (
                        <span className="text-xs text-brand-400">No email</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
