"use client";

import { useState } from "react";
import {
  X,
  Save,
  Pencil,
  Trash2,
  Download,
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

const STATUS_OPTIONS: Report["status"][] = ["Building", "In Review", "Ready"];

const STATUS_COLORS: Record<string, string> = {
  Ready: "bg-emerald-100 text-emerald-700",
  "In Review": "bg-amber-100 text-amber-700",
  Building: "bg-rose-100 text-rose-700",
};

export function ReportDetailPanel({ report, onClose }: ReportDetailPanelProps) {
  const { updateReport, deleteReport } = useReportsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(report.title);
  const [status, setStatus] = useState(report.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateReport(report.id, { title, status });
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

  const reportResult = (report.result_data || {}) as {
    summary?: string;
    metrics?: Array<{ id?: string; label?: string; value?: string | number }>;
    sections?: Array<{ title?: string; notes?: string }>;
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExport}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-1.5 bg-brand-500 text-white hover:bg-brand-600"
                >
                  <Save className="h-3.5 w-3.5" />{" "}
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="gap-1.5"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent-100 rounded-lg"
          >
            <X className="h-5 w-5 text-accent-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span
              className={clsx(
                "rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider",
                STATUS_COLORS[status],
              )}
            >
              {status}
            </span>
            <span className="text-xs text-accent-500">{report.type_id}</span>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-accent-500 uppercase tracking-wider mb-2">
              Title
            </label>
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                className="text-lg font-bold"
              />
            ) : (
              <h2 className="text-xl font-bold text-brand-900">{title}</h2>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-accent-50 p-4">
              <div className="flex items-center gap-2 text-xs text-accent-500 mb-1">
                <FileText className="h-3.5 w-3.5" /> Type
              </div>
              <div className="text-sm font-semibold text-brand-900">
                {report.type_id}
              </div>
            </div>
            <div className="rounded-xl bg-accent-50 p-4">
              <div className="flex items-center gap-2 text-xs text-accent-500 mb-1">
                <Clock className="h-3.5 w-3.5" /> Status
              </div>
              {isEditing ? (
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as Report["status"])
                  }
                  className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm font-semibold text-brand-900">
                  {status}
                </div>
              )}
            </div>
          </div>

          {/* Owner + timestamps */}
          <div className="space-y-2 text-xs text-accent-500">
            <div>
              Owner:{" "}
              <span className="font-medium text-accent-700">
                {report.owner}
              </span>
            </div>
            <div>
              Created:{" "}
              <span className="font-medium text-accent-700">
                {new Date(report.created_at).toLocaleDateString("en-GB")}
              </span>
            </div>
            <div>
              Updated:{" "}
              <span className="font-medium text-accent-700">
                {new Date(report.updated_at).toLocaleDateString("en-GB")}
              </span>
            </div>
            {report.last_run_at && (
              <div>
                Last Run:{" "}
                <span className="font-medium text-accent-700">
                  {new Date(report.last_run_at).toLocaleDateString("en-GB")}
                </span>
              </div>
            )}
          </div>

          {reportResult.summary && (
            <div className="rounded-xl border border-border p-4">
              <label className="block text-xs font-semibold text-accent-500 uppercase tracking-wider mb-2">
                Generated Summary
              </label>
              <p className="text-sm text-accent-700">{reportResult.summary}</p>
              {Array.isArray(reportResult.metrics) &&
                reportResult.metrics.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {reportResult.metrics.slice(0, 6).map((metric, index) => (
                      <div
                        key={`${metric.id || metric.label || "metric"}-${index}`}
                        className="rounded-lg bg-accent-50 px-3 py-2"
                      >
                        <div className="text-[11px] uppercase tracking-wider text-accent-500">
                          {metric.label || metric.id || "Metric"}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-brand-900">
                          {String(metric.value ?? "")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-accent-500 uppercase tracking-wider mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {report.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
