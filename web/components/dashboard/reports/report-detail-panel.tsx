"use client";

import { useState } from "react";
import {
  X,
  Save,
  Pencil,
  Trash2,
  Download,
  Calendar,
  Users,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReportsStore } from "@/lib/reports/store";
import type { Report } from "@/lib/reports/types";
import clsx from "clsx";
import { exportSingleReport } from "@/lib/reports/export";

interface ReportDetailPanelProps {
  report: Report;
  onClose: () => void;
}

const STATUS_OPTIONS: Report["status"][] = ["Building", "In Review", "Ready", "Scheduled"];
type ScheduleCadenceValue = Exclude<Report["schedule_cadence"], null>;
const CADENCE_OPTIONS: { value: ScheduleCadenceValue | ""; label: string }[] = [
  { value: "", label: "No Schedule" },
  { value: "once", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];
const FORMAT_OPTIONS: Report["format"][] = ["PDF", "XLSX", "Slides"];

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "bg-brand-100 text-brand-600",
  Ready: "bg-emerald-100 text-emerald-700",
  "In Review": "bg-amber-100 text-amber-700",
  Building: "bg-rose-100 text-rose-700",
};

export function ReportDetailPanel({ report, onClose }: ReportDetailPanelProps) {
  const { updateReport, deleteReport } = useReportsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(report.title);
  const [status, setStatus] = useState(report.status);
  const [cadence, setCadence] = useState<ScheduleCadenceValue | "">(report.schedule_cadence ?? "");
  const [format, setFormat] = useState(report.format);
  const [recipientInput, setRecipientInput] = useState(report.recipients.join(", "));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const recipients = recipientInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    await updateReport(report.id, {
      title,
      status,
      schedule_cadence: cadence === "" ? null : cadence,
      recipients,
      format,
    });
    setSaving(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteReport(report.id);
    onClose();
  };

  const handleExport = () => {
    exportSingleReport(report);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
        {/* Header actions */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
                <Button size="sm" variant="outline" onClick={handleDelete} className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 bg-brand-500 text-white hover:bg-brand-600">
                  <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="gap-1.5">
                  Cancel
                </Button>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent-100 rounded-lg">
            <X className="h-5 w-5 text-accent-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className={clsx("rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider", STATUS_COLORS[status])}>
              {status}
            </span>
            <span className="text-xs text-accent-500">{report.type_id}</span>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-accent-500 uppercase tracking-wider mb-2">Title</label>
            {isEditing ? (
              <Input value={title} onChange={(e) => setTitle(e.target.value)} fullWidth className="text-lg font-bold" />
            ) : (
              <h2 className="text-xl font-bold text-brand-900">{title}</h2>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-accent-50 p-4">
              <div className="flex items-center gap-2 text-xs text-accent-500 mb-1">
                <FileText className="h-3.5 w-3.5" /> Format
              </div>
              {isEditing ? (
                <select value={format} onChange={(e) => setFormat(e.target.value as Report["format"])} className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm">
                  {FORMAT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              ) : (
                <div className="text-sm font-semibold text-brand-900">{format}</div>
              )}
            </div>
            <div className="rounded-xl bg-accent-50 p-4">
              <div className="flex items-center gap-2 text-xs text-accent-500 mb-1">
                <Clock className="h-3.5 w-3.5" /> Status
              </div>
              {isEditing ? (
                <select value={status} onChange={(e) => setStatus(e.target.value as Report["status"])} className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <div className="text-sm font-semibold text-brand-900">{status}</div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-900 mb-3">
              <Calendar className="h-4 w-4 text-brand-500" /> Schedule
            </div>
            {isEditing ? (
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as ScheduleCadenceValue | "")}
                className="w-full h-10 rounded-xl border border-border bg-white px-4 text-sm"
              >
                {CADENCE_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            ) : (
              <div className="text-sm text-accent-700">
                {cadence ? CADENCE_OPTIONS.find((c) => c.value === cadence)?.label : "Not scheduled"}
              </div>
            )}
          </div>

          {/* Recipients */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-900 mb-3">
              <Users className="h-4 w-4 text-brand-500" /> Recipients
            </div>
            {isEditing ? (
              <div>
                <Input
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  placeholder="email@company.com, email2@company.com"
                  fullWidth
                />
                <p className="text-xs text-accent-400 mt-1">Comma-separated email addresses</p>
              </div>
            ) : (
              <div className="space-y-1">
                {report.recipients.length > 0 ? (
                  report.recipients.map((r, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 mr-2">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-accent-400">No recipients configured</span>
                )}
              </div>
            )}
          </div>

          {/* Owner + timestamps */}
          <div className="space-y-2 text-xs text-accent-500">
            <div>Owner: <span className="font-medium text-accent-700">{report.owner}</span></div>
            <div>Created: <span className="font-medium text-accent-700">{new Date(report.created_at).toLocaleDateString("en-GB")}</span></div>
            <div>Updated: <span className="font-medium text-accent-700">{new Date(report.updated_at).toLocaleDateString("en-GB")}</span></div>
            {report.last_run_at && (
              <div>Last Run: <span className="font-medium text-accent-700">{new Date(report.last_run_at).toLocaleDateString("en-GB")}</span></div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-accent-500 uppercase tracking-wider mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {report.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-600">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
