import clsx from "clsx";
import type { ReportType } from "@/lib/reports/data";

type ReportTypeTabsProps = {
  types: ReportType[];
  activeId: ReportType["id"];
  onChange: (id: ReportType["id"]) => void;
};

export function ReportTypeTabs({ types, activeId, onChange }: ReportTypeTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {types.map((type) => {
        const isActive = type.id === activeId;
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={clsx(
              "rounded-full border px-4 py-2 text-xs font-semibold transition-all",
              isActive
                ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                : "border-brand-200 bg-white text-brand-700 hover:border-brand-400 hover:bg-brand-50"
            )}
          >
            {type.label}
          </button>
        );
      })}
    </div>
  );
}
