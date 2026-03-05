"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, Pencil, Trash2, Download, MoreVertical } from "lucide-react";
import {
  REPORT_TYPES,
  type ReportTypeId,
} from "@/lib/reports/constants";
import { useReportsStore } from "@/lib/reports/store";
import type { Report } from "@/lib/reports/types";
import clsx from "clsx";
import { exportSingleReport } from "@/lib/reports/export";

type ReportStatus = Report["status"];

const STATUS_COLORS: Record<ReportStatus, string> = {
  Scheduled: "bg-brand-100 text-brand-600",
  Ready: "bg-emerald-100 text-emerald-700",
  "In Review": "bg-amber-100 text-amber-700",
  Building: "bg-rose-100 text-rose-700",
};

interface ReportGridProps {
  onOpenReport?: (report: Report) => void;
}

export function ReportGrid({ onOpenReport }: ReportGridProps) {
  const { reports, deleteReport } = useReportsStore();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<ReportTypeId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch =
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesType = activeType === "all" || r.type_id === activeType;
      const matchesStatus =
        statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, activeType, statusFilter, reports]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuOpen(null);
    await deleteReport(id);
  };

  const handleExport = (e: React.MouseEvent, report: Report) => {
    e.stopPropagation();
    setMenuOpen(null);
    exportSingleReport(report);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-brand-900">Your Reports</h2>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Reports"
              className="h-11 w-full rounded-full border border-border bg-white pl-11 pr-4 text-sm text-brand-900 placeholder:text-accent-400 focus:border-brand-300 focus:outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 appearance-none rounded-full border border-border bg-white pl-4 pr-10 text-sm font-medium text-brand-900 focus:border-brand-300 focus:outline-none"
            >
              <option value="all">Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Ready">Ready</option>
              <option value="In Review">In Review</option>
              <option value="Building">Building</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-400" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {REPORT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setActiveType(type.id)}
              className={clsx(
                "rounded-full px-4 py-2 text-xs font-semibold transition-all",
                activeType === type.id
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-white text-accent-600 border border-border hover:border-brand-300 hover:text-brand-600"
              )}
            >
              {type.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActiveType("all")}
            className={clsx(
              "rounded-full px-4 py-2 text-xs font-semibold transition-all",
              activeType === "all"
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-white text-accent-600 border border-border hover:border-brand-300 hover:text-brand-600"
            )}
          >
            All
          </button>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((report) => (
          <div
            key={report.id}
            onClick={() => onOpenReport?.(report)}
            className="group relative flex min-h-[220px] flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-brand-200 cursor-pointer"
          >
            {/* Actions menu */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === report.id ? null : report.id);
                }}
                className="p-1.5 rounded-lg hover:bg-accent-100 text-accent-400 hover:text-accent-600"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen === report.id && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-border bg-white shadow-lg z-20 py-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpenReport?.(report); setMenuOpen(null); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-accent-700 hover:bg-accent-50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleExport(e, report)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-accent-700 hover:bg-accent-50"
                  >
                    <Download className="h-3.5 w-3.5" /> Export
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, report.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>

            {/* Status badge */}
            <span
              className={clsx(
                "w-fit rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                STATUS_COLORS[report.status]
              )}
            >
              {report.status}
            </span>

            <p className="mt-4 text-xs text-accent-500">
              {report.owner} &bull; {new Date(report.updated_at).toLocaleDateString("en-GB")}
            </p>

            <h3 className="mt-1.5 text-sm font-bold text-brand-900 leading-snug">
              {report.title}
            </h3>

            <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
              {report.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-accent-400 italic">
            No reports match your filters.
          </p>
        </div>
      )}
    </div>
  );
}
