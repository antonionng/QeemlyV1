"use client";

import clsx from "clsx";

export type SalaryViewMode = "annual" | "monthly";

interface SalaryViewToggleProps {
  value: SalaryViewMode;
  onChange: (value: SalaryViewMode) => void;
  className?: string;
}

export function SalaryViewToggle({ value, onChange, className }: SalaryViewToggleProps) {
  return (
    <div className={clsx("flex gap-1 rounded-lg bg-brand-100/50 p-1", className)}>
      {(["annual", "monthly"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={clsx(
            "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
            value === mode
              ? "bg-white text-brand-900 shadow-sm"
              : "text-brand-600 hover:text-brand-800"
          )}
        >
          {mode === "annual" ? "Annual" : "Monthly"}
        </button>
      ))}
    </div>
  );
}
