"use client";

import { useState } from "react";
import { 
  ALL_REPORT_WIDGET_IDS 
} from "@/lib/reports/widget-registry";
import { 
  Plus, 
  Calendar, 
  Download, 
  LayoutGrid, 
  Info,
  ShieldCheck,
  FileBarChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportsLayoutManager } from "@/components/dashboard/reports/layout-manager";

export default function ReportsPage() {
  const [activeWidgets, setActiveWidgets] = useState<string[]>(ALL_REPORT_WIDGET_IDS);

  const handleRemoveWidget = (widgetId: string) => {
    setActiveWidgets(prev => prev.filter(id => id !== widgetId));
  };

  const handleResetWidgets = () => {
    setActiveWidgets(ALL_REPORT_WIDGET_IDS);
  };

  return (
    <div className="bench-results space-y-8 relative z-10">
      {/* Header Section */}
      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-brand-900">
                Reports & Analytics
              </h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
                Live Data
              </span>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-brand-700/80 max-w-2xl">
              Generate board-ready compensation summaries, benchmark packs, and compliance updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button variant="ghost" size="sm" onClick={handleResetWidgets} className="h-11 bg-white hover:bg-brand-50 border border-border/40 px-5 font-bold text-brand-700">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Reset Layout
            </Button>
            <Button variant="outline" size="sm" className="h-11 bg-white border border-border/40 px-5 font-bold text-brand-700">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
            <Button size="sm" className="h-11 px-6 font-bold uppercase tracking-widest text-[11px] bg-brand-600 text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
            <Button variant="ghost" className="h-11 bg-white hover:bg-brand-50 border border-border/40 px-5">
              <Download className="mr-2 h-4 w-4 text-brand-600" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 border-r border-border/40 pr-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent-500">Status</p>
              <p className="text-sm font-bold text-brand-900">Systems Healthy</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 border-r border-border/40 pr-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <FileBarChart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent-500">Coverage</p>
              <p className="text-sm font-bold text-brand-900">100% History</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-brand-50 px-3 py-1 lg:flex">
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-[11px] font-bold text-brand-700 uppercase tracking-tight">Real-time sync active</span>
          </div>

          <div className="ml-auto text-[11px] font-medium text-accent-400 italic">
            Next scheduled run: Monday, 9:00 AM
          </div>
        </div>
      </div>

      {/* Main Widget Grid */}
      <div className="w-full">
        <ReportsLayoutManager 
          activeWidgets={activeWidgets}
          onRemoveWidget={handleRemoveWidget}
        />
      </div>
    </div>
  );
}
