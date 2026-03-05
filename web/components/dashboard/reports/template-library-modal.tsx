"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Search, X } from "lucide-react";
import {
  REPORT_TYPES,
  type ReportTypeId,
} from "@/lib/reports/constants";
import type { ReportTemplate } from "@/lib/reports/types";
import clsx from "clsx";

type TemplateLibraryModalProps = {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  templates: ReportTemplate[];
  isLoadingTemplates?: boolean;
  onSelectTemplate: (template: ReportTemplate) => void;
};

export function TemplateLibraryModal({
  open,
  onClose,
  onBack,
  templates,
  isLoadingTemplates = false,
  onSelectTemplate,
}: TemplateLibraryModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<ReportTypeId | "all">("all");
  const [activeIndustry, setActiveIndustry] = useState<string>("all");

  const industryOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        templates
          .map((template) => template.category || "")
          .filter((category) => category.startsWith("industry-"))
      )
    ).sort((left, right) => left.localeCompare(right));
    return values;
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const matchType = activeType === "all" || t.type_id === activeType;
      const matchIndustry = activeIndustry === "all" || t.category === activeIndustry;
      return matchSearch && matchType && matchIndustry;
    });
  }, [templates, search, activeType, activeIndustry]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-[fadeIn_180ms_ease-out]"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Create from template"
          tabIndex={-1}
          className="relative flex w-full max-w-4xl flex-col rounded-3xl border border-border bg-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] outline-none animate-[popIn_200ms_cubic-bezier(0.2,0.8,0.2,1)] max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand-900 hover:text-brand-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-accent-500 hover:bg-accent-100 hover:text-brand-900 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h2 className="px-8 pt-2 pb-4 text-xl font-bold text-brand-900">
            Create from template
          </h2>

          {/* Search + pills */}
          <div className="flex flex-col gap-4 px-8 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Templates"
                className="h-11 w-full rounded-full border border-border bg-white pl-11 pr-4 text-sm text-brand-900 placeholder:text-accent-400 focus:border-brand-300 focus:outline-none"
              />
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

          {industryOptions.length > 0 && (
            <div className="px-8 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveIndustry("all")}
                  className={clsx(
                    "rounded-full px-4 py-2 text-xs font-semibold transition-all",
                    activeIndustry === "all"
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-white text-accent-600 border border-border hover:border-brand-300 hover:text-brand-600"
                  )}
                >
                  All Industries
                </button>
                {industryOptions.map((industry) => (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => setActiveIndustry(industry)}
                    className={clsx(
                      "rounded-full px-4 py-2 text-xs font-semibold transition-all",
                      activeIndustry === industry
                        ? "bg-brand-500 text-white shadow-sm"
                        : "bg-white text-accent-600 border border-border hover:border-brand-300 hover:text-brand-600"
                    )}
                  >
                    {toIndustryLabel(industry)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Template grid */}
          <div className="flex-1 overflow-y-auto px-8 pb-8 widget-scroll">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((template) => (
                <div
                  key={template.id}
                  className="group flex flex-col rounded-2xl border border-border bg-white p-5 transition-all hover:shadow-md hover:border-brand-200"
                >
                  {/* Cadence badge */}
                  <span className="w-fit rounded-md bg-accent-100 px-2.5 py-1 text-[10px] font-bold text-accent-600">
                    {template.cadence || "On Demand"}
                  </span>

                  <h4 className="mt-3 text-sm font-bold text-brand-900">
                    {template.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-accent-500 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Open Template */}
                  <button
                    type="button"
                    disabled={isLoadingTemplates}
                    onClick={() => onSelectTemplate(template)}
                    className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-bold text-brand-900 transition-colors group-hover:text-brand-600 disabled:cursor-not-allowed disabled:text-accent-400"
                  >
                    Open Template
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {isLoadingTemplates && (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-accent-400 italic">Loading templates...</p>
              </div>
            )}

            {!isLoadingTemplates && filtered.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-accent-400 italic">
                  No templates match your search.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function toIndustryLabel(category: string): string {
  if (!category.startsWith("industry-")) return category;
  return category
    .replace("industry-", "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
