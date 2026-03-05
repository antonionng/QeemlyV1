"use client";

import { useState, useRef, useEffect } from "react";
import { Settings2, RotateCcw } from "lucide-react";
import { useSalaryReview, ALL_COLUMNS, type ColumnKey } from "@/lib/salary-review";

export function ColumnSettings() {
  const { visibleColumns, toggleColumnVisibility, resetColumns } = useSalaryReview();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-accent-500 transition-colors hover:bg-accent-50 hover:text-accent-700"
        aria-label="Column settings"
        title="Show / hide columns"
      >
        <Settings2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-border bg-white p-2 shadow-lg dropdown-enter">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-border/50 mb-1">
            <span className="text-xs font-semibold text-accent-900">Columns</span>
            <button
              type="button"
              onClick={resetColumns}
              className="flex items-center gap-1 text-[11px] text-accent-500 hover:text-accent-700"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-0.5">
            {ALL_COLUMNS.map((col) => {
              const checked = visibleColumns.includes(col.key);
              const isName = col.key === "name";
              return (
                <label
                  key={col.key}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors cursor-pointer ${
                    isName ? "opacity-50 cursor-not-allowed" : "hover:bg-accent-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isName}
                    onChange={() => toggleColumnVisibility(col.key)}
                    className="h-3.5 w-3.5 rounded border-accent-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-accent-700">{col.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
