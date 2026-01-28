"use client";

import { useState, useMemo } from "react";
import { 
  REPORT_TYPES, 
  ReportTypeId, 
  formatTimeAgo 
} from "@/lib/reports/data";
import { useReportsContext } from "@/lib/reports/context";
import { 
  ArrowRight, 
  BarChart3, 
  FileText, 
  LayoutGrid, 
  Search, 
  ShieldCheck, 
  Tag 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import clsx from "clsx";

const TYPE_ICONS: Record<ReportTypeId, any> = {
  overview: LayoutGrid,
  benchmark: BarChart3,
  compliance: ShieldCheck,
  custom: FileText,
};

export function ReportTemplatesWidget() {
  const { 
    selectedType, 
    setSelectedType, 
    searchQuery, 
    setSearchQuery, 
    filteredTemplates 
  } = useReportsContext();

  const activeType = selectedType === "all" ? "overview" : selectedType;

  return (
    <div className="flex h-full flex-col">
      {/* Search and Tabs */}
      <div className="flex flex-col gap-4 border-b border-border/40 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1 rounded-xl bg-brand-50/50 p-1">
          {REPORT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                selectedType === type.id
                  ? "bg-white text-brand-600 shadow-sm ring-1 ring-brand-200"
                  : "text-accent-500 hover:text-brand-600"
              )}
            >
              {type.label}
            </button>
          ))}
          <button
            onClick={() => setSelectedType("all")}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
              selectedType === "all"
                ? "bg-white text-brand-600 shadow-sm ring-1 ring-brand-200"
                : "text-accent-500 hover:text-brand-600"
            )}
          >
            All
          </button>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="h-9 w-full rounded-full bg-brand-50/50 pl-9 text-xs focus:bg-white"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredTemplates.map((template) => {
          const Icon = TYPE_ICONS[template.typeId];
          return (
            <div 
              key={template.id}
              className="group flex flex-col rounded-2xl border border-border bg-white p-5 transition-all hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-[10px] font-bold text-accent-600">
                  {template.cadence}
                </span>
              </div>
              
              <h4 className="mt-4 font-bold text-brand-900 group-hover:text-brand-600 transition-colors">
                {template.title}
              </h4>
              <p className="mt-1 line-clamp-2 text-xs text-accent-500 leading-relaxed">
                {template.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {template.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="flex items-center gap-1 rounded-md bg-brand-50/50 px-2 py-0.5 text-[10px] font-medium text-brand-600">
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-5">
                <button className="flex w-full items-center justify-between rounded-xl bg-brand-50/50 px-4 py-2.5 text-xs font-bold text-brand-700 transition-all hover:bg-brand-500 hover:text-white">
                  <span>Open Template</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-sm text-accent-400 font-medium italic">No templates found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
