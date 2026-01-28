"use client";

import clsx from "clsx";
import { BarChart3, Check, ChevronDown, Layout, RotateCcw, Sliders, Smartphone, TrendingUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { BENCHMARK_PRESET_LAYOUTS, type BenchmarkLayoutPreset } from "@/lib/benchmarks/preset-layouts";

type BenchmarkPresetSwitcherProps = {
  currentPresetId: string;
  isCustomized: boolean;
  onSelectPreset: (presetId: string) => void;
  onReset: () => void;
};

const PRESET_ICONS: Record<string, typeof BarChart3> = {
  full: BarChart3,
  quick: Smartphone,
  offer: Sliders,
  trends: TrendingUp,
};

export function BenchmarkPresetSwitcher({
  currentPresetId,
  isCustomized,
  onSelectPreset,
  onReset,
}: BenchmarkPresetSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPreset = BENCHMARK_PRESET_LAYOUTS.find(p => p.id === currentPresetId);
  const CurrentIcon = currentPreset ? PRESET_ICONS[currentPreset.icon] || Layout : Layout;

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
        <CurrentIcon className="h-4 w-4 text-brand-500" />
        <span className="text-brand-900">
          {currentPreset?.name}
        </span>
        {isCustomized && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
            Modified
          </span>
        )}
        <ChevronDown
          className={clsx(
            "h-4 w-4 text-brand-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border/50 bg-white p-2 shadow-xl">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-brand-500">
            Layout Presets
          </div>

          {BENCHMARK_PRESET_LAYOUTS.map(preset => {
            const PresetIcon = PRESET_ICONS[preset.icon] || Layout;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onSelectPreset(preset.id);
                  setIsOpen(false);
                }}
                className={clsx(
                  "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors",
                  preset.id === currentPresetId && !isCustomized
                    ? "bg-brand-50"
                    : "hover:bg-brand-50/50"
                )}
              >
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <PresetIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-brand-900">{preset.name}</span>
                    {preset.id === currentPresetId && !isCustomized && (
                      <Check className="h-4 w-4 text-brand-500" />
                    )}
                  </div>
                  <p className="text-xs text-brand-600">{preset.description}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {preset.widgets.slice(0, 4).map(widgetId => (
                      <span
                        key={widgetId}
                        className="rounded bg-brand-100/70 px-1.5 py-0.5 text-[10px] font-medium text-brand-600"
                      >
                        {widgetId.split("-").map(w => w[0].toUpperCase()).join("")}
                      </span>
                    ))}
                    {preset.widgets.length > 4 && (
                      <span className="rounded bg-brand-100/70 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
                        +{preset.widgets.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Reset option */}
          {isCustomized && (
            <>
              <div className="my-2 border-t border-border/50" />
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl p-3 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50/50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to default layout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
