"use client";

import clsx from "clsx";
import { Check, ChevronDown, Plus, Shield, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { COMPLIANCE_WIDGET_REGISTRY } from "@/lib/compliance/widget-registry";

type ComplianceWidgetPickerProps = {
  activeWidgets: string[];
  onToggleWidget: (widgetId: string) => void;
};

export function ComplianceWidgetPicker({
  activeWidgets,
  onToggleWidget,
}: ComplianceWidgetPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredWidgets = Object.values(COMPLIANCE_WIDGET_REGISTRY).filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
          "bg-brand-900 text-white shadow-lg shadow-brand-900/10 hover:bg-brand-800",
          isOpen && "ring-2 ring-brand-500/20"
        )}
      >
        <Plus className="h-4 w-4" />
        <span>Add Widgets</span>
        <ChevronDown
          className={clsx(
            "h-4 w-4 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border/50 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="relative mb-2 p-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-400" />
            <input
              type="text"
              placeholder="Search widgets..."
              className="w-full rounded-lg border border-border/50 bg-brand-50/50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand-300 focus:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-auto px-1 py-1 widget-scroll">
            {filteredWidgets.map((widget) => {
              const isActive = activeWidgets.includes(widget.id);
              const Icon = widget.icon;
              return (
                <button
                  key={widget.id}
                  type="button"
                  onClick={() => onToggleWidget(widget.id)}
                  className={clsx(
                    "group flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-all",
                    isActive ? "bg-brand-50" : "hover:bg-brand-50/50"
                  )}
                >
                  <div className={clsx(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                    isActive 
                      ? "bg-brand-500 border-brand-400 text-white" 
                      : "bg-white border-border/50 text-brand-500 group-hover:border-brand-200"
                  )}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-brand-900 leading-none">{widget.name}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-brand-500" />}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-brand-600 line-clamp-2">
                      {widget.description}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded bg-brand-100/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-600">
                        {widget.category}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
