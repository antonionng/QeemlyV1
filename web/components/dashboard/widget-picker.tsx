"use client";

import clsx from "clsx";
import { Check, Plus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  WIDGET_REGISTRY,
  getWidgetsByCategory,
  type WidgetDefinition,
} from "@/lib/dashboard/widget-registry";

type WidgetPickerProps = {
  activeWidgets: string[];
  onToggleWidget: (widgetId: string) => void;
};

const CATEGORIES = [
  { id: "metrics", label: "Metrics" },
  { id: "charts", label: "Charts" },
  { id: "lists", label: "Lists" },
  { id: "insights", label: "Insights" },
] as const;

export function WidgetPicker({ activeWidgets, onToggleWidget }: WidgetPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allWidgets = Object.values(WIDGET_REGISTRY);
  const filteredWidgets =
    selectedCategory === "all"
      ? allWidgets
      : allWidgets.filter(w => w.category === selectedCategory);

  const activeCount = activeWidgets.length;
  const totalCount = allWidgets.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
          "bg-white shadow-sm hover:shadow-md",
          isOpen
            ? "border-brand-500 ring-2 ring-brand-500/20"
            : "border-border/50 hover:border-brand-300"
        )}
      >
        <Plus className="h-4 w-4 text-brand-500" />
        <span className="text-brand-900">Widgets</span>
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
          {activeCount}/{totalCount}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border/50 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
            <h3 className="font-semibold text-brand-900">Manage Widgets</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-400 hover:bg-brand-50 hover:text-brand-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-border/30 px-3 py-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                selectedCategory === "all"
                  ? "bg-brand-500 text-white"
                  : "text-brand-600 hover:bg-brand-50"
              )}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
                  selectedCategory === cat.id
                    ? "bg-brand-500 text-white"
                    : "text-brand-600 hover:bg-brand-50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Widget list */}
          <div className="max-h-80 overflow-auto p-2">
            {filteredWidgets.map(widget => {
              const isActive = activeWidgets.includes(widget.id);
              const Icon = widget.icon;

              return (
                <button
                  key={widget.id}
                  type="button"
                  onClick={() => onToggleWidget(widget.id)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all",
                    isActive
                      ? "bg-brand-50 ring-1 ring-brand-200"
                      : "hover:bg-brand-50/50"
                  )}
                >
                  <div
                    className={clsx(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      isActive
                        ? "bg-brand-500 text-white"
                        : "bg-brand-100 text-brand-600"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-900">
                        {widget.name}
                      </span>
                      <span
                        className={clsx(
                          "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                          widget.category === "metrics"
                            ? "bg-emerald-100 text-emerald-700"
                            : widget.category === "charts"
                            ? "bg-blue-100 text-blue-700"
                            : widget.category === "lists"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-purple-100 text-purple-700"
                        )}
                      >
                        {widget.category}
                      </span>
                    </div>
                    <p className="text-xs text-brand-600 truncate">
                      {widget.description}
                    </p>
                  </div>
                  <div
                    className={clsx(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                      isActive
                        ? "bg-brand-500 text-white"
                        : "border border-brand-200 text-transparent"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-border/30 px-4 py-3">
            <p className="text-xs text-brand-500">
              Drag widgets to rearrange. Click to toggle visibility.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

